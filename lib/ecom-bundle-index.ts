/**
 * eCommerce Utils — Bundle reverse-index engine.
 *
 * BigCommerce has no reverse lookup for "which bundles contain this SKU".
 * Bundles are regular products whose text modifiers hold child SKUs in
 * config.default_value. We paginate the entire visible catalog with
 * include=modifiers, build a reverse map (childSku → BundleIndexEntry[]),
 * and cache it in globalThis with a 30-minute TTL.
 *
 * Rate limiting: 2 concurrent requests, 300ms between batches,
 * exponential backoff on 429.
 */

import axios from 'axios';
import type { ApiConfiguration, ProductCheck } from './ecom-storage';
import { bcHeaders, checkPurchasability } from './ecom-validation';

/* ── Types ─────────────────────────────────────────────── */

export interface BundleIndexEntry {
  bundleProductId: number;
  bundleSku: string;
  bundleName: string;
  modifierName: string;
  checks: ProductCheck[];
}

export interface BundleIndexProgress {
  status: 'idle' | 'building' | 'ready' | 'error';
  currentPage: number;
  totalPages: number;
  productsScanned: number;
  bundlesFound: number;
  percentage: number;
  currentStep: string;
  isExpired: boolean;
  error?: string;
}

export interface BundleLookupResult {
  sku: string;
  found: boolean;
  bundles: BundleIndexEntry[];
  indexAge: number;
  totalBundlesInIndex: number;
}

/* ── globalThis singleton ──────────────────────────────── */

interface BundleIndexStore {
  reverseMap: Map<string, BundleIndexEntry[]>;
  builtAt: Date;
  totalBundles: number;
}

const g = globalThis as typeof globalThis & {
  __bundleIndex?: BundleIndexStore;
  __bundleIndexProgress?: BundleIndexProgress;
  __bundleIndexBuildPromise?: Promise<void>;
};

const INDEX_TTL_MS = 30 * 60 * 1000; // 30 minutes

function defaultProgress(): BundleIndexProgress {
  return {
    status: 'idle',
    currentPage: 0,
    totalPages: 0,
    productsScanned: 0,
    bundlesFound: 0,
    percentage: 0,
    currentStep: '',
    isExpired: false,
  };
}

if (!g.__bundleIndexProgress) {
  g.__bundleIndexProgress = defaultProgress();
}

/* ── Rate-limited GET with retry on 429 ────────────────── */

async function rateLimitedGet(url: string, headers: Record<string, string>) {
  const maxRetries = 3;
  let delay = 2000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await axios.get(url, { headers, timeout: 15_000 });
    } catch (err) {
      if (
        axios.isAxiosError(err) &&
        err.response?.status === 429 &&
        attempt < maxRetries
      ) {
        await new Promise((r) => setTimeout(r, delay));
        delay = Math.min(delay * 2, 30_000);
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}

/* ── Batch fetch with concurrency control ──────────────── */

async function batchFetch<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency = 2,
  delayMs = 300,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    if (i + concurrency < items.length) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return results;
}

/* ── Bundle checks (5) ─────────────────────────────────── */

function checkBundle(product: any, channelIds: number[]): ProductCheck[] {
  const checks: ProductCheck[] = [];

  // 1. Visibilita
  checks.push({
    name: 'Visibilità',
    status: product.is_visible ? 'pass' : 'fail',
    value: product.is_visible ? 'Visibile su Storefront' : 'Non visibile',
  });

  // 2. Purchasability
  checks.push(checkPurchasability(product));

  // 3. Nome
  checks.push({
    name: 'Nome',
    status: product.name?.trim() ? 'pass' : 'fail',
    value: product.name?.trim() || 'Mancante',
  });

  // 4. SKU
  checks.push({
    name: 'SKU',
    status: product.sku?.trim() ? 'pass' : 'fail',
    value: product.sku?.trim() || 'Mancante',
  });

  // 5. Channel
  checks.push({
    name: 'Channel',
    status: channelIds.length > 0 ? 'pass' : 'fail',
    value:
      channelIds.length > 0
        ? `${channelIds.length} channel`
        : 'Nessun channel',
  });

  return checks;
}

/* ── Build index ───────────────────────────────────────── */

export async function buildBundleIndex(
  apiConfig: ApiConfiguration,
): Promise<void> {
  // Dedup: if a build is already running, return existing promise
  if (g.__bundleIndexBuildPromise) {
    return g.__bundleIndexBuildPromise;
  }

  const promise = doBuild(apiConfig);
  g.__bundleIndexBuildPromise = promise;

  try {
    await promise;
  } finally {
    g.__bundleIndexBuildPromise = undefined;
  }
}

async function doBuild(apiConfig: ApiConfiguration): Promise<void> {
  const progress = g.__bundleIndexProgress!;
  const baseUrl = `${apiConfig.apiEndpoint}/${apiConfig.storeHash}/v3/catalog`;
  const headers = bcHeaders(apiConfig.apiKey);

  // Reset progress
  Object.assign(progress, {
    status: 'building',
    currentPage: 0,
    totalPages: 0,
    productsScanned: 0,
    bundlesFound: 0,
    percentage: 0,
    currentStep: 'Avvio indicizzazione catalogo…',
    isExpired: false,
    error: undefined,
  });

  const reverseMap = new Map<string, BundleIndexEntry[]>();
  // Collect all bundle product IDs for channel assignment fetch
  const bundleProducts: Array<{ product: any; childSkus: Array<{ sku: string; modName: string }> }> = [];

  try {
    // First page to get total pages
    const firstUrl = `${baseUrl}/products?is_visible=true&include=modifiers&limit=10&page=1`;
    const firstRes = await rateLimitedGet(firstUrl, headers);
    const meta = firstRes.data?.meta?.pagination;
    const totalPages = meta?.total_pages ?? 1;
    const totalItems = meta?.total ?? 0;

    progress.totalPages = totalPages;
    progress.currentStep = `Scansione catalogo: ${totalItems} prodotti in ${totalPages} pagine`;

    // Process first page
    processPage(firstRes.data?.data ?? [], bundleProducts);
    progress.currentPage = 1;
    progress.productsScanned += (firstRes.data?.data ?? []).length;
    progress.percentage = Math.round((1 / totalPages) * 100);

    // Remaining pages
    if (totalPages > 1) {
      const pageNumbers = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);

      await batchFetch(
        pageNumbers,
        async (page) => {
          const url = `${baseUrl}/products?is_visible=true&include=modifiers&limit=10&page=${page}`;
          const res = await rateLimitedGet(url, headers);
          const products = res.data?.data ?? [];
          processPage(products, bundleProducts);

          progress.currentPage = Math.max(progress.currentPage, page);
          progress.productsScanned += products.length;
          progress.bundlesFound = bundleProducts.length;
          progress.percentage = Math.round(
            (progress.currentPage / totalPages) * 90,
          ); // 90% for scanning
          progress.currentStep = `Scansione pagina ${progress.currentPage}/${totalPages} — ${bundleProducts.length} bundle trovati`;
          return null;
        },
        2,
        300,
      );
    }

    progress.bundlesFound = bundleProducts.length;

    // Fetch channel assignments for all bundle products in batches
    if (bundleProducts.length > 0) {
      progress.currentStep = `Verifica channel assignments per ${bundleProducts.length} bundle…`;
      progress.percentage = 92;

      const allBundleIds = bundleProducts.map((b) => b.product.id);
      const channelMap = new Map<number, number[]>();

      // Batch channel assignments in groups of 50 IDs
      const idChunks: number[][] = [];
      for (let i = 0; i < allBundleIds.length; i += 50) {
        idChunks.push(allBundleIds.slice(i, i + 50));
      }

      await batchFetch(
        idChunks,
        async (chunk) => {
          try {
            const channelUrl = `${baseUrl}/products/channel-assignments?product_id:in=${chunk.join(',')}`;
            const channelRes = await rateLimitedGet(channelUrl, headers);
            const assignments: any[] = channelRes.data?.data ?? [];
            for (const a of assignments) {
              const existing = channelMap.get(a.product_id) ?? [];
              existing.push(a.channel_id);
              channelMap.set(a.product_id, existing);
            }
          } catch {
            // Channel fetch failure is non-fatal — checks will show "Nessun channel"
          }
          return null;
        },
        2,
        300,
      );

      // Build entries with checks
      progress.currentStep = 'Costruzione indice e controlli bundle…';
      progress.percentage = 96;

      for (const { product, childSkus } of bundleProducts) {
        const channelIds = channelMap.get(product.id) ?? [];
        const checks = checkBundle(product, channelIds);

        for (const { sku, modName } of childSkus) {
          const normalizedSku = sku.toUpperCase().trim();
          const entry: BundleIndexEntry = {
            bundleProductId: product.id,
            bundleSku: product.sku ?? '',
            bundleName: product.name ?? '',
            modifierName: modName,
            checks,
          };

          const existing = reverseMap.get(normalizedSku) ?? [];
          existing.push(entry);
          reverseMap.set(normalizedSku, existing);
        }
      }
    }

    // Store index
    g.__bundleIndex = {
      reverseMap,
      builtAt: new Date(),
      totalBundles: bundleProducts.length,
    };

    Object.assign(progress, {
      status: 'ready',
      percentage: 100,
      currentStep: `Indice pronto — ${bundleProducts.length} bundle, ${reverseMap.size} SKU indicizzati`,
      isExpired: false,
    });
  } catch (err) {
    Object.assign(progress, {
      status: 'error',
      error: err instanceof Error ? err.message : 'Errore sconosciuto',
      currentStep: 'Errore durante la costruzione dell\'indice',
    });
    throw err;
  }
}

function processPage(
  products: any[],
  bundleProducts: Array<{ product: any; childSkus: Array<{ sku: string; modName: string }> }>,
) {
  for (const product of products) {
    const modifiers: any[] = product.modifiers ?? [];
    const textMods = modifiers.filter(
      (m: any) => m.type === 'text' && m.config?.default_value?.trim(),
    );

    if (textMods.length > 0) {
      const childSkus = textMods.map((m: any) => ({
        sku: m.config.default_value.trim(),
        modName: m.display_name || m.name || 'Modifier',
      }));
      bundleProducts.push({ product, childSkus });
    }
  }
}

/* ── Lookup ─────────────────────────────────────────────── */

export function lookupBundlesForSku(sku: string): BundleLookupResult {
  const normalizedSku = sku.toUpperCase().trim();
  const index = g.__bundleIndex;

  if (!index) {
    return {
      sku,
      found: false,
      bundles: [],
      indexAge: 0,
      totalBundlesInIndex: 0,
    };
  }

  const bundles = index.reverseMap.get(normalizedSku) ?? [];
  const ageMs = Date.now() - index.builtAt.getTime();

  return {
    sku,
    found: bundles.length > 0,
    bundles,
    indexAge: ageMs,
    totalBundlesInIndex: index.totalBundles,
  };
}

/* ── Status ─────────────────────────────────────────────── */

export function getBundleIndexStatus(): BundleIndexProgress {
  const progress = g.__bundleIndexProgress ?? defaultProgress();
  const index = g.__bundleIndex;

  // Update expiry flag
  if (index && progress.status === 'ready') {
    const ageMs = Date.now() - index.builtAt.getTime();
    progress.isExpired = ageMs > INDEX_TTL_MS;
  }

  return { ...progress };
}

/* ── Invalidate ─────────────────────────────────────────── */

export function invalidateBundleIndex(): void {
  g.__bundleIndex = undefined;
  g.__bundleIndexProgress = defaultProgress();
  g.__bundleIndexBuildPromise = undefined;
}

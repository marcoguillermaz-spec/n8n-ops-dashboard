/**
 * eCommerce Utils — BigCommerce SKU validation logic.
 *
 * Flow:
 *  1. Look up product by SKU (include=images for main product)
 *  2. Fetch product modifiers (type=text → sub-product references)
 *  3. Validate each sub-product SKU exists + collect product data
 *  4. Batch fetch channel assignments for all product IDs
 *  5. Run 11 checks on main product, 8 checks on each sub-product
 *  6. Return comprehensive result with check details
 */

import axios from 'axios';
import type {
  ApiConfiguration,
  InsertValidationResult,
  SubProduct,
  ProductCheck,
} from './ecom-storage';

/* ── Types ─────────────────────────────────────────────── */

interface ApiCallLog {
  step: string;
  url: string;
  method: string;
  status: number;
  duration: number;
  success: boolean;
  error?: string;
}

/* ── Helpers ───────────────────────────────────────────── */

function bcHeaders(apiKey: string) {
  return {
    'X-Auth-Token': apiKey,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  } as const;
}

/* ── Purchasability check (shared) ───────────────────── */

function checkPurchasability(product: any): ProductCheck {
  if (product.availability === 'available') {
    return { name: 'Purchasability', status: 'pass', value: 'Disponibile' };
  }
  if (product.availability === 'preorder') {
    const releaseDate = product.preorder_release_date;
    const hasDate = !!releaseDate;
    return {
      name: 'Purchasability',
      status: hasDate ? 'pass' : 'fail',
      value: hasDate
        ? `Preorder — ${releaseDate}`
        : 'Preorder senza data di rilascio',
      message: hasDate ? undefined : 'Configurare preorder_release_date',
    };
  }
  return {
    name: 'Purchasability',
    status: 'fail',
    value:
      product.availability === 'disabled'
        ? 'Disabilitato'
        : `${product.availability ?? 'N/A'}`,
  };
}

/* ── Main product checks (11) ────────────────────────── */

function checkMainProduct(
  product: any,
  images: any[],
  channelIds: number[],
): ProductCheck[] {
  const checks: ProductCheck[] = [];

  // 1. Visibilità
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

  // 5. Prezzo > 0 (prodotto principale)
  checks.push({
    name: 'Prezzo',
    status: product.price != null && product.price > 0 ? 'pass' : 'fail',
    value:
      product.price != null
        ? `€${Number(product.price).toFixed(2)}`
        : 'Mancante',
    message:
      product.price != null && product.price === 0
        ? 'Il prezzo del prodotto principale deve essere > 0'
        : undefined,
  });

  // 6. Tipologia
  checks.push({
    name: 'Tipologia',
    status: product.type ? 'pass' : 'fail',
    value: product.type || 'Mancante',
  });

  // 7. Brand
  checks.push({
    name: 'Brand',
    status: product.brand_id && product.brand_id > 0 ? 'pass' : 'fail',
    value:
      product.brand_id > 0
        ? `Brand ID: ${product.brand_id}`
        : 'Non assegnato',
  });

  // 8. Channel
  checks.push({
    name: 'Channel',
    status: channelIds.length > 0 ? 'pass' : 'fail',
    value:
      channelIds.length > 0
        ? `${channelIds.length} channel`
        : 'Nessun channel',
  });

  // 9. Categoria
  const cats: number[] = product.categories ?? [];
  checks.push({
    name: 'Categoria',
    status: cats.length > 0 ? 'pass' : 'fail',
    value:
      cats.length > 0 ? `${cats.length} categorie` : 'Nessuna categoria',
  });

  // 10. Descrizione
  const descText = (product.description ?? '')
    .replace(/<[^>]*>/g, '')
    .trim();
  checks.push({
    name: 'Descrizione',
    status: descText ? 'pass' : 'fail',
    value: descText ? 'Presente' : 'Mancante',
  });

  // 11. Immagine
  checks.push({
    name: 'Immagine',
    status: images.length > 0 ? 'pass' : 'fail',
    value:
      images.length > 0
        ? `${images.length} immagine/i`
        : 'Nessuna immagine',
  });

  return checks;
}

/* ── Sub-product checks (8) ──────────────────────────── */

function checkSubProductData(
  product: any,
  channelIds: number[],
): ProductCheck[] {
  const checks: ProductCheck[] = [];

  // 1. Visibilità
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

  // 5. Prezzo >= 0 (sub-prodotti: zero è OK)
  checks.push({
    name: 'Prezzo',
    status: product.price != null && product.price >= 0 ? 'pass' : 'fail',
    value:
      product.price != null
        ? `€${Number(product.price).toFixed(2)}`
        : 'Mancante',
  });

  // 6. Tipologia
  checks.push({
    name: 'Tipologia',
    status: product.type ? 'pass' : 'fail',
    value: product.type || 'Mancante',
  });

  // 7. Brand
  checks.push({
    name: 'Brand',
    status: product.brand_id && product.brand_id > 0 ? 'pass' : 'fail',
    value:
      product.brand_id > 0
        ? `Brand ID: ${product.brand_id}`
        : 'Non assegnato',
  });

  // 8. Channel
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

/* ── Main validation function ──────────────────────────── */

export async function validateProductBySku(
  sku: string,
  apiConfig: ApiConfiguration,
): Promise<InsertValidationResult> {
  const apiCalls: ApiCallLog[] = [];
  const baseUrl = `${apiConfig.apiEndpoint}/${apiConfig.storeHash}/v3/catalog`;
  const headers = bcHeaders(apiConfig.apiKey);

  try {
    /* ── Step 1: Product lookup by SKU (include images) ── */
    const productUrl = `${baseUrl}/products?sku=${encodeURIComponent(sku)}&include=images`;
    const t0 = Date.now();

    const productRes = await axios.get(productUrl, {
      headers,
      timeout: 10_000,
    });

    apiCalls.push({
      step: 'Product Lookup',
      url: productUrl,
      method: 'GET',
      status: productRes.status,
      duration: Date.now() - t0,
      success: true,
    });

    const products = productRes.data?.data;
    if (!products || products.length === 0) {
      throw new Error(`Product with SKU ${sku} not found`);
    }
    const product = products[0];
    const mainImages: any[] = product.images ?? [];

    /* ── Step 2: Fetch product modifiers ───────────────── */
    const modUrl = `${baseUrl}/products/${product.id}/modifiers`;
    const t1 = Date.now();

    const modRes = await axios.get(modUrl, { headers, timeout: 10_000 });

    apiCalls.push({
      step: 'Modifiers Fetch',
      url: modUrl,
      method: 'GET',
      status: modRes.status,
      duration: Date.now() - t1,
      success: true,
    });

    const modifiers: any[] = modRes.data?.data ?? [];
    const textModifiers = modifiers.filter((m) => m.type === 'text');

    /* ── Step 3: Validate sub-products ─────────────────── */
    const subProducts: SubProduct[] = [];
    let foundCount = 0;
    const allProductIds: number[] = [product.id];
    const subProductDataMap = new Map<string, any>();

    for (const mod of textModifiers) {
      const subSku: string = mod.config?.default_value || mod.name;
      const t2 = Date.now();
      const subUrl = `${baseUrl}/products?sku=${encodeURIComponent(subSku)}`;

      try {
        const subRes = await axios.get(subUrl, {
          headers,
          timeout: 10_000,
        });

        apiCalls.push({
          step: `Sub-Product Validation: ${subSku}`,
          url: subUrl,
          method: 'GET',
          status: subRes.status,
          duration: Date.now() - t2,
          success: true,
        });

        const subData = subRes.data?.data;
        const exists = subData && subData.length > 0;
        const subProduct = exists ? subData[0] : null;

        if (exists && subProduct) {
          allProductIds.push(subProduct.id);
          subProductDataMap.set(subSku, subProduct);
        }

        subProducts.push({
          name: mod.display_name || mod.name,
          sku: subSku,
          type: mod.type,
          required: mod.required ?? false,
          found: exists,
          productId: subProduct?.id,
        });

        if (exists) foundCount++;
      } catch (err) {
        apiCalls.push({
          step: `Sub-Product Validation: ${subSku}`,
          url: subUrl,
          method: 'GET',
          status: axios.isAxiosError(err)
            ? err.response?.status ?? 0
            : 0,
          duration: Date.now() - t2,
          success: false,
          error:
            err instanceof Error ? err.message : 'Unknown error',
        });

        subProducts.push({
          name: mod.display_name || mod.name,
          sku: subSku,
          type: mod.type,
          required: mod.required ?? false,
          found: false,
          error:
            err instanceof Error
              ? err.message
              : 'Product not found',
        });
      }
    }

    /* ── Step 4: Batch fetch channel assignments ───────── */
    const channelMap = new Map<number, number[]>();

    try {
      const channelUrl = `${baseUrl}/products/channel-assignments?product_id:in=${allProductIds.join(',')}`;
      const t3 = Date.now();
      const channelRes = await axios.get(channelUrl, {
        headers,
        timeout: 10_000,
      });

      apiCalls.push({
        step: 'Channel Assignments',
        url: channelUrl,
        method: 'GET',
        status: channelRes.status,
        duration: Date.now() - t3,
        success: true,
      });

      const assignments: any[] = channelRes.data?.data ?? [];
      for (const a of assignments) {
        const existing = channelMap.get(a.product_id) ?? [];
        existing.push(a.channel_id);
        channelMap.set(a.product_id, existing);
      }
    } catch (err) {
      apiCalls.push({
        step: 'Channel Assignments',
        url: `${baseUrl}/products/channel-assignments?product_id:in=...`,
        method: 'GET',
        status: axios.isAxiosError(err)
          ? err.response?.status ?? 0
          : 0,
        duration: 0,
        success: false,
        error:
          err instanceof Error ? err.message : 'Unknown error',
      });
    }

    /* ── Step 5: Run all checks ────────────────────────── */
    const mainChannels = channelMap.get(product.id) ?? [];
    const mainProductChecks = checkMainProduct(
      product,
      mainImages,
      mainChannels,
    );

    for (const sp of subProducts) {
      if (sp.found && sp.productId) {
        const spData = subProductDataMap.get(sp.sku);
        const spChannels = channelMap.get(sp.productId) ?? [];
        if (spData) {
          sp.checks = checkSubProductData(spData, spChannels);
        }
      }
    }

    /* ── Step 6: Determine overall status ──────────────── */
    const mainFailCount = mainProductChecks.filter(
      (c) => c.status === 'fail',
    ).length;
    const subMissing = subProducts.filter((sp) => !sp.found).length;
    const subCheckFails = subProducts
      .filter((sp) => sp.found && sp.checks)
      .flatMap((sp) => sp.checks!)
      .filter((c) => c.status === 'fail').length;

    const allPassed =
      mainFailCount === 0 && subMissing === 0 && subCheckFails === 0;

    const issuesParts: string[] = [];
    if (mainFailCount > 0)
      issuesParts.push(
        `${mainFailCount} check falliti (prodotto principale)`,
      );
    if (subMissing > 0)
      issuesParts.push(`${subMissing} sub-prodotto/i mancanti`);
    if (subCheckFails > 0)
      issuesParts.push(`${subCheckFails} check falliti (sub-prodotti)`);

    return {
      sku,
      productId: product.id,
      productName: product.name,
      status: allPassed ? 'passed' : 'failed',
      subProductsFound: foundCount,
      subProductsTotal: textModifiers.length,
      issues: issuesParts.length > 0 ? issuesParts.join(' · ') : null,
      validationData: {
        product,
        modifiers: textModifiers,
        subProducts,
        mainProductChecks,
      },
      apiCalls,
    };
  } catch (error) {
    apiCalls.push({
      step: 'Product Lookup',
      url: `${baseUrl}/products?sku=${encodeURIComponent(sku)}`,
      method: 'GET',
      status: axios.isAxiosError(error)
        ? error.response?.status ?? 0
        : 0,
      duration: 0,
      success: false,
      error:
        error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

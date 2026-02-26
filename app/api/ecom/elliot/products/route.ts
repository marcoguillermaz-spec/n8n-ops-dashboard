/**
 * POST /api/ecom/elliot/products
 *
 * Body: { skus: string[] }
 *
 * Flow:
 *  1. For each SKU, fetch the product name from BigCommerce.
 *  2. POST all { sku, name } pairs to the Elliot simulator.
 *  3. Return a summary of what was added (and any per-SKU errors).
 */

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getActiveApiConfiguration } from '@/lib/ecom-storage';
import { bcHeaders } from '@/lib/ecom-validation';
import { addProductsToElliot, getElliotConfig } from '@/lib/elliot-client';
import { getBrandById } from '@/lib/elliot-brands';

/* ── helpers ────────────────────────────────────────────── */

async function fetchProductNameBySku(
  sku: string,
  apiEndpoint: string,
  storeHash: string,
  apiKey: string,
): Promise<string> {
  const url = `${apiEndpoint}/${storeHash}/v3/catalog/products?sku=${encodeURIComponent(sku)}`;
  const { data } = await axios.get(url, { headers: bcHeaders(apiKey) });
  const product = data?.data?.[0];
  if (!product) throw new Error(`SKU "${sku}" non trovato su BigCommerce`);
  return product.name as string;
}

/* ── route handler ──────────────────────────────────────── */

export async function POST(req: NextRequest) {
  /* 1. Parse body */
  let skus: string[] = [];
  let brandId: string;
  try {
    const body = await req.json();
    if (!Array.isArray(body?.skus) || body.skus.length === 0) {
      return NextResponse.json({ error: 'Body deve contenere un array "skus" non vuoto.' }, { status: 400 });
    }
    if (!body?.brandId || typeof body.brandId !== 'string') {
      return NextResponse.json({ error: 'Campo "brandId" obbligatorio.' }, { status: 400 });
    }
    if (!getBrandById(body.brandId)) {
      return NextResponse.json({ error: `Brand non riconosciuto: ${body.brandId}` }, { status: 400 });
    }
    skus = body.skus.map((s: unknown) => String(s).trim()).filter(Boolean);
    brandId = body.brandId;
  } catch {
    return NextResponse.json({ error: 'JSON non valido.' }, { status: 400 });
  }

  /* 2. Check BigCommerce config */
  const bcConfig = getActiveApiConfiguration();
  if (!bcConfig) {
    return NextResponse.json({ error: 'Credenziali BigCommerce non configurate.' }, { status: 400 });
  }

  /* 3. Check Elliot config */
  const elliotConfig = getElliotConfig();
  if (!elliotConfig) {
    return NextResponse.json({ error: 'Credenziali Elliot non configurate (ELLIOT_API_URL / ELLIOT_API_KEY).' }, { status: 400 });
  }

  /* 4. Fetch product names from BigCommerce */
  const resolved: { sku: string; name: string }[] = [];
  const errors: { sku: string; error: string }[] = [];

  await Promise.all(
    skus.map(async (sku) => {
      try {
        const name = await fetchProductNameBySku(
          sku,
          bcConfig.apiEndpoint,
          bcConfig.storeHash,
          bcConfig.apiKey,
        );
        resolved.push({ sku, name });
      } catch (err: any) {
        errors.push({ sku, error: err?.message ?? 'Errore sconosciuto' });
      }
    }),
  );

  /* 5. POST to Elliot — one request per product */
  const elliotResults = resolved.length > 0
    ? await addProductsToElliot(resolved, elliotConfig, brandId)
    : [];

  const elliotAdded    = elliotResults.filter((r) => !r.error && !r.alreadyExists);
  const elliotDupes    = elliotResults.filter((r) => r.alreadyExists);
  const elliotErrors   = elliotResults.filter((r) => r.error && !r.alreadyExists);

  const withName = (r: { sku: string }) => ({
    ...resolved.find((p) => p.sku === r.sku),
  });

  return NextResponse.json({
    added:         elliotAdded.map((r) => ({ ...withName(r), elliotResponse: r.response })),
    alreadyExists: elliotDupes.map((r) => withName(r)),
    bcErrors:      errors,
    elliotErrors:  elliotErrors.map((r) => ({ sku: r.sku, error: r.error })),
  });
}

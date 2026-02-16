/**
 * Configuration for the Catalogue Feed section.
 *
 * 4 brands × 2 providers (Google Merchant, AWIN) = 8 Google Sheets.
 * Each sheet is a product feed synced by an n8n workflow.
 */

/* ── Types ──────────────────────────────────────── */

export type Brand = 'testbusters' | 'peer4med' | 'topsquad' | 'medschool';
export type Provider = 'google' | 'awin';

export interface BrandMeta {
  id: Brand;
  label: string;
}

/* ── Brands ─────────────────────────────────────── */

export const BRANDS: BrandMeta[] = [
  { id: 'testbusters', label: 'Testbusters' },
  { id: 'peer4med', label: 'Peer4med' },
  { id: 'topsquad', label: 'Topsquad' },
  { id: 'medschool', label: 'Medschool' },
];

/* ── Sheet IDs ──────────────────────────────────── */

export const SHEET_IDS: Record<Brand, Record<Provider, string>> = {
  testbusters: {
    google: '1CKVyYkw8UrcGUpPBvvbU71MYUyh8ZLfI5WkI67LWTxc',
    awin: '1bguia3XGVVLhb_SoHrXM1hBa9azlYZrtDvPCqCjFLeY',
  },
  peer4med: {
    google: '1wBl2qQiLGCpuU-qRs5fR-cCIT27g0CWW3i-d8QwaqU4',
    awin: '1mnI_eorc8uONih8_IjdUem3mytjOFGx1Pj-BzrxIEuU',
  },
  topsquad: {
    google: '1jF_tGaHxJtms-bGUiZvwXKdtrG_l6K8KzGlOSCt8Swc',
    awin: '1cmwDV_FQAf8qyeCbzojw4jajYJ1ck1s2IaKMbVOas3Q',
  },
  medschool: {
    google: '1m78pG6VVSB1Hpb-jJbg1R5ApqskAeZ_9dZ6FSJW1weg',
    awin: '1RGScdDVBv3MI9aJlNbesgnIqsNfw8_sGZtmMo5LsCW0',
  },
};

/* ── Column definitions ─────────────────────────── */

/** Display columns: product_id → "SKU", product_name → "Nome prodotto" */
export const GOOGLE_COLS = {
  letters: ['A', 'B'],
  keys: ['product_id', 'product_name'] as const,
  labels: ['SKU', 'Nome prodotto'],
};

export const AWIN_COLS = {
  letters: ['A', 'B'],
  keys: ['product_id', 'product_name'] as const,
  labels: ['SKU', 'Nome prodotto'],
};

/* ── Row types ──────────────────────────────────── */

export type FeedProduct = Record<'product_id' | 'product_name', string>;

/* ── Helpers ────────────────────────────────────── */

export function isValidBrand(v: string): v is Brand {
  return BRANDS.some((b) => b.id === v);
}

export function isValidProvider(v: string): v is Provider {
  return v === 'google' || v === 'awin';
}

import { NextRequest, NextResponse } from 'next/server';
import { gvizQuery } from '@/lib/gsheet';
import {
  SHEET_IDS,
  GOOGLE_COLS,
  AWIN_COLS,
  isValidBrand,
  isValidProvider,
  type Brand,
  type Provider,
} from '@/lib/catalogue-feed-config';

/**
 * GET /api/catalogue-feed/products?brand=testbusters&provider=google
 *
 * Returns products from the matching Google Sheet feed.
 */
export async function GET(req: NextRequest) {
  const brand = req.nextUrl.searchParams.get('brand') || '';
  const provider = req.nextUrl.searchParams.get('provider') || '';

  if (!isValidBrand(brand)) {
    return NextResponse.json({ error: 'Brand non valido' }, { status: 400 });
  }
  if (!isValidProvider(provider)) {
    return NextResponse.json({ error: 'Provider non valido' }, { status: 400 });
  }

  const sheetId = SHEET_IDS[brand as Brand][provider as Provider];
  const cols = provider === 'google' ? GOOGLE_COLS : AWIN_COLS;

  const selectClause = cols.letters.join(', ');

  try {
    const rows = await gvizQuery({
      sheetId,
      query: `SELECT ${selectClause}`,
    });

    // First row is header — skip it
    const products = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const obj: Record<string, string> = {};
      for (let j = 0; j < cols.keys.length; j++) {
        obj[cols.keys[j]] = row[j] ?? '';
      }
      products.push(obj);
    }

    return NextResponse.json({
      brand,
      provider,
      count: products.length,
      products,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

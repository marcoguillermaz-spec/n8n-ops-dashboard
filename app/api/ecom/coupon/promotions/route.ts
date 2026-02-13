/**
 * GET /api/ecom/coupon/promotions?q=search_term
 *
 * Search promotions by name from BigCommerce Promotions API.
 */

import { NextResponse } from 'next/server';
import { getActiveApiConfiguration } from '@/lib/ecom-storage';
import { searchPromotions } from '@/lib/ecom-coupon';
import axios from 'axios';

export async function GET(request: Request) {
  const apiConfig = getActiveApiConfiguration();
  if (!apiConfig) {
    return NextResponse.json(
      { success: false, message: 'API BigCommerce non configurata' },
      { status: 400 },
    );
  }

  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') ?? '';
    const results = await searchPromotions(query, apiConfig);
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { success: false, message: `BigCommerce API error: ${error.response?.status ?? 'unknown'}` },
        { status: error.response?.status ?? 500 },
      );
    }
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Errore' },
      { status: 500 },
    );
  }
}

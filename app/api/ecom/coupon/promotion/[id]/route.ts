/**
 * GET /api/ecom/coupon/promotion/:id
 *
 * Fetch promotion details by ID from BigCommerce Promotions API.
 */

import { NextResponse } from 'next/server';
import { getActiveApiConfiguration } from '@/lib/ecom-storage';
import { getPromotion } from '@/lib/ecom-coupon';
import axios from 'axios';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params;
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { success: false, message: 'ID promozione non valido' },
      { status: 400 },
    );
  }

  const apiConfig = getActiveApiConfiguration();
  if (!apiConfig) {
    return NextResponse.json(
      { success: false, message: 'API BigCommerce non configurata. Impostare BC_API_ENDPOINT, BC_STORE_HASH e BC_API_KEY in .env.local' },
      { status: 400 },
    );
  }

  try {
    const promo = await getPromotion(id, apiConfig);
    const warning =
      promo.redemption_type.toLowerCase() !== 'coupon'
        ? `Attenzione: questa promozione è di tipo "${promo.redemption_type}", non "coupon"`
        : undefined;

    return NextResponse.json({ success: true, data: promo, warning });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return NextResponse.json(
        { success: false, message: `Promozione ${id} non trovata` },
        { status: 404 },
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Errore durante il recupero della promozione',
      },
      { status: 500 },
    );
  }
}

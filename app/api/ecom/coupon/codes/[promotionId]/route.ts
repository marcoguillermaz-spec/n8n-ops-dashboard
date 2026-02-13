/**
 * GET /api/ecom/coupon/codes/:promotionId
 *
 * List promotion codes with cursor-based pagination.
 */

import { NextResponse } from 'next/server';
import { getActiveApiConfiguration } from '@/lib/ecom-storage';
import { listPromotionCodes } from '@/lib/ecom-coupon';
import { couponListCodesQuerySchema } from '@/lib/ecom-schemas';
import axios from 'axios';
import { z } from 'zod';

export async function GET(
  request: Request,
  context: { params: Promise<{ promotionId: string }> },
) {
  const { promotionId: rawId } = await context.params;
  const promotionId = Number(rawId);

  if (!Number.isInteger(promotionId) || promotionId <= 0) {
    return NextResponse.json(
      { success: false, message: 'ID promozione non valido' },
      { status: 400 },
    );
  }

  const apiConfig = getActiveApiConfiguration();
  if (!apiConfig) {
    return NextResponse.json(
      { success: false, message: 'API BigCommerce non configurata' },
      { status: 400 },
    );
  }

  try {
    const url = new URL(request.url);
    const query = couponListCodesQuerySchema.parse({
      limit: url.searchParams.get('limit') ?? undefined,
      after: url.searchParams.get('after') ?? undefined,
    });

    const result = await listPromotionCodes(promotionId, apiConfig, query);
    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues.map((e) => e.message).join(', ') },
        { status: 400 },
      );
    }
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: `BigCommerce API error: ${error.response?.status ?? 'unknown'}`,
          details: error.response?.data,
        },
        { status: error.response?.status ?? 500 },
      );
    }
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Errore' },
      { status: 500 },
    );
  }
}

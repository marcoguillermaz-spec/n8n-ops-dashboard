/**
 * POST /api/ecom/coupon/codes
 *
 * Create a single promotion coupon code.
 */

import { NextResponse } from 'next/server';
import { getActiveApiConfiguration } from '@/lib/ecom-storage';
import { createPromotionCode } from '@/lib/ecom-coupon';
import { couponCreateCodeSchema } from '@/lib/ecom-schemas';
import axios from 'axios';
import { z } from 'zod';

export async function POST(request: Request) {
  const apiConfig = getActiveApiConfiguration();
  if (!apiConfig) {
    return NextResponse.json(
      { success: false, message: 'API BigCommerce non configurata' },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();
    const { promotionId, code, max_uses, max_uses_per_customer } =
      couponCreateCodeSchema.parse(body);

    const created = await createPromotionCode(
      promotionId,
      { code, max_uses, max_uses_per_customer },
      apiConfig,
    );

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues.map((e) => e.message).join(', ') },
        { status: 400 },
      );
    }
    if (axios.isAxiosError(error)) {
      const msg =
        error.response?.data?.title ??
        error.response?.data?.detail ??
        `BigCommerce API error: ${error.response?.status ?? 'unknown'}`;
      return NextResponse.json(
        { success: false, message: msg },
        { status: error.response?.status ?? 500 },
      );
    }
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Errore' },
      { status: 500 },
    );
  }
}

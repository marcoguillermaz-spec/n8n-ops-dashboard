/**
 * POST /api/ecom/validate-sku/:sku
 *
 * Single SKU validation — looks up the product by SKU,
 * checks modifiers (sub-products), stores the result.
 */

import { NextResponse } from 'next/server';
import {
  getActiveApiConfiguration,
  createValidationResult,
} from '@/lib/ecom-storage';
import { validateProductBySku } from '@/lib/ecom-validation';
import axios from 'axios';

export async function POST(
  _request: Request,
  context: { params: Promise<{ sku: string }> },
) {
  const { sku } = await context.params;

  try {
    const apiConfig = getActiveApiConfiguration();

    if (!apiConfig) {
      return NextResponse.json(
        { message: 'API configuration not found. Set BC_API_ENDPOINT, BC_STORE_HASH and BC_API_KEY in .env.local' },
        { status: 400 },
      );
    }

    const data = await validateProductBySku(sku, apiConfig);
    const saved = createValidationResult(data);
    return NextResponse.json(saved);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          message: `API request failed: ${error.response?.status} ${error.response?.statusText}`,
          details: error.response?.data,
          url: error.config?.url,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Validation failed' },
      { status: 500 },
    );
  }
}

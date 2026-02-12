/**
 * POST /api/ecom/validate-skus
 *
 * Bulk SKU validation — accepts an array of SKU strings,
 * validates each against BigCommerce, stores results in memory.
 */

import { NextResponse } from 'next/server';
import { skuValidationRequestSchema } from '@/lib/ecom-schemas';
import {
  getActiveApiConfiguration,
  createValidationResult,
} from '@/lib/ecom-storage';
import { validateProductBySku } from '@/lib/ecom-validation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { skus } = skuValidationRequestSchema.parse(body);

    const apiConfig = getActiveApiConfiguration();
    if (!apiConfig) {
      return NextResponse.json(
        { message: 'API configuration not found. Set BC_API_ENDPOINT, BC_STORE_HASH and BC_API_KEY in .env.local' },
        { status: 400 },
      );
    }

    const promises = skus.map(async (sku) => {
      try {
        const data = await validateProductBySku(sku, apiConfig);
        return createValidationResult(data);
      } catch (error) {
        return createValidationResult({
          sku,
          status: 'error',
          issues: error instanceof Error ? error.message : 'Unknown error',
          validationData: null,
          apiCalls: null,
        });
      }
    });

    const results = await Promise.all(promises);
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Validation failed' },
      { status: 400 },
    );
  }
}

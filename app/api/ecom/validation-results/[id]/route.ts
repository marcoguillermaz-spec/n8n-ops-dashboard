/**
 * GET /api/ecom/validation-results/:id
 *
 * Fetch a single validation result by numeric ID.
 */

import { NextResponse } from 'next/server';
import { getValidationResultById } from '@/lib/ecom-storage';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);

    if (isNaN(numId)) {
      return NextResponse.json(
        { message: 'Invalid ID' },
        { status: 400 },
      );
    }

    const result = getValidationResultById(numId);

    if (!result) {
      return NextResponse.json(
        { message: 'Validation result not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { message: 'Failed to fetch validation result' },
      { status: 500 },
    );
  }
}

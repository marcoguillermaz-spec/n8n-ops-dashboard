/**
 * /api/ecom/validation-results
 *
 * GET  — list all validation results (newest first)
 * DELETE — clear all validation results
 */

import { NextResponse } from 'next/server';
import {
  getValidationResults,
  clearValidationResults,
} from '@/lib/ecom-storage';

export async function GET() {
  try {
    const results = getValidationResults();
    return NextResponse.json(results);
  } catch {
    return NextResponse.json(
      { message: 'Failed to fetch validation results' },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    clearValidationResults();
    return NextResponse.json({ message: 'All validation results cleared' });
  } catch {
    return NextResponse.json(
      { message: 'Failed to clear validation results' },
      { status: 500 },
    );
  }
}

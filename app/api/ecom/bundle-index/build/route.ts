import { NextResponse } from 'next/server';
import { getActiveApiConfiguration } from '@/lib/ecom-storage';
import {
  buildBundleIndex,
  getBundleIndexStatus,
  invalidateBundleIndex,
} from '@/lib/ecom-bundle-index';

export async function POST() {
  const apiConfig = getActiveApiConfiguration();
  if (!apiConfig) {
    return NextResponse.json(
      { success: false, error: 'API non configurata' },
      { status: 500 },
    );
  }

  // Fire-and-forget: start build, return status immediately
  buildBundleIndex(apiConfig).catch(() => {
    // Error is already captured in progress state
  });

  return NextResponse.json({
    success: true,
    status: getBundleIndexStatus(),
  });
}

export async function DELETE() {
  invalidateBundleIndex();
  return NextResponse.json({
    success: true,
    message: 'Indice invalidato',
  });
}

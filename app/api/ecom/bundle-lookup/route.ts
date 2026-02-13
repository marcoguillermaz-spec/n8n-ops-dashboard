import { NextRequest, NextResponse } from 'next/server';
import { lookupBundlesForSku, getBundleIndexStatus } from '@/lib/ecom-bundle-index';

export async function GET(request: NextRequest) {
  const sku = request.nextUrl.searchParams.get('sku')?.trim();

  if (!sku) {
    return NextResponse.json(
      { success: false, error: 'Parametro SKU mancante' },
      { status: 400 },
    );
  }

  const status = getBundleIndexStatus();

  if (status.status === 'building') {
    return NextResponse.json(
      { success: false, error: 'Indice in costruzione, attendere il completamento' },
      { status: 409 },
    );
  }

  if (status.status !== 'ready') {
    return NextResponse.json(
      { success: false, error: 'Indice non disponibile — costruire prima l\'indice' },
      { status: 409 },
    );
  }

  if (status.isExpired) {
    return NextResponse.json(
      { success: false, error: 'Indice scaduto — ricostruire l\'indice' },
      { status: 409 },
    );
  }

  const result = lookupBundlesForSku(sku);
  return NextResponse.json({ success: true, data: result });
}

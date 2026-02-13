import { NextResponse } from 'next/server';
import { getBundleIndexStatus } from '@/lib/ecom-bundle-index';

export async function GET() {
  return NextResponse.json(getBundleIndexStatus());
}

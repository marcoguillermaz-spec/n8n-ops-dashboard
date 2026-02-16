/**
 * POST /api/ecom/cache-flush
 *
 * Server-side proxy for Next.js on-demand revalidation.
 * Calls GET {baseUrl}/api/revalidate?path={value} or ?sku={value}
 * on the selected brand + environment.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

const BRANDS = ['testbusters', 'peer4med', 'topsquad', 'medschool'] as const;

const BASE_URLS: Record<(typeof BRANDS)[number], { production: string; staging: string }> = {
  testbusters: { production: 'https://www.testbusters.it', staging: 'https://stg.testbusters.it' },
  peer4med: { production: 'https://www.peer4med.it', staging: 'https://stg.peer4med.it' },
  topsquad: { production: 'https://www.topsquad.it', staging: 'https://stg.topsquad.it' },
  medschool: { production: 'https://www.medschool.it', staging: 'https://stg.medschool.it' },
};

const cacheFlushSchema = z.object({
  brand: z.enum(BRANDS),
  env: z.enum(['production', 'staging']),
  type: z.enum(['path', 'sku']),
  value: z.string().min(1, 'Valore richiesto'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { brand, env, type, value } = cacheFlushSchema.parse(body);

    const baseUrl = BASE_URLS[brand][env];
    const url = `${baseUrl}/api/revalidate?${type}=${encodeURIComponent(value)}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return NextResponse.json(
        {
          success: false,
          message: `Revalidation failed (${res.status})`,
          details: errText || undefined,
        },
        { status: res.status },
      );
    }

    const data = await res.json().catch(() => ({}));

    return NextResponse.json({
      success: true,
      message: data.message || `Cache invalidata con successo (${type}: ${value})`,
      details: data,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues.map((e) => e.message).join(', ') },
        { status: 400 },
      );
    }

    if (error instanceof DOMException && error.name === 'TimeoutError') {
      return NextResponse.json(
        { success: false, message: 'Timeout: il server non ha risposto entro 15 secondi' },
        { status: 504 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Errore durante il cache flush',
      },
      { status: 500 },
    );
  }
}

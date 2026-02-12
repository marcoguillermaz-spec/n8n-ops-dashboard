/**
 * POST /api/ecom/voucher
 *
 * Server-side proxy for the voucher workflow.
 * Avoids CORS issues by calling external APIs from the server.
 *
 * Flow:
 *  1. POST testbusters.it/api/vouchers/create    → { voucherCode, orderId }
 *  2. POST testbusters.it/api/webhooks/store/order/created → { data: { order_id } }
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

const voucherSchema = z.object({
  voucherCode: z.string().min(1, 'Voucher code is required'),
  orderId: z.string().min(1, 'Order ID is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { voucherCode, orderId } = voucherSchema.parse(body);

    /* ── Step 1: Create voucher ──────────────────── */
    const createRes = await fetch('https://testbusters.it/api/vouchers/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voucherCode, orderId }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text().catch(() => '');
      return NextResponse.json(
        {
          success: false,
          message: `Voucher creation failed (${createRes.status})`,
          details: errText || undefined,
        },
        { status: createRes.status },
      );
    }

    /* ── Step 2: Trigger order webhook ───────────── */
    const webhookRes = await fetch(
      'https://testbusters.it/api/webhooks/store/order/created',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { order_id: orderId } }),
      },
    );

    if (!webhookRes.ok) {
      const errText = await webhookRes.text().catch(() => '');
      return NextResponse.json(
        {
          success: false,
          message: `Order webhook failed (${webhookRes.status}). Voucher was created but order update failed.`,
          details: errText || undefined,
        },
        { status: webhookRes.status },
      );
    }

    const webhookData = await webhookRes.json().catch(() => ({}));

    return NextResponse.json({
      success: true,
      message: webhookData.message || 'Voucher applicato con successo all\'ordine',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues.map((e) => e.message).join(', ') },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Errore durante l\'applicazione del voucher',
      },
      { status: 500 },
    );
  }
}

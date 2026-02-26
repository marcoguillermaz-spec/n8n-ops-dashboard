/**
 * POST /api/ecom/mail-migration/migrate
 *
 * Esegue la migrazione degli ordini dal vecchio al nuovo utente:
 *  1. Aggiunge gli ordini (oggetti completi) al nuovo utente (POST identities)
 *  2. Se va a buon fine, rimuove gli ordini dal vecchio utente (POST identities)
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

const orderSchema = z.object({
  id: z.string(),
  status: z.string().optional(),
  skus: z.array(z.string()).optional(),
});

const schema = z.object({
  oldEmail: z.string().email(),
  newEmail: z.string().email(),
  ordersToMigrate: z.array(orderSchema).min(1),
  oldUserCurrentOrders: z.array(orderSchema),
  newUserCurrentOrders: z.array(orderSchema),
});

function getAwsConfig() {
  const base = (process.env.ELLIOT_API_URL ?? '').replace(/\/$/, '');
  const key = process.env.ELLIOT_API_KEY ?? '';
  return { base, key };
}

function awsHeaders(key: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'currentBrandId': "''",
  };
  if (key) headers['x-api-key'] = key;
  return headers;
}

interface IdentityOrder {
  id: string;
  status?: string;
  skus?: string[];
}

async function postIdentity(
  email: string,
  orders: IdentityOrder[],
  base: string,
  key: string,
): Promise<{ ok: boolean; status: number; body: string }> {
  const res = await fetch(`${base}/identities`, {
    method: 'POST',
    headers: awsHeaders(key),
    body: JSON.stringify({ email, orders }),
  });
  const body = await res.text().catch(() => '');
  return { ok: res.ok, status: res.status, body };
}

export async function POST(request: Request) {
  try {
    const { base, key } = getAwsConfig();

    if (!base) {
      return NextResponse.json(
        { success: false, message: 'ELLIOT_API_URL non configurato nel server' },
        { status: 500 },
      );
    }

    const data = await request.json();
    const { oldEmail, newEmail, ordersToMigrate, oldUserCurrentOrders, newUserCurrentOrders } =
      schema.parse(data);

    // Step 1: aggiorna nuovo utente aggiungendo gli ordini migrati
    const migratedIds = new Set(ordersToMigrate.map((o) => o.id));
    const updatedNewOrders = [
      ...newUserCurrentOrders.filter((o) => !migratedIds.has(o.id)), // evita duplicati
      ...ordersToMigrate,
    ];
    const updateNewResult = await postIdentity(newEmail, updatedNewOrders, base, key);

    if (!updateNewResult.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `Errore nell'aggiornamento del nuovo utente (${updateNewResult.status})`,
          details: updateNewResult.body || undefined,
        },
        { status: 500 },
      );
    }

    // Step 2: aggiorna vecchio utente rimuovendo gli ordini migrati
    const updatedOldOrders = oldUserCurrentOrders.filter((o) => !migratedIds.has(o.id));
    const updateOldResult = await postIdentity(oldEmail, updatedOldOrders, base, key);

    if (!updateOldResult.ok) {
      return NextResponse.json(
        {
          success: false,
          partialSuccess: true,
          message: `Ordini aggiunti al nuovo utente, ma errore nella rimozione dal vecchio (${updateOldResult.status}). Verificare manualmente.`,
          details: updateOldResult.body || undefined,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `${ordersToMigrate.length} ordine/i migrato/i con successo`,
      migratedOrders: ordersToMigrate.map((o) => o.id),
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
        message: error instanceof Error ? error.message : 'Errore imprevisto',
      },
      { status: 500 },
    );
  }
}

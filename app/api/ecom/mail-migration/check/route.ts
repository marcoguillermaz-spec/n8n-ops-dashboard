/**
 * POST /api/ecom/mail-migration/check
 *
 * Verifica l'esistenza del vecchio e del nuovo utente tramite AWS identities API
 * e calcola quali ordini possono essere migrati.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  oldEmail: z.string().email('Email non valida'),
  newEmail: z.string().email('Email non valida'),
  orders: z.array(z.string().min(1)).min(1, 'Inserisci almeno un ordine'),
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

export interface IdentityOrder {
  id: string;
  status?: string;
  skus?: string[];
}

async function fetchIdentity(
  email: string,
  base: string,
  key: string,
): Promise<{ found: boolean; orders: IdentityOrder[]; raw: unknown }> {
  const url = `${base}/identities?email:in=${encodeURIComponent(email)}&includes=orders`;
  const res = await fetch(url, { headers: awsHeaders(key) });

  if (res.status === 404) return { found: false, orders: [], raw: null };
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Errore API identities (${res.status})${body ? `: ${body}` : ''}`);
  }

  const data = await res.json();
  const user = Array.isArray(data) ? data[0] : null;

  if (!user) return { found: false, orders: [], raw: data };

  const orders: IdentityOrder[] = Array.isArray(user.orders) ? user.orders : [];

  return { found: true, orders, raw: user };
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

    const body = await request.json();
    const { oldEmail, newEmail, orders: inputOrderIds } = schema.parse(body);

    const [oldIdentity, newIdentity] = await Promise.all([
      fetchIdentity(oldEmail, base, key),
      fetchIdentity(newEmail, base, key),
    ]);

    if (!oldIdentity.found) {
      return NextResponse.json(
        { success: false, message: 'Utente da migrare non trovato' },
        { status: 404 },
      );
    }

    if (!newIdentity.found) {
      return NextResponse.json(
        {
          success: false,
          message: 'Utente di destinazione non trovato, creare account prima di procedere',
        },
        { status: 404 },
      );
    }

    const oldOrders = oldIdentity.orders;
    const newOrders = newIdentity.orders;

    const oldOrderIds = new Set(oldOrders.map((o) => o.id));
    const newOrderIds = new Set(newOrders.map((o) => o.id));

    // Ordini dell'input trovati sul vecchio utente (oggetti completi)
    const ordersFoundOnOld = oldOrders.filter((o) => inputOrderIds.includes(o.id));
    // ID ordini dell'input NON trovati sul vecchio utente
    const ordersNotFoundOnOld = inputOrderIds.filter((id) => !oldOrderIds.has(id));
    // ID ordini dell'input già presenti sul nuovo utente
    const ordersAlreadyOnNew = inputOrderIds.filter((id) => newOrderIds.has(id));
    // Oggetti completi da migrare: trovati sul vecchio e non già sul nuovo
    const ordersToMigrate = ordersFoundOnOld.filter((o) => !newOrderIds.has(o.id));

    return NextResponse.json({
      success: true,
      oldUserOrders: oldOrders,
      newUserOrders: newOrders,
      ordersToMigrate,        // array di oggetti {id, status, skus}
      ordersNotFoundOnOld,    // array di ID string
      ordersAlreadyOnNew,     // array di ID string
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

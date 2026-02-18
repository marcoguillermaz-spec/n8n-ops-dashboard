import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { bcHeaders } from '@/lib/ecom-validation';

/* ── Types ─────────────────────────────────────────── */

export interface FeedCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  value: string;
  message?: string;
}

export interface FeedValidationResult {
  sku: string;
  productId: number;
  productName: string;
  status: 'passed' | 'failed';
  checks: FeedCheck[];
}

/* ── Helper: strip HTML ─────────────────────────────── */

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/* ── POST /api/catalogue-feed/validate-sku ──────────── */

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const sku = typeof body?.sku === 'string' ? body.sku.trim() : '';

  if (!sku) {
    return NextResponse.json({ success: false, message: 'SKU obbligatorio' }, { status: 400 });
  }

  const endpoint = process.env.BC_API_ENDPOINT;
  const storeHash = process.env.BC_STORE_HASH;
  const apiKey = process.env.BC_API_KEY;

  if (!endpoint || !storeHash || !apiKey) {
    return NextResponse.json(
      { success: false, message: 'Credenziali BigCommerce non configurate' },
      { status: 500 }
    );
  }

  const baseUrl = `${endpoint}/${storeHash}/v3/catalog`;

  try {
    /* 1 — Fetch product by SKU with images and custom_fields */
    const res = await axios.get(`${baseUrl}/products`, {
      headers: bcHeaders(apiKey),
      params: { 'sku:in': sku, include: 'images,custom_fields', limit: 1 },
    });

    const products: any[] = res.data?.data ?? [];

    if (products.length === 0) {
      return NextResponse.json(
        { success: false, message: `Nessun prodotto trovato per SKU: ${sku}` },
        { status: 404 }
      );
    }

    const p = products[0];

    /* 2 — Extract custom fields as a map */
    const customFields: Record<string, string> = {};
    for (const cf of p.custom_fields ?? []) {
      customFields[cf.name.toLowerCase()] = String(cf.value ?? '');
    }

    /* 3 — Run feed validation checks */
    const checks: FeedCheck[] = [];

    // Check 1: Visibilità
    checks.push({
      name: 'Visibilità',
      status: p.is_visible ? 'pass' : 'fail',
      value: p.is_visible ? 'Visibile' : 'Nascosto',
      message: p.is_visible ? undefined : 'Attivare "Visible on Storefront"',
    });

    // Check 2: feed_enabled custom field
    const feedEnabledRaw = customFields['feed_enabled'];
    const feedEnabled = feedEnabledRaw === 'true';
    checks.push({
      name: 'feed_enabled',
      status: feedEnabled ? 'pass' : 'fail',
      value: feedEnabledRaw !== undefined ? `"${feedEnabledRaw}"` : 'Assente',
      message: feedEnabled
        ? undefined
        : feedEnabledRaw === undefined
        ? 'Aggiungere custom field feed_enabled = true'
        : `Valore non valido (atteso "true", trovato "${feedEnabledRaw}")`,
    });

    // Check 3: Custom field "title"
    const titleField = customFields['title'];
    const hasTitle = titleField !== undefined && titleField.length > 0;
    checks.push({
      name: 'Custom field title',
      status: hasTitle ? 'pass' : 'fail',
      value: hasTitle ? `"${titleField}"` : 'Assente',
      message: hasTitle ? undefined : 'Aggiungere custom field title',
    });

    // Check 4: Categorie
    const categories: number[] = p.categories ?? [];
    checks.push({
      name: 'Categorie',
      status: categories.length >= 1 ? 'pass' : 'fail',
      value: `${categories.length} categoria${categories.length !== 1 ? 'e' : ''}`,
      message: categories.length >= 1 ? undefined : 'Associare almeno una categoria',
    });

    // Check 5: Immagine di copertina
    const images: any[] = p.images ?? [];
    checks.push({
      name: 'Immagine copertina',
      status: images.length >= 1 ? 'pass' : 'fail',
      value: images.length >= 1 ? `${images.length} immagine/i` : 'Nessuna immagine',
      message: images.length >= 1 ? undefined : 'Aggiungere almeno un\'immagine di copertina',
    });

    // Check 6: Descrizione
    const desc = stripHtml(p.description ?? '');
    checks.push({
      name: 'Descrizione',
      status: desc.length > 0 ? 'pass' : 'fail',
      value: desc.length > 0 ? `${desc.length} caratteri` : 'Vuota',
      message: desc.length > 0 ? undefined : 'Aggiungere una descrizione al prodotto',
    });

    // Check 7: Prezzo base (price > 0); sale_price opzionale
    const price = parseFloat(p.price ?? '0') || 0;
    checks.push({
      name: 'Prezzo',
      status: price > 0 ? 'pass' : 'fail',
      value: price > 0 ? `€ ${price.toFixed(2)}` : 'Non impostato',
      message: price > 0 ? undefined : 'Il prezzo base (Default Price) deve essere > 0',
    });

    const allPassed = checks.every((c) => c.status === 'pass');

    const result: FeedValidationResult = {
      sku: p.sku,
      productId: p.id,
      productName: p.name,
      status: allPassed ? 'passed' : 'failed',
      checks,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    const status = err.response?.status ?? 500;
    const message = err.response?.data?.title ?? err.message ?? 'Errore BigCommerce';
    return NextResponse.json({ success: false, message }, { status });
  }
}

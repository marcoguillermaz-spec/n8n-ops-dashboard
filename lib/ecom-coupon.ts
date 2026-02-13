/**
 * eCommerce Utils — BigCommerce Promotions API client.
 *
 * Handles promotion details, coupon code listing, and code creation.
 */

import axios from 'axios';
import type { ApiConfiguration } from './ecom-storage';

/* ── Types ─────────────────────────────────────────────── */

export interface PromotionInfo {
  id: number;
  name: string;
  redemption_type: string;
  status: string;
}

export interface CodeItem {
  id: number;
  code: string;
  max_uses: number;
  max_uses_per_customer: number;
  current_uses: number;
  created_at: string;
}

export interface CodesPagination {
  after: string | null;
}

/* ── Helpers ───────────────────────────────────────────── */

function bcHeaders(apiKey: string) {
  return {
    'X-Auth-Token': apiKey,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  } as const;
}

function promotionsBaseUrl(config: ApiConfiguration) {
  return `${config.apiEndpoint}/${config.storeHash}/v3/promotions`;
}

/* ── API functions ─────────────────────────────────────── */

export async function searchPromotions(
  query: string,
  config: ApiConfiguration,
): Promise<PromotionInfo[]> {
  const url = `${promotionsBaseUrl(config)}?limit=250`;
  const res = await axios.get(url, {
    headers: bcHeaders(config.apiKey),
    timeout: 10_000,
  });

  const all: PromotionInfo[] = (res.data?.data ?? []).map((d: any) => ({
    id: d.id,
    name: d.name,
    redemption_type: d.redemption_type,
    status: d.status,
  }));

  if (!query.trim()) return all;

  const q = query.toLowerCase();
  return all.filter((p) => p.name.toLowerCase().includes(q));
}

export async function getPromotion(
  id: number,
  config: ApiConfiguration,
): Promise<PromotionInfo> {
  const url = `${promotionsBaseUrl(config)}/${id}`;
  const res = await axios.get(url, {
    headers: bcHeaders(config.apiKey),
    timeout: 10_000,
  });
  const d = res.data?.data;
  return {
    id: d.id,
    name: d.name,
    redemption_type: d.redemption_type,
    status: d.status,
  };
}

export async function listPromotionCodes(
  promotionId: number,
  config: ApiConfiguration,
  opts: { limit?: number; after?: string } = {},
): Promise<{ data: CodeItem[]; pagination: CodesPagination }> {
  const limit = Math.min(opts.limit ?? 250, 250);
  const params = new URLSearchParams({ limit: String(limit) });
  if (opts.after) params.set('after', opts.after);

  const url = `${promotionsBaseUrl(config)}/${promotionId}/codes?${params}`;
  const res = await axios.get(url, {
    headers: bcHeaders(config.apiKey),
    timeout: 10_000,
  });

  const items: CodeItem[] = (res.data?.data ?? []).map((c: any) => ({
    id: c.id,
    code: c.code,
    max_uses: c.max_uses ?? 0,
    max_uses_per_customer: c.max_uses_per_customer ?? 0,
    current_uses: c.current_uses ?? 0,
    created_at: c.created_at ?? '',
  }));

  const after: string | null =
    res.data?.meta?.pagination?.cursors?.after ?? null;

  return { data: items, pagination: { after } };
}

export async function createPromotionCode(
  promotionId: number,
  body: { code: string; max_uses?: number; max_uses_per_customer?: number },
  config: ApiConfiguration,
): Promise<any> {
  const url = `${promotionsBaseUrl(config)}/${promotionId}/codes`;
  const res = await axios.post(
    url,
    {
      code: body.code,
      ...(body.max_uses != null && { max_uses: body.max_uses }),
      ...(body.max_uses_per_customer != null && {
        max_uses_per_customer: body.max_uses_per_customer,
      }),
    },
    {
      headers: bcHeaders(config.apiKey),
      timeout: 10_000,
    },
  );
  return res.data?.data;
}

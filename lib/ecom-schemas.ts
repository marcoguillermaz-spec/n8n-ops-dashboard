/**
 * eCommerce Utils — Zod request / response schemas.
 *
 * Replaces the drizzle-zod based schemas from the Replit project
 * with standalone Zod definitions (no database dependency).
 */

import { z } from 'zod';

/* ── Bulk SKU validation request ─────────────────────────── */

export const skuValidationRequestSchema = z.object({
  skus: z.array(z.string().min(1)).min(1),
  apiConfigId: z.number().optional(), // ignored (env-based config only)
});

export type SkuValidationRequest = z.infer<typeof skuValidationRequestSchema>;

/* ── API config test request ─────────────────────────────── */

export const apiConfigTestSchema = z.object({
  apiEndpoint: z.string().url(),
  storeHash: z.string().min(1),
  apiKey: z.string().min(1),
});

export type ApiConfigTestRequest = z.infer<typeof apiConfigTestSchema>;

/* ── Coupon code creation request ────────────────────────── */

export const couponCreateCodeSchema = z.object({
  promotionId: z.number().int().positive(),
  code: z.string().min(1).max(50),
  max_uses: z.number().int().min(0).optional(),
  max_uses_per_customer: z.number().int().min(0).optional(),
});

export type CouponCreateCodeRequest = z.infer<typeof couponCreateCodeSchema>;

/* ── Coupon codes list query ─────────────────────────────── */

export const couponListCodesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(250).default(250),
  after: z.string().optional(),
});

export type CouponListCodesQuery = z.infer<typeof couponListCodesQuerySchema>;

/* ── Coupon code generation (client-side params) ─────────── */

export const couponCodeGenSchema = z.object({
  prefix: z.string().max(20).default(''),
  length: z.coerce.number().int().min(4).max(30).default(8),
  quantity: z.coerce.number().int().min(1).max(10000).default(10),
});

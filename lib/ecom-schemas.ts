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

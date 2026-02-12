/**
 * eCommerce Utils — In-memory storage layer.
 *
 * Validation results are transient (cleared on server restart).
 * API configuration is read from environment variables.
 */

/* ──────────────────────────────────────────────────────────
 * Types
 * ────────────────────────────────────────────────────────── */

export interface ValidationResult {
  id: number;
  sku: string;
  productId: number | null;
  productName: string | null;
  status: 'passed' | 'failed' | 'processing' | 'error';
  subProductsFound: number;
  subProductsTotal: number;
  issues: string | null;
  validationData: unknown;
  apiCalls: unknown;
  createdAt: Date;
}

export interface InsertValidationResult {
  sku: string;
  productId?: number | null;
  productName?: string | null;
  status: string;
  subProductsFound?: number;
  subProductsTotal?: number;
  issues?: string | null;
  validationData?: unknown;
  apiCalls?: unknown;
}

export interface ApiConfiguration {
  id: number;
  name: string;
  apiEndpoint: string;
  storeHash: string;
  apiKey: string;
  isActive: boolean;
  createdAt: Date;
}

export interface ProductCheck {
  name: string;
  status: 'pass' | 'fail';
  value: string;
  message?: string;
}

export interface SubProduct {
  name: string;
  sku: string;
  type: string;
  required: boolean;
  found: boolean;
  productId?: number;
  checks?: ProductCheck[];
  error?: string;
}

export interface ValidationProgress {
  total: number;
  completed: number;
  percentage: number;
  currentStep: string;
  currentAction: string;
  currentSku?: string;
}

export interface ValidationStats {
  passed: number;
  failed: number;
  pending: number;
  total: number;
}

/* ──────────────────────────────────────────────────────────
 * In-memory store for validation results
 * ────────────────────────────────────────────────────────── */

const results = new Map<number, ValidationResult>();
let nextId = 1;

export function createValidationResult(
  data: InsertValidationResult,
): ValidationResult {
  const id = nextId++;
  const row: ValidationResult = {
    id,
    sku: data.sku,
    productId: data.productId ?? null,
    productName: data.productName ?? null,
    status: data.status as ValidationResult['status'],
    subProductsFound: data.subProductsFound ?? 0,
    subProductsTotal: data.subProductsTotal ?? 0,
    issues: data.issues ?? null,
    validationData: data.validationData ?? null,
    apiCalls: data.apiCalls ?? null,
    createdAt: new Date(),
  };
  results.set(id, row);
  return row;
}

export function getValidationResults(): ValidationResult[] {
  return Array.from(results.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

export function getValidationResultById(
  id: number,
): ValidationResult | undefined {
  return results.get(id);
}

export function updateValidationResult(
  id: number,
  updates: Partial<InsertValidationResult>,
): ValidationResult | undefined {
  const existing = results.get(id);
  if (!existing) return undefined;
  const updated: ValidationResult = { ...existing, ...updates } as ValidationResult;
  results.set(id, updated);
  return updated;
}

export function deleteValidationResult(id: number): boolean {
  return results.delete(id);
}

export function clearValidationResults(): void {
  results.clear();
}

/* ──────────────────────────────────────────────────────────
 * API configuration — read from environment variables
 *
 * BC_API_ENDPOINT, BC_STORE_HASH, BC_API_KEY in .env.local
 * ────────────────────────────────────────────────────────── */

export function getActiveApiConfiguration(): ApiConfiguration | undefined {
  const apiEndpoint = process.env.BC_API_ENDPOINT;
  const storeHash = process.env.BC_STORE_HASH;
  const apiKey = process.env.BC_API_KEY;

  if (!apiEndpoint || !storeHash || !apiKey) return undefined;

  return {
    id: 1,
    name: 'default',
    apiEndpoint,
    storeHash,
    apiKey,
    isActive: true,
    createdAt: new Date(),
  };
}

export function isApiConfigured(): boolean {
  return getActiveApiConfiguration() !== undefined;
}

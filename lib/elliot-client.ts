/**
 * Elliot Simulator API client.
 *
 * Base URL and API key are read from environment variables:
 *   ELLIOT_API_URL  – e.g. https://b2wl5e6k10.execute-api.eu-south-1.amazonaws.com/prod
 *   ELLIOT_API_KEY  – X-Api-Key header value
 *
 * NOTE: POST /products accepts ONE product per request (plain object, not array).
 *       Multiple products require multiple sequential/parallel requests.
 */

export interface ElliotProduct {
  sku: string;
  name: string;
}

export interface ElliotProductResult {
  sku: string;
  response: unknown;
  error?: string;
  alreadyExists?: boolean;
}

export interface ElliotConfig {
  baseUrl: string;
  apiKey: string;
}

export function getElliotConfig(): ElliotConfig | undefined {
  const baseUrl = process.env.ELLIOT_API_URL;
  const apiKey = process.env.ELLIOT_API_KEY;
  if (!baseUrl || !apiKey) return undefined;
  return { baseUrl, apiKey };
}

const ELLIOT_HEADERS = (apiKey: string, brandId: string) => ({
  'Content-Type': 'application/json',
  'X-Api-Key': apiKey,
  'currentBrandId': brandId,
});

/**
 * GET /products/:sku — returns the product if it exists, null otherwise.
 */
async function getProductBySku(
  sku: string,
  config: ElliotConfig,
  brandId: string,
): Promise<unknown | null> {
  const url = `${config.baseUrl}/products/${encodeURIComponent(sku)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: ELLIOT_HEADERS(config.apiKey, brandId),
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  // Elliot returns null (as JSON) when not found
  return json ?? null;
}

/**
 * POST /products — adds a single product to the Elliot simulator.
 */
async function addSingleProduct(
  product: ElliotProduct,
  config: ElliotConfig,
  brandId: string,
): Promise<unknown> {
  const url = `${config.baseUrl}/products`;
  const res = await fetch(url, {
    method: 'POST',
    headers: ELLIOT_HEADERS(config.apiKey, brandId),
    body: JSON.stringify({ sku: product.sku, name: product.name }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Elliot API error ${res.status}: ${text}`);
  }

  return res.json().catch(() => null);
}

/**
 * Adds multiple products to the Elliot simulator (one request per product).
 * Checks existence first to avoid duplicate-key errors.
 * Returns per-product results including any individual errors.
 */
export async function addProductsToElliot(
  products: ElliotProduct[],
  config: ElliotConfig,
  brandId: string,
): Promise<ElliotProductResult[]> {
  return Promise.all(
    products.map(async (product) => {
      try {
        // Check if already exists to avoid 500 on duplicate key
        const existing = await getProductBySku(product.sku, config, brandId);
        if (existing !== null) {
          return {
            sku: product.sku,
            response: existing,
            alreadyExists: true,
          };
        }
        const response = await addSingleProduct(product, config, brandId);
        return { sku: product.sku, response };
      } catch (err: any) {
        return { sku: product.sku, response: null, error: err?.message ?? 'Errore sconosciuto' };
      }
    }),
  );
}

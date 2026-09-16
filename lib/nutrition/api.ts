import { buildPublicApiUrl } from '@/lib/api/env';
import type { FoodProduct, FoodSearchResponse, NutritionErrorCode } from './types';
import { NutritionApiError } from './types';

// These are the two public nutrition routes exposed by the API. Keeping them in
// one client prevents transport details from leaking into UI components.
export const nutritionRoutes = {
  byBarcode: (barcode: string) => `/api/nutrition/products/${encodeURIComponent(barcode)}`,
  search: (query: string) => `/api/nutrition/search?query=${encodeURIComponent(query)}`
};

const knownCodes = new Set<NutritionErrorCode>(['PRODUCT_NOT_FOUND', 'INVALID_BARCODE', 'PROVIDER_UNAVAILABLE']);

type ApiEnvelope<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

const isApiEnvelope = <T>(payload: unknown): payload is ApiEnvelope<T> =>
  typeof payload === 'object' && payload !== null && 'data' in payload;

async function readResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as (ApiEnvelope<T> | T | { code?: string } | null);
  if (response.ok) {
    if (isApiEnvelope<T>(payload)) return payload.data;
    return payload as T;
  }

  const code = payload && typeof payload === 'object' && 'code' in payload ? payload.code : undefined;
  if (code && knownCodes.has(code as NutritionErrorCode)) throw new NutritionApiError(code as NutritionErrorCode);
  if (response.status === 404) throw new NutritionApiError('PRODUCT_NOT_FOUND');
  if (response.status === 400 || response.status === 422) throw new NutritionApiError('INVALID_BARCODE');
  if (response.status === 502 || response.status === 503 || response.status === 504) throw new NutritionApiError('PROVIDER_UNAVAILABLE');
  throw new NutritionApiError('NETWORK_ERROR');
}

async function request<T>(path: string, signal?: AbortSignal) {
  try {
    const response = await fetch(buildPublicApiUrl(path), { signal, headers: { Accept: 'application/json' } });
    return await readResponse<T>(response);
  } catch (error) {
    if (error instanceof NutritionApiError || (error instanceof DOMException && error.name === 'AbortError')) throw error;
    throw new NutritionApiError('NETWORK_ERROR');
  }
}

export const getFoodByBarcode = (barcode: string, signal?: AbortSignal) =>
  request<FoodProduct>(nutritionRoutes.byBarcode(barcode.replace(/\s+/g, '')), signal);

export const searchFoods = (query: string, signal?: AbortSignal) =>
  request<FoodSearchResponse>(nutritionRoutes.search(query.trim()), signal);

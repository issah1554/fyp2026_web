import { authenticatedFetch } from "@/src/services/auth/authService";
import { apiUrl } from "@/src/services/config";
import type { Area } from "@/src/services/areas/areaService";
import type { Commodity } from "@/src/services/commodities/commodityService";

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
  meta?: Record<string, unknown>;
};

export type PaginationMeta = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
};

export type MarketStatus = "active" | "inactive";

export type Market = {
  market_id: string;
  name: string;
  code: string;
  admin_area_id?: string;
  admin_area?: Area | null;
  address: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  description?: string;
  status: MarketStatus | string;
  created_at: string;
};

export type MarketFormPayload = {
  name: string;
  code: string;
  admin_area_id: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  description: string;
  status: MarketStatus;
};

export type MarketPrice = {
  price_id: string;
  market_id?: string;
  commodity_id?: string;
  market?: Pick<Market, "market_id" | "name" | "code"> | null;
  commodity?: Pick<Commodity, "commodity_id" | "name" | "unit" | "unit_detail"> | null;
  unit?: { unit_id: string; name: string; symbol: string } | null;
  price_type?: string;
  market_name?: string;
  commodity_name?: string;
  price: number | string;
  price_usd?: number | string | null;
  quantity?: number | string | null;
  min_price?: number | string | null;
  max_price?: number | string | null;
  currency: string;
  source_key?: string;
  source_name?: string;
  raw_prices_count?: number;
  price_date: string;
  created_at: string;
};

export type MarketPriceFormPayload = {
  market_id?: string;
  commodity_id: string;
  unit_id: string;
  price: number;
  currency: string;
  price_date: string;
};

export type MarketListResult = {
  data: Market[];
  pagination: PaginationMeta;
};

export type MarketPriceListResult = {
  data: MarketPrice[];
  pagination: PaginationMeta;
};

export type RawCommodityPrice = {
  raw_price_id: string;
  source_id?: string | null;
  source_key: string;
  source_name: string;
  source_label?: string | null;
  source_reference: string;
  market_name: string;
  commodity_name: string;
  unit_symbol: string;
  price_type?: string | null;
  price: number | string;
  quantity: number | string;
  min_price?: number | string | null;
  max_price?: number | string | null;
  currency: string;
  price_date: string;
  observed_at: string;
  raw_payload: Record<string, unknown>;
  normalized_price_id?: string | null;
  created_at: string;
};

export type RawCommodityPriceListResult = {
  data: RawCommodityPrice[];
  pagination: PaginationMeta;
};

export type MarketIntegrationSyncResult = {
  fetched: number;
  selected: number;
  created: number;
  updated: number;
  errors: Array<{ source: string; error: string }>;
};

export type MarketIntegrationUpdateStatus = {
  source: string;
  latest_stored_at: string | null;
  fetched: number;
  new: number;
  has_updates: boolean;
};

export type MarketIntegrationUpdateResult = {
  sources: MarketIntegrationUpdateStatus[];
  errors: Array<{ source: string; error: string }>;
};

export type MarketIntegrationSource = {
  key: "platform_a" | "platform_b" | "internal" | string;
  name: string;
  source_type?: "internal" | "api" | "scraper" | "file" | string;
  base_url: string;
  prices_url: string;
  health_url: string;
  is_active?: boolean;
  last_checked_at?: string | null;
  last_imported_at?: string | null;
  last_seen_record_at?: string | null;
};

export type MarketIntegrationHealth = {
  source: string;
  name: string;
  ok: boolean;
  payload?: unknown;
  error?: string;
};

function getFirstErrorMessage(errors: unknown): string {
  if (Array.isArray(errors)) {
    for (const error of errors) {
      const message = getFirstErrorMessage(error);
      if (message) return message;
    }
    return "";
  }

  if (errors && typeof errors === "object") {
    for (const error of Object.values(errors)) {
      const message = getFirstErrorMessage(error);
      if (message) return message;
    }
    return "";
  }

  return errors ? String(errors) : "";
}

function getErrorMessage(payload: ApiResponse<unknown> | null, fallback: string) {
  return payload?.message ?? getFirstErrorMessage(payload?.errors) ?? fallback;
}

async function marketRequest<T>(path: string, init: RequestInit = {}, fallback = "Request failed.") {
  const response = await authenticatedFetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, fallback));
  }

  if (!payload) {
    throw new Error(fallback);
  }

  return payload;
}

function normalizePagination(meta: Record<string, unknown> | undefined, fallbackCount: number): PaginationMeta {
  const pagination = (meta?.pagination ?? {}) as Partial<PaginationMeta>;
  return {
    page: Number(pagination.page ?? 1),
    page_size: Number(pagination.page_size ?? fallbackCount),
    total_items: Number(pagination.total_items ?? fallbackCount),
    total_pages: Number(pagination.total_pages ?? 1),
    has_next: Boolean(pagination.has_next),
    has_previous: Boolean(pagination.has_previous),
  };
}

function withQuery(path: string, params: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });
  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export async function listMarkets(
  params: { status?: string; admin_area_id?: string; search?: string; page?: number; page_size?: number } = {},
): Promise<MarketListResult> {
  const payload = await marketRequest<Market[]>(
    withQuery("/markets", params),
    {},
    "Could not load markets.",
  );
  const data = payload.data ?? [];
  return { data, pagination: normalizePagination(payload.meta, data.length) };
}

export async function getMarket(marketId: string) {
  const payload = await marketRequest<Market>(`/markets/${marketId}`, {}, "Could not load market.");
  return payload.data;
}

export async function createMarket(data: MarketFormPayload) {
  const payload = await marketRequest<Market>("/markets", { method: "POST", body: JSON.stringify(data) }, "Could not create market.");
  return { message: payload.message ?? "Market created successfully.", market: payload.data };
}

export async function updateMarket(marketId: string, data: MarketFormPayload) {
  const payload = await marketRequest<Market>(`/markets/${marketId}`, { method: "PATCH", body: JSON.stringify(data) }, "Could not update market.");
  return { message: payload.message ?? "Market updated successfully.", market: payload.data };
}

export async function deleteMarket(marketId: string) {
  const payload = await marketRequest<unknown>(`/markets/${marketId}`, { method: "DELETE" }, "Could not delete market.");
  return payload.message ?? "Market deleted successfully.";
}

export async function listMarketPrices(
  params: { market_id?: string; commodity_id?: string; price_date?: string; date_from?: string; date_to?: string; source_key?: string; search?: string; ordering?: string; page?: number; page_size?: number } = {},
): Promise<MarketPriceListResult> {
  const payload = await marketRequest<MarketPrice[]>(
    withQuery("/market-prices", params),
    {},
    "Could not load market prices.",
  );
  const data = payload.data ?? [];
  return { data, pagination: normalizePagination(payload.meta, data.length) };
}

export async function syncMarketIntegrations(params: { source?: string; commodity?: string; market?: string; limit?: number; new_only?: boolean } = {}) {
  const payload = await marketRequest<MarketIntegrationSyncResult>(
    withQuery("/market-integrations/sync", params),
    { method: "POST" },
    "Could not sync market integrations.",
  );
  return {
    message: payload.message ?? "Market integrations synced successfully.",
    result: payload.data ?? { fetched: 0, selected: 0, created: 0, updated: 0, errors: [] },
  };
}

export async function importRawMarketIntegrationPrices(params: { source?: string; commodity?: string; market?: string; limit?: number; new_only?: boolean } = {}) {
  const payload = await marketRequest<MarketIntegrationSyncResult>(
    withQuery("/market-integrations/import-raw", params),
    { method: "POST" },
    "Could not import raw market integration prices.",
  );
  return {
    message: payload.message ?? "Raw market integration prices imported successfully.",
    result: payload.data ?? { fetched: 0, selected: 0, created: 0, updated: 0, errors: [] },
  };
}

export async function standardizeMarketIntegrationPrices(params: { source?: string; commodity?: string; market?: string; limit?: number } = {}) {
  const payload = await marketRequest<Pick<MarketIntegrationSyncResult, "created" | "updated" | "errors">>(
    withQuery("/market-integrations/standardize", params),
    { method: "POST" },
    "Could not standardise market integration prices.",
  );
  return {
    message: payload.message ?? "Raw market integration prices standardised successfully.",
    result: payload.data ?? { created: 0, updated: 0, errors: [] },
  };
}

export async function checkMarketIntegrationUpdates(params: { source?: string; commodity?: string; market?: string; limit?: number } = {}) {
  const payload = await marketRequest<MarketIntegrationUpdateResult>(
    withQuery("/market-integrations/updates", params),
    {},
    "Could not check source updates.",
  );
  return payload.data ?? { sources: [], errors: [] };
}

export async function listMarketIntegrationSources() {
  const payload = await marketRequest<MarketIntegrationSource[]>(
    "/market-integrations/sources",
    {},
    "Could not load market integration sources.",
  );
  return payload.data ?? [];
}

export async function checkMarketIntegrationHealth() {
  const payload = await marketRequest<MarketIntegrationHealth[]>(
    "/market-integrations/health",
    {},
    "Could not check market integration health.",
  );
  return {
    data: payload.data ?? [],
    meta: payload.meta ?? {},
  };
}

export async function listPricesForMarket(marketId: string) {
  const payload = await marketRequest<MarketPrice[]>(`/markets/${marketId}/prices`, {}, "Could not load market prices.");
  return payload.data ?? [];
}

export async function listLatestPricesForMarket(marketId: string) {
  const payload = await marketRequest<MarketPrice[]>(`/markets/${marketId}/latest-prices`, {}, "Could not load latest prices.");
  return payload.data ?? [];
}

export async function createMarketPrice(data: MarketPriceFormPayload) {
  const payload = await marketRequest<MarketPrice>("/market-prices", { method: "POST", body: JSON.stringify(data) }, "Could not create market price.");
  return { message: payload.message ?? "Market price created successfully.", price: payload.data };
}

export async function createNestedMarketPrice(marketId: string, data: Omit<MarketPriceFormPayload, "market_id">) {
  const payload = await marketRequest<MarketPrice>(
    `/markets/${marketId}/prices`,
    { method: "POST", body: JSON.stringify(data) },
    "Could not create market price.",
  );
  return { message: payload.message ?? "Market price created successfully.", price: payload.data };
}

export async function updateMarketPrice(priceId: string, data: MarketPriceFormPayload) {
  const payload = await marketRequest<MarketPrice>(`/market-prices/${priceId}`, { method: "PATCH", body: JSON.stringify(data) }, "Could not update market price.");
  return { message: payload.message ?? "Market price updated successfully.", price: payload.data };
}

export async function deleteMarketPrice(priceId: string) {
  const payload = await marketRequest<unknown>(`/market-prices/${priceId}`, { method: "DELETE" }, "Could not delete market price.");
  return payload.message ?? "Market price deleted successfully.";
}

export async function listCommodityPrices(commodityId: string) {
  const payload = await marketRequest<MarketPrice[]>(`/commodities/${commodityId}/prices`, {}, "Could not load commodity prices.");
  return payload.data ?? [];
}

export async function listCommodityPriceHistory(commodityId: string) {
  const payload = await marketRequest<MarketPrice[]>(`/commodities/${commodityId}/price-history`, {}, "Could not load commodity price history.");
  return payload.data ?? [];
}

export async function listCommodityPriceComparison(commodityId: string, priceDate?: string) {
  const payload = await marketRequest<MarketPrice[]>(
    withQuery(`/commodities/${commodityId}/price-comparison`, { price_date: priceDate }),
    {},
    "Could not load commodity price comparison.",
  );
  return payload.data ?? [];
}

export type NormalizedMarketPrice = {
  source: string;
  commodity: string;
  price_tzs: number | null;
  price_usd: number | null;
  market?: string | null;
  volume?: number | null;
  confidence?: number | null;
  delay_minutes?: number | null;
  timestamp: string | null;
  raw?: Record<string, unknown>;
};

export type NormalizedMarketPriceListResult = {
  data: NormalizedMarketPrice[];
  pagination: PaginationMeta;
};

export async function listLivePrices(params: { source?: string; commodity?: string; market?: string; page?: number; page_size?: number } = {}): Promise<NormalizedMarketPriceListResult> {
  const payload = await marketRequest<NormalizedMarketPrice[]>(
    withQuery("/market-integrations/live-prices", params),
    {},
    "Could not load live normalized prices."
  );
  const data = payload.data ?? [];
  return { data, pagination: normalizePagination(payload.meta, data.length) };
}

export async function listStoredIntegrationPrices(params: { source?: string; commodity?: string; market?: string; search?: string; ordering?: string; page?: number; page_size?: number } = {}): Promise<MarketPriceListResult> {
  const payload = await marketRequest<MarketPrice[]>(
    withQuery("/market-integrations/prices", params),
    {},
    "Could not load stored integration prices."
  );
  const data = payload.data ?? [];
  return { data, pagination: normalizePagination(payload.meta, data.length) };
}

export async function listRawIntegrationPrices(params: { source?: string; commodity?: string; market?: string; search?: string; ordering?: string; page?: number; page_size?: number } = {}): Promise<RawCommodityPriceListResult> {
  const payload = await marketRequest<RawCommodityPrice[]>(
    withQuery("/market-integrations/raw-prices", params),
    {},
    "Could not load raw integration prices."
  );
  const data = payload.data ?? [];
  return { data, pagination: normalizePagination(payload.meta, data.length) };
}

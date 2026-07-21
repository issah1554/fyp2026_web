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
  commodity?: Pick<Commodity, "commodity_id" | "name" | "unit"> | null;
  market_name?: string;
  commodity_name?: string;
  price: number | string;
  currency: string;
  price_date: string;
  created_at: string;
};

export type MarketPriceFormPayload = {
  market_id?: string;
  commodity_id: string;
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

function withQuery(path: string, params: Record<string, string | number | undefined>) {
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
  params: { market_id?: string; commodity_id?: string; price_date?: string; date_from?: string; date_to?: string; page?: number; page_size?: number } = {},
): Promise<MarketPriceListResult> {
  const payload = await marketRequest<MarketPrice[]>(
    withQuery("/market-prices", params),
    {},
    "Could not load market prices.",
  );
  const data = payload.data ?? [];
  return { data, pagination: normalizePagination(payload.meta, data.length) };
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

import { authenticatedFetch } from "@/src/services/auth/authService";
import { apiUrl } from "@/src/services/config";
import { listMarketPrices, type MarketPrice } from "@/src/services/markets/marketService";

type ApiResponse<T> = {
  data?: T;
  results?: T;
  meta?: Record<string, unknown>;
};

export type InsightListing = {
  listing_id?: string;
  id?: string | number;
  commodity_name?: string;
  commodity?: { name?: string };
  area_name?: string;
  area?: { name?: string };
  quantity?: string | number;
  price?: string | number;
  status?: string;
  seller_name?: string;
};

export type InsightOrder = {
  order_id?: string;
  id?: string | number;
  listing?: { commodity?: { name?: string } };
  commodity_name?: string;
  buyer_name?: string;
  quantity?: string | number;
  total_price?: string | number;
  status?: string;
  created_at?: string;
};

function normalizeList<T>(payload: ApiResponse<T[]> | T[]): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

async function fetchCollection<T>(path: string, fallback: string): Promise<T[]> {
  const response = await authenticatedFetch(apiUrl(path), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(fallback);
  }

  const payload = (await response.json().catch(() => [])) as ApiResponse<T[]> | T[];
  return normalizeList(payload);
}

export async function getInsightPrices() {
  const result = await listMarketPrices({
    ordering: "-price_date",
    page_size: 100,
  });
  return result.data;
}

export async function getInsightListings() {
  return fetchCollection<InsightListing>("/listings", "Could not load commodity listings.");
}

export async function getInsightOrders() {
  return fetchCollection<InsightOrder>("/orders", "Could not load commodity orders.");
}

export function asNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function commodityNameFromPrice(price: MarketPrice) {
  return price.commodity?.name ?? price.commodity_name ?? "Unknown commodity";
}

export function marketNameFromPrice(price: MarketPrice) {
  return price.market?.name ?? price.market_name ?? "Unknown market";
}

export function commodityNameFromListing(listing: InsightListing) {
  return listing.commodity_name ?? listing.commodity?.name ?? "Unknown commodity";
}

export function areaNameFromListing(listing: InsightListing) {
  return listing.area_name ?? listing.area?.name ?? "Unknown area";
}

export function commodityNameFromOrder(order: InsightOrder) {
  return order.commodity_name ?? order.listing?.commodity?.name ?? "Unknown commodity";
}

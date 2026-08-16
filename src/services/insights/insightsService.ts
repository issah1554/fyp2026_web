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

export type InsightDataset = {
  prices: MarketPrice[];
  listings: InsightListing[];
  orders: InsightOrder[];
  warnings: string[];
};

export type InsightSeriesPoint = {
  key: string;
  value: number;
  count?: number;
};

export type InsightAnalytics = {
  totals: {
    priceRows: number;
    listingRows: number;
    orderRows: number;
    commoditiesTracked: number;
    marketsTracked: number;
    latestPriceDate: string;
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    totalListedQuantity: number;
    totalOrderValue: number;
  };
  priceByCommodity: InsightSeriesPoint[];
  priceByMarket: InsightSeriesPoint[];
  dailyAveragePrices: InsightSeriesPoint[];
  listingQuantityByCommodity: InsightSeriesPoint[];
  listingQuantityByArea: InsightSeriesPoint[];
  orderQuantityByCommodity: InsightSeriesPoint[];
  orderValueByCommodity: InsightSeriesPoint[];
  reportRows: {
    prices: Array<Record<string, string | number>>;
    listings: Array<Record<string, string | number>>;
    orders: Array<Record<string, string | number>>;
  };
};

type BackendInsightSeriesPoint = {
  key: string;
  value: number;
  count?: number;
};

type BackendInsightAnalytics = {
  totals: {
    price_rows: number;
    listing_rows: number;
    order_rows: number;
    commodities_tracked: number;
    markets_tracked: number;
    latest_price_date: string | null;
    average_price: number;
    min_price: number;
    max_price: number;
    total_listed_quantity: number;
    total_order_value: number;
  };
  price_by_commodity: BackendInsightSeriesPoint[];
  price_by_market: BackendInsightSeriesPoint[];
  daily_average_prices: BackendInsightSeriesPoint[];
  listing_quantity_by_commodity: BackendInsightSeriesPoint[];
  listing_quantity_by_area: BackendInsightSeriesPoint[];
  order_quantity_by_commodity: BackendInsightSeriesPoint[];
  order_value_by_commodity: BackendInsightSeriesPoint[];
  report_rows?: InsightAnalytics["reportRows"];
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

async function fetchResource<T>(path: string, fallback: string): Promise<T> {
  const response = await authenticatedFetch(apiUrl(path), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(fallback);
  }

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!payload?.data) {
    throw new Error(fallback);
  }

  return payload.data;
}

function withTimeout<T>(promise: Promise<T>, label: string, timeoutMs = 12000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error(`${label} timed out. Check that the backend API is running.`));
    }, timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => window.clearTimeout(timeout));
  });
}

async function settleCollection<T>(label: string, promise: Promise<T[]>): Promise<{ data: T[]; warning?: string }> {
  try {
    return { data: await withTimeout(promise, label) };
  } catch (error) {
    return {
      data: [],
      warning: error instanceof Error ? error.message : `Could not load ${label.toLowerCase()}.`,
    };
  }
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

export async function loadInsightDataset(): Promise<InsightDataset> {
  const [prices, listings, orders] = await Promise.all([
    settleCollection("Market prices", getInsightPrices()),
    settleCollection("Listings", getInsightListings()),
    settleCollection("Orders", getInsightOrders()),
  ]);

  return {
    prices: prices.data,
    listings: listings.data,
    orders: orders.data,
    warnings: [prices.warning, listings.warning, orders.warning].filter((warning): warning is string => Boolean(warning)),
  };
}

function normalizeBackendSeries(series: BackendInsightSeriesPoint[] | undefined): InsightSeriesPoint[] {
  return (series ?? []).map((item) => ({
    key: item.key,
    value: asNumber(item.value),
    count: item.count,
  }));
}

function normalizeBackendAnalytics(payload: BackendInsightAnalytics): InsightAnalytics {
  return {
    totals: {
      priceRows: payload.totals.price_rows,
      listingRows: payload.totals.listing_rows,
      orderRows: payload.totals.order_rows,
      commoditiesTracked: payload.totals.commodities_tracked,
      marketsTracked: payload.totals.markets_tracked,
      latestPriceDate: payload.totals.latest_price_date ?? "No price records",
      averagePrice: asNumber(payload.totals.average_price),
      minPrice: asNumber(payload.totals.min_price),
      maxPrice: asNumber(payload.totals.max_price),
      totalListedQuantity: asNumber(payload.totals.total_listed_quantity),
      totalOrderValue: asNumber(payload.totals.total_order_value),
    },
    priceByCommodity: normalizeBackendSeries(payload.price_by_commodity),
    priceByMarket: normalizeBackendSeries(payload.price_by_market),
    dailyAveragePrices: normalizeBackendSeries(payload.daily_average_prices),
    listingQuantityByCommodity: normalizeBackendSeries(payload.listing_quantity_by_commodity),
    listingQuantityByArea: normalizeBackendSeries(payload.listing_quantity_by_area),
    orderQuantityByCommodity: normalizeBackendSeries(payload.order_quantity_by_commodity),
    orderValueByCommodity: normalizeBackendSeries(payload.order_value_by_commodity),
    reportRows: payload.report_rows ?? { prices: [], listings: [], orders: [] },
  };
}

export async function getInsightVisualizationAnalytics() {
  const payload = await fetchResource<BackendInsightAnalytics>(
    "/insights/visualization",
    "Could not load backend visualization analytics.",
  );
  return normalizeBackendAnalytics(payload);
}

export async function getInsightReportingAnalytics() {
  const payload = await fetchResource<BackendInsightAnalytics>(
    "/insights/reporting",
    "Could not load backend reporting analytics.",
  );
  return normalizeBackendAnalytics(payload);
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

function averageByKey<T>(items: T[], keySelector: (item: T) => string, valueSelector: (item: T) => number) {
  const map = new Map<string, { total: number; count: number }>();

  for (const item of items) {
    const value = valueSelector(item);
    if (value <= 0) continue;

    const key = keySelector(item);
    const current = map.get(key) ?? { total: 0, count: 0 };
    current.total += value;
    current.count += 1;
    map.set(key, current);
  }

  return Array.from(map.entries())
    .map(([key, entry]) => ({ key, value: entry.total / entry.count, count: entry.count }))
    .sort((left, right) => right.value - left.value);
}

function sumByKey<T>(items: T[], keySelector: (item: T) => string, valueSelector: (item: T) => number) {
  const map = new Map<string, number>();

  for (const item of items) {
    const key = keySelector(item);
    map.set(key, (map.get(key) ?? 0) + valueSelector(item));
  }

  return Array.from(map.entries())
    .map(([key, value]) => ({ key, value }))
    .sort((left, right) => right.value - left.value);
}

export function buildInsightAnalytics({ prices, listings, orders }: InsightDataset): InsightAnalytics {
  const priceValues = prices.map((item) => asNumber(item.price)).filter((value) => value > 0);
  const latestPriceDate = prices.map((item) => item.price_date).filter(Boolean).sort().reverse()[0] ?? "No price records";

  const dailyAveragePrices = averageByKey(prices, (item) => item.price_date || "Undated", (item) => asNumber(item.price))
    .sort((left, right) => left.key.localeCompare(right.key));

  const priceRows = prices.map((price) => ({
    commodity: commodityNameFromPrice(price),
    market: marketNameFromPrice(price),
    price: asNumber(price.price),
    min_price: asNumber(price.min_price),
    max_price: asNumber(price.max_price),
    currency: price.currency || "TZS",
    source: price.source_name ?? price.source_key ?? "Manual",
    price_date: price.price_date,
  }));

  const listingRows = listings.map((listing) => ({
    commodity: commodityNameFromListing(listing),
    area: areaNameFromListing(listing),
    quantity: asNumber(listing.quantity),
    price: asNumber(listing.price),
    seller: listing.seller_name ?? "-",
    status: listing.status ?? "Unknown",
  }));

  const orderRows = orders.map((order) => ({
    commodity: commodityNameFromOrder(order),
    buyer: order.buyer_name ?? "-",
    quantity: asNumber(order.quantity),
    total_price: asNumber(order.total_price),
    status: order.status ?? "Unknown",
    created_at: order.created_at ?? "-",
  }));

  return {
    totals: {
      priceRows: prices.length,
      listingRows: listings.length,
      orderRows: orders.length,
      commoditiesTracked: new Set(prices.map(commodityNameFromPrice)).size,
      marketsTracked: new Set(prices.map(marketNameFromPrice)).size,
      latestPriceDate,
      averagePrice: priceValues.length ? priceValues.reduce((sum, value) => sum + value, 0) / priceValues.length : 0,
      minPrice: priceValues.length ? Math.min(...priceValues) : 0,
      maxPrice: priceValues.length ? Math.max(...priceValues) : 0,
      totalListedQuantity: listings.reduce((sum, listing) => sum + asNumber(listing.quantity), 0),
      totalOrderValue: orders.reduce((sum, order) => sum + asNumber(order.total_price), 0),
    },
    priceByCommodity: averageByKey(prices, commodityNameFromPrice, (item) => asNumber(item.price)),
    priceByMarket: averageByKey(prices, marketNameFromPrice, (item) => asNumber(item.price)),
    dailyAveragePrices,
    listingQuantityByCommodity: sumByKey(listings, commodityNameFromListing, (item) => asNumber(item.quantity)),
    listingQuantityByArea: sumByKey(listings, areaNameFromListing, (item) => asNumber(item.quantity)),
    orderQuantityByCommodity: sumByKey(orders, commodityNameFromOrder, (item) => asNumber(item.quantity)),
    orderValueByCommodity: sumByKey(orders, commodityNameFromOrder, (item) => asNumber(item.total_price)),
    reportRows: {
      prices: priceRows,
      listings: listingRows,
      orders: orderRows,
    },
  };
}

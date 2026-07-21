"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal } from "@/src/components/ui/Modal";
import Pagination from "@/src/components/ui/Pagination";
import { useAuth } from "../../auth/hooks/useAuth";
import { userCan } from "@/src/services/auth/authService";
import { listAreas, type Area } from "@/src/services/areas/areaService";
import { listCommodities, type Commodity } from "@/src/services/commodities/commodityService";
import {
  createMarket,
  createNestedMarketPrice,
  deleteMarket,
  deleteMarketPrice,
  getMarket,
  listCommodityPriceComparison,
  listCommodityPriceHistory,
  listCommodityPrices,
  listLatestPricesForMarket,
  listMarketPrices,
  listMarkets,
  listPricesForMarket,
  updateMarket,
  updateMarketPrice,
  type Market,
  type MarketFormPayload,
  type MarketPrice,
  type MarketPriceFormPayload,
  type MarketStatus,
  type PaginationMeta,
} from "@/src/services/markets/marketService";

type MarketFormState = {
  name: string;
  code: string;
  admin_area_id: string;
  address: string;
  latitude: string;
  longitude: string;
  description: string;
  status: MarketStatus;
};

type PriceFormState = {
  market_id: string;
  commodity_id: string;
  price: string;
  currency: string;
  price_date: string;
};

type MarketModalState = { mode: "create"; market: null } | { mode: "edit"; market: Market };
type PriceModalState =
  | { mode: "create"; price: null; marketId?: string }
  | { mode: "edit"; price: MarketPrice; marketId?: string };
type DetailTab = "details" | "prices" | "latest";

const emptyPagination: PaginationMeta = {
  page: 1,
  page_size: 10,
  total_items: 0,
  total_pages: 1,
  has_next: false,
  has_previous: false,
};

const emptyMarketForm: MarketFormState = {
  name: "",
  code: "",
  admin_area_id: "",
  address: "",
  latitude: "",
  longitude: "",
  description: "",
  status: "active",
};

const today = new Date().toISOString().slice(0, 10);

const emptyPriceForm: PriceFormState = {
  market_id: "",
  commodity_id: "",
  price: "",
  currency: "UGX",
  price_date: today,
};

function asNumberOrNull(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeMarketForm(form: MarketFormState): MarketFormPayload {
  return {
    name: form.name.trim(),
    code: form.code.trim(),
    admin_area_id: form.admin_area_id,
    address: form.address.trim(),
    latitude: asNumberOrNull(form.latitude),
    longitude: asNumberOrNull(form.longitude),
    description: form.description.trim(),
    status: form.status,
  };
}

function normalizePriceForm(form: PriceFormState): MarketPriceFormPayload {
  return {
    market_id: form.market_id,
    commodity_id: form.commodity_id,
    price: Number(form.price),
    currency: form.currency.trim() || "UGX",
    price_date: form.price_date,
  };
}

function formatDate(value?: string) {
  if (!value) return "None";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function formatMoney(price: string | number, currency = "UGX") {
  return `${currency} ${Number(price).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function marketAreaName(market: Market) {
  return market.admin_area?.name ?? market.admin_area_id ?? "None";
}

function priceMarketName(price: MarketPrice, markets: Market[]) {
  return price.market?.name ?? price.market_name ?? markets.find((market) => market.market_id === price.market_id)?.name ?? "Unknown market";
}

function priceCommodityName(price: MarketPrice, commodities: Commodity[]) {
  return price.commodity?.name ?? price.commodity_name ?? commodities.find((commodity) => commodity.commodity_id === price.commodity_id)?.name ?? "Unknown commodity";
}

function statusBadgeClass(status: string) {
  return status === "active" ? "bg-success-100 text-success-700" : "bg-main-200 text-main-700";
}

export default function MarketsPage() {
  const { user, loading: authLoading } = useAuth();
  const canCreateMarkets = userCan(user, "markets.create");
  const canUpdateMarkets = userCan(user, "markets.update");
  const canDeleteMarkets = userCan(user, "markets.delete");
  const canCreatePrices = userCan(user, "market_prices.create");
  const canUpdatePrices = userCan(user, "market_prices.update");
  const canDeletePrices = userCan(user, "market_prices.delete");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [pricePagination, setPricePagination] = useState(emptyPagination);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pricePage, setPricePage] = useState(1);
  const [pricePageSize, setPricePageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [priceMarketFilter, setPriceMarketFilter] = useState("");
  const [priceCommodityFilter, setPriceCommodityFilter] = useState("");
  const [priceDateFilter, setPriceDateFilter] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [loadingMarkets, setLoadingMarkets] = useState(true);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [pageError, setPageError] = useState("");
  const [pageNotice, setPageNotice] = useState("");
  const [marketModal, setMarketModal] = useState<MarketModalState | null>(null);
  const [marketForm, setMarketForm] = useState(emptyMarketForm);
  const [priceModal, setPriceModal] = useState<PriceModalState | null>(null);
  const [priceForm, setPriceForm] = useState(emptyPriceForm);
  const [formError, setFormError] = useState("");
  const [formNotice, setFormNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedMarketId, setSelectedMarketId] = useState("");
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("details");
  const [marketDetailPrices, setMarketDetailPrices] = useState<MarketPrice[]>([]);
  const [latestPrices, setLatestPrices] = useState<MarketPrice[]>([]);
  const [commodityViewId, setCommodityViewId] = useState("");
  const [comparisonDate, setComparisonDate] = useState("");
  const [commodityPrices, setCommodityPrices] = useState<MarketPrice[]>([]);
  const [commodityHistory, setCommodityHistory] = useState<MarketPrice[]>([]);
  const [commodityComparison, setCommodityComparison] = useState<MarketPrice[]>([]);

  const loadLookups = useCallback(async () => {
    const [areaResult, commodityResult] = await Promise.all([
      listAreas({ page: 1, page_size: 100 }),
      listCommodities({ page: 1, page_size: 100 }),
    ]);
    setAreas(areaResult.data);
    setCommodities(commodityResult.data);
  }, []);

  const loadMarkets = useCallback(async () => {
    setLoadingMarkets(true);
    setPageError("");
    try {
      const result = await listMarkets({ page, page_size: pageSize, search, status: statusFilter, admin_area_id: areaFilter });
      setMarkets(result.data);
      setPagination(result.pagination);
      if (!selectedMarketId && result.data[0]) setSelectedMarketId(result.data[0].market_id);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not load markets.");
    } finally {
      setLoadingMarkets(false);
    }
  }, [areaFilter, page, pageSize, search, selectedMarketId, statusFilter]);

  const loadPrices = useCallback(async () => {
    setLoadingPrices(true);
    setPageError("");
    try {
      const result = await listMarketPrices({
        page: pricePage,
        page_size: pricePageSize,
        market_id: priceMarketFilter,
        commodity_id: priceCommodityFilter,
        price_date: priceDateFilter,
        date_from: dateFromFilter,
        date_to: dateToFilter,
      });
      setPrices(result.data);
      setPricePagination(result.pagination);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not load market prices.");
    } finally {
      setLoadingPrices(false);
    }
  }, [dateFromFilter, dateToFilter, priceCommodityFilter, priceDateFilter, priceMarketFilter, pricePage, pricePageSize]);

  useEffect(() => {
    if (authLoading) return;
    const timeout = window.setTimeout(() => {
      void loadLookups().catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [authLoading, loadLookups]);

  useEffect(() => {
    if (authLoading) return;
    const timeout = window.setTimeout(() => {
      void loadMarkets();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [authLoading, loadMarkets]);

  useEffect(() => {
    if (authLoading) return;
    const timeout = window.setTimeout(() => {
      void loadPrices();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [authLoading, loadPrices]);

  useEffect(() => {
    if (!selectedMarketId || authLoading) return;
    void Promise.all([
      getMarket(selectedMarketId),
      listPricesForMarket(selectedMarketId),
      listLatestPricesForMarket(selectedMarketId),
    ])
      .then(([market, marketPrices, latest]) => {
        setSelectedMarket(market ?? null);
        setMarketDetailPrices(marketPrices);
        setLatestPrices(latest);
      })
      .catch((error) => setPageError(error instanceof Error ? error.message : "Could not load market detail."));
  }, [authLoading, selectedMarketId]);

  useEffect(() => {
    if (!commodityViewId || authLoading) {
      return;
    }
    void Promise.all([
      listCommodityPrices(commodityViewId),
      listCommodityPriceHistory(commodityViewId),
      listCommodityPriceComparison(commodityViewId, comparisonDate),
    ])
      .then(([general, history, comparison]) => {
        setCommodityPrices(general);
        setCommodityHistory(history);
        setCommodityComparison(comparison);
      })
      .catch((error) => setPageError(error instanceof Error ? error.message : "Could not load commodity price views."));
  }, [authLoading, commodityViewId, comparisonDate]);

  const marketStats = useMemo(() => {
    const active = markets.filter((market) => market.status === "active").length;
    return [
      ["Markets", pagination.total_items, "bi-shop", "bg-main-200 text-main-700"],
      ["Active", active, "bi-check-circle", "bg-success-100 text-success-700"],
      ["Prices", pricePagination.total_items, "bi-cash-stack", "bg-primary-100 text-primary-700"],
      ["Commodities", commodities.length, "bi-basket", "bg-accent-100 text-accent-700"],
    ];
  }, [commodities.length, markets, pagination.total_items, pricePagination.total_items]);

  const openCreateMarket = () => {
    setMarketForm(emptyMarketForm);
    setMarketModal({ mode: "create", market: null });
    setFormError("");
    setFormNotice("");
  };

  const openEditMarket = (market: Market) => {
    setMarketForm({
      name: market.name ?? "",
      code: market.code ?? "",
      admin_area_id: market.admin_area?.area_id ?? market.admin_area_id ?? "",
      address: market.address ?? "",
      latitude: market.latitude == null ? "" : String(market.latitude),
      longitude: market.longitude == null ? "" : String(market.longitude),
      description: market.description ?? "",
      status: market.status === "inactive" ? "inactive" : "active",
    });
    setMarketModal({ mode: "edit", market });
    setFormError("");
    setFormNotice("");
  };

  const openCreatePrice = (marketId?: string) => {
    setPriceForm({ ...emptyPriceForm, market_id: marketId ?? "" });
    setPriceModal({ mode: "create", price: null, marketId });
    setFormError("");
    setFormNotice("");
  };

  const openEditPrice = (price: MarketPrice, marketId?: string) => {
    setPriceForm({
      market_id: price.market_id ?? price.market?.market_id ?? marketId ?? "",
      commodity_id: price.commodity_id ?? price.commodity?.commodity_id ?? "",
      price: String(price.price ?? ""),
      currency: price.currency ?? "UGX",
      price_date: price.price_date?.slice(0, 10) ?? today,
    });
    setPriceModal({ mode: "edit", price, marketId });
    setFormError("");
    setFormNotice("");
  };

  const saveMarket = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!marketModal) return;
    setSaving(true);
    setFormError("");
    setFormNotice("");
    try {
      const payload = normalizeMarketForm(marketForm);
      const result =
        marketModal.mode === "create"
          ? await createMarket(payload)
          : await updateMarket(marketModal.market.market_id, payload);
      setFormNotice(result.message);
      if (result.market?.market_id) setSelectedMarketId(result.market.market_id);
      await loadMarkets();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save market.");
    } finally {
      setSaving(false);
    }
  };

  const savePrice = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!priceModal) return;
    const duplicate = [...prices, ...marketDetailPrices].some(
      (price) =>
        price.price_id !== priceModal.price?.price_id &&
        (price.market_id ?? price.market?.market_id) === priceForm.market_id &&
        (price.commodity_id ?? price.commodity?.commodity_id) === priceForm.commodity_id &&
        price.price_date?.slice(0, 10) === priceForm.price_date,
    );
    if (duplicate && !window.confirm("A similar price already exists for this market, commodity, and date. Continue?")) return;
    setSaving(true);
    setFormError("");
    setFormNotice("");
    try {
      const payload = normalizePriceForm(priceForm);
      const result =
        priceModal.mode === "create" && priceModal.marketId
          ? await createNestedMarketPrice(priceModal.marketId, {
              commodity_id: payload.commodity_id,
              price: payload.price,
              currency: payload.currency,
              price_date: payload.price_date,
            })
          : priceModal.mode === "create"
            ? await createNestedMarketPrice(payload.market_id ?? "", {
                commodity_id: payload.commodity_id,
                price: payload.price,
                currency: payload.currency,
                price_date: payload.price_date,
              })
            : await updateMarketPrice(priceModal.price.price_id, payload);
      setFormNotice(result.message);
      await loadPrices();
      if (selectedMarketId) {
        setMarketDetailPrices(await listPricesForMarket(selectedMarketId));
        setLatestPrices(await listLatestPricesForMarket(selectedMarketId));
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save price.");
    } finally {
      setSaving(false);
    }
  };

  const removeMarket = async (market: Market) => {
    if (!window.confirm(`Delete ${market.name}?`)) return;
    setPageError("");
    setPageNotice("");
    try {
      setPageNotice(await deleteMarket(market.market_id));
      if (selectedMarketId === market.market_id) setSelectedMarketId("");
      await loadMarkets();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not delete market.");
    }
  };

  const removePrice = async (price: MarketPrice) => {
    if (!window.confirm(`Delete price record for ${formatDate(price.price_date)}?`)) return;
    setPageError("");
    setPageNotice("");
    try {
      setPageNotice(await deleteMarketPrice(price.price_id));
      await loadPrices();
      if (selectedMarketId) {
        setMarketDetailPrices(await listPricesForMarket(selectedMarketId));
        setLatestPrices(await listLatestPricesForMarket(selectedMarketId));
      }
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not delete price.");
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center text-main-600">
        <span className="size-4 animate-spin rounded-full border-2 border-primary-700 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-4">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-main-500">Market operations</p>
          <h1 className="text-2xl font-bold text-main-950 sm:text-3xl">Markets</h1>
        </div>
        {(canCreateMarkets || canCreatePrices) && (
          <div className="flex flex-wrap gap-2">
            {canCreatePrices && <button type="button" onClick={() => openCreatePrice()} className="flex items-center gap-2 rounded-md border border-main-300 bg-main-100 px-4 py-2 text-sm font-bold text-main-800 hover:border-primary-300 hover:text-primary-700">
              <i className="bi bi-cash-coin" aria-hidden="true" />
              Add price
            </button>}
            {canCreateMarkets && <button type="button" onClick={openCreateMarket} className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700">
              <i className="bi bi-plus-circle" aria-hidden="true" />
              Add market
            </button>}
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {marketStats.map(([label, value, icon, color]) => (
          <div key={String(label)} className="rounded-lg border border-main-300 bg-main-200 p-4 shadow-none">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-main-500">{label}</p>
                <p className="mt-1 text-2xl font-bold text-main-950">{value}</p>
              </div>
              <span className={`flex size-11 items-center justify-center rounded-lg ${color}`}>
                <i className={`bi ${icon} text-xl`} aria-hidden="true" />
              </span>
            </div>
          </div>
        ))}
      </section>

      {(pageError || pageNotice) && (
        <div className={`rounded-md border px-4 py-3 text-sm font-semibold ${pageError ? "border-danger-300 bg-danger-100 text-danger-700" : "border-success-300 bg-success-100 text-success-700"}`}>
          {pageError || pageNotice}
        </div>
      )}

      <section className="rounded-md border border-main-200 bg-main-0 p-5 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-main-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-main-500">Registry</p>
            <h2 className="mt-1 text-xl font-bold text-main-950">Markets list</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,14rem)_10rem_12rem]">
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search markets" className="rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm text-main-900 outline-none placeholder:text-main-500 focus:border-primary-500 focus:bg-main-0" />
            <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0">
              <option value="">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select value={areaFilter} onChange={(event) => { setAreaFilter(event.target.value); setPage(1); }} className="rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0">
              <option value="">All areas</option>
              {areas.map((area) => <option key={area.area_id} value={area.area_id}>{area.name}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-220 text-left text-sm">
            <thead>
              <tr className="border-b border-main-200 text-xs font-bold uppercase text-main-500">
                <th className="py-3 pr-4">Market</th><th className="py-3 pr-4">Admin area</th><th className="py-3 pr-4">Address</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4">Created</th><th className="py-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-main-200">
              {loadingMarkets ? (
                <tr><td colSpan={6} className="py-10 text-center text-main-500">Loading markets...</td></tr>
              ) : markets.length ? markets.map((market) => (
                <tr key={market.market_id} className={`hover:bg-main-50 ${selectedMarketId === market.market_id ? "bg-primary-50" : ""}`}>
                  <td className="py-4 pr-4">
                    <button type="button" onClick={() => setSelectedMarketId(market.market_id)} className="text-left">
                      <p className="font-bold text-main-900">{market.name}</p>
                      <p className="mt-1 font-mono text-xs text-main-500">{market.code || market.market_id}</p>
                    </button>
                  </td>
                  <td className="py-4 pr-4 text-main-700">{marketAreaName(market)}</td>
                  <td className="py-4 pr-4 text-main-700">{market.address || "None"}</td>
                  <td className="py-4 pr-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass(market.status)}`}>{market.status}</span></td>
                  <td className="py-4 pr-4 text-main-700">{formatDate(market.created_at)}</td>
                  <td className="py-4 pr-4">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setSelectedMarketId(market.market_id)} className="flex size-8 items-center justify-center rounded-md border border-main-300 bg-main-100 text-main-700 hover:border-primary-300 hover:text-primary-700" aria-label={`View ${market.name}`}><i className="bi bi-eye" /></button>
                      {canUpdateMarkets && <button type="button" onClick={() => openEditMarket(market)} className="flex size-8 items-center justify-center rounded-md border border-main-300 bg-main-100 text-main-700 hover:border-primary-300 hover:text-primary-700" aria-label={`Edit ${market.name}`}><i className="bi bi-pencil-square" /></button>}
                      {canDeleteMarkets && <button type="button" onClick={() => void removeMarket(market)} className="flex size-8 items-center justify-center rounded-md border border-danger-300 bg-danger-100 text-danger-700 hover:bg-danger-200" aria-label={`Delete ${market.name}`}><i className="bi bi-trash" /></button>}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="py-10 text-center text-main-500">No markets found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-col gap-3 border-t border-main-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-main-600">
            <span>Rows</span>
            <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="rounded-md border border-main-300 bg-main-100 px-2 py-1 text-sm text-main-900 outline-none">
              {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </div>
          <Pagination page={pagination.page} pageSize={pagination.page_size} totalItems={pagination.total_items} onChange={setPage} showHelper size="sm" rounded="full" disabled={loadingMarkets} />
        </div>
      </section>

      {selectedMarket && (
        <section className="rounded-md border border-main-200 bg-main-0 p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-main-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-main-500">Market detail</p>
              <h2 className="mt-1 text-xl font-bold text-main-950">{selectedMarket.name}</h2>
            </div>
            {canCreatePrices && <button type="button" onClick={() => openCreatePrice(selectedMarket.market_id)} className="flex w-fit items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700"><i className="bi bi-plus-circle" />Add price</button>}
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto border-b border-main-200">
            {(["details", "prices", "latest"] as DetailTab[]).map((tab) => (
              <button key={tab} type="button" onClick={() => setDetailTab(tab)} className={`shrink-0 border-b-2 px-4 py-3 text-sm font-bold ${detailTab === tab ? "border-primary-600 text-primary-700" : "border-transparent text-main-600 hover:text-main-950"}`}>
                {tab === "details" ? "Market details" : tab === "prices" ? "Price records" : "Latest prices"}
              </button>
            ))}
          </div>
          {detailTab === "details" && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[["Code", selectedMarket.code], ["Admin area", marketAreaName(selectedMarket)], ["Address", selectedMarket.address], ["Latitude", selectedMarket.latitude ?? "None"], ["Longitude", selectedMarket.longitude ?? "None"], ["Status", selectedMarket.status], ["Created", formatDate(selectedMarket.created_at)], ["Description", selectedMarket.description || "None"]].map(([label, value]) => (
                <div key={String(label)} className="rounded-md border border-main-200 bg-main-50 p-3">
                  <p className="text-xs font-bold uppercase text-main-500">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-main-900">{String(value)}</p>
                </div>
              ))}
            </div>
          )}
          {detailTab === "prices" && <PriceTable prices={marketDetailPrices} markets={markets} commodities={commodities} canUpdate={canUpdatePrices} canDelete={canDeletePrices} onEdit={(price) => openEditPrice(price, selectedMarket.market_id)} onDelete={removePrice} emptyText="No prices recorded for this market." />}
          {detailTab === "latest" && <PriceTable prices={latestPrices} markets={markets} commodities={commodities} canUpdate={canUpdatePrices} canDelete={canDeletePrices} onEdit={(price) => openEditPrice(price, selectedMarket.market_id)} onDelete={removePrice} emptyText="No latest prices available." />}
        </section>
      )}

      <section className="rounded-md border border-main-200 bg-main-0 p-5 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-main-200 pb-4">
          <div>
            <p className="text-sm font-semibold text-main-500">Price records</p>
            <h2 className="mt-1 text-xl font-bold text-main-950">All market prices</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <select value={priceMarketFilter} onChange={(event) => { setPriceMarketFilter(event.target.value); setPricePage(1); }} className="rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0"><option value="">All markets</option>{markets.map((market) => <option key={market.market_id} value={market.market_id}>{market.name}</option>)}</select>
            <select value={priceCommodityFilter} onChange={(event) => { setPriceCommodityFilter(event.target.value); setPricePage(1); }} className="rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0"><option value="">All commodities</option>{commodities.map((commodity) => <option key={commodity.commodity_id} value={commodity.commodity_id}>{commodity.name}</option>)}</select>
            <input type="date" value={priceDateFilter} onChange={(event) => { setPriceDateFilter(event.target.value); setPricePage(1); }} className="rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0" />
            <input type="date" value={dateFromFilter} onChange={(event) => { setDateFromFilter(event.target.value); setPricePage(1); }} className="rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0" />
            <input type="date" value={dateToFilter} onChange={(event) => { setDateToFilter(event.target.value); setPricePage(1); }} className="rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0" />
          </div>
        </div>
        {loadingPrices ? <p className="py-10 text-center text-main-500">Loading prices...</p> : <PriceTable prices={prices} markets={markets} commodities={commodities} canUpdate={canUpdatePrices} canDelete={canDeletePrices} onEdit={(price) => openEditPrice(price)} onDelete={removePrice} emptyText="No market prices found." />}
        <div className="mt-4 flex flex-col gap-3 border-t border-main-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-main-600"><span>Rows</span><select value={pricePageSize} onChange={(event) => { setPricePageSize(Number(event.target.value)); setPricePage(1); }} className="rounded-md border border-main-300 bg-main-100 px-2 py-1 text-sm text-main-900 outline-none">{[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}</select></div>
          <Pagination page={pricePagination.page} pageSize={pricePagination.page_size} totalItems={pricePagination.total_items} onChange={setPricePage} showHelper size="sm" rounded="full" disabled={loadingPrices} />
        </div>
      </section>

      <section className="rounded-md border border-main-200 bg-main-0 p-5 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-main-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-main-500">Commodity price views</p>
            <h2 className="mt-1 text-xl font-bold text-main-950">Compare across markets</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,16rem)_11rem]">
            <select value={commodityViewId} onChange={(event) => {
              setCommodityViewId(event.target.value);
              if (!event.target.value) {
                setCommodityPrices([]);
                setCommodityHistory([]);
                setCommodityComparison([]);
              }
            }} className="rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0"><option value="">Select commodity</option>{commodities.map((commodity) => <option key={commodity.commodity_id} value={commodity.commodity_id}>{commodity.name}</option>)}</select>
            <input type="date" value={comparisonDate} onChange={(event) => setComparisonDate(event.target.value)} className="rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0" />
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <CompactPriceList title="Price comparison" prices={commodityComparison} markets={markets} commodities={commodities} />
          <CompactPriceList title="General prices" prices={commodityPrices} markets={markets} commodities={commodities} />
          <CompactPriceList title="Price history" prices={commodityHistory} markets={markets} commodities={commodities} />
        </div>
      </section>

      <Modal open={Boolean(marketModal)} onClose={() => setMarketModal(null)} size="lg" className="rounded-md border border-main-300 bg-main-0 p-0 shadow-lg">
        <form onSubmit={(event) => void saveMarket(event)}>
          <ModalHeader title={marketModal?.mode === "edit" ? "Edit market" : "Create market"} eyebrow="Market details" onClose={() => setMarketModal(null)} />
          <div className="grid max-h-[calc(100vh-10rem)] gap-4 overflow-y-auto px-5 py-5 sm:grid-cols-2">
            <FormAlert error={formError} notice={formNotice} />
            <Field label="Name"><input required value={marketForm.name} onChange={(event) => setMarketForm((current) => ({ ...current, name: event.target.value }))} className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0" /></Field>
            <Field label="Code"><input required value={marketForm.code} onChange={(event) => setMarketForm((current) => ({ ...current, code: event.target.value }))} className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0" /></Field>
            <Field label="Admin area"><select required value={marketForm.admin_area_id} onChange={(event) => setMarketForm((current) => ({ ...current, admin_area_id: event.target.value }))} className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0"><option value="">Select admin area</option>{areas.map((area) => <option key={area.area_id} value={area.area_id}>{area.name}</option>)}</select></Field>
            <Field label="Status"><select value={marketForm.status} onChange={(event) => setMarketForm((current) => ({ ...current, status: event.target.value as MarketStatus }))} className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0"><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>
            <Field label="Address"><input value={marketForm.address} onChange={(event) => setMarketForm((current) => ({ ...current, address: event.target.value }))} className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0" /></Field>
            <Field label="Latitude"><input type="number" step="any" value={marketForm.latitude} onChange={(event) => setMarketForm((current) => ({ ...current, latitude: event.target.value }))} className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0" /></Field>
            <Field label="Longitude"><input type="number" step="any" value={marketForm.longitude} onChange={(event) => setMarketForm((current) => ({ ...current, longitude: event.target.value }))} className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0" /></Field>
            <div className="sm:col-span-2"><Field label="Description"><textarea rows={3} value={marketForm.description} onChange={(event) => setMarketForm((current) => ({ ...current, description: event.target.value }))} className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0" /></Field></div>
          </div>
          <ModalActions saving={saving} saveText="Save market" onCancel={() => setMarketModal(null)} />
        </form>
      </Modal>

      <Modal open={Boolean(priceModal)} onClose={() => setPriceModal(null)} size="lg" className="rounded-md border border-main-300 bg-main-0 p-0 shadow-lg">
        <form onSubmit={(event) => void savePrice(event)}>
          <ModalHeader title={priceModal?.mode === "edit" ? "Edit price" : "Add price"} eyebrow="Market price" onClose={() => setPriceModal(null)} />
          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
            <FormAlert error={formError} notice={formNotice} />
            <Field label="Market"><select required disabled={Boolean(priceModal?.marketId && priceModal.mode === "create")} value={priceForm.market_id} onChange={(event) => setPriceForm((current) => ({ ...current, market_id: event.target.value }))} className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0 disabled:opacity-70"><option value="">Select market</option>{markets.map((market) => <option key={market.market_id} value={market.market_id}>{market.name}</option>)}</select></Field>
            <Field label="Commodity"><select required value={priceForm.commodity_id} onChange={(event) => setPriceForm((current) => ({ ...current, commodity_id: event.target.value }))} className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0"><option value="">Select commodity</option>{commodities.map((commodity) => <option key={commodity.commodity_id} value={commodity.commodity_id}>{commodity.name}</option>)}</select></Field>
            <Field label="Price"><input required type="number" min="0" step="0.01" value={priceForm.price} onChange={(event) => setPriceForm((current) => ({ ...current, price: event.target.value }))} className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0" /></Field>
            <Field label="Currency"><input required value={priceForm.currency} onChange={(event) => setPriceForm((current) => ({ ...current, currency: event.target.value.toUpperCase() }))} className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0" /></Field>
            <Field label="Price date"><input required type="date" value={priceForm.price_date} onChange={(event) => setPriceForm((current) => ({ ...current, price_date: event.target.value }))} className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0" /></Field>
          </div>
          <ModalActions saving={saving} saveText="Save price" onCancel={() => setPriceModal(null)} />
        </form>
      </Modal>
    </div>
  );
}

function PriceTable({ prices, markets, commodities, canUpdate, canDelete, onEdit, onDelete, emptyText }: { prices: MarketPrice[]; markets: Market[]; commodities: Commodity[]; canUpdate: boolean; canDelete: boolean; onEdit: (price: MarketPrice) => void; onDelete: (price: MarketPrice) => void; emptyText: string }) {
  const canMutate = canUpdate || canDelete;
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-180 text-left text-sm">
        <thead><tr className="border-b border-main-200 text-xs font-bold uppercase text-main-500"><th className="py-3 pr-4">Market</th><th className="py-3 pr-4">Commodity</th><th className="py-3 pr-4">Price</th><th className="py-3 pr-4">Price date</th><th className="py-3 pr-4">Created</th>{canMutate && <th className="py-3 pr-4 text-right">Actions</th>}</tr></thead>
        <tbody className="divide-y divide-main-200">
          {prices.length ? prices.map((price) => (
            <tr key={price.price_id} className="hover:bg-main-50">
              <td className="py-4 pr-4 font-bold text-main-900">{priceMarketName(price, markets)}</td>
              <td className="py-4 pr-4 text-main-700">{priceCommodityName(price, commodities)}</td>
              <td className="py-4 pr-4 font-bold text-primary-700">{formatMoney(price.price, price.currency)}</td>
              <td className="py-4 pr-4 text-main-700">{formatDate(price.price_date)}</td>
              <td className="py-4 pr-4 text-main-700">{formatDate(price.created_at)}</td>
              {canMutate && <td className="py-4 pr-4"><div className="flex justify-end gap-2">{canUpdate && <button type="button" onClick={() => onEdit(price)} className="flex size-8 items-center justify-center rounded-md border border-main-300 bg-main-100 text-main-700 hover:border-primary-300 hover:text-primary-700" aria-label="Edit price"><i className="bi bi-pencil-square" /></button>}{canDelete && <button type="button" onClick={() => void onDelete(price)} className="flex size-8 items-center justify-center rounded-md border border-danger-300 bg-danger-100 text-danger-700 hover:bg-danger-200" aria-label="Delete price"><i className="bi bi-trash" /></button>}</div></td>}
            </tr>
          )) : <tr><td colSpan={canMutate ? 6 : 5} className="py-10 text-center text-main-500">{emptyText}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function CompactPriceList({ title, prices, markets, commodities }: { title: string; prices: MarketPrice[]; markets: Market[]; commodities: Commodity[] }) {
  return (
    <div className="rounded-md border border-main-200 bg-main-50 p-4">
      <h3 className="text-sm font-bold text-main-950">{title}</h3>
      <div className="mt-3 space-y-2">
        {prices.length ? prices.map((price) => (
          <div key={`${title}-${price.price_id}`} className="rounded-md border border-main-200 bg-main-0 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-main-900">{priceMarketName(price, markets)}</p>
                <p className="mt-1 text-xs text-main-500">{priceCommodityName(price, commodities)} - {formatDate(price.price_date)}</p>
              </div>
              <p className="shrink-0 text-sm font-bold text-primary-700">{formatMoney(price.price, price.currency)}</p>
            </div>
          </div>
        )) : <p className="rounded-md border border-main-200 bg-main-0 px-3 py-8 text-center text-sm text-main-500">No prices to show.</p>}
      </div>
    </div>
  );
}

function ModalHeader({ title, eyebrow, onClose }: { title: string; eyebrow: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-main-200 px-5 py-4">
      <div><p className="text-sm font-semibold text-main-500">{eyebrow}</p><h2 className="text-xl font-bold text-main-950">{title}</h2></div>
      <button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-md text-main-500 hover:bg-main-100 hover:text-main-900" aria-label="Close"><i className="bi bi-x-lg" /></button>
    </div>
  );
}

function ModalActions({ saving, saveText, onCancel }: { saving: boolean; saveText: string; onCancel: () => void }) {
  return (
    <div className="flex justify-end gap-2 border-t border-main-200 px-5 py-4">
      <button type="button" onClick={onCancel} className="rounded-md border border-main-300 bg-main-100 px-4 py-2 text-sm font-bold text-main-700 hover:bg-main-200">Cancel</button>
      <button type="submit" disabled={saving} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Saving..." : saveText}</button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="text-sm font-bold text-main-900">{label}{children}</label>;
}

function FormAlert({ error, notice }: { error: string; notice: string }) {
  if (!error && !notice) return null;
  return <div className={`sm:col-span-2 rounded-md border px-3 py-2 text-sm font-semibold ${error ? "border-danger-300 bg-danger-100 text-danger-700" : "border-success-300 bg-success-100 text-success-700"}`}>{error || notice}</div>;
}

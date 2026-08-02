"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  checkMarketIntegrationUpdates,
  checkMarketIntegrationHealth,
  listMarketIntegrationSources,
  listMarketPrices,
  syncMarketIntegrations,
  type MarketIntegrationHealth,
  type MarketIntegrationSource,
  type MarketIntegrationUpdateStatus,
  type MarketPrice,
  type PaginationMeta,
} from "@/src/services/markets/marketService";

type SourceKey = "platform_a" | "platform_b" | "internal" | "viwanda";

const sourceKeys: SourceKey[] = ["platform_a", "platform_b", "internal", "viwanda"];

const emptyPagination: PaginationMeta = {
  page: 1,
  page_size: 10,
  total_items: 0,
  total_pages: 1,
  has_next: false,
  has_previous: false,
};

function formatDate(value?: string) {
  if (!value) return "None";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatMoney(value: string | number | null | undefined, currency: string) {
  if (value === null || value === undefined || value === "") return "None";
  return `${currency} ${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function sourceLabel(source: string) {
  return source.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function healthFor(source: MarketIntegrationSource, health: MarketIntegrationHealth[]) {
  return health.find((item) => item.source === source.key);
}

function isLocalSource(sourceKey: string) {
  return sourceKey === "internal";
}

function serviceLabel(source: MarketIntegrationSource) {
  if (source.base_url) return source.base_url;
  if (source.key === "internal") return "Local database";
  return "Not configured";
}

function updateFor(source: MarketIntegrationSource, updates: MarketIntegrationUpdateStatus[]) {
  return updates.find((item) => item.source === source.key);
}

function updateSummary(update?: MarketIntegrationUpdateStatus) {
  if (!update) return "None";
  if (update.new <= 0) return "Up to date";
  return update.new === 1 ? "1 record" : `${update.new} records`;
}

function sourceStatus(source: MarketIntegrationSource, health: MarketIntegrationHealth[]) {
  const sourceHealth = healthFor(source, health);
  const isLocal = isLocalSource(source.key);
  if (sourceHealth?.ok === true || (!sourceHealth && isLocal)) return { label: isLocal ? "Local" : "Online", className: "bg-success-100 text-success-700" };
  if (sourceHealth?.ok === false) return { label: "Offline", className: "bg-danger-100 text-danger-700" };
  return { label: "Unknown", className: "bg-main-200 text-main-700" };
}

export default function DataSourcesPage() {
  const [sources, setSources] = useState<MarketIntegrationSource[]>([]);
  const [health, setHealth] = useState<MarketIntegrationHealth[]>([]);
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [selectedSource, setSelectedSource] = useState<SourceKey | "">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [checkingUpdates, setCheckingUpdates] = useState<string>("");
  const [syncingSource, setSyncingSource] = useState<string>("");
  const [updates, setUpdates] = useState<MarketIntegrationUpdateStatus[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const sourceCards = useMemo(() => {
    const configured = new Map(sources.map((source) => [source.key, source]));
    return sourceKeys.map(
      (key) =>
        configured.get(key) ?? {
          key,
          name: sourceLabel(key),
          base_url: "",
          prices_url: "",
          health_url: "",
        },
    );
  }, [sources]);

  const loadSources = useCallback(async () => {
    setSources(await listMarketIntegrationSources());
  }, []);

  const loadHealth = useCallback(async () => {
    setCheckingHealth(true);
    try {
      const result = await checkMarketIntegrationHealth();
      setHealth(result.data);
    } finally {
      setCheckingHealth(false);
    }
  }, []);

  const loadUpdates = useCallback(async (source?: string) => {
    setCheckingUpdates(source ?? "all");
    setError("");
    try {
      const result = await checkMarketIntegrationUpdates({ source, limit: 500 });
      setUpdates((current) => {
        if (!source) return result.sources;
        return [...current.filter((item) => item.source !== source), ...result.sources];
      });
      if (result.errors.length) {
        setError(result.errors.map((item) => `${sourceLabel(item.source)}: ${item.error}`).join(" "));
      }
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not check source updates.");
    } finally {
      setCheckingUpdates("");
    }
  }, []);

  const loadPrices = useCallback(async () => {
    const result = await listMarketPrices({
      source_key: selectedSource,
      page,
      page_size: pageSize,
    });
    setPrices(result.data);
    setPagination(result.pagination);
  }, [page, pageSize, selectedSource]);

  useEffect(() => {
    let mounted = true;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError("");
      Promise.all([loadSources(), loadHealth(), loadUpdates(), loadPrices()])
        .catch((loadError) => {
          if (mounted) setError(loadError instanceof Error ? loadError.message : "Could not load source data.");
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    }, 0);
    return () => {
      mounted = false;
      window.clearTimeout(timeout);
    };
  }, [loadHealth, loadPrices, loadSources, loadUpdates]);

  const syncSource = async (source?: string) => {
    setSyncingSource(source ?? "all");
    setNotice("");
    setError("");
    try {
      const response = await syncMarketIntegrations({ source, limit: 500, new_only: true });
      const errorCount = response.result.errors.length;
      setNotice(`${response.message} Fetched: ${response.result.fetched}. New selected: ${response.result.selected}. Created: ${response.result.created}. Updated: ${response.result.updated}.${errorCount ? ` Errors: ${errorCount}.` : ""}`);
      await Promise.all([loadPrices(), loadHealth(), loadUpdates(source)]);
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Could not sync source data.");
    } finally {
      setSyncingSource("");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-4">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-main-500">Market integrations</p>
          <h1 className="text-2xl font-bold text-main-950 sm:text-3xl">Data Sources</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void loadHealth()} disabled={checkingHealth} className="flex items-center gap-2 rounded-md border border-main-300 bg-main-100 px-4 py-2 text-sm font-bold text-main-800 hover:border-primary-300 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-60">
            <i className={`bi ${checkingHealth ? "bi-arrow-repeat" : "bi-heart-pulse"}`} />
            {checkingHealth ? "Checking..." : "Check health"}
          </button>
          <button type="button" onClick={() => void loadUpdates()} disabled={Boolean(checkingUpdates)} className="flex items-center gap-2 rounded-md border border-main-300 bg-main-100 px-4 py-2 text-sm font-bold text-main-800 hover:border-primary-300 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-60">
            <i className={`bi ${checkingUpdates === "all" ? "bi-arrow-repeat" : "bi-radar"}`} />
            {checkingUpdates === "all" ? "Checking..." : "Check updates"}
          </button>
          <button type="button" onClick={() => void syncSource()} disabled={Boolean(syncingSource)} className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">
            <i className={`bi ${syncingSource === "all" ? "bi-arrow-repeat" : "bi-cloud-download"}`} />
            {syncingSource === "all" ? "Importing..." : "Import new"}
          </button>
        </div>
      </section>

      {(error || notice) && <div className={`rounded-md border px-4 py-3 text-sm font-semibold ${error ? "border-danger-300 bg-danger-100 text-danger-700" : "border-success-300 bg-success-100 text-success-700"}`}>{error || notice}</div>}

      <section className="rounded-md border border-main-200 bg-main-100 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-main-950">Sources</p>
            <p className="text-xs text-main-500">{sourceCards.length} configured</p>
          </div>
          <button type="button" onClick={() => { setSelectedSource(""); setPage(1); }} className="rounded-md border border-main-300 px-3 py-1.5 text-xs font-bold text-main-700 hover:border-primary-300 hover:text-primary-700">
            All rows
          </button>
        </div>
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))]">
          {sourceCards.map((source) => {
            const status = sourceStatus(source, health);
            const sourceUpdate = updateFor(source, updates);
            const isSelected = selectedSource === source.key;
            return (
              <div key={source.key} className={`rounded-md border p-3 ${isSelected ? "border-primary-300 bg-primary-50" : "border-main-200 bg-main-50"}`}>
                <div className="flex items-start justify-between gap-3">
                  <button type="button" onClick={() => { setSelectedSource(source.key as SourceKey); setPage(1); }} className="min-w-0 text-left">
                    <span className="block truncate font-bold text-main-900">{source.name}</span>
                    <span className="font-mono text-xs text-main-500">{source.key}</span>
                  </button>
                  <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold ${status.className}`}>{status.label}</span>
                </div>
                <p className="mt-2 truncate text-xs text-main-600">{serviceLabel(source)}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="font-bold text-main-500">Latest</p>
                    <p className="mt-1 truncate text-main-800">{formatDate(sourceUpdate?.latest_stored_at ?? undefined)}</p>
                  </div>
                  <div>
                    <p className="font-bold text-main-500">New</p>
                    <p className={`mt-1 font-bold ${sourceUpdate?.has_updates ? "text-success-700" : "text-main-800"}`}>{updateSummary(sourceUpdate)}</p>
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button type="button" onClick={() => void loadUpdates(source.key)} disabled={Boolean(checkingUpdates)} className="flex size-8 items-center justify-center rounded-md border border-main-300 bg-main-100 text-main-700 hover:border-primary-300 hover:text-primary-700 disabled:opacity-60" aria-label={`Check ${source.name}`}>
                    <i className={`bi ${checkingUpdates === source.key ? "bi-arrow-repeat" : "bi-radar"}`} />
                  </button>
                  <button type="button" onClick={() => void syncSource(source.key)} disabled={Boolean(syncingSource)} className="flex size-8 items-center justify-center rounded-md bg-primary-600 text-main-0 hover:bg-primary-700 disabled:opacity-60" aria-label={`Import ${source.name}`}>
                    <i className={`bi ${syncingSource === source.key ? "bi-arrow-repeat" : "bi-cloud-download"}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-md border border-main-200 bg-main-100 p-5 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-main-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-main-500">Stored data</p>
            <h2 className="mt-1 text-xl font-bold text-main-950">Imported market prices</h2>
          </div>
          <select value={selectedSource} onChange={(event) => { setSelectedSource(event.target.value as SourceKey | ""); setPage(1); }} className="w-full rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-100 sm:w-60">
            <option value="">All source rows</option>
            {sourceCards.map((source) => <option key={source.key} value={source.key}>{source.name}</option>)}
          </select>
        </div>
        {loading ? <p className="py-10 text-center text-main-500">Loading source data...</p> : <SourcePriceTable prices={prices} />}
        <div className="mt-4 flex flex-col gap-3 border-t border-main-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-main-600"><span>Rows</span><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="rounded-md border border-main-300 bg-main-100 px-2 py-1 text-sm text-main-900 outline-none">{[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}</select></div>
          <div className="flex items-center gap-2 text-sm font-semibold text-main-600"><button type="button" disabled={!pagination.has_previous} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-md border border-main-300 bg-main-100 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50">Previous</button><span>Page {pagination.page} of {pagination.total_pages}</span><button type="button" disabled={!pagination.has_next} onClick={() => setPage((current) => current + 1)} className="rounded-md border border-main-300 bg-main-100 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50">Next</button></div>
        </div>
      </section>
    </div>
  );
}

function SourcePriceTable({ prices }: { prices: MarketPrice[] }) {
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-220 text-left text-sm">
        <thead><tr className="border-b border-main-200 text-xs font-bold uppercase text-main-500"><th className="py-3 pr-4">Source</th><th className="py-3 pr-4">Market</th><th className="py-3 pr-4">Commodity</th><th className="py-3 pr-4">Price TZS</th><th className="py-3 pr-4">Price USD</th><th className="py-3 pr-4">Price date</th><th className="py-3 pr-4">Imported</th></tr></thead>
        <tbody className="divide-y divide-main-200">
          {prices.length ? prices.map((price) => (
            <tr key={price.price_id} className="hover:bg-main-50">
              <td className="py-4 pr-4"><span className="inline-flex rounded-md bg-primary-100 px-2 py-1 text-xs font-bold text-primary-700">{price.source_name || sourceLabel(price.source_key || "manual")}</span></td>
              <td className="py-4 pr-4 font-bold text-main-900">{price.market?.name ?? price.market_name ?? "Unknown market"}</td>
              <td className="py-4 pr-4 text-main-700">{price.commodity?.name ?? price.commodity_name ?? "Unknown commodity"}</td>
              <td className="py-4 pr-4 font-bold text-primary-700">{formatMoney(price.price, price.currency)}</td>
              <td className="py-4 pr-4 font-semibold text-main-800">{formatMoney(price.price_usd, "USD")}</td>
              <td className="py-4 pr-4 text-main-700">{formatDate(price.price_date)}</td>
              <td className="py-4 pr-4 text-main-700">{formatDate(price.created_at)}</td>
            </tr>
          )) : <tr><td colSpan={7} className="py-10 text-center text-main-500">No imported source prices found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

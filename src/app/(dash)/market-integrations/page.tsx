"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  checkMarketIntegrationUpdates,
  importRawMarketIntegrationPrices,
  checkMarketIntegrationHealth,
  listMarketIntegrationSources,
  listRawIntegrationPrices,
  listStoredIntegrationPrices,
  standardizeMarketIntegrationPrices,
  type MarketIntegrationHealth,
  type MarketIntegrationSource,
  type MarketIntegrationUpdateStatus,
  type MarketPrice,
  type PaginationMeta,
  type RawCommodityPrice,
} from "@/src/services/markets/marketService";

type SourceKey = "platform_a" | "platform_b" | "internal" | "viwanda";
type SortDirection = "asc" | "desc";
type SortConfig<TSortKey extends string> = {
  key: TSortKey;
  direction: SortDirection;
};

const sourceKeys: SourceKey[] = ["platform_a", "platform_b", "internal", "viwanda"];

const emptyPagination: PaginationMeta = {
  page: 1,
  page_size: 10,
  total_items: 0,
  total_pages: 1,
  has_next: false,
  has_previous: false,
};

function formatDate(value?: string | null) {
  if (!value) return "None";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatDateOnly(value?: string | null) {
  if (!value) return "None";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
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

function showingCount(currentCount: number, totalItems: number) {
  return `Showing ${currentCount.toLocaleString()} of ${totalItems.toLocaleString()}`;
}

function nextSort<TSortKey extends string>(current: SortConfig<TSortKey>, key: TSortKey): SortConfig<TSortKey> {
  return {
    key,
    direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
  };
}

function orderingFromSort<TSortKey extends string>(sort: SortConfig<TSortKey>) {
  return `${sort.direction === "desc" ? "-" : ""}${sort.key}`;
}

function SortHeader<TSortKey extends string>({
  label,
  sortKey,
  sort,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: TSortKey;
  sort: SortConfig<TSortKey>;
  onSort: (key: TSortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort.key === sortKey;
  return (
    <th className={`py-3 pr-4 ${align === "right" ? "text-right" : ""}`}>
      <button type="button" onClick={() => onSort(sortKey)} className={`inline-flex items-center gap-1 font-bold uppercase ${align === "right" ? "justify-end" : ""}`}>
        {label}
        <i className={`bi ${active ? (sort.direction === "asc" ? "bi-sort-up" : "bi-sort-down") : "bi-arrow-down-up"} text-xs`} />
      </button>
    </th>
  );
}

export default function MarketIntegrationsPage() {
  const [sources, setSources] = useState<MarketIntegrationSource[]>([]);
  const [health, setHealth] = useState<MarketIntegrationHealth[]>([]);
  const [rawPrices, setRawPrices] = useState<RawCommodityPrice[]>([]);
  const [normalizedPrices, setNormalizedPrices] = useState<MarketPrice[]>([]);
  
  const [activeTab, setActiveTab] = useState<"raw" | "normalized">("raw");
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [selectedAggregationSources, setSelectedAggregationSources] = useState<string[]>([]);
  const [filterCommodity, setFilterCommodity] = useState<string>("");
  const [filterMarket, setFilterMarket] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [rawSort, setRawSort] = useState<SortConfig<RawPriceSortKey>>({ key: "observed_at", direction: "desc" });
  const [normalizedSort, setNormalizedSort] = useState<SortConfig<NormalizedPriceSortKey>>({ key: "price_date", direction: "desc" });
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState<PaginationMeta>(emptyPagination);

  const [loading, setLoading] = useState(true);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [checkingUpdates, setCheckingUpdates] = useState<string>("");
  const [importingSource, setImportingSource] = useState<string>("");
  const [standardizingSource, setStandardizingSource] = useState<string>("");
  const [updates, setUpdates] = useState<MarketIntegrationUpdateStatus[]>([]);
  
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  
  const [rawPayloadModal, setRawPayloadModal] = useState<RawCommodityPrice | null>(null);

  const sourceCards = useMemo(() => {
    const configured = new Map(sources.map((source) => [source.key, source]));
    return sourceKeys.map(
      (key) =>
        configured.get(key) ?? {
          key,
          name: sourceLabel(key),
          base_url: key === "viwanda" ? "Local Web Scraper" : "",
          prices_url: "",
          health_url: "",
        },
    );
  }, [sources]);

  const loadSources = useCallback(async () => {
    try {
      const data = await listMarketIntegrationSources();
      setSources(data);
    } catch (err) {
      console.error("Could not load sources", err);
    }
  }, []);

  const loadHealth = useCallback(async () => {
    setCheckingHealth(true);
    try {
      const result = await checkMarketIntegrationHealth();
      setHealth(result.data);
    } catch (err) {
      console.error("Could not load health status", err);
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
        const remaining = current.filter((item) => item.source !== source);
        return [...remaining, ...result.sources];
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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        source: selectedSource || undefined,
        commodity: filterCommodity || undefined,
        market: filterMarket || undefined,
        search: search || undefined,
        ordering: orderingFromSort(activeTab === "raw" ? rawSort : normalizedSort),
        page,
        page_size: pageSize,
      };

      if (activeTab === "raw") {
        const rawResult = await listRawIntegrationPrices(params);
        setRawPrices(rawResult.data);
        setPagination(rawResult.pagination);
      } else {
        const storedResult = await listStoredIntegrationPrices(params);
        setNormalizedPrices(storedResult.data);
        setPagination(storedResult.pagination);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load integration data.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedSource, filterCommodity, filterMarket, page, pageSize, rawSort, normalizedSort, search]);

  useEffect(() => {
    let mounted = true;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      Promise.all([loadSources(), loadHealth(), loadUpdates(), loadData()])
        .catch((loadError) => {
          if (mounted) setError(loadError instanceof Error ? loadError.message : "Could not load data.");
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    }, 0);
    return () => {
      mounted = false;
      window.clearTimeout(timeout);
    };
  }, [loadSources, loadHealth, loadUpdates, loadData]);

  const importRawSource = async (source?: string) => {
    setImportingSource(source ?? "all");
    setNotice("");
    setError("");
    try {
      const response = await importRawMarketIntegrationPrices({ source, limit: 500, new_only: true });
      const errorCount = response.result.errors.length;
      setNotice(
        `${response.message} Fetched: ${response.result.fetched}. New selected: ${response.result.selected}. Raw created: ${response.result.created}. Raw updated: ${response.result.updated}.${
          errorCount ? ` Errors: ${errorCount}.` : ""
        }`
      );
      setPage(1);
      await loadData();
      await loadHealth();
      await loadUpdates(source);
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Could not import raw source data.");
    } finally {
      setImportingSource("");
    }
  };

  const selectedAggregationLabel = selectedAggregationSources.length
    ? `${selectedAggregationSources.length} selected`
    : "No sources selected";

  const toggleAggregationSource = (sourceKey: string) => {
    setSelectedAggregationSources((current) =>
      current.includes(sourceKey)
        ? current.filter((key) => key !== sourceKey)
        : [...current, sourceKey],
    );
  };

  const checkSelectedSources = async () => {
    if (!selectedAggregationSources.length) {
      setError("Select at least one source before checking updates.");
      setNotice("");
      return;
    }
    setError("");
    setNotice("");
    let newRows = 0;
    for (const source of selectedAggregationSources) {
      const result = await checkMarketIntegrationUpdates({ source, limit: 500 });
      setUpdates((current) => [...current.filter((item) => item.source !== source), ...result.sources]);
      newRows += result.sources.reduce((total, item) => total + item.new, 0);
    }
    setNotice(
      newRows
        ? `Checked ${selectedAggregationSources.length} selected source(s). ${newRows} new row(s) available.`
        : `Checked ${selectedAggregationSources.length} selected source(s). No new data available.`,
    );
  };

  const importSelectedSources = async () => {
    if (!selectedAggregationSources.length) {
      setError("Select at least one source before importing.");
      setNotice("");
      return;
    }
    setError("");
    setNotice("");
    let fetched = 0;
    let selected = 0;
    let created = 0;
    let updated = 0;
    let errors = 0;

    try {
      for (const source of selectedAggregationSources) {
        setImportingSource(source);
        const response = await importRawMarketIntegrationPrices({ source, limit: 500, new_only: true });
        fetched += response.result.fetched;
        selected += response.result.selected;
        created += response.result.created;
        updated += response.result.updated;
        errors += response.result.errors.length;
        await loadUpdates(source);
      }

      setPage(1);
      await loadData();
      await loadHealth();
      await loadSources();
      setNotice(
        selected
          ? `Imported selected sources. Fetched: ${fetched}. New selected: ${selected}. Raw created: ${created}. Raw updated: ${updated}.${errors ? ` Errors: ${errors}.` : ""}`
          : `No new data available. Fetched: ${fetched}. Raw created: 0. Raw updated: 0.${errors ? ` Errors: ${errors}.` : ""}`,
      );
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Could not import selected raw sources.");
    } finally {
      setImportingSource("");
    }
  };

  const standardizeSelectedSources = async () => {
    if (!selectedAggregationSources.length) {
      setError("Select at least one source before standardising.");
      setNotice("");
      return;
    }
    setError("");
    setNotice("");
    let created = 0;
    let updated = 0;
    let errors = 0;
    try {
      for (const source of selectedAggregationSources) {
        setStandardizingSource(source);
        const response = await standardizeMarketIntegrationPrices({ source, limit: 500 });
        created += response.result.created;
        updated += response.result.updated;
        errors += response.result.errors.length;
      }
      setPage(1);
      await loadData();
      await loadSources();
      setNotice(`Standardised selected sources. Created: ${created}. Updated: ${updated}.${errors ? ` Errors: ${errors}.` : ""}`);
    } catch (standardizeError) {
      setError(standardizeError instanceof Error ? standardizeError.message : "Could not standardise selected sources.");
    } finally {
      setStandardizingSource("");
    }
  };

  const handleTabChange = (tab: "raw" | "normalized") => {
    setActiveTab(tab);
    setPage(1);
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-4">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-main-500">Market integrations</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadHealth()}
            disabled={checkingHealth}
            className="flex items-center gap-2 rounded-md border border-main-300 bg-main-100 px-4 py-2 text-sm font-bold text-main-800 hover:border-primary-300 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-60 transition-all cursor-pointer"
          >
            <i className={`bi ${checkingHealth ? "bi-arrow-repeat animate-spin" : "bi-heart-pulse"}`} />
            {checkingHealth ? "Checking..." : "Check Health"}
          </button>
          <button
            type="button"
            onClick={() => void checkSelectedSources()}
            disabled={Boolean(checkingUpdates)}
            className="flex items-center gap-2 rounded-md border border-main-300 bg-main-100 px-4 py-2 text-sm font-bold text-main-800 hover:border-primary-300 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-60 transition-all cursor-pointer"
          >
            <i className={`bi ${checkingUpdates === "all" ? "bi-arrow-repeat animate-spin" : "bi-radar"}`} />
            {checkingUpdates ? "Checking..." : "Check Selected"}
          </button>
          <button
            type="button"
            onClick={() => void importSelectedSources()}
            disabled={Boolean(importingSource)}
            className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60 transition-all cursor-pointer"
          >
            <i className={`bi ${importingSource === "all" ? "bi-arrow-repeat animate-spin" : "bi-cloud-download"}`} />
            {importingSource ? "Importing..." : "Import Raw"}
          </button>
          <button
            type="button"
            onClick={() => void standardizeSelectedSources()}
            disabled={Boolean(standardizingSource)}
            className="flex items-center gap-2 rounded-md bg-accent-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-60 transition-all cursor-pointer"
          >
            <i className={`bi ${standardizingSource ? "bi-arrow-repeat animate-spin" : "bi-check2-circle"}`} />
            {standardizingSource ? "Standardising..." : "Standardise"}
          </button>
        </div>
      </section>

      {(error || notice) && (
        <div
          className={`rounded-md border px-4 py-3 text-sm font-semibold transition-all ${
            error ? "border-danger-300 bg-danger-100 text-danger-700" : "border-success-300 bg-success-100 text-success-700"
          }`}
        >
          {error || notice}
        </div>
      )}

      <section className="rounded-md border border-main-200 bg-main-100 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-main-950">Sources</p>
            <p className="text-xs text-main-500">{sourceCards.length} configured · {selectedAggregationLabel}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setSelectedAggregationSources(sourceCards.map((source) => source.key))} className="rounded-md border border-main-300 px-3 py-1.5 text-xs font-bold text-main-700 hover:border-primary-300 hover:text-primary-700">
              Select all
            </button>
            <button type="button" onClick={() => { setSelectedSource(""); setSelectedAggregationSources([]); }} className="rounded-md border border-main-300 px-3 py-1.5 text-xs font-bold text-main-700 hover:border-primary-300 hover:text-primary-700">
              Clear
            </button>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {sourceCards.map((source) => {
            const status = sourceStatus(source, health);
            const sourceUpdate = updateFor(source, updates);
            const isSelected = selectedSource === source.key;
            const isAggregationSelected = selectedAggregationSources.includes(source.key);
            return (
              <div key={source.key} className={`rounded-md border p-3 ${isAggregationSelected ? "border-primary-300 bg-primary-50" : isSelected ? "border-primary-200 bg-main-50" : "border-main-200 bg-main-50"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2">
                    <input
                      type="checkbox"
                      checked={isAggregationSelected}
                      onChange={() => toggleAggregationSource(source.key)}
                      className="mt-1 size-4 accent-primary-600"
                      aria-label={`Select ${source.name} for aggregation`}
                    />
                    <button type="button" onClick={() => { setSelectedSource(source.key); setPage(1); }} className="min-w-0 text-left">
                      <span className="block truncate font-bold text-main-900">{source.name}</span>
                      <span className="font-mono text-xs text-main-500">{source.key}</span>
                    </button>
                  </div>
                  <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold ${status.className}`}>{status.label}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="font-bold text-main-500">Latest</p>
                    <p className="mt-1 truncate text-main-800">{formatDateOnly(sourceUpdate?.latest_stored_at)}</p>
                  </div>
                  <div>
                    <p className="font-bold text-main-500">Imported</p>
                    <p className="mt-1 truncate text-main-800">{formatDateOnly(source.last_imported_at)}</p>
                  </div>
                  <div>
                    <p className="font-bold text-main-500">New</p>
                    <p className={`mt-1 font-bold ${sourceUpdate?.has_updates ? "text-success-700" : "text-main-800"}`}>
                      {updateSummary(sourceUpdate)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button type="button" onClick={() => void loadUpdates(source.key)} disabled={Boolean(checkingUpdates)} className="flex items-center justify-center gap-1.5 rounded-md border border-main-300 bg-main-100 px-3 py-1.5 text-xs font-bold text-main-700 hover:border-primary-300 hover:text-primary-700 disabled:opacity-60">
                    <i className={`bi ${checkingUpdates === source.key ? "bi-arrow-repeat animate-spin" : "bi-radar"}`} />
                    Check
                  </button>
                  <button type="button" onClick={() => void importRawSource(source.key)} disabled={Boolean(importingSource)} className="flex items-center justify-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-bold text-main-0 hover:bg-primary-700 disabled:opacity-60">
                    <i className={`bi ${importingSource === source.key ? "bi-arrow-repeat animate-spin" : "bi-cloud-download"}`} />
                    Import Raw
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-md border border-main-200 bg-main-100 p-5 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-main-200 pb-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 border-b border-transparent">
              <button
                type="button"
                onClick={() => handleTabChange("raw")}
                className={`pb-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === "raw" ? "border-primary-600 text-primary-700" : "border-transparent text-main-500 hover:text-main-800"
                }`}
              >
                Raw Prices
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("normalized")}
                className={`pb-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === "normalized" ? "border-primary-600 text-primary-700" : "border-transparent text-main-500 hover:text-main-800"
                }`}
              >
                Standard Prices
              </button>
            </div>
            <p className="text-xs text-main-500 font-semibold">
              {activeTab === "raw" 
                ? "Source-level imported rows stored in raw commodity prices." 
                : "Standard app-ready rows stored in commodities prices."
              }
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {activeTab === "raw" && (
              <div>
                <label className="block text-xs font-bold text-main-600 mb-1">Source Feed</label>
                <select
                  value={selectedSource}
                  onChange={(e) => {
                    setSelectedSource(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-100 transition-all"
                >
                  <option value="">All Integration Sources</option>
                  {sourceCards.map((src) => (
                    <option key={src.key} value={src.key}>{src.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-main-600 mb-1">Filter Commodity</label>
              <input
                type="text"
                value={filterCommodity}
                onChange={(e) => setFilterCommodity(e.target.value)}
                placeholder="e.g. Maize, Coffee"
                className="w-full rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-main-600 mb-1">Filter Market</label>
              <input
                type="text"
                value={filterMarket}
                onChange={(e) => setFilterMarket(e.target.value)}
                placeholder="e.g. Dar es Salaam"
                className="w-full rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-main-600 mb-1">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Source, market, commodity, reference"
                className="w-full rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-100 transition-all"
              />
            </div>

          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-main-300 border-t-primary-600" />
            <p className="text-sm font-semibold text-main-500">Retrieving feed rows...</p>
          </div>
        ) : activeTab === "raw" ? (
          <RawPricesTable
            prices={rawPrices}
            sort={rawSort}
            onSort={(key) => {
              setRawSort((current) => nextSort(current, key));
              setPage(1);
            }}
            onViewRaw={setRawPayloadModal}
          />
        ) : (
          <NormalizedPricesTable
            prices={normalizedPrices}
            sort={normalizedSort}
            onSort={(key) => {
              setNormalizedSort((current) => nextSort(current, key));
              setPage(1);
            }}
          />
        )}

        {!loading && (
          <div className="mt-4 flex flex-col gap-3 border-t border-main-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-sm text-main-600">
              <span>{showingCount(activeTab === "raw" ? rawPrices.length : normalizedPrices.length, pagination.total_items)}</span>
              <span>Rows</span>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                className="rounded-md border border-main-300 bg-main-100 px-2 py-1 text-sm text-main-900 outline-none"
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-main-600">
              <button
                type="button"
                disabled={!pagination.has_previous}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-md border border-main-300 bg-main-100 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              <span>Page {pagination.page} of {pagination.total_pages}</span>
              <button
                type="button"
                disabled={!pagination.has_next}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-md border border-main-300 bg-main-100 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Raw Payload Modal */}
      {rawPayloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-main-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-lg border border-main-200 bg-main-100 p-6 shadow-xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-main-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-main-950">Raw JSON Payload</h3>
                <p className="text-xs text-main-500 mt-0.5">
                  Stored raw record from source <span className="font-bold text-primary-700">{rawPayloadModal.source_name || rawPayloadModal.source_key}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRawPayloadModal(null)}
                className="h-8 w-8 rounded-full hover:bg-main-100 text-main-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto bg-main-900 text-main-50 p-4 rounded-md font-mono text-xs my-4 select-text">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(rawPayloadModal.raw_payload ?? rawPayloadModal, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setRawPayloadModal(null)}
                className="rounded bg-main-800 text-main-0 px-4 py-2 text-sm font-bold hover:bg-main-900 transition-colors cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RawPricesTable({
  prices,
  sort,
  onSort,
  onViewRaw,
}: {
  prices: RawCommodityPrice[];
  sort: SortConfig<RawPriceSortKey>;
  onSort: (key: RawPriceSortKey) => void;
  onViewRaw: (item: RawCommodityPrice) => void;
}) {
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-220 text-left text-sm">
        <thead>
          <tr className="border-b border-main-200 text-xs font-bold uppercase text-main-500">
            <SortHeader label="Source" sortKey="source" sort={sort} onSort={onSort} />
            <SortHeader label="Commodity" sortKey="commodity" sort={sort} onSort={onSort} />
            <SortHeader label="Market" sortKey="market" sort={sort} onSort={onSort} />
            <SortHeader label="Price" sortKey="price" sort={sort} onSort={onSort} />
            <SortHeader label="Reference" sortKey="reference" sort={sort} onSort={onSort} />
            <SortHeader label="Observed" sortKey="observed_at" sort={sort} onSort={onSort} />
            <th className="py-3 pr-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-main-200">
          {prices.length ? (
            prices.map((price) => (
                <tr key={price.raw_price_id} className="hover:bg-main-50 transition-colors">
                  <td className="py-4 pr-4">
                    <span className="inline-flex rounded-md bg-accent-100 px-2.5 py-1 text-xs font-bold text-accent-800">
                      {price.source_name || sourceLabel(price.source_key)}
                    </span>
                  </td>
                  <td className="py-4 pr-4 font-bold text-main-900">{price.commodity_name}</td>
                  <td className="py-4 pr-4 text-main-700">{price.market_name}</td>
                  <td className="py-4 pr-4 font-bold text-primary-700">
                    {formatMoney(price.price, price.currency)}
                  </td>
                  <td className="max-w-56 truncate py-4 pr-4 text-xs text-main-600">{price.source_reference || "None"}</td>
                  <td className="py-4 pr-4 text-xs text-main-600">{formatDate(price.observed_at)}</td>
                  <td className="py-4 pr-4 text-right">
                    <button
                      type="button"
                      onClick={() => onViewRaw(price)}
                      className="rounded border border-main-300 bg-main-100 px-2.5 py-1 text-xs font-semibold text-main-700 hover:border-accent-300 hover:text-accent-700 cursor-pointer"
                    >
                      Inspect JSON
                    </button>
                  </td>
                </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="py-12 text-center text-main-550">
                No raw imported rows found. Check updates and import new source data.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

type RawPriceSortKey = "source" | "commodity" | "market" | "price" | "reference" | "observed_at";

type NormalizedPriceSortKey = "commodity" | "market" | "price" | "raw_prices_count" | "price_date" | "created_at";

function NormalizedPricesTable({ prices, sort, onSort }: { prices: MarketPrice[]; sort: SortConfig<NormalizedPriceSortKey>; onSort: (key: NormalizedPriceSortKey) => void }) {
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-220 text-left text-sm">
        <thead>
          <tr className="border-b border-main-200 text-xs font-bold uppercase text-main-500">
            <SortHeader label="Commodity" sortKey="commodity" sort={sort} onSort={onSort} />
            <SortHeader label="Market" sortKey="market" sort={sort} onSort={onSort} />
            <SortHeader label="Price TZS" sortKey="price" sort={sort} onSort={onSort} />
            <th className="py-3 pr-4">Price USD</th>
            <SortHeader label="Sources" sortKey="raw_prices_count" sort={sort} onSort={onSort} />
            <SortHeader label="Report Date" sortKey="price_date" sort={sort} onSort={onSort} />
            <SortHeader label="Date Synced" sortKey="created_at" sort={sort} onSort={onSort} />
          </tr>
        </thead>
        <tbody className="divide-y divide-main-200">
          {prices.length ? (
            prices.map((price) => (
              <tr key={price.price_id} className="hover:bg-main-50 transition-colors">
                <td className="py-4 pr-4 font-bold text-main-900">
                  {price.commodity?.name ?? price.commodity_name ?? "Unknown"}
                </td>
                <td className="py-4 pr-4 font-bold text-main-700">
                  {price.market?.name ?? price.market_name ?? "Unknown"}
                </td>
                <td className="py-4 pr-4 font-bold text-primary-700">{formatMoney(price.price, price.currency)}</td>
                <td className="py-4 pr-4 font-semibold text-main-850">{formatMoney(price.price_usd, "USD")}</td>
                <td className="py-4 pr-4 font-bold text-main-800">{price.raw_prices_count ?? 0}</td>
                <td className="py-4 pr-4 text-main-700">{formatDate(price.price_date)}</td>
                <td className="py-4 pr-4 text-xs text-main-600">{formatDate(price.created_at)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="py-12 text-center text-main-550">
                No synced integration rows found. Try triggering a sync.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

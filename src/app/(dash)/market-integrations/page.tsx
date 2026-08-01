"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  checkMarketIntegrationHealth,
  listMarketIntegrationSources,
  listLivePrices,
  listStoredIntegrationPrices,
  syncMarketIntegrations,
  type MarketIntegrationHealth,
  type MarketIntegrationSource,
  type MarketPrice,
  type NormalizedMarketPrice,
} from "@/src/services/markets/marketService";

type SourceKey = "platform_a" | "platform_b" | "platform_c" | "viwanda";

const sourceKeys: SourceKey[] = ["platform_a", "platform_b", "platform_c", "viwanda"];

function formatDate(value?: string | null) {
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

export default function MarketIntegrationsPage() {
  const [sources, setSources] = useState<MarketIntegrationSource[]>([]);
  const [health, setHealth] = useState<MarketIntegrationHealth[]>([]);
  const [livePrices, setLivePrices] = useState<NormalizedMarketPrice[]>([]);
  const [storedPrices, setStoredPrices] = useState<MarketPrice[]>([]);
  
  const [activeTab, setActiveTab] = useState<"live" | "stored">("live");
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [filterCommodity, setFilterCommodity] = useState<string>("");
  const [filterMarket, setFilterMarket] = useState<string>("");
  
  const [loading, setLoading] = useState(true);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [syncingSource, setSyncingSource] = useState<string>("");
  
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  
  const [rawPayloadModal, setRawPayloadModal] = useState<NormalizedMarketPrice | null>(null);

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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        source: selectedSource || undefined,
        commodity: filterCommodity || undefined,
        market: filterMarket || undefined,
      };

      if (activeTab === "live") {
        const live = await listLivePrices(params);
        setLivePrices(live);
      } else {
        const stored = await listStoredIntegrationPrices(params);
        setStoredPrices(stored);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load integration data.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedSource, filterCommodity, filterMarket]);

  useEffect(() => {
    let mounted = true;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      Promise.all([loadSources(), loadHealth(), loadData()])
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
  }, [loadSources, loadHealth, loadData]);

  const syncSource = async (source?: string) => {
    setSyncingSource(source ?? "all");
    setNotice("");
    setError("");
    try {
      const response = await syncMarketIntegrations({ source, limit: 200 });
      const errorCount = response.result.errors.length;
      setNotice(
        `${response.message} Created: ${response.result.created}. Updated: ${response.result.updated}.${
          errorCount ? ` Errors: ${errorCount}.` : ""
        }`
      );
      await loadData();
      await loadHealth();
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
          <h1 className="text-2xl font-bold text-main-950 sm:text-3xl">External API Integration Feed</h1>
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
            onClick={() => void syncSource()}
            disabled={Boolean(syncingSource)}
            className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60 transition-all cursor-pointer"
          >
            <i className={`bi ${syncingSource === "all" ? "bi-arrow-repeat animate-spin" : "bi-cloud-download"}`} />
            {syncingSource === "all" ? "Syncing..." : "Sync All Sources"}
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

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {sourceCards.map((source) => {
          const sourceHealth = healthFor(source, health);
          const isHealthy = sourceHealth?.ok === true;
          const isUnhealthy = sourceHealth?.ok === false;
          const isScraper = source.key === "viwanda";

          return (
            <div key={source.key} className="rounded-md border border-main-200 bg-main-0 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-main-400">{source.key}</span>
                    <h2 className="mt-0.5 text-lg font-bold text-main-950">{source.name}</h2>
                  </div>
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-bold ${
                      isHealthy
                        ? "bg-success-100 text-success-700"
                        : isUnhealthy
                        ? "bg-danger-100 text-danger-700"
                        : "bg-main-200 text-main-700"
                    }`}
                  >
                    {isHealthy ? "Online" : isUnhealthy ? "Offline" : "Unknown"}
                  </span>
                </div>
                
                <div className="mt-4 space-y-2 text-xs">
                  <div>
                    <p className="font-bold text-main-500">Service URL</p>
                    <p className="break-all text-main-800 font-mono mt-0.5">
                      {source.base_url || "Not configured"}
                    </p>
                  </div>
                  {!isScraper && source.prices_url && (
                    <div>
                      <p className="font-bold text-main-500">Endpoint</p>
                      <p className="break-all text-main-800 font-mono mt-0.5">{source.prices_url}</p>
                    </div>
                  )}
                  {isScraper && (
                    <p className="text-xs text-main-600 bg-main-50 p-2 rounded border border-main-200">
                      Local PDF scraping module for Ministry of Industry and Trade reports.
                    </p>
                  )}
                  {sourceHealth?.error && (
                    <p className="rounded-md border border-danger-200 bg-danger-100 p-2 text-danger-700 mt-2">
                      {sourceHealth.error}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSource(source.key);
                    void loadData();
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded border border-main-300 bg-main-100 py-1.5 text-xs font-bold text-main-800 hover:border-primary-300 hover:text-primary-700 transition-all cursor-pointer"
                >
                  <i className="bi bi-search" />
                  Feed
                </button>
                <button
                  type="button"
                  onClick={() => void syncSource(source.key)}
                  disabled={Boolean(syncingSource)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded bg-primary-600 py-1.5 text-xs font-bold text-main-0 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60 transition-all cursor-pointer"
                >
                  <i className={`bi ${syncingSource === source.key ? "bi-arrow-repeat animate-spin" : "bi-cloud-download"}`} />
                  Sync
                </button>
              </div>
            </div>
          );
        })}
      </section>

      <section className="rounded-md border border-main-200 bg-main-0 p-5 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-main-200 pb-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 border-b border-transparent">
              <button
                type="button"
                onClick={() => setActiveTab("live")}
                className={`pb-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === "live" ? "border-primary-600 text-primary-700" : "border-transparent text-main-500 hover:text-main-800"
                }`}
              >
                Normalized Live Prices Feed
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("stored")}
                className={`pb-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === "stored" ? "border-primary-600 text-primary-700" : "border-transparent text-main-500 hover:text-main-800"
                }`}
              >
                Synced Prices Database
              </button>
            </div>
            <p className="text-xs text-main-500 font-semibold">
              {activeTab === "live" 
                ? "Showing real-time raw normalized payloads parsed from API sources." 
                : "Showing verified records synced and saved to the central database."
              }
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <label className="block text-xs font-bold text-main-600 mb-1">Source Feed</label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0 transition-all"
              >
                <option value="">All Integration Sources</option>
                {sourceCards.map((src) => (
                  <option key={src.key} value={src.key}>{src.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-main-600 mb-1">Filter Commodity</label>
              <input
                type="text"
                value={filterCommodity}
                onChange={(e) => setFilterCommodity(e.target.value)}
                placeholder="e.g. Maize, Coffee"
                className="w-full rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-main-600 mb-1">Filter Market</label>
              <input
                type="text"
                value={filterMarket}
                onChange={(e) => setFilterMarket(e.target.value)}
                placeholder="e.g. Dar es Salaam"
                className="w-full rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0 transition-all"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => void loadData()}
                className="w-full flex items-center justify-center gap-2 rounded-md bg-main-800 text-main-0 py-2.5 text-sm font-bold hover:bg-main-900 transition-all cursor-pointer"
              >
                <i className="bi bi-filter" />
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-main-300 border-t-primary-600" />
            <p className="text-sm font-semibold text-main-500">Retrieving feed rows...</p>
          </div>
        ) : activeTab === "live" ? (
          <LivePricesTable prices={livePrices} onViewRaw={setRawPayloadModal} />
        ) : (
          <StoredPricesTable prices={storedPrices} />
        )}
      </section>

      {/* Raw Payload Modal */}
      {rawPayloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-main-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-lg border border-main-200 bg-main-0 p-6 shadow-xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-main-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-main-950">Raw JSON Payload</h3>
                <p className="text-xs text-main-500 mt-0.5">
                  Parsed record from source <span className="font-bold text-primary-700">{rawPayloadModal.source}</span>
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
                {JSON.stringify(rawPayloadModal.raw ?? rawPayloadModal, null, 2)}
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

function LivePricesTable({
  prices,
  onViewRaw,
}: {
  prices: NormalizedMarketPrice[];
  onViewRaw: (item: NormalizedMarketPrice) => void;
}) {
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-220 text-left text-sm">
        <thead>
          <tr className="border-b border-main-200 text-xs font-bold uppercase text-main-500">
            <th className="py-3 pr-4">Source</th>
            <th className="py-3 pr-4">Commodity</th>
            <th className="py-3 pr-4">Market</th>
            <th className="py-3 pr-4">Price TZS</th>
            <th className="py-3 pr-4">Price USD</th>
            <th className="py-3 pr-4">Confidence</th>
            <th className="py-3 pr-4">Feed Time</th>
            <th className="py-3 pr-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-main-200">
          {prices.length ? (
            prices.map((price, idx) => {
              const confidence = price.confidence ?? 1.0;
              const confPercent = Math.round(confidence * 100);
              return (
                <tr key={`${price.source}-${price.commodity}-${idx}`} className="hover:bg-main-50 transition-colors">
                  <td className="py-4 pr-4">
                    <span className="inline-flex rounded-md bg-accent-100 px-2.5 py-1 text-xs font-bold text-accent-800">
                      {sourceLabel(price.source)}
                    </span>
                  </td>
                  <td className="py-4 pr-4 font-bold text-main-900">{price.commodity}</td>
                  <td className="py-4 pr-4 text-main-700">{price.market ?? "Unknown Market"}</td>
                  <td className="py-4 pr-4 font-bold text-primary-700">
                    {price.price_tzs !== null ? formatMoney(price.price_tzs, "TZS") : "N/A"}
                  </td>
                  <td className="py-4 pr-4 font-semibold text-main-850">
                    {price.price_usd !== null ? formatMoney(price.price_usd, "USD") : "N/A"}
                  </td>
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-12 bg-main-200 rounded overflow-hidden">
                        <div
                          className={`h-full rounded ${
                            confidence >= 0.85 
                              ? "bg-success-500" 
                              : confidence >= 0.6 
                              ? "bg-warning-500" 
                              : "bg-danger-500"
                          }`}
                          style={{ width: `${confPercent}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-main-600">{confPercent}%</span>
                    </div>
                  </td>
                  <td className="py-4 pr-4 text-xs text-main-600">{formatDate(price.timestamp)}</td>
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
              );
            })
          ) : (
            <tr>
              <td colSpan={8} className="py-12 text-center text-main-550">
                No normalized live rows received. The API feeds might be unreachable or returning empty results.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function StoredPricesTable({ prices }: { prices: MarketPrice[] }) {
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-220 text-left text-sm">
        <thead>
          <tr className="border-b border-main-200 text-xs font-bold uppercase text-main-500">
            <th className="py-3 pr-4">Source</th>
            <th className="py-3 pr-4">Commodity</th>
            <th className="py-3 pr-4">Market</th>
            <th className="py-3 pr-4">Price TZS</th>
            <th className="py-3 pr-4">Price USD</th>
            <th className="py-3 pr-4">Report Date</th>
            <th className="py-3 pr-4">Date Synced</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-main-200">
          {prices.length ? (
            prices.map((price) => (
              <tr key={price.price_id} className="hover:bg-main-50 transition-colors">
                <td className="py-4 pr-4">
                  <span className="inline-flex rounded-md bg-primary-100 px-2.5 py-1 text-xs font-bold text-primary-700">
                    {price.source_name || sourceLabel(price.source_key || "feed")}
                  </span>
                </td>
                <td className="py-4 pr-4 font-bold text-main-900">
                  {price.commodity?.name ?? price.commodity_name ?? "Unknown"}
                </td>
                <td className="py-4 pr-4 font-bold text-main-700">
                  {price.market?.name ?? price.market_name ?? "Unknown"}
                </td>
                <td className="py-4 pr-4 font-bold text-primary-700">{formatMoney(price.price, price.currency)}</td>
                <td className="py-4 pr-4 font-semibold text-main-850">{formatMoney(price.price_usd, "USD")}</td>
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

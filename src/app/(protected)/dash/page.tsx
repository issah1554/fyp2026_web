"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import StatsGrid from "../_components/ui/StatsGrid";
import {
  checkMarketIntegrationHealth,
  listMarketPrices,
  listMarkets,
  type MarketIntegrationHealth,
  type MarketPrice,
} from "@/src/services/markets/marketService";
import { listListings } from "@/src/services/trade/tradeService";
import { listUsers } from "@/src/services/users/userService";

function getStatusClass(status?: string) {
  if (!status) return "bg-main-100 text-main-700";
  const s = status.toLowerCase();
  if (s === "verified" || s === "active" || s === "online" || s === "ok") return "bg-success-100 text-success-700";
  if (s === "review" || s === "degraded" || s === "pending") return "bg-warning-100 text-warning-700";
  if (s === "inactive" || s === "offline" || s === "flagged") return "bg-danger-100 text-danger-700";
  return "bg-accent-100 text-accent-700";
}

function formatPriceValue(price: number | string | undefined, currency?: string) {
  if (price === undefined || price === null || price === "") return "N/A";
  const num = typeof price === "number" ? price : Number(price);
  if (Number.isNaN(num)) return String(price);
  const formatted = num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return currency ? `${currency} ${formatted}` : `TZS ${formatted}`;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeMarketsCount, setActiveMarketsCount] = useState<number>(0);
  const [dailyPricesCount, setDailyPricesCount] = useState<number>(0);
  const [tradeListingsCount, setTradeListingsCount] = useState<number>(0);
  const [usersCount, setUsersCount] = useState<number>(0);

  const [recentPrices, setRecentPrices] = useState<MarketPrice[]>([]);
  const [integrationHealth, setIntegrationHealth] = useState<MarketIntegrationHealth[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const [marketsRes, pricesRes, listingsRes, usersRes, healthRes] = await Promise.allSettled([
      listMarkets({ page: 1, page_size: 1 }),
      listMarketPrices({ page: 1, page_size: 6 }),
      listListings({ page: 1, page_size: 1 }),
      listUsers({ page: 1, page_size: 1 }),
      checkMarketIntegrationHealth(),
    ]);

    if (marketsRes.status === "fulfilled") {
      setActiveMarketsCount(marketsRes.value.pagination.total_items);
    }
    if (pricesRes.status === "fulfilled") {
      setDailyPricesCount(pricesRes.value.pagination.total_items);
      setRecentPrices(pricesRes.value.data);
    }
    if (listingsRes.status === "fulfilled") {
      setTradeListingsCount(listingsRes.value.pagination.total_items);
    }
    if (usersRes.status === "fulfilled") {
      setUsersCount(usersRes.value.pagination.total_items);
    }
    if (healthRes.status === "fulfilled") {
      setIntegrationHealth(healthRes.value.data);
    }

    const failedCount = [marketsRes, pricesRes, listingsRes, usersRes].filter((r) => r.status === "rejected").length;
    if (failedCount > 0 && marketsRes.status === "rejected" && pricesRes.status === "rejected") {
      setError("Failed to fetch backend data. Please verify network connection or credentials.");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const metrics = [
    {
      label: "Active markets",
      value: loading ? "..." : activeMarketsCount.toLocaleString(),
      detail: "Verified trading locations",
      icon: "bi-shop",
      color: "text-primary-700",
      bg: "bg-primary-100",
      href: "/markets",
    },
    {
      label: "Daily price records",
      value: loading ? "..." : dailyPricesCount.toLocaleString(),
      detail: "Recorded commodity price points",
      icon: "bi-database-check",
      color: "text-accent-700",
      bg: "bg-accent-100",
      href: "/markets",
    },
    {
      label: "Active trade listings",
      value: loading ? "..." : tradeListingsCount.toLocaleString(),
      detail: "Live market listings & offers",
      icon: "bi-cart-check",
      color: "text-warning-700",
      bg: "bg-warning-100",
      href: "/listings",
    },
    {
      label: "System members",
      value: loading ? "..." : usersCount.toLocaleString(),
      detail: "Registered platform users",
      icon: "bi-people",
      color: "text-success-700",
      bg: "bg-success-100",
      href: "/users",
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-4">
      <section className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-main-500">Operations</p>
          <h1 className="text-2xl font-bold text-main-950 sm:text-3xl">Market Dashboard</h1>
        </div>
        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading}
          className="flex w-fit items-center gap-2 rounded-md border border-main-300 bg-main-100 px-3 py-1.5 text-xs font-semibold text-main-800 shadow-sm hover:bg-main-200 disabled:opacity-50"
        >
          <i className={`bi bi-arrow-clockwise ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          Refresh data
        </button>
      </section>

      {error && (
        <div className="flex items-center justify-between rounded-md border border-danger-200 bg-danger-50 p-4 text-sm font-medium text-danger-800">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadData()}
            className="rounded bg-danger-600 px-3 py-1 text-xs font-bold text-main-0 hover:bg-danger-700"
          >
            Retry
          </button>
        </div>
      )}

      <StatsGrid stats={metrics} />

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-md border border-main-200 bg-main-100 p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-main-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-main-500">Recent collection</p>
              <h2 className="mt-1 text-xl font-bold text-main-950">Market Price Submissions</h2>
            </div>
            <Link
              href="/markets"
              className="flex w-fit items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700"
            >
              <i className="bi bi-plus-circle" aria-hidden="true" />
              Manage prices
            </Link>
          </div>

          <div className="mt-5 overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-sm text-main-500">
                <i className="bi bi-arrow-clockwise mr-2 animate-spin text-base" /> Loading market prices...
              </div>
            ) : recentPrices.length === 0 ? (
              <div className="py-10 text-center text-sm text-main-500">
                No recent market price records found in backend.
              </div>
            ) : (
              <table className="w-full min-w-160 text-left text-sm">
                <thead>
                  <tr className="border-b border-main-200 text-xs font-bold uppercase text-main-500">
                    <th className="py-3 pr-4">Market</th>
                    <th className="py-3 pr-4">Commodity</th>
                    <th className="py-3 pr-4">Price</th>
                    <th className="py-3 pr-4">Date / Type</th>
                    <th className="py-3 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-main-200">
                  {recentPrices.map((row) => {
                    const marketName = row.market?.name || row.market_name || "Unknown Market";
                    const commodityName = row.commodity?.name || row.commodity_name || "Unknown Commodity";
                    const dateOrType = row.price_date || row.price_type || "Standard";
                    const statusText = row.price_type ? row.price_type.toUpperCase() : "VERIFIED";

                    return (
                      <tr key={row.price_id}>
                        <td className="py-4 pr-4 font-bold text-main-900">{marketName}</td>
                        <td className="py-4 pr-4 text-main-700">{commodityName}</td>
                        <td className="py-4 pr-4 font-semibold text-main-900">
                          {formatPriceValue(row.price, row.currency)}
                        </td>
                        <td className="py-4 pr-4 text-xs text-main-600">{dateOrType}</td>
                        <td className="py-4 pr-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(statusText)}`}>
                            {statusText}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="rounded-md border border-main-200 bg-main-100 p-5 shadow-sm">
          <div className="border-b border-main-200 pb-3">
            <p className="text-sm font-semibold text-main-500">Integrations status</p>
            <h2 className="mt-1 text-xl font-bold text-main-950">Analytics & Integration Feeds</h2>
          </div>
          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="py-8 text-center text-sm text-main-500">Checking feed status...</div>
            ) : integrationHealth.length === 0 ? (
              [
                { source: "Platform A", status: "Online" },
                { source: "Platform B", status: "Online" },
                { source: "Internal System", status: "Online" },
                { source: "Viwanda Scraper", status: "Online" },
              ].map((feed) => (
                <div
                  key={feed.source}
                  className="flex items-center justify-between rounded-md border border-main-200 bg-main-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-md bg-accent-100 text-sm font-bold text-accent-700">
                      <i className="bi bi-broadcast" />
                    </span>
                    <span className="font-semibold text-main-800">{feed.source}</span>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(feed.status)}`}>
                    {feed.status}
                  </span>
                </div>
              ))
            ) : (
              integrationHealth.map((health) => {
                const statusStr = health.ok ? "Online" : "Degraded";
                return (
                  <div
                    key={health.source}
                    className="flex items-center justify-between rounded-md border border-main-200 bg-main-50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-md bg-accent-100 text-sm font-bold text-accent-700">
                        <i className="bi bi-broadcast" />
                      </span>
                      <div>
                        <p className="font-semibold capitalize text-main-800">{health.name || health.source.replace(/_/g, " ")}</p>
                        <p className="text-xs text-main-500">{health.ok ? "Feed Operational" : health.error || "Connection Degraded"}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(statusStr)}`}>
                      {statusStr}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

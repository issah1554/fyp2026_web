"use client";

import { useCallback, useEffect, useState } from "react";
import { listMarkets } from "@/src/services/markets/marketService";
import { listCommodities } from "@/src/services/commodities/commodityService";
import { listMarketPrices } from "@/src/services/markets/marketService";
import { listUsers } from "@/src/services/users/userService";
import { listListings } from "@/src/services/trade/tradeService";

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => `"${String(row[header] ?? "").replaceAll('"', '""')}"`)
        .join(","),
    ),
  ];
  return lines.join("\n");
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [marketsCount, setMarketsCount] = useState(0);
  const [commoditiesCount, setCommoditiesCount] = useState(0);
  const [pricesCount, setPricesCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);

  const [includePrices, setIncludePrices] = useState(true);
  const [includeCommodities, setIncludeCommodities] = useState(true);
  const [includeMarkets, setIncludeMarkets] = useState(true);
  const [includeListings, setIncludeListings] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [mkts, comms, prcs, usrs] = await Promise.allSettled([
        listMarkets({ page: 1, page_size: 1 }),
        listCommodities({ page: 1, page_size: 1 }),
        listMarketPrices({ page: 1, page_size: 1 }),
        listUsers({ page: 1, page_size: 1 }),
      ]);

      if (mkts.status === "fulfilled") setMarketsCount(mkts.value.pagination.total_items);
      if (comms.status === "fulfilled") setCommoditiesCount(comms.value.pagination.total_items);
      if (prcs.status === "fulfilled") setPricesCount(prcs.value.pagination.total_items);
      if (usrs.status === "fulfilled") setUsersCount(usrs.value.pagination.total_items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch platform metrics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const handleExport = async (format: "csv" | "json") => {
    setExporting(true);
    setError("");
    setNotice("");

    try {
      const exportPackage: Record<string, unknown> = {
        exported_at: new Date().toISOString(),
        system: "Market Information System",
      };

      const tasks: Promise<void>[] = [];

      if (includePrices) {
        tasks.push(
          listMarketPrices({ page: 1, page_size: 100 }).then((res) => {
            exportPackage.market_prices = res.data;
          }),
        );
      }
      if (includeCommodities) {
        tasks.push(
          listCommodities({ page: 1, page_size: 100 }).then((res) => {
            exportPackage.commodities = res.data;
          }),
        );
      }
      if (includeMarkets) {
        tasks.push(
          listMarkets({ page: 1, page_size: 100 }).then((res) => {
            exportPackage.markets = res.data;
          }),
        );
      }
      if (includeListings) {
        tasks.push(
          listListings({ page: 1, page_size: 100 }).then((res) => {
            exportPackage.trade_listings = res.data;
          }),
        );
      }

      await Promise.all(tasks);

      const timestamp = new Date().toISOString().slice(0, 10);

      if (format === "json") {
        const content = JSON.stringify(exportPackage, null, 2);
        downloadFile(`market_intelligence_export_${timestamp}.json`, content, "application/json");
      } else {
        const rows: Array<Record<string, unknown>> = [];
        if (Array.isArray(exportPackage.market_prices)) {
          (exportPackage.market_prices as Array<Record<string, unknown>>).forEach((p) => {
            rows.push({
              dataset: "Market Prices",
              id: p.price_id ?? "",
              market: typeof p.market === "object" && p.market ? (p.market as Record<string, string>).name : p.market_name ?? "",
              commodity: typeof p.commodity === "object" && p.commodity ? (p.commodity as Record<string, string>).name : p.commodity_name ?? "",
              price: p.price ?? "",
              currency: p.currency ?? "TZS",
              date: p.price_date ?? "",
            });
          });
        }
        if (Array.isArray(exportPackage.commodities)) {
          (exportPackage.commodities as Array<Record<string, unknown>>).forEach((c) => {
            rows.push({
              dataset: "Commodities",
              id: c.commodity_id ?? "",
              market: "",
              commodity: c.name ?? "",
              price: "",
              currency: "",
              date: c.created_at ?? "",
            });
          });
        }

        const csvContent = toCsv(rows.length > 0 ? rows : [{ dataset: "Empty", status: "No records selected" }]);
        downloadFile(`market_intelligence_export_${timestamp}.csv`, csvContent, "text/csv");
      }

      setNotice(`Successfully generated and downloaded ${format.toUpperCase()} export package.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report package.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-4">
      <section className="flex flex-col gap-4 rounded-md border border-main-200 bg-main-100/80 p-5 shadow-sm backdrop-blur md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase text-primary-700">Decision Support</p>
          <h1 className="mt-2 text-2xl font-bold text-main-950 sm:text-3xl">Reports & Decision Support Exports</h1>
          <p className="mt-2 text-sm leading-6 text-main-600">
            Generate leadership-ready market intelligence reports and datasets directly from backend API records.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleExport("json")}
            disabled={exporting}
            className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700 disabled:opacity-50"
          >
            {exporting && <i className="bi bi-arrow-clockwise animate-spin" />}
            <i className="bi bi-file-code" /> Export JSON
          </button>
          <button
            type="button"
            onClick={() => void handleExport("csv")}
            disabled={exporting}
            className="flex items-center gap-2 rounded-md bg-accent-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-accent-700 disabled:opacity-50"
          >
            {exporting && <i className="bi bi-arrow-clockwise animate-spin" />}
            <i className="bi bi-file-earmark-spreadsheet" /> Export CSV
          </button>
        </div>
      </section>

      {notice && (
        <div className="rounded-md border border-success-200 bg-success-50 p-4 text-sm font-medium text-success-800">
          {notice}
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-md border border-danger-200 bg-danger-50 p-4 text-sm font-medium text-danger-800">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadStats()}
            className="rounded bg-danger-600 px-3 py-1 text-xs font-bold text-main-0 hover:bg-danger-700"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-md border border-main-200 bg-main-100 p-5 shadow-sm">
          <p className="text-sm font-semibold text-main-500">Active Markets</p>
          <p className="mt-2 text-2xl font-bold text-main-950">{loading ? "..." : marketsCount}</p>
          <p className="mt-2 text-xs text-main-600">Trading centers available</p>
        </div>
        <div className="rounded-md border border-main-200 bg-main-100 p-5 shadow-sm">
          <p className="text-sm font-semibold text-main-500">Commodity Types</p>
          <p className="mt-2 text-2xl font-bold text-main-950">{loading ? "..." : commoditiesCount}</p>
          <p className="mt-2 text-xs text-main-600">Monitored crop catalog</p>
        </div>
        <div className="rounded-md border border-main-200 bg-main-100 p-5 shadow-sm">
          <p className="text-sm font-semibold text-main-500">Price Submissions</p>
          <p className="mt-2 text-2xl font-bold text-main-950">{loading ? "..." : pricesCount}</p>
          <p className="mt-2 text-xs text-main-600">Total recorded observations</p>
        </div>
        <div className="rounded-md border border-main-200 bg-main-100 p-5 shadow-sm">
          <p className="text-sm font-semibold text-main-500">System Users</p>
          <p className="mt-2 text-2xl font-bold text-main-950">{loading ? "..." : usersCount}</p>
          <p className="mt-2 text-xs text-main-600">Registered officers & users</p>
        </div>
      </div>

      <div className="rounded-md border border-main-200 bg-main-100 p-5 shadow-sm">
        <h2 className="text-lg font-bold text-main-950">Custom Export Builder</h2>
        <p className="mt-1 text-sm text-main-600">
          Select backend modules to include in your generated market intelligence export package.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex items-center gap-3 rounded-md border border-main-200 bg-main-50 p-4 text-sm font-semibold text-main-800 cursor-pointer">
            <input
              type="checkbox"
              checked={includePrices}
              onChange={(e) => setIncludePrices(e.target.checked)}
              className="size-4 accent-primary-600"
            />
            Market Price Records ({pricesCount})
          </label>
          <label className="flex items-center gap-3 rounded-md border border-main-200 bg-main-50 p-4 text-sm font-semibold text-main-800 cursor-pointer">
            <input
              type="checkbox"
              checked={includeCommodities}
              onChange={(e) => setIncludeCommodities(e.target.checked)}
              className="size-4 accent-primary-600"
            />
            Commodities Catalog ({commoditiesCount})
          </label>
          <label className="flex items-center gap-3 rounded-md border border-main-200 bg-main-50 p-4 text-sm font-semibold text-main-800 cursor-pointer">
            <input
              type="checkbox"
              checked={includeMarkets}
              onChange={(e) => setIncludeMarkets(e.target.checked)}
              className="size-4 accent-primary-600"
            />
            Active Markets ({marketsCount})
          </label>
          <label className="flex items-center gap-3 rounded-md border border-main-200 bg-main-50 p-4 text-sm font-semibold text-main-800 cursor-pointer">
            <input
              type="checkbox"
              checked={includeListings}
              onChange={(e) => setIncludeListings(e.target.checked)}
              className="size-4 accent-primary-600"
            />
            Trade Listings & Offers
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 border-t border-main-200 pt-4">
          <button
            type="button"
            onClick={() => void handleExport("csv")}
            disabled={exporting}
            className="rounded-md bg-primary-600 px-5 py-2.5 text-sm font-bold text-main-0 hover:bg-primary-700 disabled:opacity-50"
          >
            Download Package (CSV)
          </button>
          <button
            type="button"
            onClick={() => void handleExport("json")}
            disabled={exporting}
            className="rounded-md bg-accent-600 px-5 py-2.5 text-sm font-bold text-main-0 hover:bg-accent-700 disabled:opacity-50"
          >
            Download Package (JSON)
          </button>
        </div>
      </div>
    </div>
  );
}

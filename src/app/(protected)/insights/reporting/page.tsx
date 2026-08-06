"use client";

import { useEffect, useMemo, useState } from "react";
import {
  areaNameFromListing,
  asNumber,
  commodityNameFromListing,
  commodityNameFromOrder,
  commodityNameFromPrice,
  getInsightListings,
  getInsightOrders,
  getInsightPrices,
  marketNameFromPrice,
  type InsightListing,
  type InsightOrder,
} from "@/src/services/insights/insightsService";
import type { MarketPrice } from "@/src/services/markets/marketService";
import { InsightLoading, InsightMessage, InsightShell, InsightStatCard } from "../_components/InsightShell";

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Array<Record<string, string | number>>) {
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

function formatCurrency(value: number) {
  return `TZS ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function ReportingPage() {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [listings, setListings] = useState<InsightListing[]>([]);
  const [orders, setOrders] = useState<InsightOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void Promise.all([getInsightPrices(), getInsightListings(), getInsightOrders()])
      .then(([priceData, listingData, orderData]) => {
        if (!active) return;
        setPrices(priceData);
        setListings(listingData);
        setOrders(orderData);
      })
      .catch((nextError) => {
        if (active) {
          setError(nextError instanceof Error ? nextError.message : "Could not load reporting data.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const reportSummary = useMemo(() => {
    const totalOrderValue = orders.reduce((sum, order) => sum + asNumber(order.total_price), 0);
    const totalListedQuantity = listings.reduce((sum, listing) => sum + asNumber(listing.quantity), 0);
    const latestPriceDate = prices.map((item) => item.price_date).sort().reverse()[0] ?? "No price records";
    return {
      totalPriceRows: prices.length,
      totalListings: listings.length,
      totalOrders: orders.length,
      totalOrderValue,
      totalListedQuantity,
      latestPriceDate,
    };
  }, [listings, orders, prices]);

  const latestPriceRows = useMemo(
    () =>
      prices.slice(0, 20).map((price) => ({
        commodity: commodityNameFromPrice(price),
        market: marketNameFromPrice(price),
        price: asNumber(price.price),
        currency: price.currency || "TZS",
        price_date: price.price_date,
      })),
    [prices],
  );

  const listingRows = useMemo(
    () =>
      listings.slice(0, 20).map((listing) => ({
        commodity: commodityNameFromListing(listing),
        area: areaNameFromListing(listing),
        quantity: asNumber(listing.quantity),
        price: asNumber(listing.price),
        status: listing.status ?? "Unknown",
      })),
    [listings],
  );

  const orderRows = useMemo(
    () =>
      orders.slice(0, 20).map((order) => ({
        commodity: commodityNameFromOrder(order),
        buyer: order.buyer_name ?? "-",
        quantity: asNumber(order.quantity),
        total_price: asNumber(order.total_price),
        status: order.status ?? "Unknown",
        created_at: order.created_at ?? "-",
      })),
    [orders],
  );

  const reportDefinitions = [
    {
      key: "market-price-snapshot",
      label: "Market Price Snapshot CSV",
      description: "Download the latest market price rows currently stored in the database.",
      onDownload: () => downloadFile("market-price-snapshot.csv", toCsv(latestPriceRows), "text/csv;charset=utf-8;"),
    },
    {
      key: "listing-activity-report",
      label: "Listing Activity CSV",
      description: "Download current listing activity for supply-side reporting.",
      onDownload: () => downloadFile("listing-activity-report.csv", toCsv(listingRows), "text/csv;charset=utf-8;"),
    },
    {
      key: "order-activity-report",
      label: "Order Activity CSV",
      description: "Download order records to support demand and buyer analysis.",
      onDownload: () => downloadFile("order-activity-report.csv", toCsv(orderRows), "text/csv;charset=utf-8;"),
    },
    {
      key: "insight-summary-json",
      label: "Executive Summary JSON",
      description: "Download a compact summary package for dashboards and downstream reporting tools.",
      onDownload: () =>
        downloadFile(
          "insight-summary.json",
          JSON.stringify(
            {
              generated_at: new Date().toISOString(),
              totals: reportSummary,
              latest_prices: latestPriceRows,
              listings: listingRows,
              orders: orderRows,
            },
            null,
            2,
          ),
          "application/json;charset=utf-8;",
        ),
    },
  ];

  return (
    <InsightShell
      eyebrow="Reporting"
      title="Database-Driven Reporting Workspace"
      description="Generate downloadable operational reports from live price, listing, and order data so managers and stakeholders can distribute structured market intelligence."
    >
      {error ? <InsightMessage message={error} /> : null}

      {loading ? (
        <InsightLoading label="Loading reporting datasets..." />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InsightStatCard label="Price rows" value={reportSummary.totalPriceRows.toLocaleString()} detail="Rows available for price snapshot reports." icon="bi-file-earmark-bar-graph" />
            <InsightStatCard label="Listings included" value={reportSummary.totalListings.toLocaleString()} detail="Supply-side records available for listing reports." icon="bi-card-checklist" />
            <InsightStatCard label="Orders included" value={reportSummary.totalOrders.toLocaleString()} detail="Demand-side orders available for reporting exports." icon="bi-bag-check" />
            <InsightStatCard label="Order value" value={formatCurrency(reportSummary.totalOrderValue)} detail="Total order value represented in the current reporting window." icon="bi-cash-coin" />
          </div>

          <section className="rounded-md border border-main-200 bg-main-100 p-5 shadow-sm">
            <div className="border-b border-main-200 pb-4">
              <p className="text-sm font-bold uppercase text-primary-700">Download center</p>
              <h2 className="text-xl font-bold text-main-950">Available reports</h2>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {reportDefinitions.map((report) => (
                <article key={report.key} className="rounded-md border border-main-200 bg-main-50 p-4">
                  <h3 className="font-bold text-main-950">{report.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-main-600">{report.description}</p>
                  <button
                    type="button"
                    onClick={report.onDownload}
                    className="mt-4 rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700"
                  >
                    <i className="bi bi-download" /> Download
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-main-200 bg-main-100 p-5 shadow-sm">
            <div className="border-b border-main-200 pb-4">
              <p className="text-sm font-bold uppercase text-primary-700">Report coverage</p>
              <h2 className="text-xl font-bold text-main-950">Current database-backed reporting snapshot</h2>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <article className="rounded-md border border-main-200 bg-main-50 p-4">
                <p className="text-sm font-semibold text-main-500">Latest price date</p>
                <p className="mt-2 text-lg font-bold text-main-950">{reportSummary.latestPriceDate}</p>
              </article>
              <article className="rounded-md border border-main-200 bg-main-50 p-4">
                <p className="text-sm font-semibold text-main-500">Listed quantity</p>
                <p className="mt-2 text-lg font-bold text-main-950">{reportSummary.totalListedQuantity.toLocaleString()}</p>
              </article>
              <article className="rounded-md border border-main-200 bg-main-50 p-4">
                <p className="text-sm font-semibold text-main-500">Order records</p>
                <p className="mt-2 text-lg font-bold text-main-950">{reportSummary.totalOrders.toLocaleString()}</p>
              </article>
            </div>
          </section>
        </>
      )}
    </InsightShell>
  );
}

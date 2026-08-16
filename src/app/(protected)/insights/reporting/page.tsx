"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildInsightAnalytics,
  getInsightReportingAnalytics,
  loadInsightDataset,
  type InsightAnalytics,
  type InsightSeriesPoint,
} from "@/src/services/insights/insightsService";
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

function ReportTable({
  title,
  eyebrow,
  valueLabel,
  items,
  formatter,
}: {
  title: string;
  eyebrow: string;
  valueLabel: string;
  items: InsightSeriesPoint[];
  formatter: (value: number) => string;
}) {
  return (
    <section className="rounded-md border border-main-200 bg-main-100 p-5 shadow-sm">
      <div className="border-b border-main-200 pb-4">
        <p className="text-sm font-bold uppercase text-primary-700">{eyebrow}</p>
        <h2 className="text-xl font-bold text-main-950">{title}</h2>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-120 text-left text-sm">
          <thead>
            <tr className="border-b border-main-200 text-xs font-bold uppercase text-main-500">
              <th className="py-3 pr-4">Name</th>
              <th className="py-3 pr-4">{valueLabel}</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? (
              items.map((item) => (
                <tr key={item.key} className="border-b border-main-200">
                  <td className="py-4 pr-4 font-bold text-main-900">{item.key}</td>
                  <td className="py-4 pr-4 text-main-700">{formatter(item.value)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="py-8 text-center font-semibold text-main-500">
                  No records available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function ReportingPage() {
  const [analytics, setAnalytics] = useState<InsightAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    void getInsightReportingAnalytics()
      .then((nextAnalytics) => {
        if (!active) return;
        setAnalytics(nextAnalytics);
        setWarnings([]);
      })
      .catch(async (backendError) => {
        const dataset = await loadInsightDataset();
        if (!active) return;
        setAnalytics(buildInsightAnalytics(dataset));
        setWarnings([
          backendError instanceof Error ? backendError.message : "Backend reporting analytics unavailable.",
          ...dataset.warnings,
        ]);
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

  const reports = useMemo(() => {
    if (!analytics) return [];

    return [
      {
        key: "market-price-analysis",
        label: "Market Price Analysis CSV",
        description: "Commodity, market, source, price range, currency, and price date for all loaded market price rows.",
        rows: analytics.reportRows.prices,
      },
      {
        key: "listing-supply-analysis",
        label: "Listing Supply Analysis CSV",
        description: "Supply-side listing rows with commodity, area, quantity, price, seller, and status.",
        rows: analytics.reportRows.listings,
      },
      {
        key: "order-demand-analysis",
        label: "Order Demand Analysis CSV",
        description: "Demand-side order rows with commodity, buyer, quantity, total value, status, and creation time.",
        rows: analytics.reportRows.orders,
      },
    ];
  }, [analytics]);

  return (
    <InsightShell
      eyebrow="Reporting"
      title="Analysis and Reporting Workspace"
      description="Generate structured reports for price monitoring, supply activity, demand activity, and executive summaries from live platform data."
    >
      {error ? <InsightMessage message={error} /> : null}
      {warnings.map((warning) => (
        <InsightMessage key={warning} message={warning} />
      ))}

      {loading || !analytics ? (
        <InsightLoading label="Loading reporting datasets..." />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InsightStatCard label="Price rows" value={analytics.totals.priceRows.toLocaleString()} detail="Rows available for price analysis exports." icon="bi-file-earmark-bar-graph" />
            <InsightStatCard label="Listing rows" value={analytics.totals.listingRows.toLocaleString()} detail="Supply records available for reporting exports." icon="bi-card-checklist" />
            <InsightStatCard label="Order rows" value={analytics.totals.orderRows.toLocaleString()} detail="Demand records available for reporting exports." icon="bi-bag-check" />
            <InsightStatCard label="Order value" value={formatCurrency(analytics.totals.totalOrderValue)} detail="Total order value represented in the current reporting window." icon="bi-cash-coin" />
          </div>

          <section className="rounded-md border border-main-200 bg-main-100 p-5 shadow-sm">
            <div className="border-b border-main-200 pb-4">
              <p className="text-sm font-bold uppercase text-primary-700">Download center</p>
              <h2 className="text-xl font-bold text-main-950">Available reports</h2>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {reports.map((report) => (
                <article key={report.key} className="rounded-md border border-main-200 bg-main-50 p-4">
                  <h3 className="font-bold text-main-950">{report.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-main-600">{report.description}</p>
                  <button
                    type="button"
                    onClick={() => downloadFile(`${report.key}.csv`, toCsv(report.rows), "text/csv;charset=utf-8;")}
                    className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700"
                  >
                    <i className="bi bi-download" aria-hidden="true" /> CSV
                  </button>
                </article>
              ))}
              <article className="rounded-md border border-main-200 bg-main-50 p-4">
                <h3 className="font-bold text-main-950">Executive Summary JSON</h3>
                <p className="mt-2 text-sm leading-6 text-main-600">Compact totals and ranked analytics for dashboards, audits, and stakeholder briefings.</p>
                <button
                  type="button"
                  onClick={() =>
                    downloadFile(
                      "executive-insight-summary.json",
                      JSON.stringify({ generated_at: new Date().toISOString(), ...analytics }, null, 2),
                      "application/json;charset=utf-8;",
                    )
                  }
                  className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700"
                >
                  <i className="bi bi-download" aria-hidden="true" /> JSON
                </button>
              </article>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <ReportTable title="Top commodities by average price" eyebrow="Price report" valueLabel="Average price" items={analytics.priceByCommodity.slice(0, 8)} formatter={formatCurrency} />
            <ReportTable title="Top supply areas by listed quantity" eyebrow="Supply report" valueLabel="Listed quantity" items={analytics.listingQuantityByArea.slice(0, 8)} formatter={(value) => value.toLocaleString()} />
            <ReportTable title="Top commodities by ordered quantity" eyebrow="Demand report" valueLabel="Ordered quantity" items={analytics.orderQuantityByCommodity.slice(0, 8)} formatter={(value) => value.toLocaleString()} />
            <ReportTable title="Top commodities by order value" eyebrow="Revenue report" valueLabel="Order value" items={analytics.orderValueByCommodity.slice(0, 8)} formatter={formatCurrency} />
          </div>
        </>
      )}
    </InsightShell>
  );
}

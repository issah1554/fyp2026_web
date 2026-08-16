"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildInsightAnalytics,
  getInsightVisualizationAnalytics,
  loadInsightDataset,
  type InsightAnalytics,
  type InsightSeriesPoint,
} from "@/src/services/insights/insightsService";
import { InsightLoading, InsightMessage, InsightShell, InsightStatCard } from "../_components/InsightShell";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatCurrency(value: number) {
  return `TZS ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function formatCompact(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-dashed border-main-300 bg-main-50 px-4 py-8 text-center text-sm font-semibold text-main-500">
      {label}
    </div>
  );
}

function ChartPanel({
  title,
  eyebrow,
  items,
  formatter,
  color = "#16a34a",
}: {
  title: string;
  eyebrow: string;
  items: InsightSeriesPoint[];
  formatter: (value: number) => string;
  color?: string;
}) {
  const data = items.map((item) => ({
    name: item.key,
    value: item.value,
  }));

  return (
    <section className="rounded-md border border-main-200 bg-main-100 p-5 shadow-sm">
      <div className="border-b border-main-200 pb-4">
        <p className="text-sm font-bold uppercase text-primary-700">{eyebrow}</p>
        <h2 className="text-xl font-bold text-main-950">{title}</h2>
      </div>
      <div className="mt-5 h-72">
        {items.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--main-200)" />
              <XAxis type="number" tickFormatter={(value) => formatter(Number(value))} tick={{ fill: "var(--main-500)", fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={96} tick={{ fill: "var(--main-700)", fontSize: 12 }} />
              <Tooltip
                formatter={(value) => formatter(Number(value))}
                contentStyle={{
                  background: "var(--main-50)",
                  border: "1px solid var(--main-200)",
                  borderRadius: 6,
                  color: "var(--main-950)",
                }}
              />
              <Bar dataKey="value" fill={color} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState label="No records available for this visualization." />
        )}
      </div>
    </section>
  );
}

export default function VisualizationPage() {
  const [analytics, setAnalytics] = useState<InsightAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    void getInsightVisualizationAnalytics()
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
          backendError instanceof Error ? backendError.message : "Backend visualization analytics unavailable.",
          ...dataset.warnings,
        ]);
      })
      .catch((nextError) => {
        if (active) {
          setError(nextError instanceof Error ? nextError.message : "Could not load insight visualizations.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const trend = useMemo(() => analytics?.dailyAveragePrices.slice(-10) ?? [], [analytics]);
  const trendData = useMemo(
    () =>
      trend.map((item) => ({
        date: item.key,
        average: item.value,
      })),
    [trend],
  );

  return (
    <InsightShell
      eyebrow="Visualization analysis"
      title="Market Intelligence Visualizations"
      description="Analyze price movement, commodity performance, market strength, supply concentration, and demand signals from live platform records."
    >
      {error ? <InsightMessage message={error} /> : null}
      {warnings.map((warning) => (
        <InsightMessage key={warning} message={warning} />
      ))}

      {loading || !analytics ? (
        <InsightLoading label="Loading analysis visualizations..." />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InsightStatCard label="Price records" value={analytics.totals.priceRows.toLocaleString()} detail="Normalized market price entries included in the analysis." icon="bi-database" />
            <InsightStatCard label="Tracked markets" value={analytics.totals.marketsTracked.toString()} detail="Markets represented in the current market price dataset." icon="bi-shop-window" />
            <InsightStatCard label="Average price" value={formatCurrency(analytics.totals.averagePrice)} detail={`Range: ${formatCurrency(analytics.totals.minPrice)} to ${formatCurrency(analytics.totals.maxPrice)}.`} icon="bi-cash-stack" />
            <InsightStatCard label="Latest price date" value={analytics.totals.latestPriceDate} detail="Most recent reporting date available for analysis." icon="bi-calendar-event" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-md border border-main-200 bg-main-950 p-5 text-main-0 shadow-sm">
              <div className="flex flex-col gap-3 border-b border-main-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-main-300">Trend analysis</p>
                  <h2 className="mt-1 text-xl font-bold text-main-0">Average price movement</h2>
                </div>
                <span className="w-fit rounded-full bg-success-100 px-3 py-1 text-xs font-bold text-success-700">Live DB</span>
              </div>
              <div className="mt-5">
                {trend.length ? (
                  <>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData} margin={{ top: 10, right: 18, bottom: 4, left: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--main-800)" />
                          <XAxis dataKey="date" tick={{ fill: "var(--main-400)", fontSize: 12 }} />
                          <YAxis tickFormatter={(value) => formatCompact(Number(value))} tick={{ fill: "var(--main-400)", fontSize: 12 }} width={70} />
                          <Tooltip
                            formatter={(value) => formatCurrency(Number(value))}
                            contentStyle={{
                              background: "var(--main-900)",
                              border: "1px solid var(--main-700)",
                              borderRadius: 6,
                              color: "var(--main-0)",
                            }}
                          />
                          <Line type="monotone" dataKey="average" stroke="#22d3ee" strokeWidth={3} dot={{ r: 4, fill: "#86efac" }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
                      {trend.slice(-5).map((item) => (
                        <div key={item.key} className="rounded-md bg-main-900 p-3">
                          <p className="text-main-400">{item.key}</p>
                          <p className="mt-1 font-bold text-main-0">{formatCurrency(item.value)}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyState label="No dated price records available for trend analysis." />
                )}
              </div>
            </section>

            <ChartPanel
              eyebrow="Commodity analysis"
              title="Highest average prices"
              items={analytics.priceByCommodity.slice(0, 6)}
              formatter={formatCurrency}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <ChartPanel eyebrow="Market analysis" title="Strongest markets" items={analytics.priceByMarket.slice(0, 5)} formatter={formatCurrency} color="#0891b2" />
            <ChartPanel eyebrow="Supply analysis" title="Listed quantity by commodity" items={analytics.listingQuantityByCommodity.slice(0, 5)} formatter={formatCompact} color="#ea580c" />
            <ChartPanel eyebrow="Demand analysis" title="Order value by commodity" items={analytics.orderValueByCommodity.slice(0, 5)} formatter={formatCurrency} color="#16a34a" />
          </div>
        </>
      )}
    </InsightShell>
  );
}

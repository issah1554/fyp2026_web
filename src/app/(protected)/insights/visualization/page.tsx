"use client";

import { useEffect, useMemo, useState } from "react";
import {
  asNumber,
  commodityNameFromPrice,
  getInsightPrices,
  marketNameFromPrice,
} from "@/src/services/insights/insightsService";
import { InsightLoading, InsightMessage, InsightShell, InsightStatCard } from "../_components/InsightShell";
import type { MarketPrice } from "@/src/services/markets/marketService";

type CommoditySeries = {
  commodity: string;
  average: number;
};

function formatCurrency(value: number) {
  return `TZS ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function buildPolyline(values: number[]) {
  if (!values.length) return "";
  const max = Math.max(...values);
  const min = Math.min(...values);
  return values
    .map((value, index) => {
      const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
      const y = 90 - ((value - min) / ((max - min) || 1)) * 70;
      return `${x},${y}`;
    })
    .join(" ");
}

export default function VisualizationPage() {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void getInsightPrices()
      .then((data) => {
        if (active) setPrices(data);
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

  const summary = useMemo(() => {
    const priceValues = prices.map((item) => asNumber(item.price)).filter((value) => value > 0);
    const priceDates = Array.from(new Set(prices.map((item) => item.price_date))).sort().reverse();
    const latestDate = priceDates[0] ?? "No dated records";

    const byCommodity = new Map<string, { total: number; count: number }>();
    const byDate = new Map<string, { total: number; count: number }>();
    const byMarket = new Map<string, { total: number; count: number }>();

    for (const price of prices) {
      const commodity = commodityNameFromPrice(price);
      const market = marketNameFromPrice(price);
      const numeric = asNumber(price.price);

      if (numeric <= 0) continue;

      const commodityEntry = byCommodity.get(commodity) ?? { total: 0, count: 0 };
      commodityEntry.total += numeric;
      commodityEntry.count += 1;
      byCommodity.set(commodity, commodityEntry);

      const dateEntry = byDate.get(price.price_date) ?? { total: 0, count: 0 };
      dateEntry.total += numeric;
      dateEntry.count += 1;
      byDate.set(price.price_date, dateEntry);

      const marketEntry = byMarket.get(market) ?? { total: 0, count: 0 };
      marketEntry.total += numeric;
      marketEntry.count += 1;
      byMarket.set(market, marketEntry);
    }

    const commodityAverages: CommoditySeries[] = Array.from(byCommodity.entries())
      .map(([commodity, entry]) => ({
        commodity,
        average: entry.total / entry.count,
      }))
      .sort((left, right) => right.average - left.average)
      .slice(0, 6);

    const dailyTrend = Array.from(byDate.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(-7)
      .map(([date, entry]) => ({
        date,
        average: entry.total / entry.count,
      }));

    const marketLeaders = Array.from(byMarket.entries())
      .map(([market, entry]) => ({
        market,
        average: entry.total / entry.count,
      }))
      .sort((left, right) => right.average - left.average)
      .slice(0, 5);

    return {
      totalRecords: prices.length,
      commoditiesTracked: byCommodity.size,
      averagePrice: priceValues.length
        ? priceValues.reduce((sum, value) => sum + value, 0) / priceValues.length
        : 0,
      latestDate,
      commodityAverages,
      dailyTrend,
      marketLeaders,
    };
  }, [prices]);

  return (
    <InsightShell
      eyebrow="Visualization"
      title="Market Data Visualizations"
      description="Visualize live commodity price records from the database to understand market movement, commodity averages, and high-value trading locations."
    >
      {error ? <InsightMessage message={error} /> : null}

      {loading ? (
        <InsightLoading label="Loading price visualizations..." />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InsightStatCard label="Price records" value={summary.totalRecords.toLocaleString()} detail="Latest normalized market price entries loaded from the database." icon="bi-database" />
            <InsightStatCard label="Tracked commodities" value={summary.commoditiesTracked.toString()} detail="Unique commodities represented in the current visualization window." icon="bi-basket2" />
            <InsightStatCard label="Average market price" value={formatCurrency(summary.averagePrice)} detail="Overall average computed from live market price records." icon="bi-cash-stack" />
            <InsightStatCard label="Latest price date" value={summary.latestDate} detail="Most recent reporting date available in the market price dataset." icon="bi-calendar-event" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-md border border-main-200 bg-main-100 p-5 shadow-sm">
              <div className="border-b border-main-200 pb-4">
                <p className="text-sm font-bold uppercase text-primary-700">Commodity comparison</p>
                <h2 className="text-xl font-bold text-main-950">Average price by commodity</h2>
              </div>
              <div className="mt-5 space-y-4">
                {summary.commodityAverages.map((item) => {
                  const max = summary.commodityAverages[0]?.average || 1;
                  const width = `${Math.max((item.average / max) * 100, 8)}%`;
                  return (
                    <div key={item.commodity}>
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="font-bold text-main-900">{item.commodity}</span>
                        <span className="font-semibold text-main-600">{formatCurrency(item.average)}</span>
                      </div>
                      <div className="mt-2 h-3 rounded-full bg-main-200">
                        <div className="h-3 rounded-full bg-primary-600" style={{ width }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-md border border-main-200 bg-main-950 p-5 text-main-0 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-main-300">Trend line</p>
                  <h2 className="mt-1 text-xl font-bold text-main-0">7-day average price movement</h2>
                </div>
                <span className="rounded-full bg-success-100 px-3 py-1 text-xs font-bold text-success-700">Live DB</span>
              </div>
              <div className="mt-6">
                <svg viewBox="0 0 100 100" className="h-60 w-full" role="img" aria-label="Average daily market price trend">
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    points={buildPolyline(summary.dailyTrend.map((item) => item.average))}
                    className="text-accent-400"
                  />
                </svg>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  {summary.dailyTrend.map((item) => (
                    <div key={item.date} className="rounded-md bg-main-900 p-3">
                      <p className="text-main-400">{item.date}</p>
                      <p className="mt-1 font-bold text-main-0">{formatCurrency(item.average)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <section className="rounded-md border border-main-200 bg-main-100 p-5 shadow-sm">
            <div className="border-b border-main-200 pb-4">
              <p className="text-sm font-bold uppercase text-primary-700">Market leaders</p>
              <h2 className="text-xl font-bold text-main-950">Markets with the strongest average prices</h2>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-160 text-left text-sm">
                <thead>
                  <tr className="border-b border-main-200 text-xs font-bold uppercase text-main-500">
                    <th className="py-3 pr-4">Market</th>
                    <th className="py-3 pr-4">Average price</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.marketLeaders.map((item) => (
                    <tr key={item.market} className="border-b border-main-200">
                      <td className="py-4 pr-4 font-bold text-main-900">{item.market}</td>
                      <td className="py-4 pr-4 text-main-700">{formatCurrency(item.average)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </InsightShell>
  );
}

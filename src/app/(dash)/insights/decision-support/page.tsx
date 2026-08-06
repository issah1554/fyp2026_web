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

function formatCurrency(value: number) {
  return `TZS ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function aggregateAverageByKey<T>(items: T[], keySelector: (item: T) => string, valueSelector: (item: T) => number) {
  const map = new Map<string, { total: number; count: number }>();
  for (const item of items) {
    const key = keySelector(item);
    const value = valueSelector(item);
    if (value <= 0) continue;
    const current = map.get(key) ?? { total: 0, count: 0 };
    current.total += value;
    current.count += 1;
    map.set(key, current);
  }
  return Array.from(map.entries()).map(([key, entry]) => ({
    key,
    average: entry.total / entry.count,
  }));
}

function aggregateSumByKey<T>(items: T[], keySelector: (item: T) => string, valueSelector: (item: T) => number) {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = keySelector(item);
    const value = valueSelector(item);
    map.set(key, (map.get(key) ?? 0) + value);
  }
  return Array.from(map.entries()).map(([key, total]) => ({ key, total }));
}

export default function DecisionSupportPage() {
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
          setError(nextError instanceof Error ? nextError.message : "Could not load decision support data.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const insights = useMemo(() => {
    const priceByCommodity = aggregateAverageByKey(prices, commodityNameFromPrice, (item) => asNumber(item.price))
      .sort((left, right) => right.average - left.average);
    const priceByMarket = aggregateAverageByKey(prices, marketNameFromPrice, (item) => asNumber(item.price))
      .sort((left, right) => right.average - left.average);
    const listingByCommodity = aggregateSumByKey(listings, commodityNameFromListing, (item) => asNumber(item.quantity))
      .sort((left, right) => right.total - left.total);
    const orderByCommodity = aggregateSumByKey(orders, commodityNameFromOrder, (item) => asNumber(item.quantity))
      .sort((left, right) => right.total - left.total);
    const listingByArea = aggregateSumByKey(listings, areaNameFromListing, (item) => asNumber(item.quantity))
      .sort((left, right) => right.total - left.total);

    const topCommodity = priceByCommodity[0];
    const topMarket = priceByMarket[0];
    const topSupplyCommodity = listingByCommodity[0];
    const topDemandCommodity = orderByCommodity[0];
    const topSupplyArea = listingByArea[0];

    return {
      topCommodity,
      topMarket,
      topSupplyCommodity,
      topDemandCommodity,
      topSupplyArea,
      decisionCards: [
        {
          title: "Selling decision",
          summary: topCommodity
            ? `${topCommodity.key} currently has the strongest average price in the database.`
            : "No selling signal available yet.",
          recommendation: topCommodity
            ? `Promote ${topCommodity.key} in advisory messages and highlight premium markets where traders can capture around ${formatCurrency(topCommodity.average)}.`
            : "Capture more price records to surface commodity-level selling guidance.",
        },
        {
          title: "Market targeting decision",
          summary: topMarket
            ? `${topMarket.key} is the strongest market by average recorded price.`
            : "No market-level signal available yet.",
          recommendation: topMarket
            ? `Use ${topMarket.key} as a priority destination in decision-support briefings when high-value sale opportunities are needed.`
            : "Collect more market price entries to compare target markets reliably.",
        },
        {
          title: "Supply planning decision",
          summary: topSupplyCommodity
            ? `${topSupplyCommodity.key} has the highest listed supply volume in the current listing data.`
            : "No supply signal available yet.",
          recommendation: topSupplyCommodity
            ? `Align aggregation, storage, and transport planning around ${topSupplyCommodity.key}, especially in ${topSupplyArea?.key ?? "the leading supply area"}.`
            : "Load more listing activity to support supply-side planning.",
        },
        {
          title: "Demand response decision",
          summary: topDemandCommodity
            ? `${topDemandCommodity.key} leads current order activity by quantity.`
            : "No order signal available yet.",
          recommendation: topDemandCommodity
            ? `Prioritize buyer-facing updates, replenishment alerts, and procurement decisions for ${topDemandCommodity.key}.`
            : "Collect more order records to generate demand guidance.",
        },
      ],
    };
  }, [listings, orders, prices]);

  return (
    <InsightShell
      eyebrow="Decision support"
      title="Decision Support Workspace"
      description="Use live database records to surface practical guidance for selling, procurement, supply planning, and market targeting decisions."
    >
      {error ? <InsightMessage message={error} /> : null}

      {loading ? (
        <InsightLoading label="Loading decision support insights..." />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InsightStatCard
              label="Best priced commodity"
              value={insights.topCommodity?.key ?? "No data"}
              detail={insights.topCommodity ? `Average price: ${formatCurrency(insights.topCommodity.average)}` : "No commodity pricing signal available yet."}
              icon="bi-graph-up-arrow"
            />
            <InsightStatCard
              label="Best target market"
              value={insights.topMarket?.key ?? "No data"}
              detail={insights.topMarket ? `Average price: ${formatCurrency(insights.topMarket.average)}` : "No market targeting signal available yet."}
              icon="bi-shop-window"
            />
            <InsightStatCard
              label="Top supply commodity"
              value={insights.topSupplyCommodity?.key ?? "No data"}
              detail={insights.topSupplyCommodity ? `Listed quantity: ${insights.topSupplyCommodity.total.toLocaleString()}` : "No listing volume signal available yet."}
              icon="bi-box-seam"
            />
            <InsightStatCard
              label="Top demand commodity"
              value={insights.topDemandCommodity?.key ?? "No data"}
              detail={insights.topDemandCommodity ? `Ordered quantity: ${insights.topDemandCommodity.total.toLocaleString()}` : "No order activity signal available yet."}
              icon="bi-cart-check"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {insights.decisionCards.map((card) => (
              <section key={card.title} className="rounded-md border border-main-200 bg-main-100 p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-md bg-warning-100 text-warning-700">
                    <i className="bi bi-lightbulb" aria-hidden="true" />
                  </span>
                  <h2 className="text-lg font-bold text-main-950">{card.title}</h2>
                </div>
                <p className="mt-4 text-sm leading-6 text-main-700">{card.summary}</p>
                <div className="mt-4 rounded-md bg-accent-50 px-4 py-4 text-sm font-semibold leading-6 text-main-800">
                  Recommended action: {card.recommendation}
                </div>
              </section>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <section className="rounded-md border border-main-200 bg-main-100 p-5 shadow-sm">
              <div className="border-b border-main-200 pb-4">
                <p className="text-sm font-bold uppercase text-primary-700">Supply concentration</p>
                <h2 className="text-xl font-bold text-main-950">Areas with the highest listing volume</h2>
              </div>
              <div className="mt-4 space-y-4">
                {aggregateSumByKey(listings, areaNameFromListing, (item) => asNumber(item.quantity))
                  .sort((left, right) => right.total - left.total)
                  .slice(0, 5)
                  .map((item) => (
                    <div key={item.key}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-bold text-main-900">{item.key}</span>
                        <span className="font-semibold text-main-600">{item.total.toLocaleString()}</span>
                      </div>
                      <div className="mt-2 h-3 rounded-full bg-main-200">
                        <div
                          className="h-3 rounded-full bg-accent-600"
                          style={{
                            width: `${Math.max(
                              (item.total /
                                Math.max(
                                  ...aggregateSumByKey(listings, areaNameFromListing, (entry) => asNumber(entry.quantity)).map((entry) => entry.total),
                                  1,
                                )) *
                                100,
                              8,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            <section className="rounded-md border border-main-200 bg-main-100 p-5 shadow-sm">
              <div className="border-b border-main-200 pb-4">
                <p className="text-sm font-bold uppercase text-primary-700">Demand concentration</p>
                <h2 className="text-xl font-bold text-main-950">Commodities attracting the most orders</h2>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-160 text-left text-sm">
                  <thead>
                    <tr className="border-b border-main-200 text-xs font-bold uppercase text-main-500">
                      <th className="py-3 pr-4">Commodity</th>
                      <th className="py-3 pr-4">Ordered quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregateSumByKey(orders, commodityNameFromOrder, (item) => asNumber(item.quantity))
                      .sort((left, right) => right.total - left.total)
                      .slice(0, 5)
                      .map((item) => (
                        <tr key={item.key} className="border-b border-main-200">
                          <td className="py-4 pr-4 font-bold text-main-900">{item.key}</td>
                          <td className="py-4 pr-4 text-main-700">{item.total.toLocaleString()}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </>
      )}
    </InsightShell>
  );
}

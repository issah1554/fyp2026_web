"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/src/services/config";
import { getStoredAccessToken } from "@/src/services/auth/authService";

type Order = {
  order_id?: string;
  id?: string | number;
  listing?: { commodity?: { name?: string } };
  commodity_name?: string;
  buyer_name?: string;
  quantity?: string | number;
  total_price?: string | number;
  status?: string;
  created_at?: string;
};

type ApiResponse<T> = { data?: T; results?: T };

function normalizeList<T>(payload: ApiResponse<T[]> | T[]): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getStoredAccessToken();
    const headers = new Headers({ Accept: "application/json" });
    if (token) headers.set("Authorization", `Bearer ${token}`);

    void fetch(apiUrl("/orders"), { headers })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load commodity orders.");
        setOrders(normalizeList<Order>(await response.json()));
      })
      .catch((nextError) => setError(nextError instanceof Error ? nextError.message : "Could not load commodity orders."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-4">
      <section className="rounded-md border border-main-200 bg-main-0 p-5 shadow-sm">
        <p className="text-sm font-bold uppercase text-primary-700">API integrated</p>
        <h1 className="mt-2 text-2xl font-bold text-main-950 sm:text-3xl">Commodity Orders</h1>
        <p className="mt-2 text-sm text-main-600">Authenticated order data loaded from the Django REST API.</p>
      </section>
      <section className="overflow-x-auto rounded-md border border-main-200 bg-main-0 p-5 shadow-sm">
        {error && <div className="mb-4 rounded-md border border-danger-300 bg-danger-100 px-4 py-3 text-sm font-semibold text-danger-700">{error}</div>}
        {loading ? <div className="py-12 text-center text-main-600">Loading orders...</div> : (
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead><tr className="border-b border-main-200 text-xs font-bold uppercase text-main-500"><th className="py-3 pr-4">Order</th><th className="py-3 pr-4">Commodity</th><th className="py-3 pr-4">Buyer</th><th className="py-3 pr-4">Quantity</th><th className="py-3 pr-4">Total</th><th className="py-3 pr-4">Status</th></tr></thead>
            <tbody className="divide-y divide-main-200">
              {orders.map((order, index) => <tr key={String(order.order_id ?? order.id ?? index)}><td className="py-4 pr-4 font-bold text-main-900">{order.order_id ?? order.id ?? `Order ${index + 1}`}</td><td className="py-4 pr-4 text-main-700">{order.commodity_name ?? order.listing?.commodity?.name ?? "Commodity"}</td><td className="py-4 pr-4 text-main-700">{order.buyer_name ?? "-"}</td><td className="py-4 pr-4 text-main-700">{order.quantity ?? "-"}</td><td className="py-4 pr-4 font-semibold text-main-900">{order.total_price ?? "-"}</td><td className="py-4 pr-4"><span className="rounded-full bg-accent-100 px-3 py-1 text-xs font-bold text-accent-700">{order.status ?? "Pending"}</span></td></tr>)}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

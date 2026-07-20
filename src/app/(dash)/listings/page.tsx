"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/src/services/config";
import { getStoredAccessToken } from "@/src/services/auth/authService";

type Listing = {
  listing_id?: string;
  id?: string | number;
  commodity_name?: string;
  commodity?: { name?: string };
  area_name?: string;
  area?: { name?: string };
  quantity?: string | number;
  price?: string | number;
  status?: string;
  seller_name?: string;
};

type ApiResponse<T> = { data?: T; results?: T };

function normalizeList<T>(payload: ApiResponse<T[]> | T[]): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const headers = new Headers({ Accept: "application/json" });
    const token = getStoredAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    void fetch(apiUrl("/listings"), { headers })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load commodity listings.");
        setListings(normalizeList<Listing>(await response.json()));
      })
      .catch((nextError) => setError(nextError instanceof Error ? nextError.message : "Could not load commodity listings."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-4">
      <section className="rounded-md border border-main-200 bg-main-0 p-5 shadow-sm">
        <p className="text-sm font-bold uppercase text-primary-700">API integrated</p>
        <h1 className="mt-2 text-2xl font-bold text-main-950 sm:text-3xl">Commodity Listings</h1>
        <p className="mt-2 text-sm text-main-600">Live listings loaded from the Django REST API.</p>
      </section>
      <section className="overflow-x-auto rounded-md border border-main-200 bg-main-0 p-5 shadow-sm">
        {error && <div className="mb-4 rounded-md border border-danger-300 bg-danger-100 px-4 py-3 text-sm font-semibold text-danger-700">{error}</div>}
        {loading ? <div className="py-12 text-center text-main-600">Loading listings...</div> : (
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead><tr className="border-b border-main-200 text-xs font-bold uppercase text-main-500"><th className="py-3 pr-4">Commodity</th><th className="py-3 pr-4">Area</th><th className="py-3 pr-4">Quantity</th><th className="py-3 pr-4">Price</th><th className="py-3 pr-4">Seller</th><th className="py-3 pr-4">Status</th></tr></thead>
            <tbody className="divide-y divide-main-200">
              {listings.map((item, index) => <tr key={String(item.listing_id ?? item.id ?? index)}><td className="py-4 pr-4 font-bold text-main-900">{item.commodity_name ?? item.commodity?.name ?? "Commodity"}</td><td className="py-4 pr-4 text-main-700">{item.area_name ?? item.area?.name ?? "Area"}</td><td className="py-4 pr-4 text-main-700">{item.quantity ?? "-"}</td><td className="py-4 pr-4 font-semibold text-main-900">{item.price ?? "-"}</td><td className="py-4 pr-4 text-main-700">{item.seller_name ?? "-"}</td><td className="py-4 pr-4"><span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-700">{item.status ?? "Active"}</span></td></tr>)}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

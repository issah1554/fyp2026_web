"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  listListings,
  createOrder,
  type CommodityListing,
} from "../../../services/trade/tradeService";
import { listCommodities, type Commodity } from "../../../services/commodities/commodityService";
import { listAreas, type Area } from "../../../services/areas/areaService";

export default function MarketplacePage() {
  const { user } = useAuth();
  const isLoggedIn = Boolean(user);

  // State
  const [listings, setListings] = useState<CommodityListing[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedCommodity, setSelectedCommodity] = useState("");

  // Modals state
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderingListing, setOrderingListing] = useState<CommodityListing | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Load initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [listingsData, commoditiesData, areasData] = await Promise.all([
        listListings(),
        listCommodities(),
        listAreas(),
      ]);
      setListings(listingsData);
      setCommodities(commoditiesData.data || []);
      setAreas(areasData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load listings and catalog data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Filter listings: active only for marketplace
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      if (item.status !== "active") return false;

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        const matchesCommodity = item.commodity?.name?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesCommodity) {
          return false;
        }
      }

      // Filters
      if (selectedArea && item.adm_area?.area_id !== selectedArea) return false;
      if (selectedCommodity && item.commodity?.commodity_id !== selectedCommodity) return false;

      return true;
    });
  }, [listings, searchQuery, selectedArea, selectedCommodity]);

  // Open order modal
  const handleOpenOrderModal = (listing: CommodityListing) => {
    setOrderingListing(listing);
    setOrderQuantity(1);
    setOrderModalOpen(true);
  };

  // Submit Order placement
  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderingListing) return;
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const response = await createOrder({
        listing_id: orderingListing.listing_id,
        quantity: orderQuantity,
      });
      setNotice(response.message);
      setOrderModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      {/* Notifications */}
      {error && (
        <div className="rounded-xl border border-danger-300 bg-danger-100 px-4 py-3 text-sm font-semibold text-danger-700">
          <i className="bi bi-exclamation-triangle-fill mr-2" />
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-success-300 bg-success-100 px-4 py-3 text-sm font-semibold text-success-700">
          <i className="bi bi-check-circle-fill mr-2" />
          {notice}
        </div>
      )}

      {/* Search & Filter Controls */}
      <section className="flex flex-col gap-4 rounded-xl border border-main-200 bg-main-100 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-main-400" />
          <input
            type="text"
            placeholder="Search by title, description, or commodity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-main-300 bg-main-0 py-2 pl-10 pr-4 text-sm outline-none focus:border-primary-500 transition-colors"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCommodity}
            onChange={(e) => setSelectedCommodity(e.target.value)}
            className="rounded-lg border border-main-300 bg-main-0 px-3 py-2 text-sm outline-none focus:border-primary-500 transition-colors"
          >
            <option value="">All Commodities</option>
            {commodities.map((c) => (
              <option key={c.commodity_id} value={c.commodity_id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="rounded-lg border border-main-300 bg-main-0 px-3 py-2 text-sm outline-none focus:border-primary-500 transition-colors"
          >
            <option value="">All Areas</option>
            {areas.map((a) => (
              <option key={a.area_id} value={a.area_id}>
                {a.name} ({a.level})
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Grid of Listings */}
      {loading ? (
        <div className="py-24 text-center text-main-500">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 font-semibold">Loading listings...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-main-300 py-16 text-center text-main-500">
          <i className="bi bi-basket text-4xl text-main-300" />
          <p className="mt-4 text-base font-bold text-main-800">No commodity listings found</p>
          <p className="text-xs text-main-500">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredListings.map((item) => (
            <div
              key={item.listing_id}
              className="group flex flex-col justify-between overflow-hidden rounded-xl border border-main-200 bg-main-100 p-5 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-bold text-primary-700">
                    {item.commodity?.name || "Commodity"}
                  </span>
                  <span className="flex items-center text-xs text-main-500">
                    <i className="bi bi-geo-alt-fill mr-1 text-primary-600" />
                    {item.adm_area?.name}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-main-950 group-hover:text-primary-700 transition-colors">
                  {item.title || `${item.commodity?.name} for Sale`}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-main-600 leading-relaxed">
                  {item.description || "No description provided."}
                </p>
              </div>

              <div className="mt-6 border-t border-main-200 pt-4">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-xs font-semibold text-main-500 block uppercase">Price</span>
                    <span className="text-lg font-extrabold text-main-900">
                      TZS {parseFloat(item.price).toLocaleString()}
                      <span className="text-xs font-normal text-main-500"> / {item.commodity?.unit || "unit"}</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-main-500 block uppercase">Stock</span>
                    <span className="text-sm font-bold text-main-800">
                      {parseFloat(item.quantity).toLocaleString()} {item.commodity?.unit}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  {isLoggedIn ? (
                    item.seller_id === user?.id ? (
                      <button
                        disabled
                        className="w-full rounded-lg bg-main-300 py-2.5 text-center text-xs font-bold text-main-600 cursor-not-allowed"
                      >
                        Your Listing
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenOrderModal(item)}
                        className="w-full rounded-lg bg-primary-600 py-2.5 text-center text-xs font-bold text-main-0 hover:bg-primary-700 transition-all cursor-pointer"
                      >
                        Order Now
                      </button>
                    )
                  ) : (
                    <a
                      href="/auth/login"
                      className="block w-full rounded-lg border border-primary-600 py-2 text-center text-xs font-bold text-primary-700 hover:bg-primary-50 transition-all"
                    >
                      Login to Order
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Placement Modal */}
      {orderModalOpen && orderingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-main-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-main-200 bg-main-100 p-6 shadow-xl animate-zoom-in">
            <h2 className="text-xl font-bold text-main-950">Place Purchase Order</h2>
            <div className="mt-3 rounded-lg bg-main-200/50 p-3 text-xs text-main-700">
              <p><strong>Item:</strong> {orderingListing.title}</p>
              <p><strong>Seller Unit Price:</strong> TZS {parseFloat(orderingListing.price).toLocaleString()}</p>
              <p><strong>Available Stock:</strong> {parseFloat(orderingListing.quantity).toLocaleString()} {orderingListing.commodity?.unit}</p>
            </div>

            <form onSubmit={(e) => void handleOrderSubmit(e)} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-main-500">Order Quantity</label>
                <input
                  type="number"
                  step="any"
                  required
                  min="0.01"
                  max={parseFloat(orderingListing.quantity)}
                  value={orderQuantity || ""}
                  onChange={(e) => setOrderQuantity(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-main-300 bg-main-0 px-3 py-2 text-sm outline-none focus:border-primary-500"
                />
              </div>

              <div className="border-t border-main-200 pt-4 flex items-center justify-between text-sm">
                <span className="font-bold text-main-600">Total Price:</span>
                <span className="text-lg font-extrabold text-primary-700">
                  TZS {(orderQuantity * parseFloat(orderingListing.price)).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-end gap-2 border-t border-main-200 pt-4">
                <button
                  type="button"
                  onClick={() => setOrderModalOpen(false)}
                  className="rounded-lg border border-main-300 bg-main-0 px-4 py-2 text-sm font-bold text-main-700 hover:bg-main-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || orderQuantity <= 0 || orderQuantity > parseFloat(orderingListing.quantity)}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700 disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? "Submitting..." : "Confirm Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

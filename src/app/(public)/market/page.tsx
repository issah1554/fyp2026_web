"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  listListings,
  createOrder,
  type CommodityListing,
} from "../../../services/trade/tradeService";
import { listCommodities, type Commodity } from "../../../services/commodities/commodityService";
import { listAreas, type Area } from "../../../services/areas/areaService";

type PriceRangeOption = "any" | "under-50k" | "50k-150k" | "over-150k";
type SortOption = "recommended" | "price-asc" | "price-desc" | "newest";

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
  const [priceRange, setPriceRange] = useState<PriceRangeOption>("any");
  const [sortBy, setSortBy] = useState<SortOption>("recommended");

  // Favorites state (client-side only for visual interaction)
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

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
    const timeout = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadData]);

  // Compute active locations that intersect with active listings
  const activeListingAreas = useMemo(() => {
    const areaMap = new Map<string, { area_id: string; name: string; count: number }>();
    listings.forEach((item) => {
      if (item.status === "active" && item.adm_area) {
        const areaId = item.adm_area.area_id;
        const existing = areaMap.get(areaId);
        if (existing) {
          existing.count += 1;
        } else {
          areaMap.set(areaId, {
            area_id: areaId,
            name: item.adm_area.name,
            count: 1,
          });
        }
      }
    });
    return Array.from(areaMap.values());
  }, [listings]);

  // Filter listings: active only for marketplace
  const filteredListings = useMemo(() => {
    let list = listings.filter((item) => {
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

      // Location Filter
      if (selectedArea && item.adm_area?.area_id !== selectedArea) return false;

      // Commodity Filter
      if (selectedCommodity && item.commodity?.commodity_id !== selectedCommodity) return false;

      // Price Range Filter
      const price = parseFloat(item.price);
      if (priceRange === "under-50k" && price >= 50000) return false;
      if (priceRange === "50k-150k" && (price < 50000 || price > 150000)) return false;
      if (priceRange === "over-150k" && price <= 150000) return false;

      return true;
    });

    // Sorting
    if (sortBy === "price-asc") {
      list.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    } else if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return list;
  }, [listings, searchQuery, selectedArea, selectedCommodity, priceRange, sortBy]);

  // Handle Favorite toggle
  const toggleFavorite = (listingId: string) => {
    setFavorites((prev) => ({ ...prev, [listingId]: !prev[listingId] }));
  };

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

  const selectedAreaName = selectedArea
    ? activeListingAreas.find((a) => a.area_id === selectedArea)?.name
    : "Tanzania";

  const selectedCommodityName = selectedCommodity
    ? commodities.find((c) => c.commodity_id === selectedCommodity)?.name
    : "Commodities";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="text-xs font-semibold text-main-500 flex items-center gap-2">
        <Link href="/" className="hover:text-primary-700">Home</Link>
        <i className="bi bi-chevron-right text-3xs" />
        <Link href="/market" className="hover:text-primary-700">Commodity For Sale</Link>
        <i className="bi bi-chevron-right text-3xs" />
        <span className="text-main-800">{selectedAreaName}</span>
      </nav>

      {/* Horizontal Filter Bar */}
      <section className="rounded-xl border border-main-200 bg-main-100 p-5 shadow-sm">
        <div className="grid gap-5 md:grid-cols-4 items-end">

          {/* Location Selector (Active Intersected Areas Only) */}
          <div className="relative">
            <label className="block text-xs font-bold text-main-500 mb-2 uppercase">Location</label>
            <div className="relative">
              <i className="bi bi-geo-alt absolute left-3 top-1/2 -translate-y-1/2 text-main-400" />
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full rounded-lg border border-main-300 bg-main-0 py-2 pl-9 pr-4 text-xs outline-none focus:border-primary-500 transition-colors"
              >
                <option value="">Any location</option>
                {activeListingAreas.map((a) => (
                  <option key={a.area_id} value={a.area_id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Commodity Type Selector */}
          <div>
            <label className="block text-xs font-bold text-main-500 mb-2 uppercase">Commodity Type</label>
            <div className="relative">
              <i className="bi bi-basket absolute left-3 top-1/2 -translate-y-1/2 text-main-400" />
              <select
                value={selectedCommodity}
                onChange={(e) => setSelectedCommodity(e.target.value)}
                className="w-full rounded-lg border border-main-300 bg-main-0 py-2 pl-9 pr-4 text-xs outline-none focus:border-primary-500 transition-colors"
              >
                <option value="">Any commodity</option>
                {commodities.map((c) => (
                  <option key={c.commodity_id} value={c.commodity_id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price Selector */}
          <div>
            <label className="block text-xs font-bold text-main-500 mb-2 uppercase">Price (TZS)</label>
            <div className="relative">
              <i className="bi bi-cash-stack absolute left-3 top-1/2 -translate-y-1/2 text-main-400" />
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value as PriceRangeOption)}
                className="w-full rounded-lg border border-main-300 bg-main-0 py-2 pl-9 pr-4 text-xs outline-none focus:border-primary-500 transition-colors"
              >
                <option value="any">Any price</option>
                <option value="under-50k">Under 50,000 TZS</option>
                <option value="50k-150k">50,000 - 150,000 TZS</option>
                <option value="over-150k">Over 150,000 TZS</option>
              </select>
            </div>
          </div>

          {/* Reset Filters / Text Search */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedArea("");
                setSelectedCommodity("");
                setPriceRange("any");
                setSearchQuery("");
                setSortBy("recommended");
              }}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-main-300 bg-main-0 py-2 text-xs font-bold text-main-700 hover:bg-main-50 transition-all cursor-pointer"
            >
              <i className="bi bi-funnel-fill" />
              Reset Filters
            </button>
          </div>
        </div>

        {/* Text Search Bar */}
        <div className="relative mt-4">
          <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-main-400" />
          <input
            type="text"
            placeholder="Search by keywords (e.g. Grade A maize, Kilosa)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-main-300 bg-main-0 py-2 pl-10 pr-4 text-xs outline-none focus:border-primary-500 transition-colors"
          />
        </div>
      </section>

      {/* Notifications */}
      {error && (
        <div className="rounded-xl border border-danger-300 bg-danger-100 px-4 py-3 text-sm font-semibold text-danger-700 shadow-sm">
          <i className="bi bi-exclamation-triangle-fill mr-2" />
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-success-300 bg-success-100 px-4 py-3 text-sm font-semibold text-success-700 shadow-sm">
          <i className="bi bi-check-circle-fill mr-2" />
          {notice}
        </div>
      )}

      {/* Main Listings Header */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between border-b border-main-200 pb-3">
          <div>
            <h2 className="text-xl font-extrabold text-main-950">
              {selectedCommodityName} For Sale in {selectedAreaName}
            </h2>
            <p className="text-xs text-main-500 mt-1 font-semibold">
              {filteredListings.length.toLocaleString()} results found
            </p>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 mt-3 sm:mt-0">
            <i className="bi bi-sort-down text-main-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded bg-transparent text-xs font-bold text-main-700 border-none outline-none focus:text-primary-700 transition-colors cursor-pointer"
            >
              <option value="recommended">Recommended</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest Listings</option>
            </select>
          </div>
        </div>

        {/* Quick Area Tags */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-main-600 mt-1">
          <span className="text-main-500 uppercase tracking-wider text-2xs">Quick Areas:</span>
          <button
            onClick={() => setSelectedArea("")}
            className={`px-3 py-1 rounded-full border transition-all cursor-pointer ${
              selectedArea === ""
                ? "bg-primary-50 border-primary-200 text-primary-700"
                : "border-main-300 hover:border-main-500 text-main-600"
            }`}
          >
            All (Tanzania)
          </button>
          {activeListingAreas.slice(0, 6).map((a) => (
            <button
              key={a.area_id}
              onClick={() => setSelectedArea(a.area_id)}
              className={`px-3 py-1 rounded-full border transition-all cursor-pointer ${
                selectedArea === a.area_id
                  ? "bg-primary-50 border-primary-200 text-primary-700 font-extrabold"
                  : "border-main-300 hover:border-main-500 text-main-600"
              }`}
            >
              {a.name} ({a.count})
            </button>
          ))}
        </div>
      </section>

      {/* Listings List (Grid Cards) */}
      {loading ? (
        <div className="py-24 text-center text-main-500">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent align-[-0.125em]" />
          <p className="mt-4 font-semibold">Loading marketplace...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-main-300 bg-main-0 py-16 text-center text-main-500">
          <i className="bi bi-basket text-4xl text-main-300" />
          <p className="mt-4 text-base font-bold text-main-800">No matching commodity listings found</p>
          <p className="text-xs text-main-500">Try adjusting your locations, commodity filters, or search keywords.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredListings.map((item) => (
            <div
              key={item.listing_id}
              className="group flex flex-col justify-between overflow-hidden rounded-xl border border-main-200 bg-main-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 relative"
            >
              {/* Favorite heart icon on top right */}
              <button
                type="button"
                onClick={() => toggleFavorite(item.listing_id)}
                className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-main-250 bg-main-100/50 backdrop-blur-sm transition-colors text-base cursor-pointer z-10"
                aria-label="Add to favorites"
              >
                <i className={`bi ${favorites[item.listing_id] ? "bi-heart-fill text-danger-600" : "bi-heart text-main-400"}`} />
              </button>

              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-bold text-primary-700">
                    {item.commodity?.name || "Commodity"}
                  </span>
                  <span className="flex items-center text-xs text-main-500 mr-8">
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

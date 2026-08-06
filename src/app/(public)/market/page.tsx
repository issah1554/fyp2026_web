"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  listListings,
  createOrder,
  type CommodityListing,
} from "../../../services/trade/tradeService";
import { listCommodities, type Commodity } from "../../../services/commodities/commodityService";
import { listAreas, type Area, type AreaLevel } from "../../../services/areas/areaService";

type PriceRangeOption = "any" | "under-50k" | "50k-150k" | "over-150k";
type SortOption = "recommended" | "price-asc" | "price-desc" | "newest";
type ActiveArea = { area_id: string; name: string; level: AreaLevel | null; count: number };

export default function MarketplacePage() {
  const { user } = useAuth();
  const isLoggedIn = Boolean(user);

  // State
  const [listings, setListings] = useState<CommodityListing[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [areaMap, setAreaMap] = useState<Map<string, Area>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [selectedCommodity, setSelectedCommodity] = useState("");
  const [priceRange, setPriceRange] = useState<PriceRangeOption>("any");
  const [sortBy, setSortBy] = useState<SortOption>("recommended");

  // Favorites state (client-side only for visual interaction)
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  // Location search state
  const [locationResults, setLocationResults] = useState<Area[]>([]);
  const [locationSearching, setLocationSearching] = useState(false);
  const locationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modals state
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderingListing, setOrderingListing] = useState<CommodityListing | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Load initial data (no bulk area preload — areas are searched server-side on demand)
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [listingsData, commoditiesData] = await Promise.all([
        listListings(),
        listCommodities(),
      ]);
      setListings(listingsData);
      setCommodities(commoditiesData.data || []);
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
  const activeListingAreas = useMemo<ActiveArea[]>(() => {
    const result = new Map<string, ActiveArea>();
    listings.forEach((item) => {
      if (item.status === "active" && item.adm_area) {
        const areaId = item.adm_area.area_id;
        const existing = result.get(areaId);
        if (existing) {
          existing.count += 1;
        } else {
          const fullArea = areaMap.get(areaId);
          result.set(areaId, {
            area_id: areaId,
            name: item.adm_area.name,
            level: fullArea?.level ?? null,
            count: 1,
          });
        }
      }
    });
    return Array.from(result.values());
  }, [listings, areaMap]);

  // Walk parent chain to build breadcrumb ancestor names (Region > District > Ward)
  const breadcrumbSegments = useMemo(() => {
    if (!selectedArea) return [];
    const segments: string[] = [];
    let current = areaMap.get(selectedArea);
    // Each Area has parent: { area_id, name, level } inline — use that name directly
    // then look up the full parent Area to continue walking further up
    while (current?.parent) {
      segments.unshift(current.parent.name);
      // Walk up: look up parent's full Area to read ITS parent
      current = areaMap.get(current.parent.area_id);
    }
    return segments;
  }, [selectedArea, areaMap]);

  // Level label (Region / District / Ward)
  const levelLabel = (level: AreaLevel | null): string => {
    if (!level) return "";
    const map: Record<AreaLevel, string> = {
      region: "Region",
      district: "District",
      ward: "Ward",
    };
    return map[level];
  };

  // Filter listings: active only for marketplace
  const filteredListings = useMemo(() => {
    const list = listings.filter((item) => {
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
    ? (areaMap.get(selectedArea)?.name ?? activeListingAreas.find((a) => a.area_id === selectedArea)?.name ?? "Tanzania")
    : "Tanzania";


  // Build listing count lookup: area_id → count
  const listingCountByArea = useMemo(() => {
    const counts = new Map<string, number>();
    activeListingAreas.forEach((a) => counts.set(a.area_id, a.count));
    return counts;
  }, [activeListingAreas]);

  // Server-side debounced location search
  useEffect(() => {
    if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);
    if (!locationDropdownOpen) return;
    locationDebounceRef.current = setTimeout(() => {
      setLocationSearching(true);
      void listAreas({ search: locationSearch.trim() || undefined, page_size: 20 })
        .then((res) => {
          const results = res.data || [];
          setLocationResults(results);
          // Populate areaMap with results for breadcrumb parent traversal
          setAreaMap((prev) => {
            const next = new Map(prev);
            results.forEach((a) => next.set(a.area_id, a));
            return next;
          });
        })
        .catch(() => setLocationResults([]))
        .finally(() => setLocationSearching(false));
    }, 300);
    return () => {
      if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);
    };
  }, [locationSearch, locationDropdownOpen]);

  // When an area is selected, ensure its ancestor chain is in the areaMap for breadcrumbs
  useEffect(() => {
    if (!selectedArea || areaMap.has(selectedArea)) return;
    void listAreas({ search: undefined, page_size: 5000 })
      .then((res) => {
        setAreaMap((prev) => {
          const next = new Map(prev);
          (res.data || []).forEach((a) => next.set(a.area_id, a));
          return next;
        });
      })
      .catch(() => undefined);
  }, [selectedArea, areaMap]);

  const handleAreaSelect = (area: Area) => {
    setSelectedArea(area.area_id);
    setLocationSearch(area.name);
    setLocationDropdownOpen(false);
  };

  const handleAreaClear = () => {
    setSelectedArea("");
    setLocationSearch("");
    setLocationDropdownOpen(false);
  };

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Grouped Header & Flat Filter Banner */}
      <section className="w-full bg-main-200 border-b border-main-300 py-8 px-0 shadow-none">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col gap-6" onClick={() => setLocationDropdownOpen(false)}>
          {/* Breadcrumb — shows full ancestor chain when a location is selected */}
          <nav className="text-xs font-semibold text-main-600 flex items-center flex-wrap gap-2">
            <Link href="/" className="hover:text-primary-700 transition-colors">Home</Link>
            <i className="bi bi-chevron-right text-3xs text-main-400" />
            <Link href="/market" className="hover:text-primary-700 transition-colors">Commodity For Sale</Link>
            {breadcrumbSegments.map((seg) => (
              <span key={seg} className="flex items-center gap-2">
                <i className="bi bi-chevron-right text-3xs text-main-400" />
                <span className="text-main-500">{seg}</span>
              </span>
            ))}
            <i className="bi bi-chevron-right text-3xs text-main-400" />
            <span className="text-main-800">{selectedAreaName}</span>
          </nav>

          {/* Filters Grid */}
          <div className="grid gap-5 md:grid-cols-4 items-end">
            {/* Searchable Location Selector */}
            <div className="relative">
              <label className="block text-xs font-bold text-main-600 mb-2 uppercase tracking-wide">Location</label>
              <div className="relative">
                <i className="bi bi-geo-alt absolute left-3 top-1/2 -translate-y-1/2 text-main-400 z-10" />
                <input
                  type="text"
                  placeholder="Search location..."
                  value={locationSearch}
                  onFocus={() => setLocationDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setLocationDropdownOpen(false), 150)}
                  onChange={(e) => {
                    setLocationSearch(e.target.value);
                    setSelectedArea("");
                    setLocationDropdownOpen(true);
                  }}
                  className="w-full rounded-lg border border-main-400 bg-main-0 py-2 pl-9 pr-8 text-xs text-main-900 outline-none focus:border-primary-500 transition-colors"
                />
                {locationSearch && (
                  <button
                    type="button"
                    onClick={handleAreaClear}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-main-400 hover:text-main-700 text-sm cursor-pointer"
                  >
                    <i className="bi bi-x" />
                  </button>
                )}
                {locationDropdownOpen && (
                  <ul className="absolute z-50 top-full left-0 mt-1 w-full rounded-lg border border-main-300 bg-main-0 shadow-lg max-h-56 overflow-y-auto">
                    {locationSearching ? (
                      <li className="px-3 py-3 text-xs text-main-500 flex items-center gap-2">
                        <i className="bi bi-arrow-repeat animate-spin" /> Searching...
                      </li>
                    ) : locationResults.length === 0 ? (
                      <li className="px-3 py-3 text-xs text-main-400">No locations found</li>
                    ) : (
                      locationResults.map((a) => (
                        <li key={a.area_id}>
                          <button
                            type="button"
                            onMouseDown={() => handleAreaSelect(a)}
                            className="w-full flex items-center justify-between px-3 py-2 text-xs text-main-800 hover:bg-main-100 cursor-pointer text-left"
                          >
                            <span>{a.name}</span>
                            <span className="ml-2 text-main-400 text-2xs shrink-0">
                              {levelLabel(a.level)}
                              {(listingCountByArea.get(a.area_id) ?? 0) > 0 && (
                                <> · {listingCountByArea.get(a.area_id)}</>
                              )}
                            </span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
            </div>

            {/* Commodity Type Selector */}
            <div>
              <label className="block text-xs font-bold text-main-600 mb-2 uppercase tracking-wide">Commodity Type</label>
              <div className="relative">
                <i className="bi bi-basket absolute left-3 top-1/2 -translate-y-1/2 text-main-400" />
                <select
                  value={selectedCommodity}
                  onChange={(e) => setSelectedCommodity(e.target.value)}
                  className="w-full rounded-lg border border-main-400 bg-main-0 py-2 pl-9 pr-4 text-xs text-main-900 outline-none focus:border-primary-500 transition-colors cursor-pointer"
                >
                  <option value="" className="bg-main-0 text-main-900">Any commodity</option>
                  {commodities.map((c) => (
                    <option key={c.commodity_id} value={c.commodity_id} className="bg-main-0 text-main-900">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price Selector */}
            <div>
              <label className="block text-xs font-bold text-main-600 mb-2 uppercase tracking-wide">Price (TZS)</label>
              <div className="relative">
                <i className="bi bi-cash-stack absolute left-3 top-1/2 -translate-y-1/2 text-main-400" />
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value as PriceRangeOption)}
                  className="w-full rounded-lg border border-main-400 bg-main-0 py-2 pl-9 pr-4 text-xs text-main-900 outline-none focus:border-primary-500 transition-colors cursor-pointer"
                >
                  <option value="any" className="bg-main-0 text-main-900">Any price</option>
                  <option value="under-50k" className="bg-main-0 text-main-900">Under 50,000 TZS</option>
                  <option value="50k-150k" className="bg-main-0 text-main-900">50,000 - 150,000 TZS</option>
                  <option value="over-150k" className="bg-main-0 text-main-900">Over 150,000 TZS</option>
                </select>
              </div>
            </div>

            {/* Reset Filters / Action */}
            <div>
              <button
                type="button"
                onClick={() => {
                  setSelectedArea("");
                  setSelectedCommodity("");
                  setPriceRange("any");
                  setSearchQuery("");
                  setSortBy("recommended");
                  setLocationSearch("");
                }}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-main-400 bg-main-0 py-2 text-xs font-bold text-main-700 hover:bg-main-100 hover:text-main-900 transition-all cursor-pointer shadow-sm"
              >
                <i className="bi bi-funnel-fill" />
                Reset Filters
              </button>
            </div>
          </div>

          {/* Results count — below the filters */}
          <p className="text-sm font-semibold text-main-600">
            {filteredListings.length.toLocaleString()} results found
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-8 flex flex-col gap-6">
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

        {/* Quick Area Tags */}
        <section className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-main-600 mt-1 pb-4 border-b border-main-200">
          <span className="text-main-500 uppercase tracking-wider text-2xs">Quick Areas:</span>
          <button
            onClick={() => setSelectedArea("")}
            className={`px-3 py-1 rounded-full border transition-all cursor-pointer ${
              selectedArea === ""
                ? "bg-primary-50 border-primary-200 text-primary-700 animate-fade-in"
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
      </div>

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

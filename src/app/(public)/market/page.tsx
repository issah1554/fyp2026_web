"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/src/app/(public)/auth/hooks/useAuth";
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

export type CartItem = {
  listing: CommodityListing;
  quantity: number;
};

export default function MarketplacePage() {
  const { user } = useAuth();
  const isLoggedIn = Boolean(user);

  // State
  const [listings, setListings] = useState<CommodityListing[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedAreaObj, setSelectedAreaObj] = useState<Area | null>(null);
  const [locationSearch, setLocationSearch] = useState("");
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [selectedCommodity, setSelectedCommodity] = useState("");
  const [priceRange, setPriceRange] = useState<PriceRangeOption>("any");
  const [sortBy, setSortBy] = useState<SortOption>("recommended");

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

  // Location search state
  const [locationResults, setLocationResults] = useState<Area[]>([]);
  const [locationSearching, setLocationSearching] = useState(false);
  const [locationPage, setLocationPage] = useState(1);
  const [locationHasMore, setLocationHasMore] = useState(false);
  const [locationLoadingMore, setLocationLoadingMore] = useState(false);
  const locationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationSentinelRef = useRef<HTMLDivElement | null>(null);
  const locationFetchedQueryRef = useRef<string | undefined>(undefined);

  // Modals state
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderingListing, setOrderingListing] = useState<CommodityListing | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem("marketia_cart");
        if (saved) {
          setCart(JSON.parse(saved));
        }
      } catch {
        // ignore
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("marketia_cart", JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // Load initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [listingsData, commoditiesData] = await Promise.all([
        listListings({
          area_id: selectedArea || undefined,
          commodity_id: selectedCommodity || undefined,
          status: "available",
        }),
        listCommodities(),
      ]);
      setListings(listingsData);
      setCommodities(commoditiesData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load listings and catalog data.");
    } finally {
      setLoading(false);
    }
  }, [selectedArea, selectedCommodity]);

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
      if (item.status === "available" && item.adm_area) {
        const areaId = item.adm_area.area_id;
        const existing = result.get(areaId);
        if (existing) {
          existing.count += 1;
        } else {
          result.set(areaId, {
            area_id: areaId,
            name: item.adm_area.name,
            level: null,
            count: 1,
          });
        }
      }
    });
    return Array.from(result.values());
  }, [listings]);

  // Build breadcrumb ancestor segments directly from the selected area's ancestors field
  const breadcrumbSegments = useMemo(() => {
    if (!selectedAreaObj?.ancestors) return [];
    const a = selectedAreaObj.ancestors;
    const segments: string[] = [];
    if (a.region) segments.push(a.region);
    if (a.district) segments.push(a.district);
    return segments;
  }, [selectedAreaObj]);

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

  // Backend handles listing location, commodity, and status filters.
  const filteredListings = useMemo(() => {
    const list = listings.filter((item) => {
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
  }, [listings, searchQuery, priceRange, sortBy]);

  // Cart operations
  const addToCart = (listing: CommodityListing, qty: number = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.listing.listing_id === listing.listing_id);
      const stock = parseFloat(listing.quantity);
      if (existingIndex >= 0) {
        const updated = [...prev];
        const newQty = Math.min(updated[existingIndex].quantity + qty, stock);
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
        return updated;
      }
      return [...prev, { listing, quantity: Math.min(qty, stock) }];
    });
    setNotice(`Added "${listing.title || listing.commodity?.name}" to your cart.`);
  };

  const removeFromCart = (listingId: string) => {
    setCart((prev) => prev.filter((item) => item.listing.listing_id !== listingId));
  };

  const updateCartQuantity = (listingId: string, quantity: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.listing.listing_id === listingId) {
          const stock = parseFloat(item.listing.quantity);
          const validQty = Math.max(0.01, Math.min(quantity, stock));
          return { ...item, quantity: validQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleCartCheckout = async () => {
    if (!isLoggedIn) {
      window.location.href = "/auth/login";
      return;
    }
    if (cart.length === 0) return;

    setCheckoutSubmitting(true);
    setError("");
    setNotice("");
    try {
      for (const item of cart) {
        await createOrder({
          listing_id: item.listing.listing_id,
          quantity: item.quantity,
        });
      }
      setNotice(`Successfully placed order(s) for ${cart.length} item(s)! Check your dashboard.`);
      setCart([]);
      setCartOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to checkout cart items.");
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const cartTotalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity * parseFloat(item.listing.price), 0);
  }, [cart]);

  const cartTotalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Open order modal for direct buy now
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

  const selectedAreaName = selectedAreaObj?.name ?? "Tanzania";

  // Build listing count lookup: area_id → count
  const listingCountByArea = useMemo(() => {
    const counts = new Map<string, number>();
    activeListingAreas.forEach((a) => counts.set(a.area_id, a.count));
    return counts;
  }, [activeListingAreas]);

  // Server-side debounced location search
  useEffect(() => {
    if (!locationDropdownOpen) return;
    if (locationFetchedQueryRef.current === locationSearch) return;

    if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);
    setLocationSearching(true);
    const delay = locationFetchedQueryRef.current === undefined ? 0 : 300;
    locationDebounceRef.current = setTimeout(() => {
      setLocationPage(1);
      void listAreas({ search: locationSearch.trim() || undefined, page_size: 20, page: 1 })
        .then((res) => {
          setLocationResults(res.data || []);
          setLocationHasMore(res.pagination.has_next);
          locationFetchedQueryRef.current = locationSearch;
        })
        .catch(() => setLocationResults([]))
        .finally(() => setLocationSearching(false));
    }, delay);
    return () => {
      if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);
    };
  }, [locationSearch, locationDropdownOpen]);

  // Load next page and append results
  const loadMoreLocations = useCallback(() => {
    if (locationLoadingMore || !locationHasMore) return;
    const nextPage = locationPage + 1;
    setLocationLoadingMore(true);
    void listAreas({ search: locationSearch.trim() || undefined, page_size: 20, page: nextPage })
      .then((res) => {
        const incoming = res.data || [];
        setLocationResults((prev) => {
          const existingIds = new Set(prev.map((a) => a.area_id));
          const unique = incoming.filter((a) => !existingIds.has(a.area_id));
          return [...prev, ...unique];
        });
        setLocationHasMore(res.pagination.has_next);
        setLocationPage(nextPage);
      })
      .catch(() => undefined)
      .finally(() => setLocationLoadingMore(false));
  }, [locationLoadingMore, locationHasMore, locationPage, locationSearch]);

  // IntersectionObserver on sentinel to trigger infinite scroll
  useEffect(() => {
    const sentinel = locationSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMoreLocations(); },
      { threshold: 1.0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMoreLocations]);

  const handleAreaSelect = (area: Area) => {
    setSelectedArea(area.area_id);
    setSelectedAreaObj(area);
    setLocationSearch(area.name);
    setLocationDropdownOpen(false);
  };

  const handleAreaClear = () => {
    setSelectedArea("");
    setSelectedAreaObj(null);
    setLocationSearch("");
    setLocationDropdownOpen(false);
    setLocationResults([]);
    locationFetchedQueryRef.current = undefined;
  };

  // Quick area pill click
  const handleQuickAreaSelect = (areaId: string, areaName: string) => {
    setSelectedArea(areaId);
    setLocationSearch(areaName);
    void listAreas({ search: areaName, page_size: 20 }).then((res) => {
      const match = res.data?.find((a) => a.area_id === areaId);
      if (match) setSelectedAreaObj(match);
    }).catch(() => undefined);
  };

  return (
    <div className="w-full flex flex-col gap-8 relative">
      {/* Grouped Header & Flat Filter Banner */}
      <section className="w-full bg-main-100/20 border-b border-main-300 py-8 px-0 shadow-none">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col gap-6" onClick={() => setLocationDropdownOpen(false)}>
          {/* Breadcrumb */}
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
            <i className="bi bi-chevron-right text-3xs text-main-400"/>
            <span className="text-main-800">{selectedAreaName}</span>
          </nav>

          {/* Filters Grid */}
          <div className="grid gap-5 md:grid-cols-4 items-end">
            {/* Searchable Location Selector */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
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
                    {locationHasMore && (
                      <li>
                        <div ref={locationSentinelRef} className="px-3 py-2 text-2xs text-main-400 flex items-center gap-1">
                          {locationLoadingMore && <><i className="bi bi-arrow-repeat animate-spin" /> Loading more...</>}
                        </div>
                      </li>
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

          {/* Results count */}
          <p className="text-sm font-semibold text-main-600">
            {filteredListings.length.toLocaleString()} results found
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto w-full max-w-7xl px-6 pb-24 lg:px-8 flex flex-col gap-6">
        {/* Notifications */}
        {error && (
          <div className="rounded-xl border border-danger-300 bg-danger-100 px-4 py-3 text-sm font-semibold text-danger-700 shadow-sm flex items-center justify-between">
            <div>
              <i className="bi bi-exclamation-triangle-fill mr-2" />
              {error}
            </div>
            <button type="button" onClick={() => setError("")} className="text-xs underline font-bold cursor-pointer">Dismiss</button>
          </div>
        )}
        {notice && (
          <div className="rounded-xl border border-success-300 bg-success-100 px-4 py-3 text-sm font-semibold text-success-700 shadow-sm flex items-center justify-between">
            <div>
              <i className="bi bi-check-circle-fill mr-2" />
              {notice}
            </div>
            <button type="button" onClick={() => setNotice("")} className="text-xs underline font-bold cursor-pointer">Dismiss</button>
          </div>
        )}

        {/* Quick Area Tags */}
        <section className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-main-600 mt-1 pb-4">
          <span className="text-main-500 uppercase tracking-wider text-2xs">Quick Areas:</span>
          <button
            onClick={handleAreaClear}
            className={`px-3 py-1 rounded-full border transition-all cursor-pointer ${
              selectedArea === ""
                ? "bg-primary-50 border-primary-200 text-primary-700 font-extrabold"
                : "border-main-300 hover:border-main-500 text-main-600"
            }`}
          >
            All (Tanzania)
          </button>
          {activeListingAreas.slice(0, 6).map((a) => (
            <button
              key={a.area_id}
              onClick={() => handleQuickAreaSelect(a.area_id, a.name)}
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
            {filteredListings.map((item) => {
              const isItemInCart = cart.some((c) => c.listing.listing_id === item.listing_id);

              return (
                <div
                  key={item.listing_id}
                  className="group flex flex-col justify-between overflow-hidden rounded-xl border border-main-200 bg-main-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 relative"
                >
                  {/* Cart quick-add icon button on top right (Replaces heart icon) */}
                  <button
                    type="button"
                    onClick={() => addToCart(item, 1)}
                    className={`absolute right-4 top-4 p-2 rounded-full transition-all text-sm cursor-pointer z-10 ${
                      isItemInCart
                        ? "bg-primary-600 text-main-0 shadow-md"
                        : "bg-main-0/80 hover:bg-main-0 text-main-700 hover:text-primary-700 shadow-sm border border-main-200 backdrop-blur-sm"
                    }`}
                    title={isItemInCart ? "Item in Cart" : "Add to Cart"}
                    aria-label="Add to cart"
                  >
                    <i className={`bi ${isItemInCart ? "bi-cart-check-fill" : "bi-cart-plus"}`} />
                  </button>

                  {item.images.length > 0 && (
                    <Link
                      href={`/market/${item.listing_id}`}
                      className="mb-4 block aspect-video w-full overflow-hidden rounded-lg border border-main-200 bg-main-200 text-left"
                    >
                      <img
                        src={item.images.find((image) => image.is_primary)?.image_url ?? item.images[0].image_url}
                        alt={item.title || item.commodity?.name || "Listing image"}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </Link>
                  )}

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
                    <p className="mt-2 line-clamp-2 text-sm text-main-600 leading-relaxed">
                      {item.description
                        ? item.description.length > 110
                          ? `${item.description.slice(0, 110).trim()}...`
                          : item.description
                        : "No description provided."}
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

                    <div className="mt-4 flex gap-2">
                      {isLoggedIn ? (
                        item.seller_id === user?.id ? (
                          <>
                            <Link
                              href={`/market/${item.listing_id}`}
                              className="flex-1 rounded-lg border border-main-300 bg-main-0 py-2.5 text-center text-xs font-bold text-main-800 hover:border-primary-500 hover:text-primary-700 transition-all cursor-pointer"
                            >
                              Details
                            </Link>
                            <button
                              disabled
                              className="flex-1 rounded-lg bg-main-300 py-2.5 text-center text-xs font-bold text-main-600 cursor-not-allowed"
                            >
                              Your Listing
                            </button>
                          </>
                        ) : (
                          <>
                            <Link
                              href={`/market/${item.listing_id}`}
                              className="flex-1 rounded-lg border border-main-300 bg-main-0 py-2.5 text-center text-xs font-bold text-main-800 hover:border-primary-500 hover:text-primary-700 transition-all cursor-pointer"
                            >
                              Details
                            </Link>
                            <button
                              onClick={() => addToCart(item, 1)}
                              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-xs font-bold transition-all cursor-pointer ${
                                isItemInCart
                                  ? "border-primary-600 bg-primary-50 text-primary-700 hover:bg-primary-100"
                                  : "border-main-300 bg-main-0 text-main-800 hover:border-primary-500 hover:text-primary-700"
                              }`}
                            >
                              <i className={`bi ${isItemInCart ? "bi-cart-check" : "bi-cart-plus"}`} />
                              {isItemInCart ? "In Cart" : "Add to Cart"}
                            </button>
                            <button
                              onClick={() => handleOpenOrderModal(item)}
                              className="flex-1 rounded-lg bg-primary-600 py-2.5 text-center text-xs font-bold text-main-0 hover:bg-primary-700 transition-all cursor-pointer shadow-sm"
                            >
                              Buy Now
                            </button>
                          </>
                        )
                      ) : (
                        <div className="flex w-full gap-2">
                          <Link
                            href={`/market/${item.listing_id}`}
                            className="flex-1 rounded-lg border border-main-300 bg-main-0 py-2.5 text-center text-xs font-bold text-main-800 hover:border-primary-500 hover:text-primary-700 transition-all cursor-pointer"
                          >
                            Details
                          </Link>
                          <button
                            onClick={() => addToCart(item, 1)}
                            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-xs font-bold transition-all cursor-pointer ${
                              isItemInCart
                                ? "border-primary-600 bg-primary-50 text-primary-700"
                                : "border-main-300 bg-main-0 text-main-800 hover:border-primary-500 hover:text-primary-700"
                            }`}
                          >
                            <i className={`bi ${isItemInCart ? "bi-cart-check" : "bi-cart-plus"}`} />
                            {isItemInCart ? "In Cart" : "Add to Cart"}
                          </button>
                          <a
                            href="/auth/login"
                            className="flex-1 rounded-lg border border-primary-600 py-2.5 text-center text-xs font-bold text-primary-700 hover:bg-primary-50 transition-all"
                          >
                            Login to Buy
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Cart Trigger Button */}
      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full bg-primary-600 px-5 py-3.5 text-main-0 shadow-xl hover:bg-primary-700 transition-all cursor-pointer border-2 border-main-0"
        aria-label="Open cart"
      >
        <div className="relative">
          <i className="bi bi-cart3 text-xl" />
          {cartTotalItems > 0 && (
            <span className="absolute -top-2.5 -right-2.5 flex size-5 items-center justify-center rounded-full bg-danger-600 text-3xs font-extrabold text-main-0 shadow">
              {cartTotalItems}
            </span>
          )}
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-2xs font-bold uppercase tracking-wider text-primary-200">Cart</span>
          <span className="text-xs font-extrabold">
            TZS {cartTotalAmount.toLocaleString()}
          </span>
        </div>
      </button>

      {/* Cart Slide-Over Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-main-950/40 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-md flex-col border-l border-main-300 bg-main-100 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-main-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <i className="bi bi-cart3 text-xl text-primary-600" />
                <h2 className="text-lg font-bold text-main-950">Your Cart</h2>
                <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-bold text-primary-700">
                  {cart.length} {cart.length === 1 ? "item" : "items"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="rounded-lg p-1.5 text-main-500 hover:bg-main-200 hover:text-main-800 transition-colors cursor-pointer"
              >
                <i className="bi bi-x-lg text-lg" />
              </button>
            </div>

            {/* Cart Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <i className="bi bi-cart-x text-5xl text-main-300" />
                  <p className="mt-4 text-base font-bold text-main-800">Your cart is empty</p>
                  <p className="mt-1 text-xs text-main-500 max-w-xs">
                    Browse available commodities and click &quot;Add to Cart&quot; to start building your purchase order.
                  </p>
                </div>
              ) : (
                cart.map(({ listing, quantity }) => {
                  const itemPrice = parseFloat(listing.price);
                  const stock = parseFloat(listing.quantity);
                  const subtotal = itemPrice * quantity;

                  return (
                    <div
                      key={listing.listing_id}
                      className="flex flex-col gap-3 rounded-xl border border-main-200 bg-main-0 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-2xs font-bold uppercase tracking-wider text-primary-600">
                            {listing.commodity?.name}
                          </span>
                          <h4 className="font-bold text-main-900 text-sm">
                            {listing.title || listing.commodity?.name}
                          </h4>
                          <p className="text-xs text-main-500 flex items-center gap-1 mt-0.5">
                            <i className="bi bi-geo-alt-fill text-primary-600" />
                            {listing.adm_area?.name}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(listing.listing_id)}
                          className="p-1 text-main-400 hover:text-danger-600 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <i className="bi bi-trash text-base" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between border-t border-main-100 pt-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(listing.listing_id, quantity - 1)}
                            disabled={quantity <= 1}
                            className="size-7 rounded-md border border-main-300 bg-main-50 flex items-center justify-center text-xs font-bold text-main-700 hover:bg-main-200 disabled:opacity-40 cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0.01"
                            max={stock}
                            step="any"
                            value={quantity}
                            onChange={(e) => updateCartQuantity(listing.listing_id, parseFloat(e.target.value) || 1)}
                            className="w-14 text-center rounded-md border border-main-300 py-1 text-xs font-bold text-main-900 outline-none focus:border-primary-500"
                          />
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(listing.listing_id, quantity + 1)}
                            disabled={quantity >= stock}
                            className="size-7 rounded-md border border-main-300 bg-main-50 flex items-center justify-center text-xs font-bold text-main-700 hover:bg-main-200 disabled:opacity-40 cursor-pointer"
                          >
                            +
                          </button>
                          <span className="text-2xs text-main-400 font-semibold ml-1">
                            / {stock} {listing.commodity?.unit}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-extrabold text-main-900 block">
                            TZS {subtotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="border-t border-main-200 bg-main-0 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-main-500 uppercase tracking-wider">Total Amount</span>
                  <span className="text-xl font-extrabold text-primary-700">
                    TZS {cartTotalAmount.toLocaleString()}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={clearCart}
                    className="flex-1 rounded-lg border border-main-300 bg-main-0 py-2.5 text-xs font-bold text-main-700 hover:bg-main-100 transition-all cursor-pointer"
                  >
                    Clear Cart
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCartCheckout()}
                    disabled={checkoutSubmitting}
                    className="flex-2 rounded-lg bg-primary-600 py-2.5 text-center text-xs font-bold text-main-0 hover:bg-primary-700 disabled:opacity-60 transition-all cursor-pointer shadow-sm"
                  >
                    {checkoutSubmitting ? "Processing..." : isLoggedIn ? `Checkout (${cart.length})` : "Login to Checkout"}
                  </button>
                </div>
              </div>
            )}
          </div>
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

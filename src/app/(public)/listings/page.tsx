"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { userCan } from "@/src/services/auth/authService";
import {
  listListings,
  createListing,
  updateListing,
  deleteListing,
  createOrder,
  type CommodityListing,
  type CommodityListingFormPayload,
} from "../../../services/trade/tradeService";
import { listCommodities, type Commodity } from "../../../services/commodities/commodityService";
import { listAreas, type Area } from "../../../services/areas/areaService";

export default function ListingsPage() {
  const { user } = useAuth();

  // Authentication flags
  const isLoggedIn = Boolean(user);
  const isAdmin = Boolean(user && (typeof user.role === "string" ? user.role === "admin" : user.role?.code === "admin"));
  const canCreate = isLoggedIn && userCan(user, "listings.create");
  const canUpdate = isLoggedIn && userCan(user, "listings.update");
  const canDelete = isLoggedIn && userCan(user, "listings.delete");

  // State
  const [listings, setListings] = useState<CommodityListing[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Tabs: "marketplace" (all active) or "my-listings" (seller's own)
  const [activeTab, setActiveTab] = useState<"marketplace" | "my-listings">("marketplace");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedCommodity, setSelectedCommodity] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Modals state
  const [listingModalOpen, setListingModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<CommodityListing | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderingListing, setOrderingListing] = useState<CommodityListing | null>(null);

  // Form states
  const [listingForm, setListingForm] = useState({
    title: "",
    description: "",
    commodity_id: "",
    adm_area_id: "",
    price: 0,
    quantity: 0,
    status: "active",
  });
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

  // Filter listings based on tab and filters
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      // Tab check
      if (activeTab === "my-listings") {
        if (!isLoggedIn || item.seller_id !== user?.id) {
          return false;
        }
      } else {
        // Marketplace only shows active listings unless admin
        if (item.status !== "active" && !isAdmin) {
          return false;
        }
      }

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
      if (selectedStatus && item.status !== selectedStatus) return false;

      return true;
    });
  }, [listings, activeTab, searchQuery, selectedArea, selectedCommodity, selectedStatus, isLoggedIn, user]);

  // Open modal to Create Listing
  const handleOpenCreateModal = () => {
    setEditingListing(null);
    setListingForm({
      title: "",
      description: "",
      commodity_id: commodities[0]?.commodity_id || "",
      adm_area_id: areas[0]?.area_id || "",
      price: 0,
      quantity: 0,
      status: "active",
    });
    setListingModalOpen(true);
  };

  // Open modal to Edit Listing
  const handleOpenEditModal = (listing: CommodityListing) => {
    setEditingListing(listing);
    setListingForm({
      title: listing.title,
      description: listing.description,
      commodity_id: listing.commodity?.commodity_id || "",
      adm_area_id: listing.adm_area?.area_id || "",
      price: parseFloat(listing.price),
      quantity: parseFloat(listing.quantity),
      status: listing.status,
    });
    setListingModalOpen(true);
  };

  // Submit Listing Form (Create or Edit)
  const handleListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      if (editingListing) {
        const response = await updateListing(editingListing.listing_id, listingForm);
        setNotice(response.message);
      } else {
        const response = await createListing(listingForm as CommodityListingFormPayload);
        setNotice(response.message);
      }
      setListingModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save listing.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete/Close listing
  const handleDeleteListing = async (listingId: string) => {
    if (!window.confirm("Are you sure you want to delete this commodity listing?")) return;
    setError("");
    setNotice("");
    try {
      const message = await deleteListing(listingId);
      setNotice(message);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete listing.");
    }
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

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-800 to-primary-600 px-6 py-12 text-main-0 shadow-lg md:px-12 md:py-16">
        <div className="relative z-10 max-w-2xl">
          <span className="rounded-full bg-primary-500/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-100">
            Smart Marketplace
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Commodity Marketplace
          </h1>
          <p className="mt-4 text-base text-primary-100 md:text-lg">
            Direct farmer-to-buyer trade ecosystem. Search active listings, compare pricing, and place standard orders securely.
          </p>
        </div>
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-80 w-80 rounded-full bg-primary-500/20 blur-2xl" />
      </section>

      {/* Navigation Tabs */}
      {isLoggedIn && (
        <div className="flex border-b border-main-200">
          <button
            onClick={() => {
              setActiveTab("marketplace");
              setSelectedStatus("");
            }}
            className={`pb-3 text-sm font-bold border-b-2 px-4 transition-all cursor-pointer ${
              activeTab === "marketplace"
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-main-500 hover:text-main-800"
            }`}
          >
            <i className="bi bi-shop mr-2" />
            Marketplace
          </button>
          <button
            onClick={() => {
              setActiveTab("my-listings");
              setSelectedStatus("");
            }}
            className={`pb-3 text-sm font-bold border-b-2 px-4 transition-all cursor-pointer ${
              activeTab === "my-listings"
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-main-500 hover:text-main-800"
            }`}
          >
            <i className="bi bi-journal-text mr-2" />
            My Listings ({listings.filter((l) => l.seller_id === user?.id).length})
          </button>
        </div>
      )}

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
          {activeTab === "my-listings" && (
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-main-300 bg-main-0 px-3 py-2 text-sm outline-none focus:border-primary-500 transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="sold">Sold</option>
              <option value="inactive">Inactive</option>
            </select>
          )}
          {activeTab === "my-listings" && canCreate && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700 transition-all cursor-pointer"
            >
              <i className="bi bi-plus-lg" />
              Create Listing
            </button>
          )}
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
      ) : activeTab === "marketplace" ? (
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
      ) : (
        /* My Listings Tab (Table/Management Layout) */
        <div className="overflow-x-auto rounded-xl border border-main-200 bg-main-100 shadow-sm">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead>
              <tr className="border-b border-main-200 text-xs font-bold uppercase text-main-500 bg-main-200/50">
                <th className="py-3 px-4">Title / Commodity</th>
                <th className="py-3 px-4">Area</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-main-200 bg-main-0">
              {filteredListings.map((item) => (
                <tr key={item.listing_id} className="hover:bg-main-50 transition-colors">
                  <td className="py-4 px-4">
                    <p className="font-bold text-main-900">{item.title}</p>
                    <span className="inline-block mt-1 rounded bg-primary-100 px-2 py-0.5 text-2xs font-semibold text-primary-700">
                      {item.commodity?.name}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-main-700">{item.adm_area?.name}</td>
                  <td className="py-4 px-4 text-main-700">
                    {parseFloat(item.quantity).toLocaleString()} {item.commodity?.unit}
                  </td>
                  <td className="py-4 px-4 font-semibold text-main-900">
                    TZS {parseFloat(item.price).toLocaleString()}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-2xs font-bold uppercase ${
                        item.status === "active"
                          ? "bg-success-100 text-success-700"
                          : item.status === "sold"
                          ? "bg-primary-100 text-primary-700"
                          : "bg-main-200 text-main-600"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-main-500 text-xs">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 text-right space-x-2">
                    {canUpdate && (
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="rounded border border-main-300 bg-main-100 px-2.5 py-1.5 text-xs font-bold text-main-700 hover:border-primary-300 hover:text-primary-700 transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => void handleDeleteListing(item.listing_id)}
                        className="rounded border border-danger-300 bg-danger-100 px-2.5 py-1.5 text-xs font-bold text-danger-700 hover:bg-danger-200 transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Listing Form Modal (Create/Edit) */}
      {listingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-main-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-main-200 bg-main-100 p-6 shadow-xl animate-zoom-in">
            <h2 className="text-xl font-bold text-main-950">
              {editingListing ? "Edit Commodity Listing" : "Create Commodity Listing"}
            </h2>
            <form onSubmit={(e) => void handleListingSubmit(e)} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-main-500">Listing Title</label>
                <input
                  type="text"
                  required
                  value={listingForm.title}
                  onChange={(e) => setListingForm({ ...listingForm, title: e.target.value })}
                  placeholder="e.g. Grade A Maize Stock"
                  className="mt-1 w-full rounded-lg border border-main-300 bg-main-0 px-3 py-2 text-sm outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-main-500">Commodity</label>
                <select
                  value={listingForm.commodity_id}
                  onChange={(e) => setListingForm({ ...listingForm, commodity_id: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-main-300 bg-main-0 px-3 py-2 text-sm outline-none focus:border-primary-500"
                >
                  {commodities.map((c) => (
                    <option key={c.commodity_id} value={c.commodity_id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-main-500">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0"
                    value={listingForm.quantity || ""}
                    onChange={(e) => setListingForm({ ...listingForm, quantity: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-lg border border-main-300 bg-main-0 px-3 py-2 text-sm outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-main-500">Price (TZS)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0"
                    value={listingForm.price || ""}
                    onChange={(e) => setListingForm({ ...listingForm, price: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-lg border border-main-300 bg-main-0 px-3 py-2 text-sm outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-main-500">Location Area</label>
                <select
                  value={listingForm.adm_area_id}
                  onChange={(e) => setListingForm({ ...listingForm, adm_area_id: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-main-300 bg-main-0 px-3 py-2 text-sm outline-none focus:border-primary-500"
                >
                  {areas.map((a) => (
                    <option key={a.area_id} value={a.area_id}>
                      {a.name} ({a.level})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-main-500">Description</label>
                <textarea
                  value={listingForm.description}
                  onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })}
                  placeholder="Provide grade details, shipping terms, packaging details..."
                  className="mt-1 h-24 w-full rounded-lg border border-main-300 bg-main-0 px-3 py-2 text-sm outline-none focus:border-primary-500"
                />
              </div>

              {editingListing && (
                <div>
                  <label className="text-xs font-bold uppercase text-main-500">Listing Status</label>
                  <select
                    value={listingForm.status}
                    onChange={(e) => setListingForm({ ...listingForm, status: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-main-300 bg-main-0 px-3 py-2 text-sm outline-none focus:border-primary-500"
                  >
                    <option value="active">Active</option>
                    <option value="sold">Sold</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-main-200 pt-4">
                <button
                  type="button"
                  onClick={() => setListingModalOpen(false)}
                  className="rounded-lg border border-main-300 bg-main-0 px-4 py-2 text-sm font-bold text-main-700 hover:bg-main-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700 disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? "Saving..." : "Save Listing"}
                </button>
              </div>
            </form>
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

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { userCan } from "@/src/services/auth/authService";
import {
  listListings,
  createListing,
  updateListing,
  deleteListing,
  type CommodityListing,
  type CommodityListingFormPayload,
} from "../../../services/trade/tradeService";
import { listCommodities, type Commodity } from "../../../services/commodities/commodityService";
import { listAreas, type Area } from "../../../services/areas/areaService";

type TabOption = "my-listings" | "system-listings";

export default function ProtectedListingsPage() {
  const { user } = useAuth();
  const isLoggedIn = Boolean(user);
  const isAdmin = Boolean(user && (typeof user.role === "string" ? user.role === "admin" : user.role?.code === "admin"));

  // Permission checks
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

  // Tabs: "my-listings" (own listings) or "system-listings" (all listings for admins)
  const [activeTab, setActiveTab] = useState<TabOption>("my-listings");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedCommodity, setSelectedCommodity] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Modals
  const [listingModalOpen, setListingModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<CommodityListing | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [listingForm, setListingForm] = useState({
    title: "",
    description: "",
    commodity_id: "",
    adm_area_id: "",
    price: 0,
    quantity: 0,
    status: "active",
  });

  // Load catalogs and listings
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
      setError(err instanceof Error ? err.message : "Failed to load listings data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Set default form values once catalogs are loaded
  useEffect(() => {
    if (commodities.length > 0 && areas.length > 0 && !listingForm.commodity_id) {
      setListingForm((prev) => ({
        ...prev,
        commodity_id: commodities[0].commodity_id,
        adm_area_id: areas[0].area_id,
      }));
    }
  }, [commodities, areas, listingForm.commodity_id]);

  // Filter listings based on active tab and search filters
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      // Tab separation
      if (activeTab === "my-listings") {
        if (item.seller_id !== user?.id) return false;
      } else {
        // system-listings (Admins only)
        if (!isAdmin) return false;
      }

      // Search filters
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        const matchesCommodity = item.commodity?.name?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesCommodity) {
          return false;
        }
      }

      if (selectedArea && item.adm_area?.area_id !== selectedArea) return false;
      if (selectedCommodity && item.commodity?.commodity_id !== selectedCommodity) return false;
      if (selectedStatus && item.status !== selectedStatus) return false;

      return true;
    });
  }, [listings, activeTab, searchQuery, selectedArea, selectedCommodity, selectedStatus, user, isAdmin]);

  // Modals triggers
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

  // Create or Update Listing API submit
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

  // Delete Listing
  const handleDeleteListing = async (listingId: string) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
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

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-main-950">Listings Workspace</h1>
        <p className="text-sm text-main-600">Create and manage your commodity offerings or review platform listings.</p>
      </div>

      {/* Tabs */}
      {isAdmin && (
        <div className="flex border-b border-main-200">
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
            My Listings ({listings.filter((l) => l.seller_id === user?.id).length})
          </button>
          <button
            onClick={() => {
              setActiveTab("system-listings");
              setSelectedStatus("");
            }}
            className={`pb-3 text-sm font-bold border-b-2 px-4 transition-all cursor-pointer ${
              activeTab === "system-listings"
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-main-500 hover:text-main-800"
            }`}
          >
            All System Listings ({listings.length})
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

      {/* Controls */}
      <section className="flex flex-col gap-4 rounded-xl border border-main-200 bg-main-100 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-main-400" />
          <input
            type="text"
            placeholder="Search listings..."
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

      {/* Grid or Table list */}
      {loading ? (
        <div className="py-24 text-center text-main-500">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent align-[-0.125em]" />
          <p className="mt-4 font-semibold">Loading listings...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-main-300 py-16 text-center text-main-500 bg-main-0">
          <i className="bi bi-tag text-4xl text-main-300" />
          <p className="mt-4 text-base font-bold text-main-800">No listings found in this space</p>
          <p className="text-xs text-main-500">Try adjustments or click Create Listing to add one.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-main-200 bg-main-100 shadow-sm">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead>
              <tr className="border-b border-main-200 text-xs font-bold uppercase text-main-500 bg-main-200/50">
                <th className="py-3 px-4">Title / Commodity</th>
                <th className="py-3 px-4">Area</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Status</th>
                {activeTab === "system-listings" && <th className="py-3 px-4">Seller ID</th>}
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
                  {activeTab === "system-listings" && (
                    <td className="py-4 px-4 font-mono text-xs text-main-600">
                      {item.seller_id}
                    </td>
                  )}
                  <td className="py-4 px-4 text-main-500 text-xs">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 text-right space-x-2">
                    {(canUpdate || item.seller_id === user?.id) && (
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="rounded border border-main-300 bg-main-100 px-2.5 py-1.5 text-xs font-bold text-main-700 hover:border-primary-300 hover:text-primary-700 transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                    {(canDelete || item.seller_id === user?.id) && (
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

      {/* Listing Form Modal */}
      {listingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-main-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-main-200 bg-main-100 p-6 shadow-xl">
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
                  placeholder="Provide details..."
                  className="mt-1 h-24 w-full rounded-lg border border-main-300 bg-main-0 px-3 py-2 text-sm outline-none focus:border-primary-500"
                />
              </div>

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
                  {submitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

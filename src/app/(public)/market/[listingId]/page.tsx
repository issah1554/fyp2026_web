"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/src/app/(public)/auth/hooks/useAuth";
import Avatar from "@/src/components/ui/Avatar";
import { createOrder, getListing, type CommodityListing } from "@/src/services/trade/tradeService";

export default function MarketplaceListingDetailPage() {
  const params = useParams<{ listingId: string }>();
  const { user } = useAuth();
  const isLoggedIn = Boolean(user);
  const [listing, setListing] = useState<CommodityListing | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadListing = useCallback(async () => {
    if (!params.listingId) return;
    setLoading(true);
    setError("");
    try {
      const data = await getListing(params.listingId);
      setListing(data);
      setSelectedImageIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load listing details.");
    } finally {
      setLoading(false);
    }
  }, [params.listingId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadListing();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadListing]);

  const selectedImage = useMemo(() => {
    if (!listing?.images.length) return null;
    return listing.images[selectedImageIndex] ?? listing.images[0];
  }, [listing, selectedImageIndex]);

  const handleOrderSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!listing) return;
    if (!isLoggedIn) {
      window.location.href = "/auth/login";
      return;
    }

    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const response = await createOrder({
        listing_id: listing.listing_id,
        quantity: orderQuantity,
      });
      setNotice(response.message);
      await loadListing();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24 text-center text-main-500 lg:px-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent" />
        <p className="mt-4 font-semibold">Loading listing details...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <Link href="/market" className="text-xs font-bold text-primary-700 hover:text-primary-800">
          <i className="bi bi-arrow-left mr-1" />
          Back to marketplace
        </Link>
        <div className="mt-8 rounded-xl border border-danger-300 bg-danger-100 px-4 py-5 text-sm font-semibold text-danger-700">
          {error || "Listing not found."}
        </div>
      </div>
    );
  }

  const stock = parseFloat(listing.quantity);
  const price = parseFloat(listing.price);
  const isOwnListing = isLoggedIn && listing.seller_id === user?.id;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 lg:px-8">
      <nav className="text-xs font-semibold text-main-600 flex items-center flex-wrap gap-2">
        <Link href="/" className="hover:text-primary-700 transition-colors">Home</Link>
        <i className="bi bi-chevron-right text-3xs text-main-400" />
        <Link href="/market" className="hover:text-primary-700 transition-colors">Commodity For Sale</Link>
        <i className="bi bi-chevron-right text-3xs text-main-400" />
        <span className="text-main-800">{listing.title || listing.commodity?.name}</span>
      </nav>

      {notice && (
        <div className="rounded-xl border border-success-300 bg-success-100 px-4 py-3 text-sm font-semibold text-success-700">
          <i className="bi bi-check-circle-fill mr-2" />
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-danger-300 bg-danger-100 px-4 py-3 text-sm font-semibold text-danger-700">
          <i className="bi bi-exclamation-triangle-fill mr-2" />
          {error}
        </div>
      )}

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          <div className="aspect-video overflow-hidden rounded-lg border border-main-200 bg-main-200">
            {selectedImage ? (
              <img
                src={selectedImage.image_url}
                alt={listing.title || listing.commodity?.name || "Listing image"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-main-400">
                <div className="text-center">
                  <i className="bi bi-image text-5xl" />
                  <p className="mt-2 text-xs font-bold">No images uploaded</p>
                </div>
              </div>
            )}
          </div>

          {listing.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {listing.images.map((image, index) => (
                <button
                  type="button"
                  key={image.image_id}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-square overflow-hidden rounded-md border bg-main-0 ${
                    selectedImageIndex === index ? "border-primary-600 ring-2 ring-primary-200" : "border-main-300"
                  }`}
                >
                  <img
                    src={image.image_url}
                    alt={`${listing.title || "Listing"} image ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-bold text-primary-700">
              {listing.commodity?.name || "Commodity"}
            </span>
            <h1 className="mt-3 text-2xl font-extrabold text-main-950">
              {listing.title || `${listing.commodity?.name} for Sale`}
            </h1>
            <p className="mt-2 flex items-center text-sm font-semibold text-main-600">
              <i className="bi bi-geo-alt-fill mr-1 text-primary-600" />
              {listing.adm_area?.name || "Location not set"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-main-200 bg-main-100 p-4">
              <p className="text-2xs font-bold uppercase text-main-500">Price</p>
              <p className="mt-1 text-xl font-extrabold text-main-950">TZS {price.toLocaleString()}</p>
              <p className="text-xs text-main-500">per {listing.commodity?.unit || "unit"}</p>
            </div>
            <div className="rounded-lg border border-main-200 bg-main-100 p-4">
              <p className="text-2xs font-bold uppercase text-main-500">Available Stock</p>
              <p className="mt-1 text-xl font-extrabold text-main-950">{stock.toLocaleString()}</p>
              <p className="text-xs text-main-500">{listing.commodity?.unit || "units"}</p>
            </div>
          </div>

          <div className="rounded-lg border border-main-200 bg-main-100 p-4">
            <p className="text-xs font-bold uppercase text-main-500">Description</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-main-700">
              {listing.description || "No description provided."}
            </p>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg bg-main-100 p-4">
              <p className="text-2xs font-bold uppercase text-main-500">Seller</p>
              {listing.seller ? (
                <div className="mt-2 flex min-w-0 items-start gap-2">
                  <Avatar src={listing.seller.avatar_url} alt={listing.seller.full_name || listing.seller.username} initials={listing.seller.full_name || listing.seller.username} size={36} status="offline" />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-main-800">{listing.seller.full_name || listing.seller.username}</p>
                    {listing.seller.email && <p className="truncate text-xs text-main-500">{listing.seller.email}</p>}
                    {(listing.seller.phone_number || listing.seller.organization || listing.seller_id) && (
                      <p className="truncate text-xs text-main-500">{listing.seller.phone_number || listing.seller.organization || listing.seller_id}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-1 font-mono text-xs font-bold text-main-800">{listing.seller_id || "Unknown"}</p>
              )}
            </div>
            <div className="rounded-lg bg-main-100 p-4">
              <p className="text-2xs font-bold uppercase text-main-500">Status</p>
              <p className="mt-1 font-bold capitalize text-main-800">{listing.status}</p>
            </div>
          </div>

          <form onSubmit={(event) => void handleOrderSubmit(event)} className="rounded-lg border border-main-200 bg-main-100 p-4">
            <label className="text-xs font-bold uppercase text-main-500">Order Quantity</label>
            <div className="mt-2 flex gap-2">
              <input
                type="number"
                min="0.01"
                max={stock}
                step="any"
                value={orderQuantity || ""}
                onChange={(event) => setOrderQuantity(parseFloat(event.target.value) || 0)}
                className="min-w-0 flex-1 rounded-lg border border-main-300 bg-main-0 px-3 py-2 text-sm outline-none focus:border-primary-500"
              />
              <button
                type="submit"
                disabled={submitting || isOwnListing || orderQuantity <= 0 || orderQuantity > stock}
                className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-bold text-main-0 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isOwnListing ? "Your Listing" : submitting ? "Submitting..." : isLoggedIn ? "Buy Now" : "Login to Buy"}
              </button>
            </div>
            <p className="mt-2 text-xs font-semibold text-main-500">
              Total: TZS {(Math.max(orderQuantity, 0) * price).toLocaleString()}
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}

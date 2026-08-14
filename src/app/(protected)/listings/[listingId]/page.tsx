"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/src/components/ui/Toast";
import Avatar from "@/src/components/ui/Avatar";
import {
  getListing,
  listOrders,
  type CommodityListing,
  type Order,
  type TradeUserSummary,
} from "@/src/services/trade/tradeService";

function statusClass(status: string) {
  if (status === "pending") return "bg-warning-100 text-warning-700";
  if (status === "accepted") return "bg-primary-100 text-primary-700";
  if (status === "completed") return "bg-success-100 text-success-700";
  if (status === "available") return "bg-success-100 text-success-700";
  if (status === "sold_out") return "bg-primary-100 text-primary-700";
  if (status === "draft") return "bg-warning-100 text-warning-700";
  return "bg-danger-100 text-danger-700";
}

async function copyImageId(imageId: string) {
  try {
    await navigator.clipboard.writeText(imageId);
    toast.success({
      title: "Image ID copied",
      description: imageId,
    });
  } catch {
    toast.error({
      title: "Copy failed",
      description: "Could not copy the image ID.",
    });
  }
}

export default function ListingDetailsPage() {
  const params = useParams<{ listingId: string }>();
  const [listing, setListing] = useState<CommodityListing | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedImageId, setSelectedImageId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDetails = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [listingData, ordersData] = await Promise.all([
        getListing(params.listingId),
        listOrders(),
      ]);
      setListing(listingData);
      setOrders(ordersData);
      setSelectedImageId((current) => current || listingData.images.find((image) => image.is_primary)?.image_id || listingData.images[0]?.image_id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load listing details.");
    } finally {
      setLoading(false);
    }
  }, [params.listingId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadDetails();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadDetails]);

  const listingOrders = useMemo(
    () => orders.filter((order) => order.listing?.listing_id === params.listingId),
    [orders, params.listingId]
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl rounded-xl border border-main-200 bg-main-100 py-20 text-center text-main-500">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent" />
        <p className="mt-4 font-semibold">Loading listing details...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-5xl rounded-xl border border-danger-300 bg-danger-100 px-4 py-5 text-sm font-semibold text-danger-700">
        {error || "Listing not found."}
      </div>
    );
  }

  const selectedImage =
    listing.images.find((image) => image.image_id === selectedImageId) ??
    listing.images.find((image) => image.is_primary) ??
    listing.images[0];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/listings" className="text-xs font-bold text-primary-700 hover:text-primary-800">
          <i className="bi bi-arrow-left mr-1" />
          Back to listings
        </Link>
        <Link
          href={`/listings/${listing.listing_id}/edit`}
          className="rounded-lg border border-main-300 bg-main-0 px-3 py-2 text-xs font-bold text-main-700 hover:border-primary-300 hover:text-primary-700"
        >
          Edit Listing
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="overflow-hidden rounded-xl border border-main-200 bg-main-100 shadow-sm">
          <div className="group relative aspect-video bg-main-200">
            {selectedImage ? (
              <img src={selectedImage.image_url} alt={listing.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-main-400">
                <i className="bi bi-image text-4xl" />
              </div>
            )}
            {selectedImage && <ImageIdOverlay imageId={selectedImage.image_id} />}
          </div>
          {listing.images.length > 1 && (
            <div className="grid grid-cols-3 gap-2 p-3">
              {listing.images.slice(0, 6).map((image) => (
                <div
                  key={image.image_id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedImageId(image.image_id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedImageId(image.image_id);
                    }
                  }}
                  className={`group relative overflow-hidden rounded-lg border bg-main-200 text-left transition-colors ${
                    selectedImage?.image_id === image.image_id ? "border-primary-500" : "border-main-200 hover:border-primary-300"
                  }`}
                >
                  <div className="aspect-video">
                    <img src={image.image_url} alt={`${listing.title} image`} className="h-full w-full object-cover" />
                  </div>
                  {image.is_primary && (
                    <span className="absolute left-1.5 top-1.5 rounded bg-primary-600 px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none text-main-0">
                      Primary
                    </span>
                  )}
                  <ImageIdOverlay imageId={image.image_id} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-main-200 bg-main-100 p-5 shadow-sm">
          <span className="rounded bg-primary-100 px-2 py-1 text-2xs font-bold uppercase text-primary-700">
            {listing.commodity?.name}
          </span>
          <h1 className="mt-3 text-2xl font-bold text-main-950">{listing.title}</h1>
          <p className="mt-2 text-sm text-main-600">{listing.adm_area?.name}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Detail label="Price" value={`TZS ${parseFloat(listing.price).toLocaleString()}`} />
            <Detail label="Quantity" value={`${parseFloat(listing.quantity).toLocaleString()} ${listing.commodity?.unit}`} />
            <UserDetail label="Seller" user={listing.seller} fallbackId={listing.seller_id} />
            <div className="rounded-lg border border-main-200 bg-main-0 p-3">
              <p className="text-xs font-bold uppercase text-main-500">Status</p>
              <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-2xs font-bold uppercase ${statusClass(listing.status)}`}>
                {listing.status.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-main-200 bg-main-0 p-3">
            <p className="text-xs font-bold uppercase text-main-500">Description</p>
            <p className="mt-2 text-sm leading-6 text-main-700">{listing.description || "No description provided."}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-main-200 bg-main-100 shadow-sm">
        <div className="flex items-center justify-between border-b border-main-200 px-4 py-3">
          <h2 className="text-sm font-bold uppercase text-main-700">Orders Placed</h2>
          <span className="rounded-full bg-main-200 px-2.5 py-1 text-xs font-bold text-main-600">
            {listingOrders.length}
          </span>
        </div>

        {listingOrders.length === 0 ? (
          <div className="py-12 text-center text-main-500">
            <i className="bi bi-receipt text-3xl text-main-300" />
            <p className="mt-3 text-sm font-bold text-main-800">No orders placed for this listing</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead>
                <tr className="border-b border-main-200 bg-main-200/50 text-xs font-bold uppercase text-main-500">
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Total Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Placed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-main-200 bg-main-0">
                {listingOrders.map((order) => (
                  <tr key={order.order_id} className="hover:bg-main-50">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-main-700">#{order.order_id}</td>
                    <td className="px-4 py-3">
                      <UserInline user={order.buyer} fallbackId={order.buyer_id} />
                    </td>
                    <td className="px-4 py-3 text-main-700">
                      {parseFloat(order.quantity).toLocaleString()} {listing.commodity?.unit}
                    </td>
                    <td className="px-4 py-3 font-bold text-main-900">
                      TZS {parseFloat(order.total_price).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-2xs font-bold uppercase ${statusClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-main-500">{new Date(order.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function UserInline({ user, fallbackId }: { user?: TradeUserSummary | null; fallbackId?: string | null }) {
  if (!user) {
    return <span className="font-mono text-xs text-main-500">{fallbackId ?? "N/A"}</span>;
  }

  return (
    <div className="flex min-w-0 items-start gap-2">
      <Avatar src={user.avatar_url} alt={user.full_name || user.username} initials={user.full_name || user.username} size={34} status="offline" />
      <div className="min-w-0">
        <p className="truncate font-bold text-main-900">{user.full_name || user.username}</p>
        {user.email && <p className="truncate text-xs text-main-500">{user.email}</p>}
        {(user.phone_number || user.organization || user.user_id) && (
          <p className="truncate text-xs text-main-500">{user.phone_number || user.organization || user.user_id}</p>
        )}
      </div>
    </div>
  );
}

function UserDetail({ label, user, fallbackId }: { label: string; user?: TradeUserSummary | null; fallbackId?: string | null }) {
  return (
    <div className="rounded-lg border border-main-200 bg-main-0 p-3">
      <p className="text-xs font-bold uppercase text-main-500">{label}</p>
      <UserInline user={user} fallbackId={fallbackId} />
      {user?.role && (
        <span className="mt-2 inline-block rounded bg-main-200 px-2 py-0.5 text-2xs font-bold uppercase text-main-600">
          {user.role.name}
        </span>
      )}
    </div>
  );
}

function ImageIdOverlay({ imageId }: { imageId: string }) {
  return (
    <div className="absolute bottom-2 right-2 flex max-w-[80%] translate-y-1 items-center gap-1 rounded bg-main-950/75 px-2 py-1 text-main-0 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
      <span className="min-w-0 max-w-28 truncate font-mono text-[10px] leading-none">{imageId}</span>
      <button
        type="button"
        onClick={() => void copyImageId(imageId)}
        className="flex size-5 shrink-0 items-center justify-center rounded text-main-0 hover:bg-main-0/15"
        title="Copy image ID"
        aria-label="Copy image ID"
      >
        <i className="bi bi-copy text-[10px]" />
      </button>
    </div>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-main-200 bg-main-0 p-3">
      <p className="text-xs font-bold uppercase text-main-500">{label}</p>
      <p className={`mt-2 text-sm font-bold text-main-950 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

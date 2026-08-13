"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getListing, type CommodityListing } from "@/src/services/trade/tradeService";
import { ListingFormPage } from "../../_components/ListingFormPage";

export default function EditListingPage() {
  const params = useParams<{ listingId: string }>();
  const [listing, setListing] = useState<CommodityListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadListing = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setListing(await getListing(params.listingId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load listing.");
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

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl rounded-xl border border-main-200 bg-main-100 py-20 text-center text-main-500">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent" />
        <p className="mt-4 font-semibold">Loading listing...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-4xl rounded-xl border border-danger-300 bg-danger-100 px-4 py-5 text-sm font-semibold text-danger-700">
        {error || "Listing not found."}
      </div>
    );
  }

  return <ListingFormPage mode="edit" listing={listing} />;
}

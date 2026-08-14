"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/src/components/ui/Toast";
import {
  addListingImages,
  createListing,
  deleteListingImage,
  updateListing,
  type CommodityListing,
  type CommodityListingFormPayload,
  type ListingImage,
} from "@/src/services/trade/tradeService";
import { listCommodities, type Commodity } from "@/src/services/commodities/commodityService";
import { listAreas, type Area } from "@/src/services/areas/areaService";

type ListingFormState = {
  title: string;
  description: string;
  commodity_id: string;
  adm_area_id: string;
  price: number;
  quantity: number;
  status: string;
  images_upload: File[];
};

type SavedListingState = Omit<ListingFormState, "images_upload"> & {
  image_ids: string;
};

type Props = {
  mode: "create" | "edit";
  listing?: CommodityListing | null;
};

const inputClass = "w-full rounded-lg border border-main-300 bg-main-0 px-3 py-2 text-sm outline-none focus:border-primary-500";

function listingImageIds(images: ListingImage[]) {
  return images.map((image) => image.image_id).sort().join("|");
}

export function ListingFormPage({ mode, listing }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [existingImages, setExistingImages] = useState<ListingImage[]>(listing?.images ?? []);
  const [savedImages, setSavedImages] = useState<ListingImage[]>(listing?.images ?? []);
  const [form, setForm] = useState<ListingFormState>({
    title: listing?.title ?? "",
    description: listing?.description ?? "",
    commodity_id: listing?.commodity?.commodity_id ?? "",
    adm_area_id: listing?.adm_area?.area_id ?? "",
    price: listing ? parseFloat(listing.price) : 0,
    quantity: listing ? parseFloat(listing.quantity) : 0,
    status: listing?.status ?? "available",
    images_upload: [],
  });
  const [savedListingState, setSavedListingState] = useState<SavedListingState | null>(
    listing
      ? {
          title: listing.title,
          description: listing.description,
          commodity_id: listing.commodity.commodity_id,
          adm_area_id: listing.adm_area.area_id,
          price: parseFloat(listing.price),
          quantity: parseFloat(listing.quantity),
          status: listing.status,
          image_ids: listingImageIds(listing.images),
        }
      : null
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const selectedImagePreviews = useMemo(
    () => form.images_upload.map((file) => URL.createObjectURL(file)),
    [form.images_upload]
  );

  useEffect(() => {
    return () => {
      selectedImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [selectedImagePreviews]);

  const loadCatalogs = useCallback(async () => {
    setLoading(true);
    try {
      const [commoditiesData, areasData] = await Promise.all([
        listCommodities(),
        listAreas({ page_size: 1000 }),
      ]);
      const fetchedCommodities = commoditiesData.data || [];
      const fetchedAreas = areasData.data || [];
      setCommodities(fetchedCommodities);
      setAreas(fetchedAreas);
      setForm((current) => ({
        ...current,
        commodity_id: current.commodity_id || fetchedCommodities[0]?.commodity_id || "",
        adm_area_id: current.adm_area_id || fetchedAreas[0]?.area_id || "",
      }));
    } catch (err) {
      toast.error({
        title: "Could not load form",
        description: err instanceof Error ? err.message : "Failed to load form data.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadCatalogs();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadCatalogs]);

  const hasChanges = useMemo(() => {
    if (mode === "create") {
      return Boolean(
        form.title.trim() ||
          form.description.trim() ||
          form.price > 0 ||
          form.quantity > 0 ||
          form.images_upload.length > 0
      );
    }
    if (!savedListingState) return false;

    return (
      form.title !== savedListingState.title ||
      form.description !== savedListingState.description ||
      form.commodity_id !== savedListingState.commodity_id ||
      form.adm_area_id !== savedListingState.adm_area_id ||
      form.price !== savedListingState.price ||
      form.quantity !== savedListingState.quantity ||
      form.status !== savedListingState.status ||
      form.images_upload.length > 0 ||
      listingImageIds(existingImages) !== savedListingState.image_ids
    );
  }, [existingImages, form, savedListingState, mode]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasChanges) return;
    if (mode === "create" && form.images_upload.length < 3) {
      toast.warning({
        title: "Images required",
        description: "Please upload at least 3 listing images.",
      });
      return;
    }
    if (mode === "edit" && existingImages.length + form.images_upload.length < 3) {
      toast.warning({
        title: "Images required",
        description: "A listing must keep at least 3 images.",
      });
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "edit" && listing) {
        await updateListing(listing.listing_id, {
          title: form.title,
          description: form.description,
          commodity_id: form.commodity_id,
          adm_area_id: form.adm_area_id,
          price: form.price,
          quantity: form.quantity,
          status: form.status,
        });
        const removedImages = savedImages.filter(
          (image) => !existingImages.some((current) => current.image_id === image.image_id)
        );
        for (const image of removedImages) {
          await deleteListingImage(listing.listing_id, image.image_id);
        }
        if (form.images_upload.length > 0) {
          const addedImages = await addListingImages(listing.listing_id, form.images_upload);
          const savedImages = [...existingImages, ...addedImages.images];
          setExistingImages(savedImages);
          setSavedImages(savedImages);
          setSavedListingState({
            title: form.title,
            description: form.description,
            commodity_id: form.commodity_id,
            adm_area_id: form.adm_area_id,
            price: form.price,
            quantity: form.quantity,
            status: form.status,
            image_ids: listingImageIds(savedImages),
          });
        } else {
          setSavedImages(existingImages);
          setSavedListingState({
            title: form.title,
            description: form.description,
            commodity_id: form.commodity_id,
            adm_area_id: form.adm_area_id,
            price: form.price,
            quantity: form.quantity,
            status: form.status,
            image_ids: listingImageIds(existingImages),
          });
        }
        setForm((current) => ({ ...current, images_upload: [] }));
        toast.success({
          title: "Listing saved",
          description: "Your listing changes have been saved.",
        });
        return;
      }
      await createListing(form as CommodityListingFormPayload);
      router.push("/listings");
    } catch (err) {
      toast.error({
        title: "Could not save listing",
        description: err instanceof Error ? err.message : "Failed to save listing.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddImages = async (files: File[]) => {
    setForm({ ...form, images_upload: [...form.images_upload, ...files] });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteImage = (image: ListingImage) => {
    if (existingImages.length - 1 + form.images_upload.length < 3) {
      toast.warning({
        title: "Images required",
        description: "A listing must keep at least 3 images.",
      });
      return;
    }
    setExistingImages((current) => current.filter((item) => item.image_id !== image.image_id));
  };

  const handleCopyImageId = async (imageId: string) => {
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
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <Link href="/listings" className="text-xs font-bold text-primary-700 hover:text-primary-800">
          <i className="bi bi-arrow-left mr-1" />
          Back to listings
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-main-950">
          {mode === "edit" ? "Edit Commodity Listing" : "Create Commodity Listing"}
        </h1>
      </div>

      {loading ? (
        <div className="rounded-xl border border-main-200 bg-main-100 py-20 text-center text-main-500">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent" />
          <p className="mt-4 font-semibold">Loading form...</p>
        </div>
      ) : (
        <form onSubmit={(event) => void handleSubmit(event)} className="rounded-xl border border-main-200 bg-main-100 p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Listing Title">
              <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={inputClass} />
            </Field>
            <Field label="Commodity">
              <select required value={form.commodity_id} onChange={(event) => setForm({ ...form, commodity_id: event.target.value })} className={inputClass}>
                {commodities.map((commodity) => <option key={commodity.commodity_id} value={commodity.commodity_id}>{commodity.name}</option>)}
              </select>
            </Field>
            <Field label="Quantity">
              <input type="number" step="any" min="0" required value={form.quantity || ""} onChange={(event) => setForm({ ...form, quantity: parseFloat(event.target.value) || 0 })} className={inputClass} />
            </Field>
            <Field label="Price (TZS)">
              <input type="number" step="any" min="0" required value={form.price || ""} onChange={(event) => setForm({ ...form, price: parseFloat(event.target.value) || 0 })} className={inputClass} />
            </Field>
            <Field label="Location Area">
              <select required value={form.adm_area_id} onChange={(event) => setForm({ ...form, adm_area_id: event.target.value })} className={inputClass}>
                {areas.map((area) => <option key={area.area_id} value={area.area_id}>{area.name} ({area.level})</option>)}
              </select>
            </Field>
            <Field label="Listing Status">
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className={inputClass}>
                <option value="available">Available</option>
                <option value="sold_out">Sold Out</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
          </div>

          <div className="mt-5">
            <Field label="Description">
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={`${inputClass} h-32`} />
            </Field>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase text-main-500">
                Listing Images
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(event) => void handleAddImages(Array.from(event.target.files || []))}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex size-8 shrink-0 items-center justify-center rounded-md border border-main-300 bg-main-0 text-main-600 transition-colors hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
                title="Add images"
                aria-label="Add images"
              >
                <i className="bi bi-plus-lg text-sm" />
              </button>
            </div>
            {form.images_upload.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-main-500">
                  {form.images_upload.length} image{form.images_upload.length === 1 ? "" : "s"} selected
                </p>
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {form.images_upload.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="group relative overflow-hidden rounded-lg border border-main-200 bg-main-0">
                      <div className="aspect-video bg-main-200">
                        <img
                          src={selectedImagePreviews[index]}
                          alt={file.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, images_upload: form.images_upload.filter((_, itemIndex) => itemIndex !== index) })}
                        className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-main-950/70 text-main-0 opacity-0 transition-opacity group-hover:opacity-100"
                        title="Remove image"
                        aria-label="Remove image"
                      >
                        <i className="bi bi-x-lg text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {mode === "edit" && existingImages.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-bold uppercase text-main-500">Current Images</p>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {existingImages.map((image) => (
                  <div key={image.image_id} className="group relative overflow-hidden rounded-lg border border-main-200 bg-main-0">
                    <div className="aspect-video bg-main-200">
                      <img
                        src={image.image_url}
                        alt={`${listing.title || "Listing"} image`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {image.is_primary && (
                      <span className="absolute left-1.5 top-1.5 rounded bg-primary-600 px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none text-main-0 shadow-sm">
                        Primary
                      </span>
                    )}
                    <div className="absolute bottom-2 right-2 flex max-w-[80%] translate-y-1 items-center gap-1 rounded bg-main-950/75 px-2 py-1 text-main-0 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                      <span className="min-w-0 max-w-28 truncate font-mono text-[10px] leading-none">
                        {image.image_id}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleCopyImageId(image.image_id)}
                        className="flex size-5 shrink-0 items-center justify-center rounded text-main-0 hover:bg-main-0/15"
                        title="Copy image ID"
                        aria-label="Copy image ID"
                      >
                        <i className="bi bi-copy text-[10px]" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(image)}
                      className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-main-950/70 text-main-0 opacity-0 transition-opacity group-hover:opacity-100"
                      title="Remove image"
                      aria-label="Remove image"
                    >
                      <i className="bi bi-x-lg text-xs" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-main-200 pt-5">
            <Link href="/listings" className="rounded-lg border border-main-300 bg-main-0 px-4 py-2 text-sm font-bold text-main-700 hover:bg-main-50">
              Cancel
            </Link>
            <button disabled={submitting || !hasChanges} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700 disabled:opacity-60">
              {submitting ? "Saving..." : "Save Listing"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase text-main-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

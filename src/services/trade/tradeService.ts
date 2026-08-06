import { authenticatedFetch } from "@/src/services/auth/authService";
import { apiUrl } from "@/src/services/config";
import type { PaginationMeta } from "../commodities/commodityService";

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
  meta?: Record<string, unknown>;
};

export type ListingImage = {
  image_id: string;
  image_url: string;
  is_primary: boolean;
};

export type CommodityListing = {
  listing_id: string;
  commodity: {
    commodity_id: string;
    name: string;
    unit: string;
  };
  adm_area: {
    area_id: string;
    name: string;
    path: string;
  };
  seller_id: string | null;
  title: string;
  description: string;
  price: string;
  quantity: string;
  status: string;
  images: ListingImage[];
  created_at: string;
};

export type CommodityListingFormPayload = {
  commodity_id: string;
  adm_area_id: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  status?: string;
  image_urls?: string[];
};

export type Order = {
  order_id: string;
  listing: CommodityListing;
  buyer_id: string | null;
  quantity: string;
  total_price: string;
  status: string;
  created_at: string;
};

export type OrderFormPayload = {
  listing_id: string;
  quantity: number;
};

function getErrorMessage(payload: ApiResponse<unknown> | null, fallback: string) {
  if (payload?.message) {
    return payload.message;
  }
  if (payload?.errors && typeof payload.errors === "object") {
    const firstError = Object.values(payload.errors)[0];
    if (Array.isArray(firstError) && firstError[0]) {
      return String(firstError[0]);
    }
    if (firstError) {
      return String(firstError);
    }
  }
  return fallback;
}

async function tradeRequest<T>(path: string, init: RequestInit = {}, fallback = "Request failed.") {
  const response = await authenticatedFetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, fallback));
  }
  if (!payload) {
    throw new Error(fallback);
  }
  return payload;
}

function normalizePagination(meta: Record<string, unknown> | undefined, fallbackCount: number): PaginationMeta {
  const pagination = (meta?.pagination ?? {}) as Partial<PaginationMeta>;
  return {
    page: Number(pagination.page ?? 1),
    page_size: Number(pagination.page_size ?? fallbackCount),
    total_items: Number(pagination.total_items ?? fallbackCount),
    total_pages: Number(pagination.total_pages ?? 1),
    has_next: Boolean(pagination.has_next),
    has_previous: Boolean(pagination.has_previous),
  };
}

export async function listListings(params: {
  commodity_id?: string;
  area_id?: string;
  status?: string;
} = {}): Promise<CommodityListing[]> {
  const query = new URLSearchParams();
  if (params.commodity_id) query.set("commodity_id", params.commodity_id);
  if (params.area_id) query.set("area_id", params.area_id);
  if (params.status) query.set("status", params.status);

  const path = `/listings${query.toString() ? `?${query.toString()}` : ""}`;
  const payload = await tradeRequest<CommodityListing[]>(path, {}, "Could not load commodity listings.");
  return payload.data ?? [];
}

export async function getListing(listingId: string): Promise<CommodityListing> {
  const payload = await tradeRequest<CommodityListing>(`/listings/${listingId}`, {}, "Could not load listing details.");
  if (!payload.data) throw new Error("Listing not found.");
  return payload.data;
}

export async function createListing(data: CommodityListingFormPayload) {
  const payload = await tradeRequest<CommodityListing>(
    "/listings",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    "Could not create commodity listing."
  );
  return { message: payload.message ?? "Listing created successfully.", listing: payload.data };
}

export async function updateListing(listingId: string, data: Partial<CommodityListingFormPayload>) {
  const payload = await tradeRequest<CommodityListing>(
    `/listings/${listingId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    "Could not update commodity listing."
  );
  return { message: payload.message ?? "Listing updated successfully.", listing: payload.data };
}

export async function deleteListing(listingId: string) {
  const payload = await tradeRequest<unknown>(
    `/listings/${listingId}`,
    { method: "DELETE" },
    "Could not delete commodity listing."
  );
  return payload.message ?? "Listing deleted successfully.";
}

export async function listOrders(): Promise<Order[]> {
  const payload = await tradeRequest<Order[]>("/orders", {}, "Could not load orders.");
  return payload.data ?? [];
}

export async function createOrder(data: OrderFormPayload) {
  const payload = await tradeRequest<Order>(
    "/orders",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    "Could not place order."
  );
  return { message: payload.message ?? "Order placed successfully.", order: payload.data };
}

export async function updateOrderStatus(orderId: string, status: string) {
  const payload = await tradeRequest<Order>(
    `/orders/${orderId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
    "Could not update order status."
  );
  return { message: payload.message ?? "Order status updated successfully.", order: payload.data };
}

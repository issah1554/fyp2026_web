import { authenticatedFetch } from "@/src/services/auth/authService";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
  meta?: Record<string, unknown>;
};

export type PaginationMeta = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
};

export type CommodityCategory = {
  category_id: string;
  name: string;
  description: string;
  created_at: string;
};

export type CommodityUnit = {
  unit_id: string;
  name: string;
  symbol: string;
  description: string;
  created_at: string;
};

export type Commodity = {
  commodity_id: string;
  name: string;
  unit: string;
  unit_detail: CommodityUnit | null;
  description: string;
  categories: CommodityCategory[];
  created_at: string;
};

export type CommodityFormPayload = {
  name: string;
  unit: string;
  unit_id?: string | null;
  description: string;
  category_ids: string[];
};

export type CategoryFormPayload = {
  name: string;
  description: string;
};

export type UnitFormPayload = {
  name: string;
  symbol: string;
  description: string;
};

export type CommodityTotals = {
  total: number;
  categories: number;
  units: number;
  categorized: number;
  uncategorized: number;
};

export type CommodityListResult = {
  data: Commodity[];
  pagination: PaginationMeta;
  totals: CommodityTotals;
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

async function commodityRequest<T>(path: string, init: RequestInit = {}, fallback = "Request failed.") {
  const response = await authenticatedFetch(`${API_BASE_URL}${path}`, {
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

function normalizeTotals(meta: Record<string, unknown> | undefined, fallbackCount: number): CommodityTotals {
  const totals = (meta?.totals ?? {}) as Partial<CommodityTotals>;
  return {
    total: Number(totals.total ?? fallbackCount),
    categories: Number(totals.categories ?? 0),
    units: Number(totals.units ?? 0),
    categorized: Number(totals.categorized ?? 0),
    uncategorized: Number(totals.uncategorized ?? 0),
  };
}

export async function listCommodities(
  params: { category_id?: string; search?: string; page?: number; page_size?: number } = {},
): Promise<CommodityListResult> {
  const query = new URLSearchParams();
  if (params.category_id) {
    query.set("category_id", params.category_id);
  }
  if (params.search) {
    query.set("search", params.search);
  }
  if (params.page) {
    query.set("page", String(params.page));
  }
  if (params.page_size) {
    query.set("page_size", String(params.page_size));
  }

  const payload = await commodityRequest<Commodity[]>(
    `/commodities/${query.toString() ? `?${query.toString()}` : ""}`,
    {},
    "Could not load commodities.",
  );
  const data = payload.data ?? [];
  return {
    data,
    pagination: normalizePagination(payload.meta, data.length),
    totals: normalizeTotals(payload.meta, data.length),
  };
}

export async function listCommodityCategories() {
  const payload = await commodityRequest<CommodityCategory[]>(
    "/commodities/categories/",
    {},
    "Could not load commodity categories.",
  );
  return payload.data ?? [];
}

export async function listCommodityUnits() {
  const payload = await commodityRequest<CommodityUnit[]>(
    "/commodities/units/",
    {},
    "Could not load commodity units.",
  );
  return payload.data ?? [];
}

export async function createCommodity(data: CommodityFormPayload) {
  const payload = await commodityRequest<Commodity>(
    "/commodities/",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    "Could not create commodity.",
  );
  return { message: payload.message ?? "Commodity created successfully.", commodity: payload.data };
}

export async function updateCommodity(commodityId: string, data: CommodityFormPayload) {
  const payload = await commodityRequest<Commodity>(
    `/commodities/${commodityId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    "Could not update commodity.",
  );
  return { message: payload.message ?? "Commodity updated successfully.", commodity: payload.data };
}

export async function deleteCommodity(commodityId: string) {
  const payload = await commodityRequest<unknown>(
    `/commodities/${commodityId}/`,
    { method: "DELETE" },
    "Could not delete commodity.",
  );
  return payload.message ?? "Commodity deleted successfully.";
}

export async function createCommodityCategory(data: CategoryFormPayload) {
  const payload = await commodityRequest<CommodityCategory>(
    "/commodities/categories/",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    "Could not create category.",
  );
  return { message: payload.message ?? "Commodity category created successfully.", category: payload.data };
}

export async function updateCommodityCategory(categoryId: string, data: CategoryFormPayload) {
  const payload = await commodityRequest<CommodityCategory>(
    `/commodities/categories/${categoryId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    "Could not update category.",
  );
  return { message: payload.message ?? "Commodity category updated successfully.", category: payload.data };
}

export async function deleteCommodityCategory(categoryId: string) {
  const payload = await commodityRequest<unknown>(
    `/commodities/categories/${categoryId}/`,
    { method: "DELETE" },
    "Could not delete category.",
  );
  return payload.message ?? "Commodity category deleted successfully.";
}

export async function createCommodityUnit(data: UnitFormPayload) {
  const payload = await commodityRequest<CommodityUnit>(
    "/commodities/units/",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    "Could not create unit.",
  );
  return { message: payload.message ?? "Commodity unit created successfully.", unit: payload.data };
}

export async function updateCommodityUnit(unitId: string, data: UnitFormPayload) {
  const payload = await commodityRequest<CommodityUnit>(
    `/commodities/units/${unitId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    "Could not update unit.",
  );
  return { message: payload.message ?? "Commodity unit updated successfully.", unit: payload.data };
}

export async function deleteCommodityUnit(unitId: string) {
  const payload = await commodityRequest<unknown>(
    `/commodities/units/${unitId}/`,
    { method: "DELETE" },
    "Could not delete unit.",
  );
  return payload.message ?? "Commodity unit deleted successfully.";
}

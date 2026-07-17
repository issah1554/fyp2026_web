import { authenticatedFetch } from "@/src/services/auth/authService";
import { API_BASE_URL } from "@/src/services/config";

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

export type AreaTotals = {
  total: number;
  regions: number;
  districts: number;
  wards: number;
};

export type AreaLevel = "region" | "district" | "ward";

export type AreaParent = {
  area_id: string;
  name: string;
  level: AreaLevel;
};

export type Area = {
  area_id: string;
  name: string;
  level: AreaLevel;
  parent: AreaParent | null;
  created_at: string;
};

export type AreaFormPayload = {
  name: string;
  level: AreaLevel;
  parent_id?: string | null;
};

export type AreaPathImportPayload = {
  level: AreaLevel;
  path: string[];
};

export type BulkAreaImportResult = {
  created: Area[];
  skipped: Array<{
    index: number;
    reason: string;
    message: string;
    area?: Area;
    path: string[];
  }>;
  failed: Array<{
    index: number;
    reason: string;
    message: string;
    path: string[];
  }>;
};

export type BulkAreaImportResponse = {
  message: string;
  data: BulkAreaImportResult;
  meta: {
    created_count?: number;
    skipped_count?: number;
    failed_count?: number;
  };
};

export type AreaListResult = {
  data: Area[];
  pagination: PaginationMeta;
  totals: AreaTotals;
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

async function areaRequest<T>(path: string, init: RequestInit = {}, fallback = "Request failed.") {
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

function normalizeTotals(meta: Record<string, unknown> | undefined, fallbackCount: number): AreaTotals {
  const totals = (meta?.totals ?? {}) as Partial<AreaTotals>;
  return {
    total: Number(totals.total ?? fallbackCount),
    regions: Number(totals.regions ?? 0),
    districts: Number(totals.districts ?? 0),
    wards: Number(totals.wards ?? 0),
  };
}

export async function listAreas(
  params: { level?: string; search?: string; parent_id?: string; page?: number; page_size?: number } = {},
): Promise<AreaListResult> {
  const query = new URLSearchParams();
  if (params.level) {
    query.set("level", params.level);
  }
  if (params.search) {
    query.set("search", params.search);
  }
  if (params.parent_id) {
    query.set("parent_id", params.parent_id);
  }
  if (params.page) {
    query.set("page", String(params.page));
  }
  if (params.page_size) {
    query.set("page_size", String(params.page_size));
  }

  const payload = await areaRequest<Area[]>(
    `/areas/${query.toString() ? `?${query.toString()}` : ""}`,
    {},
    "Could not load areas.",
  );
  const data = payload.data ?? [];
  return {
    data,
    pagination: normalizePagination(payload.meta, data.length),
    totals: normalizeTotals(payload.meta, data.length),
  };
}

export async function createArea(data: AreaFormPayload) {
  const payload = await areaRequest<Area>(
    "/areas/",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    "Could not create area.",
  );
  return { message: payload.message ?? "Area created successfully.", area: payload.data };
}

export async function updateArea(areaId: string, data: AreaFormPayload) {
  const payload = await areaRequest<Area>(
    `/areas/${areaId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    "Could not update area.",
  );
  return { message: payload.message ?? "Area updated successfully.", area: payload.data };
}

export async function deleteArea(areaId: string) {
  const payload = await areaRequest<unknown>(
    `/areas/${areaId}/`,
    {
      method: "DELETE",
    },
    "Could not delete area.",
  );
  return payload.message ?? "Area deleted successfully.";
}

export async function bulkImportAreas(data: AreaPathImportPayload[]): Promise<BulkAreaImportResponse> {
  const payload = await areaRequest<BulkAreaImportResult>(
    "/areas/bulk",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    "Could not import areas.",
  );

  return {
    message: payload.message ?? "Administrative area bulk import completed.",
    data: payload.data ?? { created: [], skipped: [], failed: [] },
    meta: payload.meta ?? {},
  };
}

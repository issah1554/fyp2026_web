import { authenticatedFetch } from "@/src/services/auth/authService";
import { apiUrl } from "@/src/services/config";

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
  meta?: Record<string, unknown>;
};

export type UserRole = string;

export type ManagedProfile = {
  role: UserRole;
  phone_number: string;
  organization: string;
  is_email_verified: boolean;
  email_verified_at: string | null;
};

export type ManagedUser = {
  user_id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login: string | null;
  profile: ManagedProfile;
};

export type UserFormPayload = {
  username: string;
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  role: UserRole;
  phone_number: string;
  organization: string;
};

export type PaginationMeta = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
};

export type UserTotals = {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  verified: number;
};

export type UserListResult = {
  data: ManagedUser[];
  pagination: PaginationMeta;
  totals: UserTotals;
};

function getErrorMessage(payload: ApiResponse<unknown> | null, fallback: string) {
  if (payload?.message) {
    return payload.message;
  }

  const firstError = getFirstErrorMessage(payload?.errors);
  if (firstError) return firstError;

  return fallback;
}

function getFirstErrorMessage(errors: unknown): string {
  if (Array.isArray(errors)) {
    for (const error of errors) {
      const message = getFirstErrorMessage(error);
      if (message) return message;
    }
    return "";
  }

  if (errors && typeof errors === "object") {
    for (const error of Object.values(errors)) {
      const message = getFirstErrorMessage(error);
      if (message) return message;
    }
    return "";
  }

  return errors ? String(errors) : "";
}

async function userRequest<T>(path: string, init: RequestInit = {}, fallback = "Request failed.") {
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

function normalizeTotals(meta: Record<string, unknown> | undefined, fallbackCount: number): UserTotals {
  const totals = (meta?.totals ?? {}) as Partial<UserTotals>;
  return {
    total: Number(totals.total ?? fallbackCount),
    active: Number(totals.active ?? 0),
    inactive: Number(totals.inactive ?? 0),
    admins: Number(totals.admins ?? 0),
    verified: Number(totals.verified ?? 0),
  };
}

export async function listUsers(
  params: { search?: string; role?: string; is_active?: string; page?: number; page_size?: number } = {},
): Promise<UserListResult> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.role) query.set("role", params.role);
  if (params.is_active) query.set("is_active", params.is_active);
  if (params.page) query.set("page", String(params.page));
  if (params.page_size) query.set("page_size", String(params.page_size));

  const payload = await userRequest<ManagedUser[]>(
    `/users${query.toString() ? `?${query.toString()}` : ""}`,
    {},
    "Could not load users.",
  );
  const data = payload.data ?? [];
  return {
    data,
    pagination: normalizePagination(payload.meta, data.length),
    totals: normalizeTotals(payload.meta, data.length),
  };
}

export async function createUser(data: UserFormPayload) {
  const payload = await userRequest<ManagedUser>(
    "/users",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    "Could not create user.",
  );
  return { message: payload.message ?? "User created successfully.", user: payload.data };
}

export async function updateUser(userId: string, data: Omit<UserFormPayload, "password">) {
  const payload = await userRequest<ManagedUser>(
    `/users/${userId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    "Could not update user.",
  );
  return { message: payload.message ?? "User updated successfully.", user: payload.data };
}

export async function deleteUser(userId: string) {
  const payload = await userRequest<unknown>(
    `/users/${userId}`,
    { method: "DELETE" },
    "Could not delete user.",
  );
  return payload.message ?? "User deleted successfully.";
}

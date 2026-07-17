import { authenticatedFetch } from "@/src/services/auth/authService";
import { API_BASE_URL } from "@/src/services/config";

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
};

export type Permission = {
  permission_id: string;
  code: string;
  name: string;
  description: string;
  created_at: string;
};

export type Role = {
  role_id: string;
  code: string;
  name: string;
  description: string;
  is_system: boolean;
  permission_ids: string[];
  permissions: Permission[];
};

export type RoleFormPayload = {
  code: string;
  name: string;
  description: string;
  permission_ids: string[];
};

function getErrorMessage(payload: ApiResponse<unknown> | null, fallback: string) {
  if (payload?.message) return payload.message;
  if (payload?.errors && typeof payload.errors === "object") {
    const firstError = Object.values(payload.errors)[0];
    if (Array.isArray(firstError) && firstError[0]) return String(firstError[0]);
    if (firstError) return String(firstError);
  }
  return fallback;
}

async function accessRequest<T>(path: string, init: RequestInit = {}, fallback = "Request failed.") {
  const response = await authenticatedFetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok) throw new Error(getErrorMessage(payload, fallback));
  if (!payload) throw new Error(fallback);
  return payload;
}

export async function listRoles() {
  const payload = await accessRequest<Role[]>("/users/roles/", {}, "Could not load roles.");
  return payload.data ?? [];
}

export async function createRole(data: RoleFormPayload) {
  const payload = await accessRequest<Role>(
    "/users/roles/",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    "Could not create role.",
  );
  return { message: payload.message ?? "Role created successfully.", role: payload.data };
}

export async function updateRole(roleId: string, data: RoleFormPayload) {
  const payload = await accessRequest<Role>(
    `/users/roles/${roleId}/`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
    "Could not update role.",
  );
  return { message: payload.message ?? "Role updated successfully.", role: payload.data };
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
  const payload = await accessRequest<Role>(
    `/users/roles/${roleId}/`,
    {
      method: "PATCH",
      body: JSON.stringify({ permission_ids: permissionIds }),
    },
    "Could not update role permissions.",
  );
  return { message: payload.message ?? "Role permissions updated successfully.", role: payload.data };
}

export async function deleteRole(roleId: string) {
  const payload = await accessRequest<unknown>(
    `/users/roles/${roleId}/`,
    { method: "DELETE" },
    "Could not delete role.",
  );
  return payload.message ?? "Role deleted successfully.";
}

export async function listPermissions(params: { search?: string } = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  const payload = await accessRequest<Permission[]>(
    `/users/permissions/${query.toString() ? `?${query.toString()}` : ""}`,
    {},
    "Could not load permissions.",
  );
  return payload.data ?? [];
}

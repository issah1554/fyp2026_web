"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../auth/hooks/useAuth";
import type { AuthRole, AuthUser } from "@/src/services/auth/authService";
import {
  listPermissions,
  listRoles,
  updateRolePermissions,
  type Permission,
  type Role,
} from "@/src/services/access-control/accessControlService";

function isAdminUser(user: AuthUser | null) {
  const role = user?.role;
  if (!role) return false;
  if (typeof role === "string") return role.toLowerCase() === "admin";
  const normalizedRole = role as AuthRole;
  return normalizedRole.id === 1 || normalizedRole.name?.toLowerCase() === "admin" || normalizedRole.code === "admin";
}

export default function RolesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const isAdmin = isAdminUser(user);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageNotice, setPageNotice] = useState("");

  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace("/dash");
  }, [authLoading, isAdmin, router]);

  const loadAccessControl = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setPageError("");
    try {
      const [nextRoles, nextPermissions] = await Promise.all([listRoles(), listPermissions()]);
      setRoles(nextRoles);
      setPermissions(nextPermissions);
      const nextSelectedRole = selectedRoleId || nextRoles[0]?.role_id || "";
      setSelectedRoleId(nextSelectedRole);
      setSelectedPermissionIds(nextRoles.find((role) => role.role_id === nextSelectedRole)?.permission_ids ?? []);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not load roles.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, selectedRoleId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadAccessControl(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadAccessControl]);

  const selectedRole = useMemo(
    () => roles.find((role) => role.role_id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );

  const handleSelectRole = (role: Role) => {
    setSelectedRoleId(role.role_id);
    setSelectedPermissionIds(role.permission_ids);
    setPageError("");
    setPageNotice("");
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissionIds((current) =>
      current.includes(permissionId)
        ? current.filter((id) => id !== permissionId)
        : [...current, permissionId],
    );
    setPageError("");
    setPageNotice("");
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaving(true);
    setPageError("");
    setPageNotice("");
    try {
      const result = await updateRolePermissions(selectedRole.role_id, selectedPermissionIds);
      setPageNotice(result.message);
      await loadAccessControl();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not update role permissions.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || (!authLoading && !isAdmin)) {
    return <div className="flex min-h-96 items-center justify-center text-main-600"><span className="size-4 animate-spin rounded-full border-2 border-primary-700 border-t-transparent" /></div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-4">
      <section>
        <p className="text-sm font-semibold text-main-500">System Access Control</p>
        <h1 className="text-2xl font-bold text-main-950 sm:text-3xl">Roles</h1>
      </section>

      {(pageError || pageNotice) && (
        <div className={`rounded-md border px-4 py-3 text-sm font-semibold ${pageError ? "border-danger-300 bg-danger-100 text-danger-700" : "border-success-300 bg-success-100 text-success-700"}`}>
          {pageError || pageNotice}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="rounded-md border border-main-200 bg-main-0 p-4 shadow-sm">
          <div className="border-b border-main-200 pb-3">
            <p className="text-sm font-semibold text-main-500">Role catalog</p>
            <h2 className="mt-1 text-xl font-bold text-main-950">System Roles</h2>
          </div>
          <div className="mt-4 space-y-2">
            {loading ? (
              <p className="py-8 text-center text-sm text-main-500">Loading roles...</p>
            ) : (
              roles.map((role) => (
                <button
                  key={role.role_id}
                  type="button"
                  onClick={() => handleSelectRole(role)}
                  className={`w-full rounded-md border px-3 py-3 text-left text-sm ${
                    selectedRoleId === role.role_id
                      ? "border-primary-300 bg-primary-100 text-primary-700"
                      : "border-main-200 bg-main-50 text-main-800 hover:border-primary-300"
                  }`}
                >
                  <span className="font-bold">{role.name}</span>
                  <span className="mt-1 block text-xs opacity-80">{role.permission_ids.length} permission(s)</span>
                </button>
              ))
            )}
          </div>
        </aside>

        <div className="rounded-md border border-main-200 bg-main-0 p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-main-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-main-500">Permission assignment</p>
              <h2 className="mt-1 text-xl font-bold text-main-950">{selectedRole?.name ?? "Select role"}</h2>
            </div>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!selectedRole || saving}
              className="flex w-fit items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <i className={`bi ${saving ? "bi-arrow-repeat animate-spin" : "bi-check2-circle"}`} aria-hidden="true" />
              {saving ? "Saving..." : "Save permissions"}
            </button>
          </div>

          <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {permissions.length ? (
              permissions.map((permission) => (
                <label
                  key={permission.permission_id}
                  className="flex cursor-pointer gap-3 rounded-md border border-main-200 bg-main-50 p-3 hover:border-primary-300"
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissionIds.includes(permission.permission_id)}
                    onChange={() => togglePermission(permission.permission_id)}
                    className="mt-1 size-4 accent-primary-600"
                  />
                  <span className="min-w-0">
                    <span className="block font-mono text-xs font-bold text-main-950">{permission.code}</span>
                    <span className="mt-1 block text-sm font-bold text-main-800">{permission.name}</span>
                    {permission.description && <span className="mt-1 block text-xs text-main-500">{permission.description}</span>}
                  </span>
                </label>
              ))
            ) : (
              <p className="rounded-md border border-main-200 bg-main-50 px-3 py-8 text-center text-sm text-main-500 md:col-span-2 xl:col-span-3">
                No permissions found. Create permissions first.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

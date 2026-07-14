"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../auth/hooks/useAuth";
import type { AuthRole, AuthUser } from "@/src/services/auth/authService";
import {
  listPermissions,
  type Permission,
} from "@/src/services/access-control/accessControlService";

function isAdminUser(user: AuthUser | null) {
  const role = user?.role;
  if (!role) return false;
  if (typeof role === "string") return role.toLowerCase() === "admin";
  const normalizedRole = role as AuthRole;
  return normalizedRole.id === 1 || normalizedRole.name?.toLowerCase() === "admin" || normalizedRole.code === "admin";
}

export default function PermissionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const isAdmin = isAdminUser(user);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace("/dash");
  }, [authLoading, isAdmin, router]);

  const loadPermissions = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setPageError("");
    try {
      setPermissions(await listPermissions({ search }));
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not load permissions.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, search]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadPermissions(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadPermissions]);

  if (authLoading || (!authLoading && !isAdmin)) {
    return <div className="flex min-h-96 items-center justify-center text-main-600"><span className="size-4 animate-spin rounded-full border-2 border-primary-700 border-t-transparent" /></div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-4">
      <section>
        <p className="text-sm font-semibold text-main-500">System Access Control</p>
        <h1 className="text-2xl font-bold text-main-950 sm:text-3xl">Permissions</h1>
      </section>

      {pageError && (
        <div className="rounded-md border border-danger-300 bg-danger-100 px-4 py-3 text-sm font-semibold text-danger-700">
          {pageError}
        </div>
      )}

      <section className="rounded-md border border-main-200 bg-main-0 p-5 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-main-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-main-500">System-defined capability catalog</p>
            <h2 className="mt-1 text-xl font-bold text-main-950">Permission Registry</h2>
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search permissions"
            className="rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm text-main-900 outline-none placeholder:text-main-500 focus:border-primary-500 focus:bg-main-0 sm:w-72"
          />
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-180 text-left text-sm">
            <thead>
              <tr className="border-b border-main-200 text-xs font-bold uppercase text-main-500">
                <th className="py-3 pr-4">Code</th>
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Description</th>
                <th className="py-3 pr-4">Permission ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-main-200">
              {loading ? (
                <tr><td colSpan={4} className="py-10 text-center text-main-500">Loading permissions...</td></tr>
              ) : permissions.length ? (
                permissions.map((permission) => (
                  <tr key={permission.permission_id} className="hover:bg-main-50">
                    <td className="py-4 pr-4 font-mono text-xs font-bold text-main-900">{permission.code}</td>
                    <td className="py-4 pr-4 font-bold text-main-900">{permission.name}</td>
                    <td className="py-4 pr-4 text-main-600">{permission.description || "None"}</td>
                    <td className="py-4 pr-4 font-mono text-xs text-main-600">{permission.permission_id}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="py-10 text-center text-main-500">No permissions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

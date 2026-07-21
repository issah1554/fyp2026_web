"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HorizontalTabs, type HorizontalTab } from "@/src/components/ui/HorizontalTabs";
import { Modal } from "@/src/components/ui/Modal";
import { useAuth } from "../../auth/hooks/useAuth";
import { userCan } from "@/src/services/auth/authService";
import {
  createRole,
  deleteRole,
  listPermissions,
  listRoles,
  updateRole,
  updateRolePermissions,
  type Permission,
  type Role,
  type RoleFormPayload,
} from "@/src/services/access-control/accessControlService";

type ModalState = { mode: "create"; role: null } | { mode: "edit"; role: Role };
type RbacTab = "roles" | "permissions";

const rbacTabs: HorizontalTab<RbacTab>[] = [
  { id: "roles", label: "Roles" },
  { id: "permissions", label: "Permissions" },
];

const emptyForm: RoleFormPayload = {
  code: "",
  name: "",
  description: "",
  permission_ids: [],
};

export default function RbacPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const canListRoles = userCan(user, "roles.list");
  const canCreateRoles = userCan(user, "roles.create");
  const canUpdateRoles = userCan(user, "roles.update");
  const canDeleteRoles = userCan(user, "roles.delete");
  const canUpdateRolePermissions = userCan(user, "roles.permissions.update");
  const canListPermissions = userCan(user, "permissions.list");
  const canViewPage = canListRoles || canListPermissions;
  const tabParam = searchParams.get("tab");
  const activeTab: RbacTab = tabParam === "permissions" || tabParam === "roles" ? tabParam : "roles";
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionSearch, setPermissionSearch] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageNotice, setPageNotice] = useState("");
  const [modal, setModal] = useState<ModalState | null>(null);
  const [form, setForm] = useState<RoleFormPayload>(emptyForm);
  const [formError, setFormError] = useState("");
  const [formNotice, setFormNotice] = useState("");
  const [savingRole, setSavingRole] = useState(false);

  useEffect(() => {
    if (!authLoading && !canViewPage) router.replace("/dash");
  }, [authLoading, canViewPage, router]);

  const loadAccessControl = useCallback(async () => {
    if (!canViewPage) return;
    setLoading(true);
    setPageError("");
    try {
      const [nextRoles, nextPermissions] = await Promise.all([
        canListRoles ? listRoles() : Promise.resolve([]),
        canListPermissions ? listPermissions() : Promise.resolve([]),
      ]);
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
  }, [canListPermissions, canListRoles, canViewPage, selectedRoleId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadAccessControl(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadAccessControl]);

  const selectedRole = useMemo(
    () => roles.find((role) => role.role_id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );
  const visiblePermissions = useMemo(() => {
    const query = permissionSearch.trim().toLowerCase();
    if (!query) {
      return permissions;
    }

    return permissions.filter((permission) =>
      [permission.code, permission.name, permission.description, permission.permission_id]
        .some((value) => value?.toLowerCase().includes(query)),
    );
  }, [permissionSearch, permissions]);

  const handleSelectRole = (role: Role) => {
    setSelectedRoleId(role.role_id);
    setSelectedPermissionIds(role.permission_ids);
    setPageError("");
    setPageNotice("");
  };

  const openCreateModal = () => {
    setForm(emptyForm);
    setModal({ mode: "create", role: null });
    setFormError("");
    setFormNotice("");
  };

  const openEditModal = (role: Role) => {
    setForm({
      code: role.code,
      name: role.name,
      description: role.description,
      permission_ids: role.permission_ids,
    });
    setModal({ mode: "edit", role });
    setFormError("");
    setFormNotice("");
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
    if (!canUpdateRolePermissions) return;
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

  const handleSaveRole = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!modal) return;
    if (modal.mode === "create" && !canCreateRoles) return;
    if (modal.mode === "edit" && !canUpdateRoles) return;
    setSavingRole(true);
    setFormError("");
    setFormNotice("");
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
        permission_ids: form.permission_ids,
      };
      const result = modal.mode === "create"
        ? await createRole(payload)
        : await updateRole(modal.role.role_id, payload);
      setFormNotice(result.message);
      await loadAccessControl();
      if (result.role?.role_id) {
        setSelectedRoleId(result.role.role_id);
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save role.");
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (!canDeleteRoles) return;
    if (!window.confirm(`Delete ${role.name}?`)) return;
    setPageError("");
    setPageNotice("");
    try {
      setPageNotice(await deleteRole(role.role_id));
      setSelectedRoleId("");
      await loadAccessControl();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not delete role.");
    }
  };

  const toggleFormPermission = (permissionId: string) => {
    setForm((current) => ({
      ...current,
      permission_ids: current.permission_ids.includes(permissionId)
        ? current.permission_ids.filter((id) => id !== permissionId)
        : [...current.permission_ids, permissionId],
    }));
    setFormError("");
    setFormNotice("");
  };

  if (authLoading || (!authLoading && !canViewPage)) {
    return <div className="flex min-h-96 items-center justify-center text-main-600"><span className="size-4 animate-spin rounded-full border-2 border-primary-700 border-t-transparent" /></div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-4">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-main-500">User access</p>
          <h1 className="text-2xl font-bold text-main-950 sm:text-3xl">RBAC</h1>
        </div>
        {activeTab === "roles" && canCreateRoles && <button type="button" onClick={openCreateModal} className="flex w-fit items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700">
          <i className="bi bi-plus-circle" aria-hidden="true" />
          Add role
        </button>}
      </section>

      {(pageError || pageNotice) && (
        <div className={`rounded-md border px-4 py-3 text-sm font-semibold ${pageError ? "border-danger-300 bg-danger-100 text-danger-700" : "border-success-300 bg-success-100 text-success-700"}`}>
          {pageError || pageNotice}
        </div>
      )}

      <section className="rounded-md border border-main-200 bg-main-0 shadow-sm">
        <HorizontalTabs tabs={rbacTabs} activeTab={activeTab} basePath="/rbac" className="px-5" />

        <div className="p-5">
          <div className={activeTab === "roles" ? "grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]" : "hidden"}>
            <aside className="rounded-md border border-main-200 bg-main-0 p-4 shadow-sm">
              <div className="border-b border-main-200 pb-3">
                <p className="text-sm font-semibold text-main-500">Role catalog</p>
                <h2 className="mt-1 text-xl font-bold text-main-950">Roles</h2>
              </div>
              <div className="mt-4 space-y-2">
                {loading ? (
                  <p className="py-8 text-center text-sm text-main-500">Loading roles...</p>
                ) : (
                  roles.map((role) => (
                    <div key={role.role_id} className={`rounded-md border ${selectedRoleId === role.role_id ? "border-primary-300 bg-primary-100" : "border-main-200 bg-main-50"}`}>
                      <button
                        type="button"
                        onClick={() => handleSelectRole(role)}
                        className={`w-full px-3 py-3 text-left text-sm ${selectedRoleId === role.role_id ? "text-primary-700" : "text-main-800"}`}
                      >
                        <span className="font-bold">{role.name}</span>
                        <span className="mt-1 block font-mono text-xs opacity-80">{role.code}</span>
                        <span className="mt-1 block text-xs opacity-80">{role.permission_ids.length} permission(s){role.is_system ? " - system" : ""}</span>
                      </button>
                      {(canUpdateRoles || canDeleteRoles) && (
                      <div className="flex justify-end gap-1 border-t border-main-200 px-2 py-2">
                        {canUpdateRoles && (
                          <button type="button" onClick={() => openEditModal(role)} className="flex size-8 items-center justify-center rounded-md text-main-600 hover:bg-main-100 hover:text-primary-700" aria-label={`Edit ${role.name}`}>
                            <i className="bi bi-pencil" aria-hidden="true" />
                          </button>
                        )}
                        {!role.is_system && canDeleteRoles && (
                          <button type="button" onClick={() => void handleDeleteRole(role)} className="flex size-8 items-center justify-center rounded-md text-danger-700 hover:bg-danger-100" aria-label={`Delete ${role.name}`}>
                            <i className="bi bi-trash" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                      )}
                    </div>
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
                  disabled={!selectedRole || saving || !canUpdateRolePermissions}
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
                        disabled={!canUpdateRolePermissions}
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
                    No permissions found.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className={activeTab === "permissions" ? "" : "hidden"}>
            <div className="flex flex-col gap-3 border-b border-main-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-main-500">System-defined capability catalog</p>
                <h2 className="mt-1 text-xl font-bold text-main-950">Permission Registry</h2>
              </div>
              <input
                value={permissionSearch}
                onChange={(event) => setPermissionSearch(event.target.value)}
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
                  ) : visiblePermissions.length ? (
                    visiblePermissions.map((permission) => (
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
          </div>
        </div>
      </section>

      <Modal open={Boolean(modal)} onClose={() => setModal(null)} size="xl" className="rounded-md border border-main-300 bg-main-0 p-0 shadow-lg">
        <form onSubmit={(event) => void handleSaveRole(event)}>
          <div className="flex items-center justify-between border-b border-main-200 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-main-500">Role details</p>
              <h2 className="text-xl font-bold text-main-950">{modal?.mode === "edit" ? "Edit role" : "Create role"}</h2>
            </div>
            <button type="button" onClick={() => setModal(null)} className="flex size-9 items-center justify-center rounded-md text-main-500 hover:bg-main-100 hover:text-main-900" aria-label="Close">
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>

          <div className="grid max-h-[calc(100vh-10rem)] gap-4 overflow-y-auto px-5 py-5">
            {(formError || formNotice) && (
              <div className={`rounded-md border px-3 py-2 text-sm font-semibold ${formError ? "border-danger-300 bg-danger-100 text-danger-700" : "border-success-300 bg-success-100 text-success-700"}`}>
                {formError || formNotice}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="role-code" className="text-sm font-bold text-main-900">Code</label>
                <input id="role-code" value={form.code} disabled={modal?.mode === "edit" && modal.role.is_system} onChange={(event) => { setForm((current) => ({ ...current, code: event.target.value })); setFormError(""); setFormNotice(""); }} required className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none disabled:opacity-60 focus:border-primary-500 focus:bg-main-0" />
              </div>
              <div>
                <label htmlFor="role-name" className="text-sm font-bold text-main-900">Name</label>
                <input id="role-name" value={form.name} onChange={(event) => { setForm((current) => ({ ...current, name: event.target.value })); setFormError(""); setFormNotice(""); }} required className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0" />
              </div>
            </div>

            <div>
              <label htmlFor="role-description" className="text-sm font-bold text-main-900">Description</label>
              <textarea id="role-description" value={form.description} onChange={(event) => { setForm((current) => ({ ...current, description: event.target.value })); setFormError(""); setFormNotice(""); }} rows={3} className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0" />
            </div>

            <div>
              <p className="text-sm font-bold text-main-900">Default permissions</p>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                {permissions.map((permission) => (
                  <label key={permission.permission_id} className="flex cursor-pointer gap-3 rounded-md border border-main-200 bg-main-50 p-3 hover:border-primary-300">
                    <input type="checkbox" checked={form.permission_ids.includes(permission.permission_id)} onChange={() => toggleFormPermission(permission.permission_id)} className="mt-1 size-4 accent-primary-600" />
                    <span>
                      <span className="block font-mono text-xs font-bold text-main-950">{permission.code}</span>
                      <span className="mt-1 block text-sm font-bold text-main-800">{permission.name}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-main-200 px-5 py-4">
            <button type="button" onClick={() => setModal(null)} className="rounded-md border border-main-300 bg-main-100 px-4 py-2 text-sm font-bold text-main-700 hover:bg-main-200">Cancel</button>
            <button type="submit" disabled={savingRole} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">
              {savingRole ? "Saving..." : "Save role"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

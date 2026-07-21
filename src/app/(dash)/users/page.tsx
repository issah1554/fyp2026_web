"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/src/components/ui/Modal";
import Pagination from "@/src/components/ui/Pagination";
import { useAuth } from "../../auth/hooks/useAuth";
import { userCan } from "@/src/services/auth/authService";
import { listRoles, type Role } from "@/src/services/access-control/accessControlService";
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
  type ManagedUser,
  type PaginationMeta,
  type UserFormPayload,
  type UserRole,
  type UserTotals,
} from "@/src/services/users/userService";
import { PHONE_NUMBER_ERROR, validateInternationalPhoneNumber } from "@/src/utils/phoneValidation";

type FormState = {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone_number: string;
  organization: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
};

type ModalState =
  | { mode: "create"; user: null }
  | { mode: "edit"; user: ManagedUser };

const emptyForm: FormState = {
  username: "",
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  role: "farmer",
  phone_number: "",
  organization: "",
  is_active: true,
  is_staff: false,
  is_superuser: false,
};

function roleLabel(role: UserRole, roles: Role[]) {
  return roles.find((item) => item.code === role)?.name ?? role;
}

function normalizeCreatePayload(form: FormState): UserFormPayload {
  return {
    username: form.username.trim(),
    email: form.email.trim(),
    password: form.password,
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    role: form.role,
    phone_number: form.phone_number.trim(),
    organization: form.organization.trim(),
    is_active: form.is_active,
    is_staff: form.is_staff,
    is_superuser: form.is_superuser,
  };
}

function normalizeUpdatePayload(form: FormState): Omit<UserFormPayload, "password"> {
  return {
    username: form.username.trim(),
    email: form.email.trim(),
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    role: form.role,
    phone_number: form.phone_number.trim(),
    organization: form.organization.trim(),
    is_active: form.is_active,
    is_staff: form.is_staff,
    is_superuser: form.is_superuser,
  };
}

function roleBadgeClass(role: UserRole) {
  if (role === "admin") return "bg-danger-100 text-danger-700";
  if (role === "market_officer") return "bg-accent-100 text-accent-700";
  if (role === "researcher") return "bg-primary-100 text-primary-700";
  return "bg-main-200 text-main-700";
}

export default function UsersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const canListUsers = userCan(user, "users.list");
  const canCreateUsers = userCan(user, "users.create");
  const canUpdateUsers = userCan(user, "users.update");
  const canDeleteUsers = userCan(user, "users.delete");
  const canListRoles = userCan(user, "roles.list");
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [totals, setTotals] = useState<UserTotals>({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    verified: 0,
  });
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    page_size: 10,
    total_items: 0,
    total_pages: 1,
    has_next: false,
    has_previous: false,
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [pageNotice, setPageNotice] = useState("");
  const [modal, setModal] = useState<ModalState | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [formNotice, setFormNotice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !canListUsers) {
      router.replace("/dash");
    }
  }, [authLoading, canListUsers, router]);

  const loadUsers = useCallback(async () => {
    if (!canListUsers) return;
    setLoading(true);
    setPageError("");
    try {
      const result = await listUsers({
        page,
        page_size: pageSize,
        search,
        role: roleFilter,
        is_active: activeFilter,
      });
      setUsers(result.data);
      setPagination(result.pagination);
      setTotals(result.totals);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, [activeFilter, canListUsers, page, pageSize, roleFilter, search]);

  const loadRoles = useCallback(async () => {
    if (!canListRoles) return;
    try {
      setRoles(await listRoles());
    } catch {
      setRoles([]);
    }
  }, [canListRoles]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadUsers();
      void loadRoles();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadRoles, loadUsers]);

  const stats = useMemo(
    () => [
      ["Users", totals.total, "bi-people", "bg-main-200 text-main-700"],
      ["Active", totals.active, "bi-check2-circle", "bg-success-100 text-success-700"],
      ["Inactive", totals.inactive, "bi-pause-circle", "bg-warning-100 text-warning-700"],
      ["Admins", totals.admins, "bi-shield-lock", "bg-danger-100 text-danger-700"],
    ],
    [totals],
  );

  const openCreateModal = () => {
    setForm(emptyForm);
    setModal({ mode: "create", user: null });
    setFormError("");
    setFormNotice("");
  };

  const openEditModal = (managedUser: ManagedUser) => {
    setForm({
      username: managedUser.username,
      email: managedUser.email,
      password: "",
      first_name: managedUser.first_name,
      last_name: managedUser.last_name,
      role: managedUser.profile.role,
      phone_number: managedUser.profile.phone_number,
      organization: managedUser.profile.organization,
      is_active: managedUser.is_active,
      is_staff: managedUser.is_staff,
      is_superuser: managedUser.is_superuser,
    });
    setModal({ mode: "edit", user: managedUser });
    setFormError("");
    setFormNotice("");
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!modal) return;
    if (!validateInternationalPhoneNumber(form.phone_number)) {
      setFormError(PHONE_NUMBER_ERROR);
      setFormNotice("");
      return;
    }
    setSaving(true);
    setFormError("");
    setFormNotice("");
    try {
      const result =
        modal.mode === "create"
          ? await createUser(normalizeCreatePayload(form))
          : await updateUser(modal.user.user_id, normalizeUpdatePayload(form));
      setFormNotice(result.message);
      await loadUsers();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save user.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (managedUser: ManagedUser) => {
    if (!window.confirm(`Delete ${managedUser.username}?`)) return;
    setPageError("");
    setPageNotice("");
    try {
      setPageNotice(await deleteUser(managedUser.user_id));
      await loadUsers();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not delete user.");
    }
  };

  if (authLoading || (!authLoading && !canListUsers)) {
    return (
      <div className="flex min-h-96 items-center justify-center text-main-600">
        <span className="size-4 animate-spin rounded-full border-2 border-primary-700 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-4">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-main-500">Administration</p>
          <h1 className="text-2xl font-bold text-main-950 sm:text-3xl">Users</h1>
        </div>
        {canCreateUsers && (
          <button
            type="button"
            onClick={openCreateModal}
            className="flex w-fit items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700"
          >
            <i className="bi bi-person-plus" aria-hidden="true" />
            Add user
          </button>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value, icon, color]) => (
          <div key={String(label)} className="rounded-lg border border-main-300 bg-main-200 p-4 shadow-none">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-main-500">{label}</p>
                <p className="mt-1 text-2xl font-bold text-main-950">{value}</p>
              </div>
              <span className={`flex size-11 items-center justify-center rounded-lg ${color}`}>
                <i className={`bi ${icon} text-xl`} aria-hidden="true" />
              </span>
            </div>
          </div>
        ))}
      </section>

      {(pageError || pageNotice) && (
        <div className={`rounded-md border px-4 py-3 text-sm font-semibold ${pageError ? "border-danger-300 bg-danger-100 text-danger-700" : "border-success-300 bg-success-100 text-success-700"}`}>
          {pageError || pageNotice}
        </div>
      )}

      <section className="rounded-md border border-main-200 bg-main-0 p-5 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-main-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-main-500">Access registry</p>
            <h2 className="mt-1 text-xl font-bold text-main-950">Managed Users</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,16rem)_11rem_9rem]">
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search users"
              className="rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm text-main-900 outline-none placeholder:text-main-500 focus:border-primary-500 focus:bg-main-0"
            />
            <select
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0"
            >
              <option value="">All roles</option>
              {roles.map((role) => (
                <option key={role.role_id} value={role.code}>{role.name}</option>
              ))}
            </select>
            <select
              value={activeFilter}
              onChange={(event) => {
                setActiveFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0"
            >
              <option value="">All status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-220 text-left text-sm">
            <thead>
              <tr className="border-b border-main-200 text-xs font-bold uppercase text-main-500">
                <th className="py-3 pr-4">User</th>
                <th className="py-3 pr-4">Role</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Organization</th>
                <th className="py-3 pr-4">User ID</th>
                {(canUpdateUsers || canDeleteUsers) && <th className="py-3 pr-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-main-200">
              {loading ? (
                <tr>
                  <td colSpan={canUpdateUsers || canDeleteUsers ? 6 : 5} className="py-10 text-center text-main-500">
                    <span className="inline-flex items-center gap-2">
                      <span className="size-4 animate-spin rounded-full border-2 border-primary-700 border-t-transparent" />
                      Loading users...
                    </span>
                  </td>
                </tr>
              ) : users.length ? (
                users.map((managedUser) => (
                  <tr key={managedUser.user_id} className="hover:bg-main-50">
                    <td className="py-4 pr-4">
                      <p className="font-bold text-main-900">{managedUser.first_name || managedUser.last_name ? `${managedUser.first_name} ${managedUser.last_name}`.trim() : managedUser.username}</p>
                      <p className="mt-1 text-xs text-main-500">{managedUser.email || managedUser.username}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${roleBadgeClass(managedUser.profile.role)}`}>
                        {roleLabel(managedUser.profile.role, roles)}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap gap-1">
                        <span className={`rounded-full px-2 py-1 text-xs font-bold ${managedUser.is_active ? "bg-success-100 text-success-700" : "bg-warning-100 text-warning-700"}`}>
                          {managedUser.is_active ? "Active" : "Inactive"}
                        </span>
                        {managedUser.profile.is_email_verified && (
                          <span className="rounded-full bg-primary-100 px-2 py-1 text-xs font-bold text-primary-700">Verified</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-main-700">{managedUser.profile.organization || "None"}</td>
                    <td className="py-4 pr-4 font-mono text-xs text-main-600">{managedUser.user_id}</td>
                    {(canUpdateUsers || canDeleteUsers) && (
                      <td className="py-4 pr-4">
                        <div className="flex justify-end gap-2">
                          {canUpdateUsers && (
                            <button
                              type="button"
                              onClick={() => openEditModal(managedUser)}
                              className="flex size-8 items-center justify-center rounded-md border border-main-300 bg-main-100 text-main-700 hover:border-primary-300 hover:text-primary-700"
                              aria-label={`Edit ${managedUser.username}`}
                            >
                              <i className="bi bi-pencil-square" aria-hidden="true" />
                            </button>
                          )}
                          {canDeleteUsers && (
                            <button
                              type="button"
                              onClick={() => void handleDelete(managedUser)}
                              className="flex size-8 items-center justify-center rounded-md border border-danger-300 bg-danger-100 text-danger-700 hover:bg-danger-200"
                              aria-label={`Delete ${managedUser.username}`}
                            >
                              <i className="bi bi-trash" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canUpdateUsers || canDeleteUsers ? 6 : 5} className="py-10 text-center text-main-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-main-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-main-600">
            <span>Rows</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="rounded-md border border-main-300 bg-main-100 px-2 py-1 text-sm text-main-900 outline-none"
            >
              {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </div>
          <Pagination page={pagination.page} pageSize={pagination.page_size} totalItems={pagination.total_items} onChange={setPage} showHelper size="sm" rounded="full" disabled={loading} />
        </div>
      </section>

      <Modal open={Boolean(modal)} onClose={() => setModal(null)} size="xl" className="rounded-md border border-main-300 bg-main-0 p-0 shadow-lg">
        <form onSubmit={(event) => void handleSave(event)}>
          <div className="flex items-center justify-between border-b border-main-200 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-main-500">User details</p>
              <h2 className="text-xl font-bold text-main-950">{modal?.mode === "edit" ? "Edit user" : "Create user"}</h2>
            </div>
            <button type="button" onClick={() => setModal(null)} className="flex size-9 items-center justify-center rounded-md text-main-500 hover:bg-main-100 hover:text-main-900" aria-label="Close">
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>

          <div className="grid max-h-[calc(100vh-10rem)] gap-4 overflow-y-auto px-5 py-5 lg:grid-cols-2">
            {(formError || formNotice) && (
              <div className={`rounded-md border px-3 py-2 text-sm font-semibold lg:col-span-2 ${formError ? "border-danger-300 bg-danger-100 text-danger-700" : "border-success-300 bg-success-100 text-success-700"}`}>
                {formError || formNotice}
              </div>
            )}

            {[
              ["username", "Username", "text"],
              ["email", "Email", "email"],
              ["first_name", "First name", "text"],
              ["last_name", "Last name", "text"],
              ["phone_number", "Phone number", "tel"],
              ["organization", "Organization", "text"],
            ].map(([key, label, type]) => (
              <div key={key}>
                <label htmlFor={`user-${key}`} className="text-sm font-bold text-main-900">{label}</label>
                <input
                  id={`user-${key}`}
                  type={type}
                  inputMode={key === "phone_number" ? "tel" : undefined}
                  pattern={key === "phone_number" ? "^\\+[1-9][0-9]{7,14}$" : undefined}
                  title={key === "phone_number" ? PHONE_NUMBER_ERROR : undefined}
                  placeholder={key === "phone_number" ? "+255700000001" : undefined}
                  value={String(form[key as keyof FormState])}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, [key]: event.target.value }));
                    setFormError("");
                    setFormNotice("");
                  }}
                  required={key === "username" || key === "email"}
                  className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0"
                />
              </div>
            ))}

            {modal?.mode === "create" && (
              <div>
                <label htmlFor="user-password" className="text-sm font-bold text-main-900">Password</label>
                <input
                  id="user-password"
                  type="password"
                  value={form.password}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, password: event.target.value }));
                    setFormError("");
                    setFormNotice("");
                  }}
                  required
                  minLength={8}
                  className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0"
                />
              </div>
            )}

            <div>
              <label htmlFor="user-role" className="text-sm font-bold text-main-900">Role</label>
              <select
                id="user-role"
                value={form.role}
                onChange={(event) => {
                  setForm((current) => ({ ...current, role: event.target.value as UserRole }));
                  setFormError("");
                  setFormNotice("");
                }}
                className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0"
              >
                {roles.map((role) => <option key={role.role_id} value={role.code}>{role.name}</option>)}
              </select>
            </div>

            <div className="grid gap-3 rounded-md border border-main-200 bg-main-50 p-3 lg:col-span-2 sm:grid-cols-3">
              {[
                ["is_active", "Active"],
                ["is_staff", "Staff"],
                ["is_superuser", "Superuser"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm font-bold text-main-800">
                  <input
                    type="checkbox"
                    checked={Boolean(form[key as keyof FormState])}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, [key]: event.target.checked }));
                      setFormError("");
                      setFormNotice("");
                    }}
                    className="size-4 accent-primary-600"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-main-200 px-5 py-4">
            <button type="button" onClick={() => setModal(null)} className="rounded-md border border-main-300 bg-main-100 px-4 py-2 text-sm font-bold text-main-700 hover:bg-main-200">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? "Saving..." : "Save user"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/src/components/ui/Modal";
import Pagination from "@/src/components/ui/Pagination";
import { useAuth } from "../../auth/hooks/useAuth";
import { userCan } from "@/src/services/auth/authService";
import {
  bulkImportAreas,
  createArea,
  deleteArea,
  listAreas,
  updateArea,
  type Area,
  type AreaFormPayload,
  type AreaLevel,
  type AreaPathImportPayload,
  type AreaTotals,
  type BulkAreaImportResponse,
  type PaginationMeta,
} from "@/src/services/areas/areaService";

type FormState = {
  name: string;
  level: AreaLevel;
  parent_id: string;
};

type ModalState =
  | { mode: "create"; area: null }
  | { mode: "edit"; area: Area };

const levelLabels: Record<AreaLevel, string> = {
  region: "Region",
  district: "District",
  ward: "Ward",
};

const emptyForm: FormState = {
  name: "",
  level: "region",
  parent_id: "",
};

const defaultBulkJson = JSON.stringify(
  [
    { level: "region", path: ["Morogoro"] },
    { level: "district", path: ["Morogoro", "Kilombero"] },
    { level: "ward", path: ["Morogoro", "Kilombero", "Ifakara"] },
  ],
  null,
  2,
);

function getParentOptions(areas: Area[], level: AreaLevel) {
  if (level === "district") {
    return areas.filter((area) => area.level === "region");
  }

  if (level === "ward") {
    return areas.filter((area) => area.level === "district");
  }

  return [];
}

function normalizeFormPayload(form: FormState): AreaFormPayload {
  return {
    name: form.name.trim(),
    level: form.level,
    parent_id: form.level === "region" ? null : form.parent_id,
  };
}

function parseBulkPayload(value: string): AreaPathImportPayload[] {
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Bulk import body must be a JSON array.");
  }

  return parsed.map((item) => {
    if (!item || typeof item !== "object") {
      throw new Error("Each bulk import row must be an object.");
    }

    const row = item as { level?: unknown; path?: unknown };
    if (row.level !== "region" && row.level !== "district" && row.level !== "ward") {
      throw new Error("Each row level must be region, district, or ward.");
    }
    const level: AreaLevel = row.level;

    if (!Array.isArray(row.path) || !row.path.every((part) => typeof part === "string" && part.trim())) {
      throw new Error("Each row path must be an array of non-empty strings.");
    }

    const payload = {
      level,
      path: row.path.map((part) => part.trim()),
    };

    const expectedLength = payload.level === "region" ? 1 : payload.level === "district" ? 2 : 3;
    if (payload.path.length !== expectedLength) {
      throw new Error(`${levelLabels[payload.level]} rows must use a path with ${expectedLength} item(s).`);
    }

    return payload;
  });
}

function levelBadgeClass(level: AreaLevel) {
  if (level === "region") {
    return "bg-primary-100 text-primary-700";
  }
  if (level === "district") {
    return "bg-accent-100 text-accent-700";
  }
  return "bg-warning-100 text-warning-700";
}

export default function AreasPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const canListAreas = userCan(user, "areas.list");
  const canCreateAreas = userCan(user, "areas.create");
  const canBulkImportAreas = userCan(user, "areas.bulk_import");
  const canUpdateAreas = userCan(user, "areas.update");
  const canDeleteAreas = userCan(user, "areas.delete");
  const [areas, setAreas] = useState<Area[]>([]);
  const [allAreas, setAllAreas] = useState<Area[]>([]);
  const [totals, setTotals] = useState<AreaTotals>({
    total: 0,
    regions: 0,
    districts: 0,
    wards: 0,
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
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [pageNotice, setPageNotice] = useState("");
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [modal, setModal] = useState<ModalState | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [formNotice, setFormNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkJson, setBulkJson] = useState(defaultBulkJson);
  const [bulkResult, setBulkResult] = useState<BulkAreaImportResponse | null>(null);
  const [bulkError, setBulkError] = useState("");
  const [bulkNotice, setBulkNotice] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !canListAreas) {
      router.replace("/dash");
    }
  }, [authLoading, canListAreas, router]);

  const loadAreas = useCallback(async () => {
    if (!canListAreas) {
      return;
    }

    setLoading(true);
    setPageError("");
    try {
      const result = await listAreas({
        page,
        page_size: pageSize,
        level: levelFilter,
        search,
      });
      setAreas(result.data);
      setPagination(result.pagination);
      setTotals(result.totals);
    } catch (loadError) {
      setPageError(loadError instanceof Error ? loadError.message : "Could not load areas.");
    } finally {
      setLoading(false);
    }
  }, [canListAreas, levelFilter, page, pageSize, search]);

  const loadParentOptions = useCallback(async () => {
    if (!canListAreas) {
      return;
    }

    try {
      const result = await listAreas({ page: 1, page_size: 100 });
      setAllAreas(result.data);
    } catch {
      setAllAreas([]);
    }
  }, [canListAreas]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadAreas();
      void loadParentOptions();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadAreas, loadParentOptions]);

  const stats = useMemo(() => {
    return {
      total: totals.total,
      regions: totals.regions,
      districts: totals.districts,
      wards: totals.wards,
    };
  }, [totals]);

  const parentOptions = useMemo(() => getParentOptions(allAreas, form.level), [allAreas, form.level]);

  const openCreateModal = () => {
    setForm(emptyForm);
    setModal({ mode: "create", area: null });
    setFormError("");
    setFormNotice("");
  };

  const openEditModal = (area: Area) => {
    setForm({
      name: area.name,
      level: area.level,
      parent_id: area.parent?.area_id ?? "",
    });
    setModal({ mode: "edit", area });
    setFormError("");
    setFormNotice("");
  };

  const handleSaveArea = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!modal) {
      return;
    }

    setSaving(true);
    setFormError("");
    setFormNotice("");
    try {
      const payload = normalizeFormPayload(form);
      const result =
        modal.mode === "create"
          ? await createArea(payload)
          : await updateArea(modal.area.area_id, payload);
      setFormNotice(result.message);
      await loadAreas();
      await loadParentOptions();
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : "Could not save area.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArea = async (area: Area) => {
    if (!window.confirm(`Delete ${area.name}?`)) {
      return;
    }

    setPageError("");
    setPageNotice("");
    try {
      setPageNotice(await deleteArea(area.area_id));
      await loadAreas();
    } catch (deleteError) {
      setPageError(deleteError instanceof Error ? deleteError.message : "Could not delete area.");
    }
  };

  const handleBulkImport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBulkSaving(true);
    setBulkError("");
    setBulkNotice("");
    setBulkResult(null);
    try {
      const result = await bulkImportAreas(parseBulkPayload(bulkJson));
      setBulkResult(result);
      setBulkNotice(result.message);
      await loadAreas();
      await loadParentOptions();
    } catch (bulkError) {
      setBulkError(bulkError instanceof Error ? bulkError.message : "Could not import areas.");
    } finally {
      setBulkSaving(false);
    }
  };

  const handleBulkFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setBulkError("");
    setBulkNotice("");

    if (file.type && file.type !== "application/json" && !file.name.toLowerCase().endsWith(".json")) {
      setBulkError("Upload a JSON file.");
      return;
    }

    try {
      const text = await file.text();
      parseBulkPayload(text);
      setBulkJson(text);
      setBulkNotice("JSON file loaded and validated.");
    } catch (uploadError) {
      setBulkError(uploadError instanceof Error ? uploadError.message : "Invalid JSON file.");
    }
  };

  if (authLoading || (!authLoading && !canListAreas)) {
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
          <h1 className="text-2xl font-bold text-main-950 sm:text-3xl">Areas</h1>
        </div>
        {canCreateAreas && (
          <button
            type="button"
            onClick={openCreateModal}
            className="flex w-fit items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700"
          >
            <i className="bi bi-plus-circle" aria-hidden="true" />
            Add area
          </button>
        )}
        {canBulkImportAreas && (
          <button
            type="button"
            onClick={() => {
              setBulkResult(null);
              setBulkModalOpen(true);
              setBulkError("");
              setBulkNotice("");
            }}
            className="flex w-fit items-center gap-2 rounded-md border border-main-300 bg-main-100 px-4 py-2 text-sm font-bold text-main-800 hover:border-primary-300 hover:text-primary-700"
          >
            <i className="bi bi-upload" aria-hidden="true" />
            Import paths
          </button>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total", stats.total, "bi-geo-alt", "bg-main-200 text-main-700"],
          ["Regions", stats.regions, "bi-map", "bg-primary-100 text-primary-700"],
          ["Districts", stats.districts, "bi-signpost", "bg-accent-100 text-accent-700"],
          ["Wards", stats.wards, "bi-pin-map", "bg-warning-100 text-warning-700"],
        ].map(([label, value, icon, color]) => (
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
        <div
          className={`rounded-md border px-4 py-3 text-sm font-semibold ${
            pageError
              ? "border-danger-300 bg-danger-100 text-danger-700"
              : "border-success-300 bg-success-100 text-success-700"
          }`}
        >
          {pageError || pageNotice}
        </div>
      )}

      <section className="rounded-md border border-main-200 bg-main-0 p-5 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-main-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-main-500">Administrative hierarchy</p>
            <h2 className="mt-1 text-xl font-bold text-main-950">Area Registry</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,16rem)_10rem]">
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search areas"
              className="rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm text-main-900 outline-none placeholder:text-main-500 focus:border-primary-500 focus:bg-main-0"
            />
            <select
              value={levelFilter}
              onChange={(event) => {
                setLevelFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0"
            >
              <option value="">All levels</option>
              <option value="region">Regions</option>
              <option value="district">Districts</option>
              <option value="ward">Wards</option>
            </select>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-180 text-left text-sm">
            <thead>
              <tr className="border-b border-main-200 text-xs font-bold uppercase text-main-500">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Level</th>
                <th className="py-3 pr-4">Parent</th>
                <th className="py-3 pr-4">Area ID</th>
                {(canUpdateAreas || canDeleteAreas) && <th className="py-3 pr-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-main-200">
              {loading ? (
                <tr>
                  <td colSpan={canUpdateAreas || canDeleteAreas ? 5 : 4} className="py-10 text-center text-main-500">
                    <span className="inline-flex items-center gap-2">
                      <span className="size-4 animate-spin rounded-full border-2 border-primary-700 border-t-transparent" />
                      Loading areas...
                    </span>
                  </td>
                </tr>
              ) : areas.length ? (
                areas.map((area) => (
                  <tr key={area.area_id} className="hover:bg-main-50">
                    <td className="py-4 pr-4 font-bold text-main-900">{area.name}</td>
                    <td className="py-4 pr-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${levelBadgeClass(area.level)}`}>
                        {levelLabels[area.level]}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-main-700">{area.parent?.name ?? "None"}</td>
                    <td className="py-4 pr-4 font-mono text-xs text-main-600">{area.area_id}</td>
                    {(canUpdateAreas || canDeleteAreas) && <td className="py-4 pr-4">
                      <div className="flex justify-end gap-2">
                        {canUpdateAreas && <button
                          type="button"
                          onClick={() => openEditModal(area)}
                          className="flex size-8 items-center justify-center rounded-md border border-main-300 bg-main-100 text-main-700 hover:border-primary-300 hover:text-primary-700"
                          aria-label={`Edit ${area.name}`}
                        >
                          <i className="bi bi-pencil-square" aria-hidden="true" />
                        </button>}
                        {canDeleteAreas && <button
                          type="button"
                          onClick={() => void handleDeleteArea(area)}
                          className="flex size-8 items-center justify-center rounded-md border border-danger-300 bg-danger-100 text-danger-700 hover:bg-danger-200"
                          aria-label={`Delete ${area.name}`}
                        >
                          <i className="bi bi-trash" aria-hidden="true" />
                        </button>}
                      </div>
                    </td>}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canUpdateAreas || canDeleteAreas ? 5 : 4} className="py-10 text-center text-main-500">
                    No areas found.
                  </td>
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
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <Pagination
            page={pagination.page}
            pageSize={pagination.page_size}
            totalItems={pagination.total_items}
            onChange={setPage}
            showHelper
            size="sm"
            rounded="full"
            disabled={loading}
          />
        </div>
      </section>

      <Modal
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        size="2xl"
        className="max-h-[calc(100vh-2rem)] overflow-hidden rounded-md border border-main-300 bg-main-0 p-0 shadow-lg"
      >
        <form onSubmit={(event) => void handleBulkImport(event)}>
          <div className="flex items-center justify-between border-b border-main-200 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-main-500">Path import</p>
              <h2 className="text-xl font-bold text-main-950">Bulk Import Areas</h2>
            </div>
            <button
              type="button"
              onClick={() => setBulkModalOpen(false)}
              className="flex size-9 items-center justify-center rounded-md text-main-500 hover:bg-main-100 hover:text-main-900"
              aria-label="Close"
            >
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>

          <div className="grid max-h-[calc(100vh-8rem)] gap-4 overflow-y-auto px-5 py-5 lg:grid-cols-[1fr_20rem]">
            <div className="space-y-3">
              <div className="flex flex-col gap-2 rounded-md border border-main-200 bg-main-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-main-900">JSON input</p>
                  <p className="text-xs text-main-500">Paste JSON or upload a JSON file before importing.</p>
                </div>
                <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm font-bold text-main-700 hover:border-primary-300 hover:text-primary-700">
                  <i className="bi bi-filetype-json" aria-hidden="true" />
                  Upload JSON
                  <input type="file" accept="application/json,.json" onChange={(event) => void handleBulkFileUpload(event)} className="hidden" />
                </label>
              </div>
              <textarea
                value={bulkJson}
                onChange={(event) => {
                  setBulkJson(event.target.value);
                  setBulkResult(null);
                  setBulkError("");
                  setBulkNotice("");
                }}
                rows={14}
                spellCheck={false}
                className="min-h-80 w-full rounded-md border border-main-300 bg-main-100 px-4 py-3 font-mono text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0"
              />
            </div>

            <div className="rounded-md border border-main-200 bg-main-50 p-4">
              <p className="text-sm font-bold text-main-900">Schema</p>
              <div className="mt-3 space-y-3 text-xs text-main-600">
                <p><span className="font-bold text-main-800">Region:</span> path has 1 item.</p>
                <p><span className="font-bold text-main-800">District:</span> path has region and district.</p>
                <p><span className="font-bold text-main-800">Ward:</span> path has region, district, and ward.</p>
                <p>Existing paths are skipped and returned in the response.</p>
              </div>
              <button
                type="submit"
                disabled={bulkSaving}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <i className={`bi ${bulkSaving ? "bi-arrow-repeat animate-spin" : "bi-upload"}`} aria-hidden="true" />
                {bulkSaving ? "Importing..." : "Validate and import"}
              </button>

              {(bulkError || bulkNotice) && (
                <div
                  className={`mt-4 rounded-md border px-3 py-2 text-sm font-semibold ${
                    bulkError
                      ? "border-danger-300 bg-danger-100 text-danger-700"
                      : "border-success-300 bg-success-100 text-success-700"
                  }`}
                >
                  {bulkError || bulkNotice}
                </div>
              )}

              {bulkResult && (
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-md border border-success-300 bg-success-100 p-2 text-success-700">
                    <p className="font-bold">{bulkResult.meta.created_count ?? 0}</p>
                    <p>Created</p>
                  </div>
                  <div className="rounded-md border border-warning-300 bg-warning-100 p-2 text-warning-700">
                    <p className="font-bold">{bulkResult.meta.skipped_count ?? 0}</p>
                    <p>Skipped</p>
                  </div>
                  <div className="rounded-md border border-danger-300 bg-danger-100 p-2 text-danger-700">
                    <p className="font-bold">{bulkResult.meta.failed_count ?? 0}</p>
                    <p>Failed</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        size="lg"
        className="rounded-md border border-main-300 bg-main-0 p-0 shadow-lg"
      >
        <form onSubmit={(event) => void handleSaveArea(event)}>
          <div className="flex items-center justify-between border-b border-main-200 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-main-500">Area details</p>
              <h2 className="text-xl font-bold text-main-950">{modal?.mode === "edit" ? "Edit area" : "Create area"}</h2>
            </div>
            <button
              type="button"
              onClick={() => setModal(null)}
              className="flex size-9 items-center justify-center rounded-md text-main-500 hover:bg-main-100 hover:text-main-900"
              aria-label="Close"
            >
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>

          <div className="grid gap-4 px-5 py-5">
            {(formError || formNotice) && (
              <div
                className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                  formError
                    ? "border-danger-300 bg-danger-100 text-danger-700"
                    : "border-success-300 bg-success-100 text-success-700"
                }`}
              >
                {formError || formNotice}
              </div>
            )}

            <div>
              <label htmlFor="area-name" className="text-sm font-bold text-main-900">Name</label>
              <input
                id="area-name"
                value={form.name}
                onChange={(event) => {
                  setForm((current) => ({ ...current, name: event.target.value }));
                  setFormError("");
                  setFormNotice("");
                }}
                required
                className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0"
              />
            </div>

            <div>
              <label htmlFor="area-level" className="text-sm font-bold text-main-900">Level</label>
              <select
                id="area-level"
                value={form.level}
                onChange={(event) => {
                  setForm((current) => ({ ...current, level: event.target.value as AreaLevel, parent_id: "" }));
                  setFormError("");
                  setFormNotice("");
                }}
                className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0"
              >
                <option value="region">Region</option>
                <option value="district">District</option>
                <option value="ward">Ward</option>
              </select>
            </div>

            {form.level !== "region" && (
              <div>
                <label htmlFor="area-parent" className="text-sm font-bold text-main-900">Parent</label>
                <select
                  id="area-parent"
                  value={form.parent_id}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, parent_id: event.target.value }));
                    setFormError("");
                    setFormNotice("");
                  }}
                  required
                  className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0"
                >
                  <option value="">Select parent</option>
                  {parentOptions.map((parent) => (
                    <option key={parent.area_id} value={parent.area_id}>
                      {parent.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-main-200 px-5 py-4">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="rounded-md border border-main-300 bg-main-100 px-4 py-2 text-sm font-bold text-main-700 hover:bg-main-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save area"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

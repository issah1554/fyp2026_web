"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HorizontalTabs, type HorizontalTab } from "@/src/components/ui/HorizontalTabs";
import { Modal } from "@/src/components/ui/Modal";
import Pagination from "@/src/components/ui/Pagination";
import { useAuth } from "../../auth/hooks/useAuth";
import type { AuthRole, AuthUser } from "@/src/services/auth/authService";
import {
  createCommodity,
  createCommodityCategory,
  createCommodityUnit,
  deleteCommodity,
  deleteCommodityCategory,
  deleteCommodityUnit,
  listCommodities,
  listCommodityCategories,
  listCommodityUnits,
  updateCommodity,
  updateCommodityCategory,
  updateCommodityUnit,
  type Commodity,
  type CommodityCategory,
  type CommodityFormPayload,
  type CommodityTotals,
  type CommodityUnit,
  type PaginationMeta,
} from "@/src/services/commodities/commodityService";

type CommodityFormState = {
  name: string;
  unit: string;
  unit_id: string;
  description: string;
  category_ids: string[];
};

type CategoryFormState = {
  name: string;
  description: string;
};

type UnitFormState = {
  name: string;
  symbol: string;
  description: string;
};

type CommodityModalState =
  | { mode: "create"; commodity: null }
  | { mode: "edit"; commodity: Commodity };

type CategoryModalState =
  | { mode: "create"; category: null }
  | { mode: "edit"; category: CommodityCategory };

type UnitModalState =
  | { mode: "create"; unit: null }
  | { mode: "edit"; unit: CommodityUnit };

type CatalogTab = "commodities" | "categories" | "units";

const catalogTabs: HorizontalTab<CatalogTab>[] = [
  { id: "commodities", label: "Commodities" },
  { id: "categories", label: "Categories" },
  { id: "units", label: "Units" },
];

const emptyCommodityForm: CommodityFormState = {
  name: "",
  unit: "",
  unit_id: "",
  description: "",
  category_ids: [],
};

const emptyCategoryForm: CategoryFormState = {
  name: "",
  description: "",
};

const emptyUnitForm: UnitFormState = {
  name: "",
  symbol: "",
  description: "",
};

function isAdminUser(user: AuthUser | null) {
  const role = user?.role;
  if (!role) {
    return false;
  }

  if (typeof role === "string") {
    return role.toLowerCase() === "admin";
  }

  const normalizedRole = role as AuthRole;
  return normalizedRole.id === 1 || normalizedRole.name?.toLowerCase() === "admin" || normalizedRole.code === "admin";
}

function normalizeCommodityForm(form: CommodityFormState): CommodityFormPayload {
  return {
    name: form.name.trim(),
    unit: form.unit.trim(),
    unit_id: form.unit_id || null,
    description: form.description.trim(),
    category_ids: form.category_ids,
  };
}

export default function CommoditiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const isAdmin = isAdminUser(user);
  const tabParam = searchParams.get("tab");
  const activeTab: CatalogTab =
    tabParam === "categories" || tabParam === "units" || tabParam === "commodities"
      ? tabParam
      : "commodities";
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [categories, setCategories] = useState<CommodityCategory[]>([]);
  const [units, setUnits] = useState<CommodityUnit[]>([]);
  const [totals, setTotals] = useState<CommodityTotals>({
    total: 0,
    categories: 0,
    units: 0,
    categorized: 0,
    uncategorized: 0,
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
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [pageNotice, setPageNotice] = useState("");
  const [commodityModal, setCommodityModal] = useState<CommodityModalState | null>(null);
  const [commodityForm, setCommodityForm] = useState<CommodityFormState>(emptyCommodityForm);
  const [commodityFormError, setCommodityFormError] = useState("");
  const [commodityFormNotice, setCommodityFormNotice] = useState("");
  const [savingCommodity, setSavingCommodity] = useState(false);
  const [categoryModal, setCategoryModal] = useState<CategoryModalState | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm);
  const [categoryFormError, setCategoryFormError] = useState("");
  const [categoryFormNotice, setCategoryFormNotice] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  const [unitModal, setUnitModal] = useState<UnitModalState | null>(null);
  const [unitForm, setUnitForm] = useState<UnitFormState>(emptyUnitForm);
  const [unitFormError, setUnitFormError] = useState("");
  const [unitFormNotice, setUnitFormNotice] = useState("");
  const [savingUnit, setSavingUnit] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace("/dash");
    }
  }, [authLoading, isAdmin, router]);

  const loadCommodities = useCallback(async () => {
    if (!isAdmin) {
      return;
    }

    setLoading(true);
    setPageError("");
    try {
      const result = await listCommodities({
        page,
        page_size: pageSize,
        search,
        category_id: categoryFilter,
      });
      setCommodities(result.data);
      setPagination(result.pagination);
      setTotals(result.totals);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not load commodities.");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, isAdmin, page, pageSize, search]);

  const loadCategories = useCallback(async () => {
    if (!isAdmin) {
      return;
    }

    try {
      setCategories(await listCommodityCategories());
    } catch {
      setCategories([]);
    }
  }, [isAdmin]);

  const loadUnits = useCallback(async () => {
    if (!isAdmin) {
      return;
    }

    try {
      setUnits(await listCommodityUnits());
    } catch {
      setUnits([]);
    }
  }, [isAdmin]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadCommodities();
      void loadCategories();
      void loadUnits();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadCommodities, loadCategories, loadUnits]);

  const stats = useMemo(
    () => [
      ["Commodities", totals.total, "bi-basket", "bg-main-200 text-main-700"],
      ["Categories", totals.categories, "bi-tags", "bg-primary-100 text-primary-700"],
      ["Units", totals.units, "bi-rulers", "bg-accent-100 text-accent-700"],
      ["Uncategorized", totals.uncategorized, "bi-exclamation-circle", "bg-warning-100 text-warning-700"],
    ],
    [totals],
  );

  const openCreateCommodityModal = () => {
    setCommodityForm(emptyCommodityForm);
    setCommodityModal({ mode: "create", commodity: null });
    setCommodityFormError("");
    setCommodityFormNotice("");
  };

  const openEditCommodityModal = (commodity: Commodity) => {
    setCommodityForm({
      name: commodity.name,
      unit: commodity.unit,
      unit_id: commodity.unit_detail?.unit_id ?? "",
      description: commodity.description,
      category_ids: commodity.categories.map((category) => category.category_id),
    });
    setCommodityModal({ mode: "edit", commodity });
    setCommodityFormError("");
    setCommodityFormNotice("");
  };

  const openCreateCategoryModal = () => {
    setCategoryForm(emptyCategoryForm);
    setCategoryModal({ mode: "create", category: null });
    setCategoryFormError("");
    setCategoryFormNotice("");
  };

  const openCreateUnitModal = () => {
    setUnitForm(emptyUnitForm);
    setUnitModal({ mode: "create", unit: null });
    setUnitFormError("");
    setUnitFormNotice("");
  };

  const openEditUnitModal = (unit: CommodityUnit) => {
    setUnitForm({
      name: unit.name,
      symbol: unit.symbol,
      description: unit.description,
    });
    setUnitModal({ mode: "edit", unit });
    setUnitFormError("");
    setUnitFormNotice("");
  };

  const openEditCategoryModal = (category: CommodityCategory) => {
    setCategoryForm({
      name: category.name,
      description: category.description,
    });
    setCategoryModal({ mode: "edit", category });
    setCategoryFormError("");
    setCategoryFormNotice("");
  };

  const handleSaveCommodity = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!commodityModal) {
      return;
    }

    setSavingCommodity(true);
    setCommodityFormError("");
    setCommodityFormNotice("");
    try {
      const payload = normalizeCommodityForm(commodityForm);
      const result =
        commodityModal.mode === "create"
          ? await createCommodity(payload)
          : await updateCommodity(commodityModal.commodity.commodity_id, payload);
      setCommodityFormNotice(result.message);
      await loadCommodities();
    } catch (error) {
      setCommodityFormError(error instanceof Error ? error.message : "Could not save commodity.");
    } finally {
      setSavingCommodity(false);
    }
  };

  const handleSaveCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!categoryModal) {
      return;
    }

    setSavingCategory(true);
    setCategoryFormError("");
    setCategoryFormNotice("");
    try {
      const payload = {
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim(),
      };
      const result =
        categoryModal.mode === "create"
          ? await createCommodityCategory(payload)
          : await updateCommodityCategory(categoryModal.category.category_id, payload);
      setCategoryFormNotice(result.message);
      await loadCategories();
      await loadCommodities();
    } catch (error) {
      setCategoryFormError(error instanceof Error ? error.message : "Could not save category.");
    } finally {
      setSavingCategory(false);
    }
  };

  const handleSaveUnit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!unitModal) {
      return;
    }

    setSavingUnit(true);
    setUnitFormError("");
    setUnitFormNotice("");
    try {
      const payload = {
        name: unitForm.name.trim(),
        symbol: unitForm.symbol.trim(),
        description: unitForm.description.trim(),
      };
      const result =
        unitModal.mode === "create"
          ? await createCommodityUnit(payload)
          : await updateCommodityUnit(unitModal.unit.unit_id, payload);
      setUnitFormNotice(result.message);
      await loadUnits();
      await loadCommodities();
    } catch (error) {
      setUnitFormError(error instanceof Error ? error.message : "Could not save unit.");
    } finally {
      setSavingUnit(false);
    }
  };

  const handleDeleteCommodity = async (commodity: Commodity) => {
    if (!window.confirm(`Delete ${commodity.name}?`)) {
      return;
    }

    setPageError("");
    setPageNotice("");
    try {
      setPageNotice(await deleteCommodity(commodity.commodity_id));
      await loadCommodities();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not delete commodity.");
    }
  };

  const handleDeleteCategory = async (category: CommodityCategory) => {
    if (!window.confirm(`Delete ${category.name}?`)) {
      return;
    }

    setPageError("");
    setPageNotice("");
    try {
      setPageNotice(await deleteCommodityCategory(category.category_id));
      await loadCategories();
      await loadCommodities();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not delete category.");
    }
  };

  const handleDeleteUnit = async (unit: CommodityUnit) => {
    if (!window.confirm(`Delete ${unit.name}?`)) {
      return;
    }

    setPageError("");
    setPageNotice("");
    try {
      setPageNotice(await deleteCommodityUnit(unit.unit_id));
      await loadUnits();
      await loadCommodities();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not delete unit.");
    }
  };

  const toggleCategory = (categoryId: string) => {
    setCommodityForm((current) => ({
      ...current,
      category_ids: current.category_ids.includes(categoryId)
        ? current.category_ids.filter((id) => id !== categoryId)
        : [...current.category_ids, categoryId],
    }));
    setCommodityFormError("");
    setCommodityFormNotice("");
  };

  if (authLoading || (!authLoading && !isAdmin)) {
    return (
      <div className="flex min-h-96 items-center justify-center text-main-600">
        <span className="size-4 animate-spin rounded-full border-2 border-primary-700 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-4">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-main-500">Commodity Catalog</p>
        </div>
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

      <section className="rounded-md border border-main-200 bg-main-0 shadow-sm">
        <HorizontalTabs tabs={catalogTabs} activeTab={activeTab} basePath="/commodities" className="px-5" />

        <div className="p-5">
        <div className={activeTab === "commodities" ? "" : "hidden"}>
          <div className="flex flex-col gap-3 border-b border-main-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-main-500">Market items</p>
              <h2 className="mt-1 text-xl font-bold text-main-950">Commodities</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,16rem)_12rem_auto]">
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search commodities"
                className="rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm text-main-900 outline-none placeholder:text-main-500 focus:border-primary-500 focus:bg-main-0"
              />
              <select
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value);
                  setPage(1);
                }}
                className="rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.category_id} value={category.category_id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={openCreateCommodityModal}
                className="flex size-9 items-center justify-center rounded-md border border-main-300 bg-main-100 text-main-700 hover:border-primary-300 hover:text-primary-700"
                aria-label="Add commodity"
              >
                <i className="bi bi-plus-lg" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-180 text-left text-sm">
              <thead>
                <tr className="border-b border-main-200 text-xs font-bold uppercase text-main-500">
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Unit</th>
                  <th className="py-3 pr-4">Categories</th>
                  <th className="py-3 pr-4">Commodity ID</th>
                  <th className="py-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-main-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-main-500">
                      <span className="inline-flex items-center gap-2">
                        <span className="size-4 animate-spin rounded-full border-2 border-primary-700 border-t-transparent" />
                        Loading commodities...
                      </span>
                    </td>
                  </tr>
                ) : commodities.length ? (
                  commodities.map((commodity) => (
                    <tr key={commodity.commodity_id} className="hover:bg-main-50">
                      <td className="py-4 pr-4">
                        <p className="font-bold text-main-900">{commodity.name}</p>
                        {commodity.description && (
                          <p className="mt-1 line-clamp-1 text-xs text-main-500">{commodity.description}</p>
                        )}
                      </td>
                      <td className="py-4 pr-4 text-main-700">{commodity.unit || "None"}</td>
                      <td className="py-4 pr-4">
                        <div className="flex max-w-72 flex-wrap gap-1">
                          {commodity.categories.length ? (
                            commodity.categories.map((category) => (
                              <span key={category.category_id} className="rounded-full bg-primary-100 px-2 py-1 text-xs font-bold text-primary-700">
                                {category.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-main-500">Uncategorized</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 pr-4 font-mono text-xs text-main-600">{commodity.commodity_id}</td>
                      <td className="py-4 pr-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditCommodityModal(commodity)}
                            className="flex size-8 items-center justify-center rounded-md border border-main-300 bg-main-100 text-main-700 hover:border-primary-300 hover:text-primary-700"
                            aria-label={`Edit ${commodity.name}`}
                          >
                            <i className="bi bi-pencil-square" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteCommodity(commodity)}
                            className="flex size-8 items-center justify-center rounded-md border border-danger-300 bg-danger-100 text-danger-700 hover:bg-danger-200"
                            aria-label={`Delete ${commodity.name}`}
                          >
                            <i className="bi bi-trash" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-main-500">
                      No commodities found.
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
        </div>

        <div className={activeTab === "categories" ? "" : "hidden"}>
          <div>
            <div className="flex items-center justify-between gap-3 border-b border-main-200 pb-4">
              <div>
                <p className="text-sm font-semibold text-main-500">Grouping</p>
                <h2 className="mt-1 text-xl font-bold text-main-950">Categories</h2>
              </div>
              <button
                type="button"
                onClick={openCreateCategoryModal}
                className="flex size-9 items-center justify-center rounded-md border border-main-300 bg-main-100 text-main-700 hover:border-primary-300 hover:text-primary-700"
                aria-label="Add category"
              >
                <i className="bi bi-plus-lg" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {categories.length ? (
                categories.map((category) => (
                  <div key={category.category_id} className="rounded-md border border-main-200 bg-main-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-main-900">{category.name}</p>
                        {category.description && <p className="mt-1 line-clamp-2 text-xs text-main-500">{category.description}</p>}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => openEditCategoryModal(category)}
                          className="flex size-8 items-center justify-center rounded-md text-main-600 hover:bg-main-100 hover:text-primary-700"
                          aria-label={`Edit ${category.name}`}
                        >
                          <i className="bi bi-pencil" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteCategory(category)}
                          className="flex size-8 items-center justify-center rounded-md text-danger-700 hover:bg-danger-100"
                          aria-label={`Delete ${category.name}`}
                        >
                          <i className="bi bi-trash" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-md border border-main-200 bg-main-50 px-3 py-6 text-center text-sm text-main-500">
                  No categories found.
                </p>
              )}
            </div>
          </div>

        </div>

        <div className={activeTab === "units" ? "" : "hidden"}>
          <div>
            <div className="flex items-center justify-between gap-3 border-b border-main-200 pb-4">
              <div>
                <p className="text-sm font-semibold text-main-500">Measurements</p>
                <h2 className="mt-1 text-xl font-bold text-main-950">Units</h2>
              </div>
              <button
                type="button"
                onClick={openCreateUnitModal}
                className="flex size-9 items-center justify-center rounded-md border border-main-300 bg-main-100 text-main-700 hover:border-primary-300 hover:text-primary-700"
                aria-label="Add unit"
              >
                <i className="bi bi-plus-lg" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {units.length ? (
                units.map((unit) => (
                  <div key={unit.unit_id} className="rounded-md border border-main-200 bg-main-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-main-900">{unit.name}</p>
                        <p className="mt-1 font-mono text-xs font-bold text-accent-700">{unit.symbol}</p>
                        {unit.description && <p className="mt-1 line-clamp-2 text-xs text-main-500">{unit.description}</p>}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => openEditUnitModal(unit)}
                          className="flex size-8 items-center justify-center rounded-md text-main-600 hover:bg-main-100 hover:text-primary-700"
                          aria-label={`Edit ${unit.name}`}
                        >
                          <i className="bi bi-pencil" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteUnit(unit)}
                          className="flex size-8 items-center justify-center rounded-md text-danger-700 hover:bg-danger-100"
                          aria-label={`Delete ${unit.name}`}
                        >
                          <i className="bi bi-trash" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-md border border-main-200 bg-main-50 px-3 py-6 text-center text-sm text-main-500">
                  No units found.
                </p>
              )}
            </div>
          </div>
        </div>
        </div>
      </section>

      <Modal
        open={Boolean(commodityModal)}
        onClose={() => setCommodityModal(null)}
        size="lg"
        className="rounded-md border border-main-300 bg-main-0 p-0 shadow-lg"
      >
        <form onSubmit={(event) => void handleSaveCommodity(event)}>
          <div className="flex items-center justify-between border-b border-main-200 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-main-500">Commodity details</p>
              <h2 className="text-xl font-bold text-main-950">
                {commodityModal?.mode === "edit" ? "Edit commodity" : "Create commodity"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setCommodityModal(null)}
              className="flex size-9 items-center justify-center rounded-md text-main-500 hover:bg-main-100 hover:text-main-900"
              aria-label="Close"
            >
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>

          <div className="grid max-h-[calc(100vh-10rem)] gap-4 overflow-y-auto px-5 py-5">
            {(commodityFormError || commodityFormNotice) && (
              <div
                className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                  commodityFormError
                    ? "border-danger-300 bg-danger-100 text-danger-700"
                    : "border-success-300 bg-success-100 text-success-700"
                }`}
              >
                {commodityFormError || commodityFormNotice}
              </div>
            )}

            <div>
              <label htmlFor="commodity-name" className="text-sm font-bold text-main-900">Name</label>
              <input
                id="commodity-name"
                value={commodityForm.name}
                onChange={(event) => {
                  setCommodityForm((current) => ({ ...current, name: event.target.value }));
                  setCommodityFormError("");
                  setCommodityFormNotice("");
                }}
                required
                className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0"
              />
            </div>

            <div>
              <label htmlFor="commodity-unit" className="text-sm font-bold text-main-900">Unit</label>
              <select
                id="commodity-unit"
                value={commodityForm.unit_id}
                onChange={(event) => {
                  const selectedUnit = units.find((unit) => unit.unit_id === event.target.value);
                  setCommodityForm((current) => ({
                    ...current,
                    unit_id: event.target.value,
                    unit: selectedUnit?.symbol ?? "",
                  }));
                  setCommodityFormError("");
                  setCommodityFormNotice("");
                }}
                className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0"
              >
                <option value="">Select unit</option>
                {units.map((unit) => (
                  <option key={unit.unit_id} value={unit.unit_id}>
                    {unit.name} - {unit.symbol}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="commodity-description" className="text-sm font-bold text-main-900">Description</label>
              <textarea
                id="commodity-description"
                value={commodityForm.description}
                onChange={(event) => {
                  setCommodityForm((current) => ({ ...current, description: event.target.value }));
                  setCommodityFormError("");
                  setCommodityFormNotice("");
                }}
                rows={3}
                className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0"
              />
            </div>

            <div>
              <p className="text-sm font-bold text-main-900">Categories</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {categories.length ? (
                  categories.map((category) => (
                    <label
                      key={category.category_id}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-main-300 bg-main-100 px-3 py-2 text-sm text-main-800 hover:border-primary-300"
                    >
                      <input
                        type="checkbox"
                        checked={commodityForm.category_ids.includes(category.category_id)}
                        onChange={() => toggleCategory(category.category_id)}
                        className="size-4 accent-primary-600"
                      />
                      <span className="font-semibold">{category.name}</span>
                    </label>
                  ))
                ) : (
                  <p className="rounded-md border border-main-200 bg-main-50 px-3 py-3 text-sm text-main-500">
                    Create a category first if this commodity needs one.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-main-200 px-5 py-4">
            <button
              type="button"
              onClick={() => setCommodityModal(null)}
              className="rounded-md border border-main-300 bg-main-100 px-4 py-2 text-sm font-bold text-main-700 hover:bg-main-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingCommodity}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingCommodity ? "Saving..." : "Save commodity"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(categoryModal)}
        onClose={() => setCategoryModal(null)}
        size="lg"
        className="rounded-md border border-main-300 bg-main-0 p-0 shadow-lg"
      >
        <form onSubmit={(event) => void handleSaveCategory(event)}>
          <div className="flex items-center justify-between border-b border-main-200 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-main-500">Category details</p>
              <h2 className="text-xl font-bold text-main-950">
                {categoryModal?.mode === "edit" ? "Edit category" : "Create category"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setCategoryModal(null)}
              className="flex size-9 items-center justify-center rounded-md text-main-500 hover:bg-main-100 hover:text-main-900"
              aria-label="Close"
            >
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>

          <div className="grid gap-4 px-5 py-5">
            {(categoryFormError || categoryFormNotice) && (
              <div
                className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                  categoryFormError
                    ? "border-danger-300 bg-danger-100 text-danger-700"
                    : "border-success-300 bg-success-100 text-success-700"
                }`}
              >
                {categoryFormError || categoryFormNotice}
              </div>
            )}

            <div>
              <label htmlFor="category-name" className="text-sm font-bold text-main-900">Name</label>
              <input
                id="category-name"
                value={categoryForm.name}
                onChange={(event) => {
                  setCategoryForm((current) => ({ ...current, name: event.target.value }));
                  setCategoryFormError("");
                  setCategoryFormNotice("");
                }}
                required
                className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0"
              />
            </div>

            <div>
              <label htmlFor="category-description" className="text-sm font-bold text-main-900">Description</label>
              <textarea
                id="category-description"
                value={categoryForm.description}
                onChange={(event) => {
                  setCategoryForm((current) => ({ ...current, description: event.target.value }));
                  setCategoryFormError("");
                  setCategoryFormNotice("");
                }}
                rows={3}
                className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-main-200 px-5 py-4">
            <button
              type="button"
              onClick={() => setCategoryModal(null)}
              className="rounded-md border border-main-300 bg-main-100 px-4 py-2 text-sm font-bold text-main-700 hover:bg-main-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingCategory}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingCategory ? "Saving..." : "Save category"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(unitModal)}
        onClose={() => setUnitModal(null)}
        size="lg"
        className="rounded-md border border-main-300 bg-main-0 p-0 shadow-lg"
      >
        <form onSubmit={(event) => void handleSaveUnit(event)}>
          <div className="flex items-center justify-between border-b border-main-200 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-main-500">Unit details</p>
              <h2 className="text-xl font-bold text-main-950">
                {unitModal?.mode === "edit" ? "Edit unit" : "Create unit"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setUnitModal(null)}
              className="flex size-9 items-center justify-center rounded-md text-main-500 hover:bg-main-100 hover:text-main-900"
              aria-label="Close"
            >
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>

          <div className="grid gap-4 px-5 py-5">
            {(unitFormError || unitFormNotice) && (
              <div
                className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                  unitFormError
                    ? "border-danger-300 bg-danger-100 text-danger-700"
                    : "border-success-300 bg-success-100 text-success-700"
                }`}
              >
                {unitFormError || unitFormNotice}
              </div>
            )}

            <div>
              <label htmlFor="unit-name" className="text-sm font-bold text-main-900">Name</label>
              <input
                id="unit-name"
                value={unitForm.name}
                onChange={(event) => {
                  setUnitForm((current) => ({ ...current, name: event.target.value }));
                  setUnitFormError("");
                  setUnitFormNotice("");
                }}
                placeholder="Kilogram"
                required
                className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none placeholder:text-main-500 focus:border-primary-500 focus:bg-main-0"
              />
            </div>

            <div>
              <label htmlFor="unit-symbol" className="text-sm font-bold text-main-900">Symbol</label>
              <input
                id="unit-symbol"
                value={unitForm.symbol}
                onChange={(event) => {
                  setUnitForm((current) => ({ ...current, symbol: event.target.value }));
                  setUnitFormError("");
                  setUnitFormNotice("");
                }}
                placeholder="Kg"
                required
                className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none placeholder:text-main-500 focus:border-primary-500 focus:bg-main-0"
              />
            </div>

            <div>
              <label htmlFor="unit-description" className="text-sm font-bold text-main-900">Description</label>
              <textarea
                id="unit-description"
                value={unitForm.description}
                onChange={(event) => {
                  setUnitForm((current) => ({ ...current, description: event.target.value }));
                  setUnitFormError("");
                  setUnitFormNotice("");
                }}
                rows={3}
                className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-sm text-main-900 outline-none focus:border-primary-500 focus:bg-main-0"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-main-200 px-5 py-4">
            <button
              type="button"
              onClick={() => setUnitModal(null)}
              className="rounded-md border border-main-300 bg-main-100 px-4 py-2 text-sm font-bold text-main-700 hover:bg-main-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingUnit}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingUnit ? "Saving..." : "Save unit"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

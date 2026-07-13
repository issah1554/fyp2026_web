import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import Pagination from "./Pagination";

/* =========================================================
   Types
========================================================= */

type Primitive = string | number | boolean | null | undefined;

export type BaseRow = {
  id: number;
  [key: string]: Primitive | ReactNode | unknown[] | Record<string, unknown>;
};

export type Column<T extends BaseRow> = {
  key: keyof T | string; // allows virtual columns
  header: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  priority?: number;
  width?: string | number;
  align?: "left" | "center" | "right";
};

type Props<T extends BaseRow> = {
  data: T[];
  columns: Column<T>[];
  rowsPerPage?: number;
};

/* =========================================================
   Helpers
========================================================= */

function isPrimitive(v: unknown): v is Primitive {
  return (
    typeof v === "string" ||
    typeof v === "number" ||
    typeof v === "boolean" ||
    v == null
  );
}

/* =========================================================
   Component
========================================================= */

export default function CollapsibleTable<T extends BaseRow>({
  data,
  columns,
  rowsPerPage = 5,
}: Props<T>) {
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T;
    direction: "asc" | "desc";
  } | null>(null);

  const [page, setPage] = useState(1);
  const [rowsPerPageOption, setRowsPerPageOption] = useState(rowsPerPage);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);

  // ✅ CRITICAL FIX: start with all columns visible
  const [visibleColumnsCount, setVisibleColumnsCount] = useState(
    columns.length
  );

  const tableRef = useRef<HTMLTableElement>(null);

  /* =======================
     Responsive column logic
  ======================= */

  useEffect(() => {
    const handleResize = () => {
      if (!tableRef.current) return;

      const tableWidth = tableRef.current.offsetWidth;
      if (tableWidth === 0) return; // prevents hidden-table bug

      const minColWidth = 140;
      const maxVisible = Math.max(1, Math.floor(tableWidth / minColWidth));

      setVisibleColumnsCount(Math.min(maxVisible, columns.length));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [columns.length]);

  // Sort columns by priority to determine which to hide first
  // Lower priority values hide first; columns without priority default to their index
  const columnPriorities = useMemo(() => {
    return columns
      .map((col, index) => ({
        index,
        priority: col.priority ?? index,
      }))
      .sort((a, b) => a.priority - b.priority);
  }, [columns]);

  // Get the set of column indices that should be hidden
  const hiddenColumnIndices = useMemo(() => {
    const numToHide = columns.length - visibleColumnsCount;
    if (numToHide <= 0) return new Set<number>();
    // Hide the columns with lowest priority first
    return new Set(columnPriorities.slice(0, numToHide).map(c => c.index));
  }, [columns.length, visibleColumnsCount, columnPriorities]);

  const isColumnHidden = (index: number) => hiddenColumnIndices.has(index);

  const hasHiddenColumns = hiddenColumnIndices.size > 0;

  /* =======================
     Sorting
  ======================= */

  const sortedData = useMemo(() => {
    if (!sortConfig) return [...data];

    return [...data].sort((a, b) => {
      const av = a[sortConfig.key];
      const bv = b[sortConfig.key];

      if (!isPrimitive(av) || !isPrimitive(bv)) return 0;
      if (av == null || bv == null) return 0;

      if (av < bv) return sortConfig.direction === "asc" ? -1 : 1;
      if (av > bv) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const requestSort = (key: keyof T) => {
    setSortConfig(prev =>
      prev?.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  /* =======================
     Search (primitive-only)
  ======================= */

  const filteredData = useMemo(() => {
    const q = search.toLowerCase();

    return sortedData.filter(row =>
      Object.values(row).some(
        v => isPrimitive(v) && String(v).toLowerCase().includes(q)
      )
    );
  }, [sortedData, search]);

  /* =======================
     Pagination
  ======================= */

  const paginatedData = filteredData.slice(
    (page - 1) * rowsPerPageOption,
    page * rowsPerPageOption
  );

  /* =======================
     Expand logic
  ======================= */

  const toggleRow = (id: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllRows = () => {
    setExpandedRows(
      allExpanded ? new Set() : new Set(paginatedData.map(r => r.id))
    );
    setAllExpanded(v => !v);
  };

  /* =======================
     Render
  ======================= */

  return (
    <div className="bg-main-200 backdrop-blur-md rounded-sm border border-main-300 overflow-hidden mt-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center p-4 gap-2">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="rounded-sm min-w-0 max-w-60 px-3 py-1 text-sm text-main-800 ring ring-main-300 focus:ring-main-400 outline-none"
        />

        <select
          value={rowsPerPageOption}
          onChange={e => {
            setRowsPerPageOption(Number(e.target.value));
            setPage(1);
          }}
          className="bg-main-200 text-main-600 text-sm px-3 py-1 rounded-sm ring ring-main-300"
        >
          {[5, 10, 25, 50].map(n => (
            <option key={n} value={n}>
              Rows: {n}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table ref={tableRef} className="min-w-full divide-y divide-main-200">
          <thead className="bg-primary-200 border-y border-primary-300 text-primary-700">
            <tr>
              <th className="px-4 py-2 w-12 ">
                {hasHiddenColumns && (
                  <button
                    onClick={toggleAllRows}
                    title={allExpanded ? "Collapse all" : "Expand all"}
                    className={`transition-transform ${allExpanded ? "text-accent-700" : ""}`} >
                    
                    <i className={`bi ${allExpanded ? "bi-dash-circle ": "bi-plus-circle"} hover:text-accent-700`} />
                  </button>
                )}
              </th>

              {columns.map((col, i) => {
                const canSort = col.sortable && col.key in (data[0] ?? {});
                return (
                  <th
                    key={String(col.key)}
                    onClick={canSort ? () => requestSort(col.key as keyof T) : undefined}
                    className={`px-4 py-2 text-left text-sm font-semibold
                      ${canSort ? "cursor-pointer select-none" : ""}
                      ${isColumnHidden(i) ? "hidden" : ""}`}
                  >
                    {col.header}
                    {canSort && sortConfig?.key === col.key && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-12 text-center text-main-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <i className="bi bi-inbox text-4xl text-main-400" />
                    <p className="text-sm font-medium">No results found</p>
                    {search && (
                      <p className="text-xs text-main-400">
                        Try adjusting your search term
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map(row => {
                const expanded = expandedRows.has(row.id);

                return (
                  <React.Fragment key={row.id}>
                    <tr className={`${expanded ? "bg-main-100 " : "bg-main-200 hover:bg-main-300"} `}>
                      <td className="px-4 py-2">
                        {hasHiddenColumns && (
                          <button onClick={() => toggleRow(row.id)}>
                            <i
                              className={`bi hover:text-accent-700 ${expanded
                                ? "bi-dash-circle"
                                : "bi-plus-circle"
                                }`}
                            />
                          </button>
                        )}
                      </td>

                      {columns.map((col, i) => (
                        <td
                          key={String(col.key)}
                          className={`px-4 py-2 text-sm text-main-700 ${isColumnHidden(i) ? "hidden" : ""}`}
                        >
                          {col.render
                            ? col.render(row)
                            : col.key in row
                              ? (row[col.key as keyof T] as ReactNode)
                              : null}
                        </td>
                      ))}
                    </tr>

                    {expanded && (
                      <tr className="bg-main-100 border-b border-main-300">
                        <td
                          colSpan={visibleColumnsCount + 1}
                          className="px-4 py-2 space-y-1"
                        >
                          {columns.map((col, i) =>
                            isColumnHidden(i) ? (
                              <div key={String(col.key)} className="text-sm text-main-700">
                                <strong>{col.header}:</strong>{" "}
                                {col.render
                                  ? col.render(row)
                                  : col.key in row
                                    ? (row[col.key as keyof T] as ReactNode)
                                    : null}
                              </div>
                            ) : null
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-2 border-t border-main-300">
        <Pagination
          page={page}
          pageSize={rowsPerPageOption}
          totalItems={filteredData.length}
          onChange={setPage}
          showHelper
          size="sm"
          rounded="full"
        />
      </div>
    </div>
  );
}

export type PaginationProps = {
    page: number;              // 1-based
    pageSize: number;
    totalItems: number;
    onChange: (page: number) => void;
    siblingCount?: number;     // pages around current
    disabled?: boolean;
    className?: string;

    showHelper?: boolean;      // show "Showing X–Y of Z"
    helperClassName?: string;

    size?: 'sm' | 'md' | 'lg';       // NEW
    rounded?: 'none' | 'sm' | 'md' | 'full'; // NEW
};

function range(start: number, end: number) {
    const out: number[] = [];
    for (let i = start; i <= end; i++) out.push(i);
    return out;
}

function usePagination({
    page,
    pageSize,
    totalItems,
    siblingCount,
}: Required<Pick<PaginationProps, "page" | "pageSize" | "totalItems" | "siblingCount">>) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);

    const firstPage = 1;
    const lastPage = totalPages;

    const leftSibling = Math.max(safePage - siblingCount, 2);
    const rightSibling = Math.min(safePage + siblingCount, totalPages - 1);

    const pages: (number | "dots")[] = [firstPage];

    if (leftSibling > 2) pages.push("dots");
    pages.push(...range(leftSibling, rightSibling));
    if (rightSibling < totalPages - 1) pages.push("dots");

    if (totalPages > 1) pages.push(lastPage);

    return { pages, totalPages, safePage };
}

export default function Pagination({
    page,
    pageSize,
    totalItems,
    onChange,
    siblingCount = 1,
    disabled = false,
    className = "",
    showHelper = false,
    helperClassName = "",
    size = 'md',
    rounded = 'md',
}: PaginationProps) {
    const { pages, totalPages, safePage } = usePagination({
        page,
        pageSize,
        totalItems,
        siblingCount,
    });

    const canPrev = safePage > 1 && !disabled;
    const canNext = safePage < totalPages && !disabled;

    const startItem =
        totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
    const endItem =
        Math.min(safePage * pageSize, totalItems);

    // size mapping
    const sizeMap = {
        sm: "min-w-7 h-7 text-xs",
        md: "min-w-9 h-9 text-sm",
        lg: "min-w-11 h-11 text-base",
    };

    // rounded mapping
    const roundedMap = {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        full: "rounded-full",
    };

    const btnBase = `inline-flex items-center justify-center border transition ${sizeMap[size]} ${roundedMap[rounded]}`;
    const btn = `${btnBase} border-main-300 bg-main-100 text-main-700 hover:bg-main-200`;
    const btnActive = `${btnBase} border-primary-500 bg-primary-100 text-primary-700`;
    const btnDisabled = `${btnBase} border-main-300 bg-main-100 text-main-400 cursor-not-allowed`;

    return (
        <div className="flex items-center justify-between gap-3">
            {showHelper && (
                <span className={`text-sm text-main-600 ${helperClassName}`}>
                    Showing 
                    <span className="text-primary-700"> {startItem} -  {endItem} </span> of 
                    <span className="text-primary-700"> {totalItems} </span>
                </span>
            )}

            <nav
                className={`flex items-center gap-1 ${className}`}
                aria-label="Pagination"
            >
                <button
                    type="button"
                    className={canPrev ? btn : btnDisabled}
                    onClick={() => canPrev && onChange(safePage - 1)}
                    aria-label="Previous page"
                    disabled={!canPrev}
                >
                    <i className="bi bi-chevron-left" />
                </button>

                {pages.map((p, i) =>
                    p === "dots" ? (
                        <span
                            key={`dots-${i}`}
                            className="px-2 text-main-500"
                        >
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            type="button"
                            className={p === safePage ? btnActive : btn}
                            onClick={() => p !== safePage && onChange(p)}
                            aria-current={p === safePage ? "page" : undefined}
                        >
                            {p}
                        </button>
                    )
                )}

                <button
                    type="button"
                    className={canNext ? btn : btnDisabled}
                    onClick={() => canNext && onChange(safePage + 1)}
                    aria-label="Next page"
                    disabled={!canNext}
                >
                    <i className="bi bi-chevron-right" />
                </button>
            </nav>
        </div>
    );
}

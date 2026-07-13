import React, { useState } from "react";

type AccountStatus = "active" | "inactive" | "frozen" | "closed" | (string & {});

export interface AccountCardProps {
    accountName: string;
    accountNumber: string;
    accountType: string;
    status: AccountStatus;
    balance: number;
    currency?: string;
    className?: string;

    onEdit?: () => void;
    onDelete?: () => void;
}

const statusColors: Record<string, string> = {
    active: "bg-success-100 text-success-700 border-success-300",
    inactive: "bg-main-100 text-main-700 border-main-300",
    frozen: "bg-info-100 text-info-700 border-info-300",
    closed: "bg-danger-100 text-danger-700 border-danger-300",
};

export const AccountCard: React.FC<AccountCardProps> = ({
    accountName,
    accountNumber,
    accountType,
    status,
    balance,
    currency,
    className = "",
    onEdit,
    onDelete
}) => {
    const [menuOpen, setMenuOpen] = useState(false);

    const pillClass =
        statusColors[status.toLowerCase()] || "bg-main-100 text-main-700 border-main-300";

    return (
        <article
            className={`
                relative w-full h-full
                rounded-xl border border-main-300 bg-main-200 shado
                px-5 py-4 flex flex-col gap-3
                ${className}
            `}
        >
            {/* Ellipsis Menu Button */}
            <div className="absolute top-3 right-3">
                <button
                    className="p-1 rounded-full w-8 h-8 hover:bg-main-100 transition"
                    onClick={() => setMenuOpen(v => !v)}
                >
                    <span className="bi bi-three-dots" />
                </button>

                {menuOpen && (
                    <div className="absolute right-0 mt-2 w-32 bg-main-100 shadow-md rounded-lg border border-main-300 z-20 py-3">
                        <button
                            onClick={() => {
                                setMenuOpen(false);
                                onEdit?.();
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-main-300 text-sm"
                        >
                            Edit
                        </button>

                        <button
                            onClick={() => {
                                setMenuOpen(false);
                                onDelete?.();
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-main-300 text-sm text-danger-600"
                        >
                            Delete
                        </button>
                    </div>
                )}
            </div>

            <section className="flex flex-col justify-between gap-3 h-full">

                {/* Top: Name + number + type */}
                <div className="flex flex-col gap-2">
                    {/* Account Name */}
                    <div>
                        <p className="text-main-400 text-xs">Account Name</p>
                        <p className="font-medium text-base truncate">{accountName}</p>
                    </div>

                    {/* Account Number */}
                    <div>
                        <p className="text-main-400 text-xs">Account No.</p>
                        <p className="font-medium text-sm break-all">{accountNumber}</p>
                    </div>

                    {/* Type + Status Row */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-main-400 text-xs">Type</p>
                            <p className="font-medium text-sm">{accountType}</p>
                        </div>

                        <span className={`px-3 py-1 text-[11px] rounded-full border capitalize ${pillClass}`}>
                            {status}
                        </span>
                    </div>
                </div>

                {/* Bottom: Balance */}
                <div>
                    <p className="text-xs text-main-400">Balance</p>
                    <p className="text-2xl font-bold mt-1 flex items-baseline gap-1">
                        {/* Currency (small) */}
                        <span className="text-sm opacity-80">
                            {currency ?? "TZS"}
                        </span>

                        {/* Amount (large) */}
                        <span>
                            {new Intl.NumberFormat(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }).format(balance)}
                        </span>
                    </p>
                </div>

            </section>
        </article>
    );
};

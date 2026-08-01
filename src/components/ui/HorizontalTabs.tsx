// components/navigation/horizontal-tabs.tsx

import Link from "next/link";

export type HorizontalTab<T extends string = string> = {
    id: T;
    label: string;
    disabled?: boolean;
};

type HorizontalTabsProps<T extends string> = {
    tabs: HorizontalTab<T>[];
    activeTab: T;
    basePath: string;
    queryKey?: string;
    className?: string;
};

export function HorizontalTabs<T extends string>({
    tabs,
    activeTab,
    basePath,
    queryKey = "tab",
    className = "",
}: HorizontalTabsProps<T>) {
    return (
        <nav
            aria-label="Tabs"
            className={`flex gap-2 overflow-x-auto border-b border-main-200 ${className}`}
        >
            {tabs.map((tab) => {
                const active = activeTab === tab.id;

                return (
                    <Link
                        key={tab.id}
                        href={`${basePath}?${queryKey}=${encodeURIComponent(tab.id)}`}
                        aria-current={active ? "page" : undefined}
                        aria-disabled={tab.disabled || undefined}
                        tabIndex={tab.disabled ? -1 : undefined}
                        className={[
                            "shrink-0 border-b-2 px-4 py-3 text-sm font-bold transition",
                            active
                                ? "border-primary-600 text-primary-700"
                                : "border-transparent text-main-600 hover:border-main-300 hover:text-main-950",
                            tab.disabled
                                ? "pointer-events-none cursor-not-allowed opacity-50"
                                : "",
                        ].join(" ")}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    );
}
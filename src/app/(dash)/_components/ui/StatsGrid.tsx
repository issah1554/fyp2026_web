import Link from "next/link";

interface StatItem {
    label: string;
    value: string | number;
    change?: string;
    trend?: "up" | "down";
    icon: string;
    color: string;
    bg: string;
    href?: string;
    detail?: string;
}

interface StatsGridProps {
    stats: StatItem[];
}

export default function StatsGrid({ stats }: StatsGridProps) {
    return (
        <div className="@container mb-6">
            <div className="grid grid-cols-1 gap-3 @min-[360px]:grid-cols-1 @min-[520px]:grid-cols-2 @min-[680px]:grid-cols-3 @min-[840px]:grid-cols-4 @min-[1000px]:grid-cols-4 @min-[1160px]:grid-cols-5 @min-[1320px]:grid-cols-5 @min-[1480px]:grid-cols-6 @min-[1640px]:grid-cols-6 @min-[1800px]:grid-cols-7 @min-[1960px]:grid-cols-7">
                {stats.map((stat, index) => (
                    stat.href ? (
                        <Link
                            href={stat.href}
                            prefetch={false}
                            key={index}
                            className="block h-full bg-main-200 rounded-lg shadow-none border border-main-300 p-4 hover:shadow-md transition-shadow"
                        >
                            <StatCard stat={stat} />
                        </Link>
                    ) : (
                        <div
                            key={index}
                            className="h-full bg-main-200 rounded-lg shadow-none border border-main-300 p-4 hover:shadow-md transition-shadow"
                        >
                            <StatCard stat={stat} />
                        </div>
                    )
                ))}
            </div>
        </div>
    );
}

function StatCard({ stat }: Readonly<{ stat: StatItem }>) {
    return (
        <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
                <p className="text-sm text-main-500">
                    {stat.label}
                </p>

                <p className="mt-1 text-2xl font-bold">
                    {stat.value}
                </p>

                {stat.change && stat.trend ? (
                    <p
                        className={`mt-1 flex items-center gap-1 text-xs ${stat.trend === "up"
                            ? "text-success"
                            : "text-danger"
                            }`}
                    >
                        <i
                            className={`bi ${stat.trend === "up"
                                ? "bi-arrow-up"
                                : "bi-arrow-down"
                                }`}
                        />
                        {stat.change} from last week
                    </p>
                ) : null}

                <p className="mt-2 min-h-4 max-w-full truncate text-xs text-main-500">
                    {stat.detail || "\u00a0"}
                </p>
            </div>

            <div
                className={`h-12 w-12 shrink-0 ${stat.bg} rounded-lg flex items-center justify-center`}
            >
                <i
                    className={`bi ${stat.icon} ${stat.color} text-2xl`}
                />
            </div>
        </div>
    );
}

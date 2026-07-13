import Image from "next/image";
import Link from "next/link";

const navigation = [
  { label: "Dashboard", href: "/admin", icon: "bi-grid-1x2-fill", active: true },
  { label: "Market Data", href: "/admin/market-data", icon: "bi-clipboard2-data" },
  { label: "Commodities", href: "/admin/commodities", icon: "bi-basket2" },
  { label: "Users", href: "/admin/users", icon: "bi-people" },
  { label: "Reports", href: "/admin/reports", icon: "bi-file-earmark-bar-graph" },
  { label: "Settings", href: "/admin/settings", icon: "bi-gear" },
];

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen bg-main-100 text-main-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r border-main-200 bg-main-0 lg:flex lg:flex-col">
          <div className="flex h-20 items-center gap-3 border-b border-main-200 px-6">
            <span className="flex size-12 items-center justify-center rounded-md bg-primary-100 p-1.5">
              <Image
                src="/logo.png"
                alt=""
                width={574}
                height={597}
                className="h-full w-full object-contain"
                priority
              />
            </span>
            <div>
              <p className="text-sm font-bold uppercase text-main-950">Marketia</p>
              <p className="text-xs font-semibold text-main-500">Admin Console</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-4 py-5">
            {navigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-md px-4 py-3 text-sm font-bold",
                  item.active
                    ? "bg-primary-600 text-main-0"
                    : "text-main-700 hover:bg-main-100 hover:text-primary-700",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <i className={`bi ${item.icon} text-base`} aria-hidden="true" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-main-200 p-4">
            <div className="rounded-md bg-main-100 p-4">
              <p className="text-sm font-bold text-main-950">Data coverage</p>
              <p className="mt-2 text-sm leading-6 text-main-600">
                Market officers submitted 86% of today&apos;s expected commodity records.
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-main-200 bg-main-0/95 backdrop-blur-sm">
            <div className="flex min-h-20 flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div className="flex items-center justify-between gap-4">
                <Link href="/admin" className="flex items-center gap-3 lg:hidden">
                  <span className="flex size-11 items-center justify-center rounded-md bg-primary-100 p-1.5">
                    <Image
                      src="/logo.png"
                      alt=""
                      width={574}
                      height={597}
                      className="h-full w-full object-contain"
                      priority
                    />
                  </span>
                  <span className="text-sm font-bold uppercase text-main-950">Admin</span>
                </Link>
                <div className="hidden lg:block">
                  <p className="text-sm font-semibold text-main-500">Administration</p>
                  <h1 className="text-2xl font-bold text-main-950">Market Operations Dashboard</h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1 sm:w-80 sm:flex-none">
                  <i
                    className="bi bi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-main-500"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    placeholder="Search records"
                    className="w-full rounded-md border border-main-300 bg-main-50 px-10 py-2.5 text-sm font-medium text-main-900 outline-none placeholder:text-main-500 focus:border-primary-500 focus:bg-main-0"
                  />
                </div>
                <button
                  type="button"
                  className="flex size-11 items-center justify-center rounded-md border border-main-300 bg-main-0 text-main-700 hover:border-primary-400 hover:text-primary-700"
                  aria-label="Notifications"
                >
                  <i className="bi bi-bell" aria-hidden="true" />
                </button>
                <div className="flex size-11 items-center justify-center rounded-md bg-primary-600 text-sm font-bold text-main-0">
                  AD
                </div>
              </div>
            </div>

            <nav className="flex gap-2 overflow-x-auto border-t border-main-200 px-4 py-3 lg:hidden">
              {navigation.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={[
                    "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-bold",
                    item.active
                      ? "bg-primary-600 text-main-0"
                      : "bg-main-100 text-main-700 hover:text-primary-700",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <i className={`bi ${item.icon}`} aria-hidden="true" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>

          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </div>
      </div>
    </main>
  );
}

const summaryCards = [
  {
    label: "Active Markets",
    value: "18",
    change: "+3 this month",
    icon: "bi-shop",
    tone: "primary",
  },
  {
    label: "Price Records",
    value: "12,840",
    change: "+428 today",
    icon: "bi-database-check",
    tone: "accent",
  },
  {
    label: "Pending Reviews",
    value: "34",
    change: "12 high priority",
    icon: "bi-clipboard-check",
    tone: "warning",
  },
  {
    label: "Registered Users",
    value: "4,920",
    change: "+126 this week",
    icon: "bi-people",
    tone: "success",
  },
];

const collectionProgress = [
  { market: "Ifakara Central", commodity: "Rice", progress: "96%", status: "Verified" },
  { market: "Mlimba Market", commodity: "Maize", progress: "88%", status: "Review" },
  { market: "Mang'ula Market", commodity: "Tomatoes", progress: "75%", status: "Pending" },
  { market: "Kidatu Market", commodity: "Beans", progress: "92%", status: "Verified" },
];

const alerts = [
  {
    title: "Rice price variance",
    detail: "Ifakara Central is 14% above the weekly district average.",
    icon: "bi-graph-up-arrow",
  },
  {
    title: "Incomplete officer submissions",
    detail: "Three assigned markets have not completed afternoon updates.",
    icon: "bi-exclamation-triangle",
  },
  {
    title: "USSD usage spike",
    detail: "Commodity lookup sessions increased by 22% since yesterday.",
    icon: "bi-phone",
  },
];

const forecastRows = [
  { commodity: "Rice", direction: "Rising", confidence: "89%", price: "TZS 2,850" },
  { commodity: "Maize", direction: "Stable", confidence: "82%", price: "TZS 1,120" },
  { commodity: "Beans", direction: "Rising", confidence: "77%", price: "TZS 3,400" },
  { commodity: "Tomatoes", direction: "Falling", confidence: "73%", price: "TZS 1,650" },
];

function getToneClass(tone: string) {
  const tones: Record<string, string> = {
    primary: "bg-primary-100 text-primary-700",
    accent: "bg-accent-100 text-accent-700",
    warning: "bg-warning-100 text-warning-700",
    success: "bg-success-100 text-success-700",
  };

  return tones[tone] ?? tones.primary;
}

function getStatusClass(status: string) {
  const statuses: Record<string, string> = {
    Verified: "bg-success-100 text-success-700",
    Review: "bg-warning-100 text-warning-700",
    Pending: "bg-pending-100 text-pending-700",
  };

  return statuses[status] ?? "bg-main-100 text-main-700";
}

function getDirectionClass(direction: string) {
  const directions: Record<string, string> = {
    Rising: "text-success-700",
    Stable: "text-accent-700",
    Falling: "text-danger-600",
  };

  return directions[direction] ?? "text-main-700";
}

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col gap-4 lg:hidden">
        <p className="text-sm font-semibold text-main-500">Administration</p>
        <h1 className="text-2xl font-bold text-main-950">Market Operations Dashboard</h1>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article key={card.label} className="rounded-lg border border-main-200 bg-main-0 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-main-500">{card.label}</p>
                <p className="mt-3 text-3xl font-bold text-main-950">{card.value}</p>
              </div>
              <div className={`flex size-11 items-center justify-center rounded-md ${getToneClass(card.tone)}`}>
                <i className={`bi ${card.icon}`} aria-hidden="true" />
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold text-main-600">{card.change}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-lg border border-main-200 bg-main-0 p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-main-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-main-500">Today&apos;s collection</p>
              <h2 className="mt-1 text-xl font-bold text-main-950">Market Data Progress</h2>
            </div>
            <button
              type="button"
              className="flex w-fit items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700"
            >
              <i className="bi bi-plus-circle" aria-hidden="true" />
              Add record
            </button>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-160 text-left text-sm">
              <thead>
                <tr className="border-b border-main-200 text-xs font-bold uppercase text-main-500">
                  <th className="py-3 pr-4">Market</th>
                  <th className="py-3 pr-4">Commodity</th>
                  <th className="py-3 pr-4">Completion</th>
                  <th className="py-3 pr-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-main-200">
                {collectionProgress.map((item) => (
                  <tr key={`${item.market}-${item.commodity}`}>
                    <td className="py-4 pr-4 font-bold text-main-900">{item.market}</td>
                    <td className="py-4 pr-4 text-main-700">{item.commodity}</td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-28 rounded-full bg-main-200">
                          <div
                            className={[
                              "h-2 rounded-full bg-primary-600",
                              item.progress === "96%" && "w-[96%]",
                              item.progress === "88%" && "w-[88%]",
                              item.progress === "75%" && "w-3/4",
                              item.progress === "92%" && "w-[92%]",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          />
                        </div>
                        <span className="font-semibold text-main-700">{item.progress}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-main-200 bg-main-0 p-5 shadow-sm">
          <p className="text-sm font-semibold text-main-500">Operational alerts</p>
          <h2 className="mt-1 text-xl font-bold text-main-950">Needs Attention</h2>
          <div className="mt-5 space-y-4">
            {alerts.map((alert) => (
              <article key={alert.title} className="rounded-md border border-main-200 bg-main-50 p-4">
                <div className="flex gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-warning-100 text-warning-700">
                    <i className={`bi ${alert.icon}`} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-bold text-main-950">{alert.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-main-600">{alert.detail}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-main-200 bg-main-950 p-5 text-main-0 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-main-300">Analytics health</p>
              <h2 className="mt-1 text-xl font-bold text-main-0">Prediction Pipeline</h2>
            </div>
            <span className="rounded-full bg-success-100 px-3 py-1 text-xs font-bold text-success-700">
              Running
            </span>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {["Ingest", "Clean", "Predict"].map((step, index) => (
              <div key={step} className="rounded-md border border-main-800 bg-main-900 p-4">
                <p className="text-xs font-bold uppercase text-main-400">Step {index + 1}</p>
                <p className="mt-2 font-bold text-main-0">{step}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex h-32 items-end gap-2">
            {["h-12", "h-16", "h-20", "h-14", "h-24", "h-28", "h-18", "h-32"].map((height, index) => (
              <div key={`${height}-${index}`} className="flex flex-1 items-end rounded-t-md bg-primary-800">
                <div className={`w-full rounded-t-md bg-accent-400 ${height}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-main-200 bg-main-0 p-5 shadow-sm">
          <div className="border-b border-main-200 pb-4">
            <p className="text-sm font-semibold text-main-500">Forecast snapshot</p>
            <h2 className="mt-1 text-xl font-bold text-main-950">Commodity Outlook</h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {forecastRows.map((row) => (
              <article key={row.commodity} className="rounded-md border border-main-200 bg-main-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-main-950">{row.commodity}</h3>
                    <p className="mt-1 text-sm text-main-600">Predicted average price</p>
                  </div>
                  <i className={`bi bi-arrow-up-right-circle ${getDirectionClass(row.direction)}`} aria-hidden="true" />
                </div>
                <p className="mt-4 text-2xl font-bold text-main-950">{row.price}</p>
                <div className="mt-4 flex items-center justify-between text-sm font-semibold">
                  <span className={getDirectionClass(row.direction)}>{row.direction}</span>
                  <span className="text-main-600">{row.confidence} confidence</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

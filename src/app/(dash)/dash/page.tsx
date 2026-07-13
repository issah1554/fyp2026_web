const metrics = [
  { label: "Active markets", value: "18", detail: "3 added this month", icon: "bi-shop" },
  { label: "Daily price records", value: "428", detail: "86% collection coverage", icon: "bi-database-check" },
  { label: "Pending reviews", value: "34", detail: "12 high priority", icon: "bi-clipboard-check" },
  { label: "USSD sessions", value: "2,184", detail: "22% above yesterday", icon: "bi-phone" },
];

const marketRows = [
  { market: "Ifakara Central", commodity: "Rice", status: "Verified", price: "TZS 2,850" },
  { market: "Mlimba Market", commodity: "Maize", status: "Review", price: "TZS 1,120" },
  { market: "Mang'ula Market", commodity: "Tomatoes", status: "Pending", price: "TZS 1,650" },
  { market: "Kidatu Market", commodity: "Beans", status: "Verified", price: "TZS 3,400" },
];

function getStatusClass(status: string) {
  const statuses: Record<string, string> = {
    Verified: "bg-success-100 text-success-700",
    Review: "bg-warning-100 text-warning-700",
    Pending: "bg-pending-100 text-pending-700",
  };

  return statuses[status] ?? "bg-main-100 text-main-700";
}

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-4">
      <section className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-main-500">Operations</p>
        <h1 className="text-2xl font-bold text-main-950 sm:text-3xl">Market Dashboard</h1>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-md border border-main-200 bg-main-0 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-main-500">{metric.label}</p>
                <p className="mt-3 text-3xl font-bold text-main-950">{metric.value}</p>
              </div>
              <span className="flex size-11 items-center justify-center rounded-md bg-primary-100 text-primary-700">
                <i className={`bi ${metric.icon}`} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 text-sm font-semibold text-main-600">{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-md border border-main-200 bg-main-0 p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-main-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-main-500">Today&apos;s submissions</p>
              <h2 className="mt-1 text-xl font-bold text-main-950">Market Price Records</h2>
            </div>
            <button type="button" className="flex w-fit items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700">
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
                  <th className="py-3 pr-4">Price</th>
                  <th className="py-3 pr-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-main-200">
                {marketRows.map((row) => (
                  <tr key={`${row.market}-${row.commodity}`}>
                    <td className="py-4 pr-4 font-bold text-main-900">{row.market}</td>
                    <td className="py-4 pr-4 text-main-700">{row.commodity}</td>
                    <td className="py-4 pr-4 font-semibold text-main-900">{row.price}</td>
                    <td className="py-4 pr-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-md border border-main-200 bg-main-0 p-5 shadow-sm">
          <p className="text-sm font-semibold text-main-500">Prediction pipeline</p>
          <h2 className="mt-1 text-xl font-bold text-main-950">Analytics Health</h2>
          <div className="mt-6 space-y-3">
            {["Ingest market data", "Clean outliers", "Generate forecasts"].map((step, index) => (
              <div key={step} className="flex items-center gap-3 rounded-md border border-main-200 bg-main-50 p-4">
                <span className="flex size-9 items-center justify-center rounded-md bg-accent-100 text-sm font-bold text-accent-700">
                  {index + 1}
                </span>
                <span className="font-semibold text-main-800">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

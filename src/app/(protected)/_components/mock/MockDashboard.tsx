"use client";

import { useEffect, useState } from "react";

type ShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

type FieldRecord = {
  officer: string;
  commodity: string;
  market: string;
  area: string;
  wholesale: string;
  retail: string;
  date: string;
  status: string;
};

type ValidationRecord = {
  id: string;
  commodity: string;
  market: string;
  submitted: string;
  average: string;
  variance: string;
  officer: string;
  status: "Flagged" | "Approved" | "Rejected";
};

const fieldRecords: FieldRecord[] = [
  { officer: "Asha Msuya", commodity: "Rice", market: "Ifakara Central", area: "Kilombero", wholesale: "TZS 2,720", retail: "TZS 2,950", date: "20 Jul 2026", status: "Synced" },
  { officer: "Peter Kato", commodity: "Maize", market: "Mlimba Market", area: "Mlimba", wholesale: "TZS 1,040", retail: "TZS 1,180", date: "20 Jul 2026", status: "Draft" },
  { officer: "Neema Issa", commodity: "Beans", market: "Kidatu Market", area: "Kidatu", wholesale: "TZS 3,200", retail: "TZS 3,480", date: "19 Jul 2026", status: "Reviewed" },
];

const validationRows: ValidationRecord[] = [
  { id: "VAL-1029", commodity: "Rice", market: "Mang'ula", submitted: "TZS 4,480", average: "TZS 2,940", variance: "+52%", officer: "Asha Msuya", status: "Flagged" },
  { id: "VAL-1030", commodity: "Tomatoes", market: "Ifakara", submitted: "TZS 2,750", average: "TZS 1,780", variance: "+54%", officer: "Peter Kato", status: "Flagged" },
  { id: "VAL-1031", commodity: "Maize", market: "Mlimba", submitted: "TZS 690", average: "TZS 1,120", variance: "-38%", officer: "Neema Issa", status: "Flagged" },
];

const forecastData = {
  Rice: [2850, 2920, 3060, 3210, 3330, 3410],
  Maize: [1120, 1140, 1180, 1230, 1260, 1290],
  Beans: [3400, 3480, 3600, 3740, 3890, 4020],
};

function statusClass(status: string) {
  const styles: Record<string, string> = {
    Approved: "bg-success-100 text-success-700",
    Rejected: "bg-danger-100 text-danger-700",
    Flagged: "bg-warning-100 text-warning-700",
    Synced: "bg-success-100 text-success-700",
    Draft: "bg-warning-100 text-warning-700",
    Reviewed: "bg-accent-100 text-accent-700",
    Online: "bg-success-100 text-success-700",
    Degraded: "bg-warning-100 text-warning-700",
  };

  return styles[status] ?? "bg-main-100 text-main-700";
}

function PageShell({ eyebrow, title, description, action, children }: ShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-4">
      <section className="flex flex-col gap-4 rounded-md border border-main-200 bg-main-100/80 p-5 shadow-sm backdrop-blur md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase text-primary-700">{eyebrow}</p>
          <h1 className="mt-2 text-2xl font-bold text-main-950 sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-main-600">{description}</p>
        </div>
        {action}
      </section>
      {children}
    </div>
  );
}

function StatCard({ label, value, icon, detail }: { label: string; value: string; icon: string; detail: string }) {
  return (
    <div className="rounded-md border border-main-200 bg-main-100 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-main-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-main-950">{value}</p>
        </div>
        <span className="flex size-10 items-center justify-center rounded-md bg-primary-100 text-primary-700">
          <i className={`bi ${icon}`} />
        </span>
      </div>
      <p className="mt-4 text-sm text-main-600">{detail}</p>
    </div>
  );
}

function SparkLine({ values }: { values: number[] }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100;
    const y = 92 - ((value - min) / (max - min || 1)) * 76;
    return `${x},${y}`;
  });

  return (
    <svg viewBox="0 0 100 100" className="h-56 w-full" role="img" aria-label="Forecast line chart">
      <polyline fill="none" stroke="currentColor" strokeWidth="3" points={points.join(" ")} className="text-primary-600" />
      {points.map((point) => {
        const [cx, cy] = point.split(",");
        return <circle key={point} cx={cx} cy={cy} r="2.8" className="fill-accent-600" />;
      })}
    </svg>
  );
}

export function MarketDataPage() {
  const [records, setRecords] = useState(fieldRecords);
  const [open, setOpen] = useState(false);

  return (
    <PageShell
      eyebrow="Field collection"
      title="Field Market Data Records"
      description="Review market officer submissions for daily wholesale and retail prices before validation."
      action={<button type="button" onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700"><i className="bi bi-plus-circle" /> Add Field Observation</button>}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Today submissions" value="86" icon="bi-clipboard-data" detail="18 markets reported by 14 officers" />
        <StatCard label="Coverage" value="91%" icon="bi-broadcast-pin" detail="Kilombero zone has the strongest coverage" />
        <StatCard label="Needs review" value="12" icon="bi-exclamation-triangle" detail="Mostly retail prices outside expected bands" />
      </div>
      <DataTable headers={["Officer", "Commodity", "Market", "Wholesale", "Retail", "Date", "Status"]}>
        {records.map((record) => (
          <tr key={`${record.officer}-${record.commodity}-${record.date}`} className="border-b border-main-200">
            <td className="py-4 pr-4 font-bold text-main-900">{record.officer}</td>
            <td className="py-4 pr-4 text-main-700">{record.commodity}</td>
            <td className="py-4 pr-4 text-main-700">{record.market}, {record.area}</td>
            <td className="py-4 pr-4 font-semibold text-main-900">{record.wholesale}</td>
            <td className="py-4 pr-4 font-semibold text-main-900">{record.retail}</td>
            <td className="py-4 pr-4 text-main-600">{record.date}</td>
            <td className="py-4 pr-4"><Badge status={record.status} /></td>
          </tr>
        ))}
      </DataTable>
      {open && (
        <MockModal title="Add Field Observation" onClose={() => setOpen(false)}>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Commodity", "Market", "Wholesale price", "Retail price"].map((label) => (
              <label key={label} className="text-sm font-semibold text-main-700">{label}<input className="mt-1 w-full rounded-md border border-main-300 bg-main-100 px-3 py-2 text-main-900 outline-none focus:border-primary-600" /></label>
            ))}
          </div>
          <button type="button" onClick={() => { setRecords([{ officer: "Local Officer", commodity: "Rice", market: "Ruaha Market", area: "Kilombero", wholesale: "TZS 2,860", retail: "TZS 3,020", date: "20 Jul 2026", status: "Draft" }, ...records]); setOpen(false); }} className="mt-5 w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700">Save observation</button>
        </MockModal>
      )}
    </PageShell>
  );
}

export function ValidationsPage() {
  const [rows, setRows] = useState(validationRows);
  const setStatus = (id: string, status: ValidationRecord["status"]) => setRows((current) => current.map((row) => row.id === id ? { ...row, status } : row));

  return (
    <PageShell eyebrow="Quality assurance" title="Price Validation & Outliers Audit" description="Audit prices that diverge from moving averages before they enter decision-support reports.">
      <DataTable headers={["Case", "Commodity", "Market", "Submitted", "Moving avg", "Variance", "Officer", "Status", "Action"]}>
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-main-200">
            <td className="py-4 pr-4 font-bold text-main-900">{row.id}</td>
            <td className="py-4 pr-4 text-main-700">{row.commodity}</td>
            <td className="py-4 pr-4 text-main-700">{row.market}</td>
            <td className="py-4 pr-4 font-semibold text-main-900">{row.submitted}</td>
            <td className="py-4 pr-4 text-main-600">{row.average}</td>
            <td className="py-4 pr-4 font-bold text-warning-700">{row.variance}</td>
            <td className="py-4 pr-4 text-main-700">{row.officer}</td>
            <td className="py-4 pr-4"><Badge status={row.status} /></td>
            <td className="py-4 pr-4"><div className="flex gap-2"><button onClick={() => setStatus(row.id, "Approved")} className="rounded-md bg-success-100 px-3 py-1 text-xs font-bold text-success-700" type="button">Approve</button><button onClick={() => setStatus(row.id, "Rejected")} className="rounded-md bg-danger-100 px-3 py-1 text-xs font-bold text-danger-700" type="button">Reject</button></div></td>
          </tr>
        ))}
      </DataTable>
    </PageShell>
  );
}

export function ScrapersPage() {
  const [running, setRunning] = useState(false);
  const logs = running ? ["Connecting to marketplace feeds...", "Parsing rice and maize listings...", "Normalizing TZS price units...", "Queued 248 records for review."] : ["Last run completed at 08:45", "No critical parser errors", "Next scheduled run in 2 hours"];

  return (
    <PageShell eyebrow="Integrations" title="Web Scraping & Integrations" description="Monitor external collection jobs for social media, online marketplaces, and public price APIs." action={<button onClick={() => { setRunning(true); window.setTimeout(() => setRunning(false), 2200); }} className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700" type="button">{running && <span className="size-4 animate-spin rounded-full border-2 border-main-0 border-t-transparent" />} Run Scraper Now</button>}>
      <div className="grid gap-4 md:grid-cols-3">
        {["Social Media", "Online Marketplaces", "Public APIs"].map((name, index) => <StatCard key={name} label={name} value={index === 1 ? "Degraded" : "Online"} icon={index === 0 ? "bi-chat-dots" : index === 1 ? "bi-bag-check" : "bi-cloud-check"} detail={index === 1 ? "Parser latency above threshold" : "Feed active and authenticated"} />)}
      </div>
      <div className="rounded-md border border-main-200 bg-main-950 p-5 font-mono text-sm text-primary-200 shadow-sm">
        {logs.map((line) => <div key={line} className="py-1"><span className="text-accent-400">$</span> {line}</div>)}
      </div>
    </PageShell>
  );
}

export function ForecastingPage() {
  const [commodity, setCommodity] = useState<keyof typeof forecastData>("Rice");
  const [range, setRange] = useState(60);
  const values = forecastData[commodity];

  return (
    <PageShell eyebrow="AI insights" title="AI Market Analysis & Price Forecasting" description="Compare short-range forecast scenarios and surface recommended selling windows for decision makers.">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-md border border-main-200 bg-main-100 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-main-950">{commodity} price forecast</h2>
            <div className="flex flex-wrap gap-2">{Object.keys(forecastData).map((item) => <button key={item} onClick={() => setCommodity(item as keyof typeof forecastData)} className={`rounded-md px-3 py-2 text-sm font-bold ${commodity === item ? "bg-primary-600 text-main-0" : "bg-main-100 text-main-700"}`} type="button">{item}</button>)}</div>
          </div>
          <SparkLine values={values} />
          <div className="flex gap-2">{[30, 60, 90].map((days) => <button key={days} onClick={() => setRange(days)} className={`rounded-md px-3 py-2 text-sm font-bold ${range === days ? "bg-accent-100 text-accent-700" : "bg-main-100 text-main-700"}`} type="button">{days} days</button>)}</div>
        </div>
        <div className="space-y-4">
          {["Best Time to Sell: Rice prices in Kilombero predicted to rise by 14%", "Inventory Alert: Beans demand is strengthening near Kidatu", "Procurement Note: Maize remains stable for school feeding tenders"].map((text) => <div key={text} className="rounded-md border border-main-200 bg-main-100 p-5 shadow-sm"><p className="text-sm font-bold text-primary-700">AI recommendation</p><p className="mt-2 text-main-800">{text}</p></div>)}
        </div>
      </div>
    </PageShell>
  );
}

export function ReportsPage() {
  return (
    <PageShell eyebrow="Decision support" title="Reports & Decision Support Exports" description="Prepare leadership-ready market intelligence packs with forecast, validation, and collection coverage sections." action={<div className="flex gap-2"><button className="rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0" type="button"><i className="bi bi-filetype-pdf" /> PDF</button><button className="rounded-md bg-accent-600 px-4 py-2 text-sm font-bold text-main-0" type="button"><i className="bi bi-file-earmark-spreadsheet" /> Excel</button></div>}>
      <div className="grid gap-4 md:grid-cols-3"><StatCard label="Ready exports" value="12" icon="bi-file-earmark-check" detail="Weekly briefs and district summaries" /><StatCard label="Recipients" value="37" icon="bi-send-check" detail="Government, traders, and extension officers" /><StatCard label="Last package" value="Jul 20" icon="bi-calendar-check" detail="Kilombero price outlook sent today" /></div>
      <div className="rounded-md border border-main-200 bg-main-100 p-5 shadow-sm"><h2 className="text-lg font-bold text-main-950">Export builder</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{["Commodity trends", "Outlier decisions", "Market coverage", "AI recommendations"].map((item) => <label key={item} className="flex items-center gap-3 rounded-md border border-main-200 bg-main-50 p-3 text-sm font-semibold text-main-700"><input type="checkbox" defaultChecked className="size-4 accent-primary-600" /> {item}</label>)}</div></div>
    </PageShell>
  );
}

export function InsightsPage() {
  const reportQueue = [
    { name: "Weekly commodity bulletin", audience: "Policy & extension teams", schedule: "Every Monday, 08:00", status: "Approved" },
    { name: "District price variance digest", audience: "Regional market officers", schedule: "Daily, 17:30", status: "Reviewed" },
    { name: "Buyer readiness brief", audience: "Large buyers & aggregators", schedule: "On demand", status: "Draft" },
  ];

  const decisionSignals = [
    {
      title: "Rice supply tightening in Kilombero",
      impact: "Wholesale prices are trending upward across three markets.",
      action: "Prioritize restocking alerts and highlight high-confidence selling windows in tomorrow's bulletin.",
    },
    {
      title: "Maize prices stabilizing after validation cleanup",
      impact: "Outlier submissions dropped and district averages are converging.",
      action: "Promote the stable trend in dashboard snapshots and reduce exception-review volume.",
    },
    {
      title: "Beans demand pulse increasing in feeder markets",
      impact: "Two surrounding markets show stronger retail pull than the district baseline.",
      action: "Surface this as a decision note for traders comparing destination markets.",
    },
  ];

  const dashboardModules = [
    { name: "Executive dashboard", detail: "High-level KPIs, market coverage, price movement, and alert volumes.", tone: "primary", icon: "bi-speedometer2" },
    { name: "Analytical visualizations", detail: "Trend charts, variance maps, and commodity comparison views for analysts.", tone: "accent", icon: "bi-bar-chart-line" },
    { name: "Decision support cards", detail: "Recommended actions, emerging risks, and market opportunities for operations teams.", tone: "warning", icon: "bi-lightbulb" },
  ];

  const toneClass: Record<string, string> = {
    primary: "bg-primary-100 text-primary-700",
    accent: "bg-accent-100 text-accent-700",
    warning: "bg-warning-100 text-warning-700",
  };

  return (
    <PageShell
      eyebrow="Insight subsystem"
      title="Reporting, Visualization, and Decision Support"
      description="Generate structured reports, interactive dashboards, and analytical decision signals from validated market intelligence so officers, managers, and stakeholders can act faster."
      action={
        <div className="flex flex-wrap gap-2">
          <button className="rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700" type="button">
            <i className="bi bi-file-earmark-pdf" /> Generate report
          </button>
          <button className="rounded-md bg-accent-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-accent-700" type="button">
            <i className="bi bi-sliders" /> Open dashboard
          </button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Scheduled reports" value="12" icon="bi-file-earmark-text" detail="Automated briefs and stakeholder-ready outputs." />
        <StatCard label="Live dashboards" value="5" icon="bi-grid-1x2" detail="Operational, analytical, and executive monitoring views." />
        <StatCard label="Decision alerts" value="18" icon="bi-bell" detail="Priority signals waiting for review or distribution." />
        <StatCard label="Insight confidence" value="87%" icon="bi-patch-check" detail="Average confidence across active analytical recommendations." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-md border border-main-200 bg-main-100 p-5 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-main-200 pb-4">
            <p className="text-sm font-bold uppercase text-primary-700">Subsystem modules</p>
            <h2 className="text-xl font-bold text-main-950">What the insights workspace delivers</h2>
          </div>
          <div className="mt-5 grid gap-4">
            {dashboardModules.map((module) => (
              <article key={module.name} className="rounded-md border border-main-200 bg-main-50 p-4">
                <div className="flex items-start gap-4">
                  <span className={`flex size-11 shrink-0 items-center justify-center rounded-md ${toneClass[module.tone]}`}>
                    <i className={`bi ${module.icon}`} />
                  </span>
                  <div>
                    <h3 className="font-bold text-main-950">{module.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-main-600">{module.detail}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-main-200 bg-main-950 p-5 text-main-0 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-main-300">Visualization focus</p>
              <h2 className="mt-1 text-xl font-bold text-main-0">Analytical trend canvas</h2>
            </div>
            <span className="rounded-full bg-success-100 px-3 py-1 text-xs font-bold text-success-700">Live</span>
          </div>
          <div className="mt-6 space-y-4">
            <SparkLine values={[118, 126, 124, 139, 148, 154, 162]} />
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-md bg-main-900 p-3">
                <p className="text-main-400">Commodity trend</p>
                <p className="mt-2 font-bold text-main-0">Upward</p>
              </div>
              <div className="rounded-md bg-main-900 p-3">
                <p className="text-main-400">Variance hotspots</p>
                <p className="mt-2 font-bold text-main-0">3 markets</p>
              </div>
              <div className="rounded-md bg-main-900 p-3">
                <p className="text-main-400">Dashboard refresh</p>
                <p className="mt-2 font-bold text-main-0">15 min</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-md border border-main-200 bg-main-100 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-main-200 pb-4">
            <div>
              <p className="text-sm font-bold uppercase text-primary-700">Reporting center</p>
              <h2 className="text-xl font-bold text-main-950">Report queue and distribution plan</h2>
            </div>
            <button className="rounded-md bg-main-950 px-4 py-2 text-sm font-bold text-main-0" type="button">
              <i className="bi bi-send" /> Publish
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-160 text-left text-sm">
              <thead>
                <tr className="border-b border-main-200 text-xs font-bold uppercase text-main-500">
                  <th className="py-3 pr-4">Report</th>
                  <th className="py-3 pr-4">Audience</th>
                  <th className="py-3 pr-4">Schedule</th>
                  <th className="py-3 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {reportQueue.map((report) => (
                  <tr key={report.name} className="border-b border-main-200">
                    <td className="py-4 pr-4 font-bold text-main-950">{report.name}</td>
                    <td className="py-4 pr-4 text-main-700">{report.audience}</td>
                    <td className="py-4 pr-4 text-main-600">{report.schedule}</td>
                    <td className="py-4 pr-4">
                      <Badge status={report.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-md border border-main-200 bg-main-100 p-5 shadow-sm">
          <div className="border-b border-main-200 pb-4">
            <p className="text-sm font-bold uppercase text-primary-700">Decision support</p>
            <h2 className="text-xl font-bold text-main-950">Analytical insights ready for action</h2>
          </div>
          <div className="mt-5 space-y-4">
            {decisionSignals.map((signal) => (
              <article key={signal.title} className="rounded-md border border-main-200 bg-main-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-main-950">{signal.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-main-600">{signal.impact}</p>
                    <p className="mt-3 rounded-md bg-accent-50 px-3 py-3 text-sm font-semibold text-main-800">
                      Recommended action: {signal.action}
                    </p>
                  </div>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-warning-100 text-warning-700">
                    <i className="bi bi-lightning-charge" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Badge({ status }: { status: string }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(status)}`}>{status}</span>;
}

function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-md border border-main-200 bg-main-100 p-5 shadow-sm">
      <table className="w-full min-w-220 text-left text-sm">
        <thead><tr className="border-b border-main-200 text-xs font-bold uppercase text-main-500">{headers.map((header) => <th key={header} className="py-3 pr-4">{header}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function MockModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-main-950/70 p-4">
      <div className="w-full max-w-2xl rounded-md border border-main-200 bg-main-100 p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold text-main-950">{title}</h2><button onClick={onClose} className="text-main-500 hover:text-danger-600" type="button"><i className="bi bi-x-lg" /></button></div>
        {children}
      </div>
    </div>
  );
}

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
      <section className="flex flex-col gap-4 rounded-md border border-main-200 bg-main-0/80 p-5 shadow-sm backdrop-blur md:flex-row md:items-end md:justify-between">
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
    <div className="rounded-md border border-main-200 bg-main-0 p-5 shadow-sm">
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
              <label key={label} className="text-sm font-semibold text-main-700">{label}<input className="mt-1 w-full rounded-md border border-main-300 bg-main-0 px-3 py-2 text-main-900 outline-none focus:border-primary-600" /></label>
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
        <div className="rounded-md border border-main-200 bg-main-0 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-main-950">{commodity} price forecast</h2>
            <div className="flex flex-wrap gap-2">{Object.keys(forecastData).map((item) => <button key={item} onClick={() => setCommodity(item as keyof typeof forecastData)} className={`rounded-md px-3 py-2 text-sm font-bold ${commodity === item ? "bg-primary-600 text-main-0" : "bg-main-100 text-main-700"}`} type="button">{item}</button>)}</div>
          </div>
          <SparkLine values={values} />
          <div className="flex gap-2">{[30, 60, 90].map((days) => <button key={days} onClick={() => setRange(days)} className={`rounded-md px-3 py-2 text-sm font-bold ${range === days ? "bg-accent-100 text-accent-700" : "bg-main-100 text-main-700"}`} type="button">{days} days</button>)}</div>
        </div>
        <div className="space-y-4">
          {["Best Time to Sell: Rice prices in Kilombero predicted to rise by 14%", "Inventory Alert: Beans demand is strengthening near Kidatu", "Procurement Note: Maize remains stable for school feeding tenders"].map((text) => <div key={text} className="rounded-md border border-main-200 bg-main-0 p-5 shadow-sm"><p className="text-sm font-bold text-primary-700">AI recommendation</p><p className="mt-2 text-main-800">{text}</p></div>)}
        </div>
      </div>
    </PageShell>
  );
}

export function UssdPage() {
  const [screen, setScreen] = useState("Welcome to Smart Market\n1. Prices\n2. Sell advice\n3. Orders");
  const [sessions, setSessions] = useState(2176);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSessions((current) => current + (current % 3 === 0 ? -1 : 2));
    }, 1800);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <PageShell eyebrow="Telecom" title="USSD & Telecom Gateway Monitor" description="Track active sessions and preview farmer-facing USSD flows for low-bandwidth price decisions.">
      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="grid gap-4"><StatCard label="Live sessions" value={String(sessions)} icon="bi-phone-vibrate" detail="Average response latency 480 ms" /><StatCard label="Dial code" value="*123#" icon="bi-hash" detail="Gateway uptime 99.98%" /></div>
        <div className="rounded-md border border-main-200 bg-main-0 p-6 shadow-sm">
          <div className="mx-auto max-w-sm rounded-[2rem] border-8 border-main-900 bg-main-950 p-4 shadow-sm">
            <div className="rounded-md bg-main-100 p-4 font-mono text-sm whitespace-pre-line text-main-900">{screen}</div>
            <div className="mt-4 grid grid-cols-3 gap-2">{["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((key) => <button key={key} onClick={() => setScreen(key === "1" ? "Rice Ifakara\nRetail: TZS 2,950\nWholesale: TZS 2,720" : key === "2" ? "Sell advice\nHold rice for 10-14 days" : screen)} className="rounded-md bg-main-800 py-3 font-bold text-main-0 hover:bg-primary-700" type="button">{key}</button>)}</div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export function ReportsPage() {
  return (
    <PageShell eyebrow="Decision support" title="Reports & Decision Support Exports" description="Prepare leadership-ready market intelligence packs with forecast, validation, and collection coverage sections." action={<div className="flex gap-2"><button className="rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0" type="button"><i className="bi bi-filetype-pdf" /> PDF</button><button className="rounded-md bg-accent-600 px-4 py-2 text-sm font-bold text-main-0" type="button"><i className="bi bi-file-earmark-spreadsheet" /> Excel</button></div>}>
      <div className="grid gap-4 md:grid-cols-3"><StatCard label="Ready exports" value="12" icon="bi-file-earmark-check" detail="Weekly briefs and district summaries" /><StatCard label="Recipients" value="37" icon="bi-send-check" detail="Government, traders, and extension officers" /><StatCard label="Last package" value="Jul 20" icon="bi-calendar-check" detail="Kilombero price outlook sent today" /></div>
      <div className="rounded-md border border-main-200 bg-main-0 p-5 shadow-sm"><h2 className="text-lg font-bold text-main-950">Export builder</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{["Commodity trends", "Outlier decisions", "Market coverage", "AI recommendations"].map((item) => <label key={item} className="flex items-center gap-3 rounded-md border border-main-200 bg-main-50 p-3 text-sm font-semibold text-main-700"><input type="checkbox" defaultChecked className="size-4 accent-primary-600" /> {item}</label>)}</div></div>
    </PageShell>
  );
}

function Badge({ status }: { status: string }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(status)}`}>{status}</span>;
}

function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-md border border-main-200 bg-main-0 p-5 shadow-sm">
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
      <div className="w-full max-w-2xl rounded-md border border-main-200 bg-main-0 p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold text-main-950">{title}</h2><button onClick={onClose} className="text-main-500 hover:text-danger-600" type="button"><i className="bi bi-x-lg" /></button></div>
        {children}
      </div>
    </div>
  );
}

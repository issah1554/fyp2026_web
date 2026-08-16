import Link from "next/link";
import { metricFormat, type MlModelStatus } from "@/src/services/ml/mlManagementService";

export function MlHeader({ title, description }: { title: string; description: string }) {
  return (
    <section className="border-b border-main-200 pb-5">
      <p className="text-sm font-bold uppercase text-primary-700">Machine Learning Management</p>
      <h1 className="mt-2 text-2xl font-bold text-main-950 sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-main-600">{description}</p>
    </section>
  );
}

export function StatusBadge({ status }: { status: MlModelStatus | string }) {
  const tone =
    status === "Active"
      ? "border-success-200 bg-success-50 text-success-700"
      : status === "Candidate" || status === "Completed"
        ? "border-primary-200 bg-primary-50 text-primary-700"
        : status === "Archived" || status === "Failed"
          ? "border-danger-200 bg-danger-50 text-danger-700"
          : "border-accent-200 bg-accent-50 text-accent-700";

  return <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-bold ${tone}`}>{status}</span>;
}

export function MetricCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-md border border-main-200 bg-main-100 p-4">
      <p className="text-xs font-bold uppercase text-main-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-main-950">{value}</p>
      {detail && <p className="mt-1 text-xs text-main-500">{detail}</p>}
    </div>
  );
}

export function ActionLink({ href, icon, children }: { href: string; icon: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 rounded-md border border-main-300 bg-main-0 px-3 py-2 text-sm font-bold text-main-800 hover:bg-main-100">
      <i className={`bi ${icon}`} />
      {children}
    </Link>
  );
}

export function MetricsGrid({ metrics }: { metrics: { mae: number; rmse: number; r2: number; mape: number } }) {
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <MetricCard label="MAE" value={metricFormat(metrics.mae)} />
      <MetricCard label="RMSE" value={metricFormat(metrics.rmse)} />
      <MetricCard label="R2" value={metricFormat(metrics.r2)} />
      <MetricCard label="MAPE" value={metrics.mape ? `${metricFormat(metrics.mape)}%` : "Pending"} />
    </div>
  );
}

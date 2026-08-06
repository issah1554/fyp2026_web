"use client";

export function InsightShell({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
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

export function InsightStatCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: string;
}) {
  return (
    <article className="rounded-md border border-main-200 bg-main-100 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-main-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-main-950">{value}</p>
        </div>
        <span className="flex size-11 items-center justify-center rounded-md bg-primary-100 text-primary-700">
          <i className={`bi ${icon}`} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-main-600">{detail}</p>
    </article>
  );
}

export function InsightMessage({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-danger-300 bg-danger-100 px-4 py-3 text-sm font-semibold text-danger-700">
      {message}
    </div>
  );
}

export function InsightLoading({ label }: { label: string }) {
  return <div className="py-16 text-center text-sm font-semibold text-main-600">{label}</div>;
}

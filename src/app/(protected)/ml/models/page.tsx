import Link from "next/link";
import { ActionLink, MetricsGrid, MlHeader, StatusBadge } from "../_components";
import { mlModels } from "@/src/services/ml/mlManagementService";

export default function MlModelsPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-4">
      <MlHeader title="Model Registry" description="Review active, candidate, and archived model versions without automatically replacing production models." />
      <div className="flex flex-wrap gap-2">
        <ActionLink href="/ml/training" icon="bi-plus-circle">Train model</ActionLink>
        <ActionLink href="/ml/evaluation" icon="bi-bar-chart">Compare versions</ActionLink>
      </div>
      <section className="grid gap-4">
        {mlModels.map((model) => (
          <article key={model.id} className="rounded-md border border-main-200 bg-main-100 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-main-950">{model.name}</h2>
                  <StatusBadge status={model.status} />
                </div>
                <p className="mt-1 text-sm text-main-600">{model.purpose} | {model.algorithm} | {model.version}</p>
                <p className="mt-2 text-sm text-main-600">Dataset: {model.dataset}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/ml/models/${model.id}`} className="rounded-md bg-primary-600 px-3 py-2 text-sm font-bold text-main-0 hover:bg-primary-700">
                  View model
                </Link>
                <button className="rounded-md border border-main-300 bg-main-0 px-3 py-2 text-sm font-bold text-main-700" type="button">Activate</button>
                <button className="rounded-md border border-main-300 bg-main-0 px-3 py-2 text-sm font-bold text-main-700" type="button">Archive</button>
              </div>
            </div>
            <div className="mt-4">
              <MetricsGrid metrics={model.metrics} />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

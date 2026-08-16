"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { MetricsGrid, MlHeader, StatusBadge } from "../../_components";
import { getMlModel } from "@/src/services/ml/mlManagementService";

export default function MlModelDetailsPage() {
  const params = useParams<{ id: string }>();
  const model = getMlModel(params.id);

  if (!model) {
    return <div className="mx-auto max-w-7xl py-6 text-sm font-semibold text-danger-700">Model not found.</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-4">
      <MlHeader title={model.name} description={`${model.purpose} model details, evaluation metrics, features, hyperparameters, and artifact location.`} />
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-md border border-main-200 bg-main-100 p-4">
          <p className="text-xs font-bold uppercase text-main-500">Algorithm</p>
          <p className="mt-2 font-bold text-main-950">{model.algorithm}</p>
        </div>
        <div className="rounded-md border border-main-200 bg-main-100 p-4">
          <p className="text-xs font-bold uppercase text-main-500">Version</p>
          <p className="mt-2 font-bold text-main-950">{model.version}</p>
        </div>
        <div className="rounded-md border border-main-200 bg-main-100 p-4">
          <p className="text-xs font-bold uppercase text-main-500">Status</p>
          <div className="mt-2"><StatusBadge status={model.status} /></div>
        </div>
      </section>
      <MetricsGrid metrics={model.metrics} />
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-md border border-main-200 bg-main-100 p-5">
          <h2 className="text-lg font-bold text-main-950">Training Details</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div><dt className="font-bold text-main-700">Training date</dt><dd className="text-main-600">{model.trainingDate}</dd></div>
            <div><dt className="font-bold text-main-700">Training records</dt><dd className="text-main-600">{model.trainingRecords.toLocaleString()}</dd></div>
            <div><dt className="font-bold text-main-700">Target variable</dt><dd className="text-main-600">{model.target}</dd></div>
            <div><dt className="font-bold text-main-700">Artifact</dt><dd className="break-all text-main-600">{model.artifact}</dd></div>
          </dl>
        </div>
        <div className="rounded-md border border-main-200 bg-main-100 p-5">
          <h2 className="text-lg font-bold text-main-950">Features and Hyperparameters</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {model.features.map((feature) => <span key={feature} className="rounded-md bg-main-200 px-2 py-1 text-xs font-semibold text-main-700">{feature}</span>)}
          </div>
          <pre className="mt-4 overflow-x-auto rounded-md bg-main-950 p-4 text-xs text-main-0">{JSON.stringify(model.hyperparameters, null, 2)}</pre>
        </div>
      </section>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="rounded-md bg-primary-600 px-3 py-2 text-sm font-bold text-main-0">Activate</button>
        <Link href="/ml/evaluation" className="rounded-md border border-main-300 bg-main-0 px-3 py-2 text-sm font-bold text-main-700">Compare</Link>
        <button type="button" className="rounded-md border border-main-300 bg-main-0 px-3 py-2 text-sm font-bold text-main-700">Archive</button>
        <Link href="/ml/predictions" className="rounded-md border border-main-300 bg-main-0 px-3 py-2 text-sm font-bold text-main-700">Run prediction</Link>
      </div>
    </div>
  );
}

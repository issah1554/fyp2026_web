"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { MlHeader, StatusBadge } from "../../_components";
import { getMlTrainingRun } from "@/src/services/ml/mlManagementService";

export default function MlTrainingDetailsPage() {
  const params = useParams<{ id: string }>();
  const run = getMlTrainingRun(params.id);

  if (!run) {
    return <div className="mx-auto max-w-7xl py-6 text-sm font-semibold text-danger-700">Training run not found.</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-4">
      <MlHeader title={run.id} description="Training status, configuration, records, logs, evaluation context, and post-training actions." />
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-md border border-main-200 bg-main-100 p-4"><p className="text-xs font-bold uppercase text-main-500">Status</p><div className="mt-2"><StatusBadge status={run.status} /></div></div>
        <div className="rounded-md border border-main-200 bg-main-100 p-4"><p className="text-xs font-bold uppercase text-main-500">Train Rows</p><p className="mt-2 text-xl font-bold">{run.trainRows.toLocaleString()}</p></div>
        <div className="rounded-md border border-main-200 bg-main-100 p-4"><p className="text-xs font-bold uppercase text-main-500">Test Rows</p><p className="mt-2 text-xl font-bold">{run.testRows.toLocaleString()}</p></div>
        <div className="rounded-md border border-main-200 bg-main-100 p-4"><p className="text-xs font-bold uppercase text-main-500">Candidate</p><p className="mt-2 text-sm font-bold">{run.candidateModelId ?? "None"}</p></div>
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-md border border-main-200 bg-main-100 p-5">
          <h2 className="text-lg font-bold text-main-950">Configuration</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div><dt className="font-bold text-main-700">Task</dt><dd>{run.task}</dd></div>
            <div><dt className="font-bold text-main-700">Algorithm</dt><dd>{run.algorithm}</dd></div>
            <div><dt className="font-bold text-main-700">Dataset</dt><dd>{run.dataset}</dd></div>
            <div><dt className="font-bold text-main-700">Target</dt><dd>{run.target}</dd></div>
          </dl>
          <pre className="mt-4 overflow-x-auto rounded-md bg-main-950 p-4 text-xs text-main-0">{JSON.stringify(run.hyperparameters, null, 2)}</pre>
        </div>
        <div className="rounded-md border border-main-200 bg-main-100 p-5">
          <h2 className="text-lg font-bold text-main-950">Logs</h2>
          <div className="mt-4 space-y-2">
            {run.logs.map((log) => <p key={log} className="rounded-md bg-main-50 px-3 py-2 text-sm text-main-700">{log}</p>)}
          </div>
        </div>
      </section>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="rounded-md bg-primary-600 px-3 py-2 text-sm font-bold text-main-0">Register Candidate Model</button>
        <Link href="/ml/evaluation" className="rounded-md border border-main-300 bg-main-0 px-3 py-2 text-sm font-bold text-main-700">Compare With Active Model</Link>
        <button type="button" className="rounded-md border border-main-300 bg-main-0 px-3 py-2 text-sm font-bold text-main-700">Discard</button>
      </div>
    </div>
  );
}

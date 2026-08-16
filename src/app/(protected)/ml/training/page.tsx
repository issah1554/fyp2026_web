import Link from "next/link";
import { MlHeader, StatusBadge } from "../_components";
import { mlTrainingRuns } from "@/src/services/ml/mlManagementService";

export default function MlTrainingPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-4">
      <MlHeader title="Training Runs" description="Configure model training, review current and previous runs, and register successful outputs as candidate models." />

      <section className="rounded-md border border-main-200 bg-main-100 p-5">
        <h2 className="text-lg font-bold text-main-950">Train Model</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="text-sm font-semibold text-main-700">Task<select className="mt-1 w-full rounded-md border border-main-300 bg-main-0 px-3 py-2"><option>Price Forecasting</option><option>Demand Forecasting</option></select></label>
          <label className="text-sm font-semibold text-main-700">Algorithm<select className="mt-1 w-full rounded-md border border-main-300 bg-main-0 px-3 py-2"><option>Random Forest Regressor</option><option>XGBoost Regressor</option></select></label>
          <label className="text-sm font-semibold text-main-700">Train/Test Split<select className="mt-1 w-full rounded-md border border-main-300 bg-main-0 px-3 py-2"><option>80 / 20</option><option>70 / 30</option></select></label>
          <label className="text-sm font-semibold text-main-700">Dataset / Date Range<input className="mt-1 w-full rounded-md border border-main-300 bg-main-0 px-3 py-2" defaultValue="2024-07-01 to 2026-07-17" /></label>
          <label className="text-sm font-semibold text-main-700">Target Variable<input className="mt-1 w-full rounded-md border border-main-300 bg-main-0 px-3 py-2" defaultValue="price or weekly demand quantity" /></label>
          <label className="text-sm font-semibold text-main-700">Estimators<input className="mt-1 w-full rounded-md border border-main-300 bg-main-0 px-3 py-2" defaultValue="120" /></label>
        </div>
        <div className="mt-4">
          <button type="button" className="rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700">
            Start training
          </button>
        </div>
      </section>

      <section className="rounded-md border border-main-200 bg-main-100">
        <div className="border-b border-main-200 p-4"><h2 className="text-lg font-bold text-main-950">Run History</h2></div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-main-200 text-sm">
            <thead className="bg-main-50 text-left text-xs uppercase text-main-500">
              <tr><th className="px-4 py-3">Run</th><th className="px-4 py-3">Task</th><th className="px-4 py-3">Algorithm</th><th className="px-4 py-3">Dataset</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Candidate</th></tr>
            </thead>
            <tbody className="divide-y divide-main-200">
              {mlTrainingRuns.map((run) => (
                <tr key={run.id} className="hover:bg-main-50">
                  <td className="px-4 py-3 font-bold text-primary-700"><Link href={`/ml/training/${run.id}`}>{run.id}</Link></td>
                  <td className="px-4 py-3">{run.task}</td>
                  <td className="px-4 py-3">{run.algorithm}</td>
                  <td className="px-4 py-3">{run.dataset}</td>
                  <td className="px-4 py-3"><StatusBadge status={run.status} /></td>
                  <td className="px-4 py-3">{run.candidateModelId ?? "None"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

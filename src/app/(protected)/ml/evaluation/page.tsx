import { MlHeader, StatusBadge } from "../_components";
import { metricFormat, mlModels } from "@/src/services/ml/mlManagementService";

export default function MlEvaluationPage() {
  const comparable = mlModels.filter((model) => model.purpose === "Demand Forecasting");
  const metrics = ["mae", "rmse", "r2", "mape"] as const;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-4">
      <MlHeader title="Model Evaluation" description="Compare candidate and active models before approval. Activation is an explicit admin or analyst decision." />
      <section className="rounded-md border border-main-200 bg-main-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-main-200 text-sm">
            <thead className="bg-main-50 text-left text-xs uppercase text-main-500">
              <tr>
                <th className="px-4 py-3">Metric</th>
                {comparable.map((model) => <th key={model.id} className="px-4 py-3">{model.algorithm}<br /><span className="font-normal">{model.version}</span></th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-main-200">
              {metrics.map((metric) => (
                <tr key={metric}>
                  <td className="px-4 py-3 font-bold uppercase">{metric === "r2" ? "R2" : metric}</td>
                  {comparable.map((model) => <td key={model.id} className="px-4 py-3">{metricFormat(model.metrics[metric])}{metric === "mape" && model.metrics[metric] ? "%" : ""}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        {comparable.map((model) => (
          <article key={model.id} className="rounded-md border border-main-200 bg-main-100 p-5">
            <div className="flex items-center justify-between gap-3">
              <div><h2 className="font-bold text-main-950">{model.name}</h2><p className="text-sm text-main-600">{model.algorithm}</p></div>
              <StatusBadge status={model.status} />
            </div>
            <button type="button" className="mt-4 rounded-md bg-primary-600 px-3 py-2 text-sm font-bold text-main-0">
              Select and activate
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}

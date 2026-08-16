import Link from "next/link";
import { ActionLink, MetricCard, MlHeader, StatusBadge } from "./_components";
import { mlModels, mlPredictions, mlTrainingRuns } from "@/src/services/ml/mlManagementService";

export default function MlOverviewPage() {
  const activePriceModel = mlModels.find((model) => model.purpose === "Price Forecasting" && model.status === "Active");
  const activeDemandModel = mlModels.find((model) => model.purpose === "Demand Forecasting" && model.status === "Active");
  const latestRuns = mlTrainingRuns.slice(0, 3);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-4">
      <MlHeader
        title="ML Operations Overview"
        description="Manage SmartMarket forecasting models through a simple approval workflow: train, evaluate, register candidates, activate, monitor, and archive."
      />

      <section className="grid gap-4 lg:grid-cols-4">
        <MetricCard label="Active Price Model" value={activePriceModel?.algorithm ?? "None"} detail={activePriceModel?.version} />
        <MetricCard label="Active Demand Model" value={activeDemandModel?.algorithm ?? "None"} detail={activeDemandModel?.version} />
        <MetricCard label="Latest Training Status" value={latestRuns[0]?.status ?? "None"} detail={latestRuns[0]?.algorithm} />
        <MetricCard label="Registered Models" value={mlModels.length} detail="Active, candidate, archived" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded-md border border-main-200 bg-main-100">
          <div className="border-b border-main-200 p-4">
            <h2 className="text-lg font-bold text-main-950">Active Models</h2>
          </div>
          <div className="divide-y divide-main-200">
            {[activePriceModel, activeDemandModel].filter(Boolean).map((model) => (
              <div key={model!.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-bold text-main-950">{model!.name}</p>
                  <p className="text-sm text-main-600">{model!.purpose} | {model!.algorithm} | {model!.version}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={model!.status} />
                  <Link href={`/ml/models/${model!.id}`} className="text-sm font-bold text-primary-700 hover:underline">
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-main-200 bg-main-100 p-4">
          <h2 className="text-lg font-bold text-main-950">Quick Actions</h2>
          <div className="mt-4 grid gap-2">
            <ActionLink href="/ml/training" icon="bi-cpu">Configure training</ActionLink>
            <ActionLink href="/ml/models" icon="bi-diagram-3">Open model registry</ActionLink>
            <ActionLink href="/ml/predictions" icon="bi-graph-up">View predictions</ActionLink>
            <ActionLink href="/ml/evaluation" icon="bi-bar-chart">Compare models</ActionLink>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-md border border-main-200 bg-main-100">
          <div className="border-b border-main-200 p-4">
            <h2 className="text-lg font-bold text-main-950">Latest Training Runs</h2>
          </div>
          <div className="divide-y divide-main-200">
            {latestRuns.map((run) => (
              <Link key={run.id} href={`/ml/training/${run.id}`} className="block p-4 hover:bg-main-50">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-main-950">{run.task}</p>
                    <p className="text-sm text-main-600">{run.algorithm} | {run.dataset}</p>
                  </div>
                  <StatusBadge status={run.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-main-200 bg-main-100">
          <div className="border-b border-main-200 p-4">
            <h2 className="text-lg font-bold text-main-950">Recent Predictions</h2>
          </div>
          <div className="divide-y divide-main-200">
            {mlPredictions.slice(0, 4).map((prediction) => (
              <div key={prediction.id} className="p-4">
                <p className="font-bold text-main-950">{prediction.commodity} at {prediction.market}</p>
                <p className="text-sm text-main-600">
                  {prediction.type} | {prediction.period} | predicted {prediction.predictedValue.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

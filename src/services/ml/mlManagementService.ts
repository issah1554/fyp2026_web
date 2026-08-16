export type MlModelStatus = "Active" | "Candidate" | "Archived" | "Training";
export type MlTask = "Price Forecasting" | "Demand Forecasting";

export type MlModel = {
  id: string;
  name: string;
  purpose: MlTask;
  algorithm: string;
  version: string;
  status: MlModelStatus;
  trainingDate: string;
  trainingRecords: number;
  dataset: string;
  target: string;
  features: string[];
  hyperparameters: Record<string, string | number>;
  metrics: {
    mae: number;
    rmse: number;
    r2: number;
    mape: number;
  };
  artifact: string;
};

export type MlTrainingRun = {
  id: string;
  task: MlTask;
  algorithm: string;
  dataset: string;
  startTime: string;
  completionTime: string | null;
  status: "Pending" | "Running" | "Completed" | "Failed" | "Cancelled";
  trainRows: number;
  testRows: number;
  target: string;
  features: string[];
  hyperparameters: Record<string, string | number>;
  candidateModelId?: string;
  logs: string[];
};

export type MlPrediction = {
  id: string;
  type: MlTask;
  commodity: string;
  market: string;
  observedValue: number;
  predictedValue: number;
  period: "Daily" | "Weekly" | "Monthly" | "Seasonal";
  predictionDate: string;
  modelVersion: string;
};

export const mlModels: MlModel[] = [
  {
    id: "price-rf-v1",
    name: "Morogoro Commodity Price Forecaster",
    purpose: "Price Forecasting",
    algorithm: "Random Forest Regressor",
    version: "v1.0.0",
    status: "Active",
    trainingDate: "2026-08-07",
    trainingRecords: 178224,
    dataset: "MarketCommodityPrice historical price records",
    target: "price",
    features: ["calendar features", "lag prices", "rolling averages", "price type", "commodity", "unit"],
    hyperparameters: {
      n_estimators: 500,
      max_depth: 12,
      min_samples_leaf: 2,
      random_state: 42,
    },
    metrics: {
      mae: 118.42,
      rmse: 247.9,
      r2: 0.91,
      mape: 6.8,
    },
    artifact: "ai/models/price_forecasting/morogoro_price_forecaster_final.joblib",
  },
  {
    id: "demand-rf-v1",
    name: "Weekly Commodity Demand Forecaster",
    purpose: "Demand Forecasting",
    algorithm: "Random Forest Regressor",
    version: "v1.0.0",
    status: "Active",
    trainingDate: "2026-08-16",
    trainingRecords: 3127,
    dataset: "Synthetic archived orders aggregated weekly",
    target: "weekly demand quantity",
    features: ["commodity", "area", "week", "avg price", "previous week demand", "rolling demand"],
    hyperparameters: {
      n_estimators: 120,
      min_samples_leaf: 2,
      random_state: 42,
    },
    metrics: {
      mae: 2813.4,
      rmse: 4895.5,
      r2: 0.79,
      mape: 11.6,
    },
    artifact: "ai/models/demand_forecast_mdD1KvH2k3.joblib",
  },
  {
    id: "demand-xgb-candidate",
    name: "Weekly Commodity Demand Forecaster",
    purpose: "Demand Forecasting",
    algorithm: "XGBoost Regressor",
    version: "v0.1.0-candidate",
    status: "Candidate",
    trainingDate: "Pending evaluation",
    trainingRecords: 0,
    dataset: "Synthetic archived orders aggregated weekly",
    target: "weekly demand quantity",
    features: ["commodity", "area", "week", "avg price", "previous week demand", "rolling demand"],
    hyperparameters: {
      n_estimators: 300,
      max_depth: 6,
      learning_rate: 0.05,
    },
    metrics: {
      mae: 0,
      rmse: 0,
      r2: 0,
      mape: 0,
    },
    artifact: "Not trained",
  },
];

export const mlTrainingRuns: MlTrainingRun[] = [
  {
    id: "train-price-20260807",
    task: "Price Forecasting",
    algorithm: "Random Forest Regressor",
    dataset: "MarketCommodityPrice historical price records",
    startTime: "2026-08-07T08:40:00Z",
    completionTime: "2026-08-07T08:46:00Z",
    status: "Completed",
    trainRows: 142579,
    testRows: 35645,
    target: "price",
    features: mlModels[0].features,
    hyperparameters: mlModels[0].hyperparameters,
    candidateModelId: "price-rf-v1",
    logs: ["Fetched price history", "Built lag and rolling features", "Trained Random Forest", "Saved candidate model artifact"],
  },
  {
    id: "train-demand-20260816",
    task: "Demand Forecasting",
    algorithm: "Random Forest Regressor",
    dataset: "Synthetic archived orders aggregated weekly",
    startTime: "2026-08-16T06:20:00Z",
    completionTime: "2026-08-16T06:29:00Z",
    status: "Completed",
    trainRows: 3127,
    testRows: 782,
    target: "weekly demand quantity",
    features: mlModels[1].features,
    hyperparameters: mlModels[1].hyperparameters,
    candidateModelId: "demand-rf-v1",
    logs: ["Aggregated demand by commodity, area, and week", "Attached price features", "Evaluated holdout split", "Stored forecast rows"],
  },
  {
    id: "train-demand-xgb-planned",
    task: "Demand Forecasting",
    algorithm: "XGBoost Regressor",
    dataset: "Synthetic archived orders aggregated weekly",
    startTime: "Not scheduled",
    completionTime: null,
    status: "Pending",
    trainRows: 0,
    testRows: 0,
    target: "weekly demand quantity",
    features: mlModels[2].features,
    hyperparameters: mlModels[2].hyperparameters,
    candidateModelId: "demand-xgb-candidate",
    logs: ["Configuration ready", "Training has not started"],
  },
];

export const mlPredictions: MlPrediction[] = [
  {
    id: "pred-price-rice-weekly",
    type: "Price Forecasting",
    commodity: "Rice",
    market: "Morogoro Urban",
    observedValue: 2550,
    predictedValue: 2685,
    period: "Weekly",
    predictionDate: "2026-08-16",
    modelVersion: "price-rf-v1 / v1.0.0",
  },
  {
    id: "pred-price-beans-monthly",
    type: "Price Forecasting",
    commodity: "Beans",
    market: "Kilombero",
    observedValue: 2600,
    predictedValue: 2740,
    period: "Monthly",
    predictionDate: "2026-08-16",
    modelVersion: "price-rf-v1 / v1.0.0",
  },
  {
    id: "pred-demand-maize-weekly",
    type: "Demand Forecasting",
    commodity: "Maize",
    market: "Dodoma",
    observedValue: 18400,
    predictedValue: 19750,
    period: "Weekly",
    predictionDate: "2026-08-16",
    modelVersion: "demand-rf-v1 / v1.0.0",
  },
  {
    id: "pred-demand-rice-seasonal",
    type: "Demand Forecasting",
    commodity: "Rice",
    market: "Mbeya",
    observedValue: 13200,
    predictedValue: 15120,
    period: "Seasonal",
    predictionDate: "2026-08-16",
    modelVersion: "demand-rf-v1 / v1.0.0",
  },
];

export function getMlModel(id: string) {
  return mlModels.find((model) => model.id === id);
}

export function getMlTrainingRun(id: string) {
  return mlTrainingRuns.find((run) => run.id === id);
}

export function metricFormat(value: number) {
  return value ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "Pending";
}

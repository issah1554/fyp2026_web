"use client";

export type StepperStep<TKey extends string = string> = {
  key: TKey;
  label: string;
  completed: boolean;
  current: boolean;
  icon?: string;
};

type StepperProps<TKey extends string = string> = {
  activeStep: TKey;
  onStepChange: (step: TKey) => void;
  steps: StepperStep<TKey>[];
};

export function Stepper<TKey extends string = string>({
  activeStep,
  onStepChange,
  steps,
}: Readonly<StepperProps<TKey>>) {
  return (
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li className="relative min-w-0" key={step.key}>
            {index < steps.length - 1 ? (
              <span
                className={`absolute -bottom-6 left-6.75 top-11 w-0.5 ${
                  step.completed ? "bg-success-500" : "bg-main-300"
                }`}
              />
            ) : null}
            <button
              className={`group relative z-10 flex w-full items-center gap-3 rounded p-3 text-left transition ${
                activeStep === step.key
                  ? ""
                  : ""
              }`}
              onClick={() => onStepChange(step.key)}
              type="button"
            >
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition ${
                  step.completed
                    ? "border-success-500 bg-success-100 text-success-700 group-hover:border-success-600 group-hover:text-success-700"
                    : step.current
                      ? "border-primary-600 bg-primary-600 text-main-0"
                      : "border-main-300 bg-main-100 text-main-500 group-hover:border-main-500 group-hover:text-main-700"
                }`}
              >
                <i className={`bi ${step.icon ?? "bi-circle"} text-sm`} />
              </span>
              <div className="min-w-0">
                <p
                  className={`text-sm font-semibold ${
                    step.completed
                      ? "text-success-700 group-hover:text-success-700"
                      : activeStep === step.key
                        ? "text-primary-700"
                        : "text-main-500 group-hover:text-main-700"
                  }`}
                >
                  {step.label}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ol>
  );
}

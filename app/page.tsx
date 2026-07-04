import Image from "next/image";

const impactMetrics = [
  { value: "24/7", label: "USSD and web access" },
  { value: "8", label: "Core system modules" },
  { value: "6", label: "User groups served" },
];

const dataSources = [
  { label: "Market officers", icon: "bi-clipboard-data" },
  { label: "Traders", icon: "bi-shop" },
  { label: "Online marketplaces", icon: "bi-basket" },
  { label: "Social media", icon: "bi-chat-square-text" },
  { label: "E-commerce websites", icon: "bi-window-stack" },
  { label: "Public APIs", icon: "bi-diagram-3" },
];

const featureGroups = [
  {
    title: "Collect",
    icon: "bi-database-add",
    description:
      "Capture commodity prices, validate submissions, and preserve historical market records.",
    items: ["Price collection", "Data validation", "Historical records"],
  },
  {
    title: "Analyze",
    icon: "bi-graph-up-arrow",
    description:
      "Turn multi-source market signals into trends, forecasts, and opportunity detection.",
    items: ["Trend analysis", "Demand forecasting", "Seasonal patterns"],
  },
  {
    title: "Recommend",
    icon: "bi-stars",
    description:
      "Generate practical intelligence for pricing, production, buying, and investment decisions.",
    items: ["Price prediction", "Market insights", "Decision support"],
  },
  {
    title: "Reach",
    icon: "bi-phone",
    description:
      "Deliver market information through web dashboards and USSD for basic mobile phones.",
    items: ["USSD lookup", "Commodity search", "Offline access"],
  },
];

const users = [
  { label: "Farmers", icon: "bi-flower1" },
  { label: "Entrepreneurs", icon: "bi-briefcase" },
  { label: "Buyers", icon: "bi-cart-check" },
  { label: "Market Officers", icon: "bi-person-badge" },
  { label: "Administrators", icon: "bi-shield-check" },
  { label: "Researchers", icon: "bi-search" },
];

const modules = [
  { label: "User Management", icon: "bi-people" },
  { label: "Market Data Collection", icon: "bi-clipboard2-data" },
  { label: "Data Integration", icon: "bi-bezier2" },
  { label: "Analytics Engine", icon: "bi-bar-chart-line" },
  { label: "Price Prediction", icon: "bi-currency-exchange" },
  { label: "Recommendations", icon: "bi-lightbulb" },
  { label: "Reporting", icon: "bi-file-earmark-bar-graph" },
  { label: "Notifications", icon: "bi-bell" },
];

const benefits = [
  "Improves market transparency",
  "Strengthens bargaining power for farmers",
  "Reduces information asymmetry",
  "Supports data-driven production decisions",
  "Keeps access available through USSD",
  "Supports sustainable local growth",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-main-50 text-main-900">

      <header className="sticky top-0 z-50 border-b border-main-200 bg-main-0/90 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <a href="#" className="flex items-center gap-3" aria-label="Smart Market home">
            <span className="flex size-12 items-center justify-center hover:bg-primary-100 rounded-full p-1.5">
              <Image
                src="/logo.png"
                alt=""
                width={574}
                height={597}
                className="h-full w-full object-contain"
                priority
              />
            </span>
            <span className="text-sm font-semibold uppercase text-main-800 hover:text-primary-700">
              Smart Market
            </span>
          </a>
          <div className="hidden items-center gap-8 text-sm font-medium text-main-600 md:flex">
            <a className="flex items-center gap-2 hover:text-primary-700" href="#features">
              Features
            </a>
            <a className="flex items-center gap-2 hover:text-primary-700" href="#architecture">
              Architecture
            </a>
            <a className="flex items-center gap-2 hover:text-primary-700" href="#benefits">
              Benefits
            </a>
          </div>
        </nav>
      </header>

      <section className="border-b border-main-200 bg-main-0">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <p className="mb-5 w-fit rounded-full border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-800">
              Multi-source market analytics and USSD technology
            </p>
            <h1 className="max-w-4xl text-4xl font-bold leading-tight text-main-950 sm:text-5xl lg:text-6xl">
              Smart Market and Price Decision Support System
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-main-700">
              An intelligent market information platform for farmers, entrepreneurs,
              buyers, and market officers who need reliable prices, forecasts, and
              recommendations for better market decisions.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#features"
                className="flex items-center justify-center gap-2 rounded-md bg-primary-600 px-5 py-3 text-center text-sm font-semibold text-main-0 shadow-sm hover:bg-primary-700"
              >
                <i className="bi bi-arrow-down-circle" aria-hidden="true" />
                Explore platform
              </a>
              <a
                href="#architecture"
                className="flex items-center justify-center gap-2 rounded-md border border-main-300 bg-main-0 px-5 py-3 text-center text-sm font-semibold text-main-800 hover:border-primary-400 hover:text-primary-700"
              >
                <i className="bi bi-diagram-3" aria-hidden="true" />
                See architecture
              </a>
            </div>
            <dl className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              {impactMetrics.map((metric) => (
                <div key={metric.label} className="border-l border-main-200 pl-4">
                  <dt className="text-2xl font-bold text-main-950">{metric.value}</dt>
                  <dd className="mt-1 text-sm leading-5 text-main-600">{metric.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex items-center">
            <div className="w-full rounded-lg border border-main-200 bg-main-50 p-4 shadow-xl shadow-main-200">
              <div className="rounded-md border border-main-200 bg-main-0 p-5">
                <div className="flex items-center justify-between border-b border-main-200 pb-4">
                  <div>
                    <p className="text-sm font-semibold text-main-500">Market intelligence</p>
                    <h2 className="mt-1 flex items-center gap-2 text-xl font-bold text-main-950">
                      <i className="bi bi-broadcast-pin text-primary-600" aria-hidden="true" />
                      Commodity signal hub
                    </h2>
                  </div>
                  <span className="rounded-full bg-success-100 px-3 py-1 text-xs font-semibold text-success-700">
                    Live ready
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {dataSources.map((source) => (
                    <div key={source.label} className="rounded-md border border-main-200 bg-main-50 p-3">
                      <div className="flex size-9 items-center justify-center rounded-md bg-primary-100 text-primary-700">
                        <i className={`bi ${source.icon}`} aria-hidden="true" />
                      </div>
                      <p className="mt-3 text-sm font-medium text-main-800">{source.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-md border border-main-200 bg-main-950 p-4 text-main-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-main-200">Price forecast</p>
                    <p className="text-xs font-medium text-accent-300">Next cycle</p>
                  </div>
                  <div className="mt-5 flex h-28 items-end gap-2">
                    {[45, 62, 54, 76, 68, 88, 79, 96].map((height, index) => (
                      <div
                        key={height}
                        className="flex flex-1 items-end rounded-t-md bg-primary-600"
                      >
                        <div
                          className={[
                            "w-full rounded-t-md bg-accent-400",
                            index === 0 && "h-12",
                            index === 1 && "h-16",
                            index === 2 && "h-14",
                            index === 3 && "h-20",
                            index === 4 && "h-18",
                            index === 5 && "h-24",
                            index === 6 && "h-20",
                            index === 7 && "h-28",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-main-50 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase text-primary-700">
              Decision support workflow
            </p>
            <h2 className="mt-3 text-3xl font-bold text-main-950 sm:text-4xl">
              From fragmented market signals to clear action
            </h2>
            <p className="mt-4 text-base leading-7 text-main-700">
              The platform centralizes market data, applies analytics and machine learning, and
              distributes insights through web dashboards and USSD services.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featureGroups.map((feature) => (
              <article
                key={feature.title}
                className="rounded-lg border border-main-200 bg-main-0 p-6 shadow-sm"
              >
                <div className="flex size-11 items-center justify-center rounded-lg bg-primary-100 text-xl text-primary-700">
                  <i className={`bi ${feature.icon}`} aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-main-950">{feature.title}</h3>
                <p className="mt-3 min-h-24 text-sm leading-6 text-main-600">
                  {feature.description}
                </p>
                <ul className="mt-5 space-y-3">
                  {feature.items.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-main-800">
                      <i className="bi bi-check2-circle text-primary-600" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-main-200 bg-main-0 py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase text-primary-700">
              Built for access
            </p>
            <h2 className="mt-3 text-3xl font-bold text-main-950">Designed for rural markets</h2>
            <p className="mt-4 text-base leading-7 text-main-700">
              Smart Market supports internet-connected dashboards while keeping essential price
              lookup and recommendations available through basic mobile phones.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <div key={user.label} className="rounded-md border border-main-200 bg-main-50 p-4">
                <div className="flex size-9 items-center justify-center rounded-md bg-primary-100 text-primary-700">
                  <i className={`bi ${user.icon}`} aria-hidden="true" />
                </div>
                <p className="mt-3 font-semibold text-main-900">{user.label}</p>
                <p className="mt-2 text-sm text-main-600">Role-aware market access</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="architecture" className="bg-main-50 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold uppercase text-primary-700">
                System architecture
              </p>
              <h2 className="mt-3 text-3xl font-bold text-main-950">
                Modular services connected by one market database
              </h2>
              <p className="mt-4 text-base leading-7 text-main-700">
                Web and USSD interfaces connect through an API gateway into business services for
                users, data collection, analytics, prediction, recommendations, reporting, and
                notifications.
              </p>
            </div>
            <div className="rounded-lg border border-main-200 bg-main-0 p-5 shadow-sm">
              <div className="grid gap-3 md:grid-cols-2">
                {modules.map((module) => (
                  <div
                    key={module.label}
                    className="flex items-center gap-3 rounded-md border border-main-200 bg-main-50 px-4 py-3"
                  >
                    <i className={`bi ${module.icon} text-primary-600`} aria-hidden="true" />
                    <p className="text-sm font-semibold text-main-900">{module.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-md bg-primary-600 p-4 text-main-0">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <i className="bi bi-database-check" aria-hidden="true" />
                  Centralized Market Database
                </p>
                <p className="mt-2 text-sm leading-6 text-primary-50">
                  Stores clean market records, forecast outputs, reporting data, and audit-ready
                  operational history.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="benefits" className="bg-main-0 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="text-sm font-semibold uppercase text-primary-700">
                Benefits
              </p>
              <h2 className="mt-3 text-3xl font-bold text-main-950">
                Better decisions for buyers and sellers
              </h2>
              <p className="mt-4 text-base leading-7 text-main-700">
                Smart Market combines artificial intelligence, machine learning, multi-source data,
                and USSD access to improve market efficiency in Ifakara and similar communities.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex gap-3 rounded-md border border-main-200 bg-main-50 p-4">
                  <i className="bi bi-check-circle-fill text-primary-600" aria-hidden="true" />
                  <p className="text-sm font-semibold leading-6 text-main-900">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-main-200 bg-main-950 text-main-0">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
          <div>
            <a href="#" className="flex items-center gap-3" aria-label="Smart Market home">
              <span className="flex size-11 items-center justify-center rounded-lg border border-main-800 bg-main-0 p-1.5">
                <Image
                  src="/logo.png"
                  alt=""
                  width={574}
                  height={597}
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="text-sm font-semibold uppercase text-main-100">
                Smart Market
              </span>
            </a>
            <p className="mt-4 max-w-md text-sm leading-6 text-main-300">
              Market intelligence, price prediction, and decision support for farmers,
              entrepreneurs, buyers, and market officers.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-main-100">Platform</h2>
            <nav className="mt-4 flex flex-col gap-3 text-sm text-main-300">
              <a href="#features" className="flex items-center gap-2 hover:text-primary-300">
                <i className="bi bi-grid" aria-hidden="true" />
                Features
              </a>
              <a href="#architecture" className="flex items-center gap-2 hover:text-primary-300">
                <i className="bi bi-diagram-3" aria-hidden="true" />
                Architecture
              </a>
              <a href="#benefits" className="flex items-center gap-2 hover:text-primary-300">
                <i className="bi bi-check2-circle" aria-hidden="true" />
                Benefits
              </a>
            </nav>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-main-100">Access</h2>
            <ul className="mt-4 space-y-3 text-sm text-main-300">
              <li className="flex items-center gap-2">
                <i className="bi bi-window-sidebar" aria-hidden="true" />
                Web dashboards
              </li>
              <li className="flex items-center gap-2">
                <i className="bi bi-phone" aria-hidden="true" />
                USSD price lookup
              </li>
              <li className="flex items-center gap-2">
                <i className="bi bi-person-lock" aria-hidden="true" />
                Role-based market data
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-main-800">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 text-sm text-main-400 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <p>Smart Market and Price Decision Support System</p>
            <a href="#" className="flex items-center gap-2 font-medium text-main-200 hover:text-primary-300">
              <i className="bi bi-arrow-up-circle" aria-hidden="true" />
              Back to top
            </a>
          </div>
        </div>
      </footer>

    </main>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "./auth/hooks/useAuth";

const impactMetrics = [
  { value: "24/7", label: "USSD and web access" },
  { value: "8", label: "Core system modules" },
  { value: "6", label: "User groups served" },
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

const benefits = [
  "Improves market transparency",
  "Strengthens bargaining power for farmers",
  "Reduces information asymmetry",
  "Supports data-driven production decisions",
  "Keeps access available through USSD",
  "Supports sustainable local growth",
];

export default function Home() {
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isLoggedIn = mounted && Boolean(user);

  return (
    <main className="min-h-screen bg-main-50 text-main-900">
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "border-b border-main-200 bg-main-100/90 backdrop-blur-sm shadow-sm"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <a href="#" className="flex items-center gap-3" aria-label="Marketia home">
            <span
              className={`flex size-12 items-center justify-center rounded-full p-1.5 transition-colors ${
                isScrolled ? "hover:bg-primary-100" : "hover:bg-main-800/40"
              }`}
            >
              <Image
                src="/logo.png"
                alt=""
                width={574}
                height={597}
                className="h-full w-full object-contain"
                priority
              />
            </span>
            <span
              className={`text-sm font-semibold uppercase transition-colors ${
                isScrolled
                  ? "text-main-800 hover:text-primary-700"
                  : "text-main-0 hover:text-primary-300"
              }`}
            >
              Marketia
            </span>
          </a>
          <div className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a
              className={`flex items-center gap-2 transition-colors ${
                isScrolled
                  ? "text-main-600 hover:text-primary-700"
                  : "text-main-200 hover:text-primary-300"
              }`}
              href="#features"
            >
              Features
            </a>
            <a
              className={`flex items-center gap-2 transition-colors ${
                isScrolled
                  ? "text-main-600 hover:text-primary-700"
                  : "text-main-200 hover:text-primary-300"
              }`}
              href="#benefits"
            >
              Benefits
            </a>
            <Link
              className={`flex items-center gap-2 transition-colors ${
                isScrolled
                  ? "text-main-600 hover:text-primary-700"
                  : "text-main-200 hover:text-primary-300"
              }`}
              href="/market"
            >
              Marketplace
            </Link>
            {isLoggedIn ? (
              <Link
                href="/dash"
                className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-main-0 hover:bg-primary-700 shadow-sm transition-all"
              >
                <i className="bi bi-person" aria-hidden="true" />
                Dashboard
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-main-0 hover:bg-primary-700 shadow-sm transition-all"
              >
                <i className="bi bi-person-lock" aria-hidden="true" />
                Sign in
              </Link>
            )}
          </div>
        </nav>
      </header>

      <section className="relative -mt-22 border-b border-main-800 pt-22 text-main-0 overflow-hidden">
        <Image
          src="/cover-image.jpg"
          alt="Marketia Cover Background"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-linear-to-b from-main-950/50 via-main-950/30 to-main-950/60 pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="max-w-3xl rounded-2xl border border-main-700/50 bg-main- p-8 sm:p-10 lg:p-12 shadow-2xl backdrop-blur-sm">
            <h3 className="text-3xl font-bold leading-tight text-main-0">
              Marketia and Price Decision Support System
            </h3>
            <p className="mt-6 text-lg leading-8 text-main-300">
              An intelligent market information platform for farmers, entrepreneurs,
              buyers, and market officers who need reliable prices, forecasts, and
              recommendations for better market decisions.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#features"
                className="flex items-center justify-center gap-2 rounded-md bg-primary-600 px-5 py-3 text-center text-sm font-semibold text-main-0 shadow-lg shadow-primary-950/50 hover:bg-primary-500 transition-all"
              >
                <i className="bi bi-arrow-down-circle" aria-hidden="true" />
                Explore platform
              </a>
            </div>
            <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-main-800/80 pt-8">
              {impactMetrics.map((metric) => (
                <div key={metric.label} className="border-l border-primary-500/40 pl-4">
                  <dt className="text-2xl font-bold text-main-0 sm:text-3xl">{metric.value}</dt>
                  <dd className="mt-1 text-sm leading-5 text-main-300">{metric.label}</dd>
                </div>
              ))}
            </dl>
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
                className="rounded-lg border border-main-200 bg-main-100 p-6 shadow-sm"
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

      <section className="border-y border-main-200 bg-main-100 py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase text-primary-700">
              Built for access
            </p>
            <h2 className="mt-3 text-3xl font-bold text-main-950">Designed for rural markets</h2>
            <p className="mt-4 text-base leading-7 text-main-700">
              Marketia supports internet-connected dashboards while keeping essential price
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
                <p className="mt-2 text-sm text-main-600">Personalized market access</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="benefits" className="bg-main-100 py-16 lg:py-20">
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
                Marketia combines artificial intelligence, machine learning, multi-source data,
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
            <a href="#" className="flex items-center gap-3" aria-label="Marketia home">
              <span className="flex size-11 items-center justify-center rounded-lg border border-main-800 bg-main-100 p-1.5">
                <Image
                  src="/logo.png"
                  alt=""
                  width={574}
                  height={597}
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="text-sm font-semibold uppercase text-main-100">
                Marketia
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
                Personalized market data
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-main-800">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 text-sm text-main-400 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <p>Marketia and Price Decision Support System</p>
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

"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../auth/hooks/useAuth";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-main-50 text-main-900">
      <header className="sticky top-0 z-50 border-b border-main-200 bg-main-100/90 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Marketia home">
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
              Marketia
            </span>
          </Link>
          <div className="flex items-center gap-8 text-sm font-medium text-main-600">
            <Link className="flex items-center gap-2 hover:text-primary-700" href="/">
              Home
            </Link>
            <Link className="flex items-center gap-2 text-primary-700 font-bold hover:text-primary-700" href="/market">
              Marketplace
            </Link>
            {user ? (
              <Link
                href="/dash"
                className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-main-0 hover:bg-primary-700 transition-all"
              >
                <i className="bi bi-person" aria-hidden="true" />
                Dashboard
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-main-0 hover:bg-primary-700 transition-all"
              >
                <i className="bi bi-person-lock" aria-hidden="true" />
                Sign In
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-1 px-6 py-12 mx-auto w-full max-w-7xl lg:px-8">{children}</main>

      <footer className="bg-main-900 px-6 py-16 text-main-400 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <Link href="/" className="flex items-center gap-3" aria-label="Marketia home">
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
            </Link>
            <p className="mt-4 max-w-md text-sm leading-6 text-main-300">
              Market intelligence, price prediction, and decision support for farmers,
              entrepreneurs, buyers, and market officers.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-main-100">Platform</h2>
            <nav className="mt-4 flex flex-col gap-3 text-sm text-main-300">
              <Link href="/#features" className="flex items-center gap-2 hover:text-primary-300">
                <i className="bi bi-grid" aria-hidden="true" />
                Features
              </Link>
              <Link href="/#benefits" className="flex items-center gap-2 hover:text-primary-300">
                <i className="bi bi-check2-circle" aria-hidden="true" />
                Benefits
              </Link>
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
        <div className="border-t border-main-800 mt-12 pt-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-main-400 sm:flex-row sm:items-center sm:justify-between">
            <p>Marketia and Price Decision Support System</p>
            <a href="#" className="flex items-center gap-2 font-medium text-main-200 hover:text-primary-300">
              <i className="bi bi-arrow-up-circle" aria-hidden="true" />
              Back to top
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import appIcon from "../icon.png";
import { useAuth } from "../auth/hooks/useAuth";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-main-50 text-main-950">
      <header className="sticky top-0 z-50 border-b border-main-200 bg-main-100/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-primary-700 text-lg">
            <Image src={appIcon} alt="Marketia" className="h-8 w-8 object-contain" />
            <span>Marketia</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-semibold text-main-600 hover:text-primary-700 transition-colors">
              Home
            </Link>
            <Link href="/listings" className="text-sm font-semibold text-main-600 hover:text-primary-700 transition-colors font-bold text-primary-700">
              Marketplace
            </Link>
            {user ? (
              <Link
                href="/dash"
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700 transition-all"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700 transition-all"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      <footer className="border-t border-main-200 bg-main-100 py-6 text-center text-xs text-main-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          &copy; {new Date().getFullYear()} Marketia. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

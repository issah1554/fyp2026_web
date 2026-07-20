"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../auth/hooks/useAuth";

interface TopNavBarProps {
  isMobile: boolean;
  onToggleSidebar: () => void;
}

export default function TopNavBar({ isMobile, onToggleSidebar }: TopNavBarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState<"notif" | "profile" | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpen(null);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = nextTheme;
    window.localStorage.setItem("theme", nextTheme);
  };

  const initials = `${user?.firstName?.[0] ?? "D"}${user?.lastName?.[0] ?? "B"}`.toUpperCase();
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Marketia";

  return (
    <nav ref={navRef} className="sticky top-0 z-30 h-14 border-none border-main-200 bg-main-100 sm:h-16">
      <div className="flex h-full items-center justify-between gap-2 px-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            className={`shrink-0 text-main-500 hover:text-main-700 ${isMobile ? "block" : "hidden"}`}
            type="button"
          >
            <i className="bi bi-list text-2xl" />
          </button>

          <Link
            href="/dash"
            prefetch={false}
            className="hidden truncate text-sm font-semibold text-main-700 hover:text-primary-700 sm:block"
          >
            Dashboard
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            onClick={(event) => {
              const icon = event.currentTarget.querySelector("i");
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
                icon?.classList.replace("bi-fullscreen", "bi-fullscreen-exit");
              } else {
                document.exitFullscreen();
                icon?.classList.replace("bi-fullscreen-exit", "bi-fullscreen");
              }
            }}
            className="cursor-pointer text-main-500 hover:text-primary-700"
            aria-label="Toggle fullscreen"
            type="button"
          >
            <i className="bi bi-fullscreen text-xl" />
          </button>

          <button
            onClick={toggleTheme}
            className="cursor-pointer text-main-500 hover:text-main-700"
            aria-label="Toggle theme"
            type="button"
          >
            <i className="bi bi-circle-half text-xl" />
          </button>

          <div className="relative">
            <button
              onClick={() => setOpen(open === "notif" ? null : "notif")}
              className="relative cursor-pointer text-main-500 hover:text-main-700"
              type="button"
            >
              <i className="bi bi-bell text-xl" />
              <span className="absolute -right-2 -top-1 rounded-full bg-danger-600 px-1.5 text-[10px] text-main-0">
                3
              </span>
            </button>

            {open === "notif" && (
              <div className="absolute right-0 z-50 mt-2 w-64 rounded-sm border border-main-300 bg-main-200 text-sm text-main-700 shadow-none shadow-main-300">
                <div className="px-4 py-2 font-semibold">Notifications</div>
                <div className="border-t border-main-300">
                  <div className="px-4 py-2 hover:bg-main-300">12 market prices need validation</div>
                  <div className="px-4 py-2 hover:bg-main-300">Rice forecast updated for Kilombero</div>
                  <div className="px-4 py-2 hover:bg-main-300">USSD gateway latency is stable</div>
                </div>
                <Link
                  href="/dash"
                  onClick={() => setOpen(null)}
                  prefetch={false}
                  className="block rounded-b-sm border-t border-main-300 px-4 py-2 text-center text-primary-700 hover:border-primary-300 hover:bg-primary-200"
                >
                  View all
                </Link>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setOpen(open === "profile" ? null : "profile")}
              className="cursor-pointer focus:outline-none"
              type="button"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-primary-700 text-xs font-semibold text-main-0">
                {initials}
              </span>
            </button>

            {open === "profile" && (
              <div className="absolute right-0 z-50 mt-2 w-max min-w-56 max-w-[calc(100vw-1rem)] rounded-md border border-main-300 bg-main-200 text-sm shadow-lg">
                <div className="max-w-full border-b border-main-300 px-4 py-4 text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary-700 text-sm font-semibold text-main-0">
                    {initials}
                  </span>
                  <div className="mt-2 wrap-break-word font-semibold">{displayName}</div>
                  <div className="break-all text-xs text-main-500">{user?.email}</div>
                </div>

                <Link href="/me/companies" onClick={() => setOpen(null)} prefetch={false} className="flex items-center gap-2 px-4 py-2 hover:bg-main-300">
                  <i className="bi bi-buildings" /> My companies
                </Link>

                <Link href="/settings" onClick={() => setOpen(null)} prefetch={false} className="flex items-center gap-2 px-4 py-2 hover:bg-main-300">
                  <i className="bi bi-gear" /> Settings
                </Link>

                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    router.replace("/auth/login");
                  }}
                  className="flex w-full items-center gap-2 rounded-b-sm border-t border-main-300 px-4 py-2 text-danger-600 hover:border-danger-300 hover:bg-danger-100"
                >
                  <i className="bi bi-box-arrow-right" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../../auth/hooks/useAuth";
import Footer from "./Footer";
import TopNavBar from "./TopNavBar";
import { SideNavBar } from "./sidenavbar/SideNavBar";

function useResponsive() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return { isMobile };
}

export function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { isMobile } = useResponsive();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const effectiveCollapsed = !isPinned && !isHovering ? true : isCollapsed;

  const mainMargin = isMobile ? "ml-0" : effectiveCollapsed ? "ml-16" : "ml-64";

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-main-100 text-main-700">
        <div className="flex items-center gap-3 rounded border border-main-200 bg-main-0 px-4 py-3 shadow-sm">
          <span className="size-4 animate-spin rounded-full border-2 border-primary-700 border-t-transparent" />
          <span className="text-sm font-medium">Loading workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-main-100 text-main-900">
      {!isMobile && (
        <SideNavBar
          effectiveCollapsed={effectiveCollapsed}
          isPinned={isPinned}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onTogglePin={() => {
            setIsPinned((current) => !current);
            setIsCollapsed(false);
          }}
        />
      )}

      {isMobile && sidebarOpen && (
        <>
          <button
            aria-label="Close sidebar overlay"
            className="fixed inset-0 z-30 bg-main-950"
            onClick={() => setSidebarOpen(false)}
          />
          <SideNavBar
            effectiveCollapsed={false}
            isPinned
            mobile
            onCloseMobile={() => setSidebarOpen(false)}
            onMouseEnter={() => undefined}
            onMouseLeave={() => undefined}
            onTogglePin={() => undefined}
          />
        </>
      )}

      <div className={`flex min-h-screen min-w-0 flex-1 flex-col transition-all duration-300 ${mainMargin}`}>
        <TopNavBar
          isMobile={isMobile}
          onToggleSidebar={() => {
            if (isMobile) {
              setSidebarOpen((current) => !current);
              return;
            }

            setIsCollapsed((current) => !current);
          }}
        />

        <main className="min-w-0 flex-1 overflow-y-auto px-2 sm:p-4 md:px-6">{children}</main>

        <Footer />
      </div>
    </div>
  );
}

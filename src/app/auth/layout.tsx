"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./hooks/useAuth";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dash");
    }
  }, [user, loading, router]);

  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-main-50 text-main-700">
        <span className="size-4 animate-spin rounded-full border-2 border-primary-700 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}

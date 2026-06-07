"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const session = localStorage.getItem("matchmaker-session");
      const isLoggedIn = session === "active";

      if (!isLoggedIn && pathname !== "/login") {
        router.replace("/login");
      } else if (isLoggedIn && pathname === "/login") {
        router.replace("/dashboard");
      }
      setLoading(false);
    };

    checkAuth();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-text-secondary animate-pulse">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  const isProtectedPath = pathname !== "/login";
  const isLoggedIn = typeof window !== "undefined" && localStorage.getItem("matchmaker-session") === "active";
  
  if (isProtectedPath && !isLoggedIn) {
    return null;
  }

  return <>{children}</>;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const session = localStorage.getItem("matchmaker-session");
    if (session === "active") {
      router.replace("/dashboard");
    } else {
      window.location.href = "/index.html";
    }
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-text-secondary">Loading system...</p>
      </div>
    </div>
  );
}

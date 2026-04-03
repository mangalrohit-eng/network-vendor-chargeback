"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/app-store";

export function StoreHydration({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const ensureSeed = useAppStore((s) => s.ensureSeed);

  useEffect(() => {
    ensureSeed();
    setReady(true);
  }, [ensureSeed]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center border border-border bg-background text-sm text-muted-foreground">
        Loading workspace…
      </div>
    );
  }

  return <>{children}</>;
}

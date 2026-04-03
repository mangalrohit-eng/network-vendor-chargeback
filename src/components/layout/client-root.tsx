"use client";

import { useEffect, type ReactNode } from "react";
import { useAppStore } from "@/stores/app-store";

/** Zustand persist seed only — no chrome (login stays unbranded). */
export function ClientRoot({ children }: { children: ReactNode }) {
  useEffect(() => {
    const runSeed = () => {
      useAppStore.getState().ensureSeed();
    };

    const api = useAppStore.persist;
    if (!api) {
      runSeed();
      return;
    }
    if (api.hasHydrated()) {
      runSeed();
      return;
    }
    return api.onFinishHydration(() => {
      runSeed();
    });
  }, []);

  return <>{children}</>;
}

"use client";

import { useEffect, type ReactNode } from "react";
import { useAppStore } from "@/stores/app-store";
import { AppShell } from "@/components/layout/app-shell";

/**
 * Single client boundary for the app shell + Zustand seed after persist rehydration.
 * Avoids nested client wrappers that can fragment `app/layout` chunks and confuse dev HMR.
 */
export function RootProviders({ children }: { children: ReactNode }) {
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

  return <AppShell>{children}</AppShell>;
}

"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/app-store";

/**
 * Seeds demo data after localStorage rehydration. Does not block the UI — the old
 * "Loading workspace" gate caused a stuck screen when hydration/effect ordering failed.
 */
export function StoreHydration({ children }: { children: React.ReactNode }) {
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

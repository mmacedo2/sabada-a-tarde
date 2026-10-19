import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

const LIVE_REFRESH_MS = 20_000;

/** Re-runs the page's loaders while a game on it is being played, so scores update. */
export function useLiveRefresh(active: boolean) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void router.invalidate();
    }, LIVE_REFRESH_MS);
    return () => clearInterval(timer);
  }, [active, router]);
}

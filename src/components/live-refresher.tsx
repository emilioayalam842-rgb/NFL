"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-fetches the current server component on an interval — used on pages
 * showing a live game so the score/stats update without a manual reload. */
export function LiveRefresher({ intervalSeconds }: { intervalSeconds: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalSeconds * 1000);
    return () => clearInterval(id);
  }, [router, intervalSeconds]);

  return null;
}

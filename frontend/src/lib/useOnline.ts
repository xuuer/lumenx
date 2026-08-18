"use client";

import { useEffect, useState } from "react";

/**
 * Tracks browser online/offline state via navigator.onLine + the window
 * 'online'/'offline' events. SSR-safe: assumes online on the initial render to
 * avoid a hydration mismatch; the real value is read on mount.
 *
 * NOTE: navigator.onLine reflects network connectivity, not backend
 * reachability — a refused backend request does NOT flip this to offline.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  return online;
}

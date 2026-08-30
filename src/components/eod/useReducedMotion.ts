"use client";

import { useSyncExternalStore } from "react";

// Subscribing to a browser media query is exactly the case
// useSyncExternalStore exists for (react.dev): it avoids the
// render-then-effect-then-setState round trip a plain useState+useEffect
// pair would need, and its getServerSnapshot keeps SSR/hydration
// consistent (server always renders the "no preference" branch). Extracted
// from the retired Scrubber.tsx (task F9) so both the log entries and any
// future consumer share one implementation.
function subscribe(callback: () => void) {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}
function getSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function getServerSnapshot() {
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

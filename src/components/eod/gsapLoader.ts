// Controller Ruling R8 (binding): GSAP must not enter any initial chunk.
// This is the single place the site imports it — a dynamic import() that
// webpack splits into its own async chunk, requested only when the first
// replay interaction happens (PLAY press, or a drill-cell click as a
// warm-up prefetch). scripts/verify-performance-budget.mjs measures the
// real cold-load initial JS and would fail if gsap ever became static.

export type GsapModule = (typeof import("gsap"))["gsap"];

let gsapPromise: Promise<GsapModule> | null = null;

export function loadGsap(): Promise<GsapModule> {
  if (!gsapPromise) {
    gsapPromise = import("gsap").then((mod) => mod.gsap ?? mod.default);
  }
  return gsapPromise;
}

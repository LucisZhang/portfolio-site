// Spec §6.1: the live layer (server-side CPU/GPU inference, §7) ships in R6.
// This phase (R2) ships only its CLOSED state — one hairline mono line where
// the live status badge / "wake the GPU" control will eventually sit. No
// /api call is made anywhere on this page; there is nothing to poll yet.
// `data-live-slot` is a stable test hook (forge-r2.spec.ts) distinct from
// the frozen SEL.instrument contract, which this sits inside of.
export function LiveSlot() {
  return (
    <p className="forge-live-slot" data-live-slot data-live-state="closed">
      LIVE LAYER — OFFLINE
    </p>
  );
}

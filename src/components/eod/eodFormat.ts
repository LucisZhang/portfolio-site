// Small pure formatting helpers for the Exactly-Once Drills fault
// chessboard. Every number these receive is read from an on-site JSON file
// by the caller — nothing here invents a value.

export function fmtMs(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  if (value < 1000) return `${value}ms`;
  return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}s`;
}

export function fmtOffset(ms: number | null): string {
  if (ms === null) return "T+—";
  const seconds = Math.abs(ms) / 1000;
  // Negative offsets (samples recorded before fault injection, e.g. the
  // broker-slo lag series' pre-fault window) read "T-24.0s", not "T+-24.0s".
  return `T${ms < 0 ? "-" : "+"}${seconds.toFixed(1)}s`;
}

export function isoToMs(iso: string | undefined | null): number | null {
  if (!iso) return null;
  const value = Date.parse(iso);
  return Number.isNaN(value) ? null : value;
}

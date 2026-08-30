// Exactly-Once Drills fault chessboard (spec §6.5, task 2.3). Every number
// below is read from public/case-studies/exactly-once-drills/* or the
// generated receipts file at import time — nothing here is a typed-in
// benchmark figure. See docs/evidence/digits-eod.md for the full
// number -> file -> JSON path -> SHA-256 register.
import summaryJson from "../../../public/case-studies/exactly-once-drills/index.summary.json";
import eodReceipts from "@/data/generated/eod-receipts.json";

export type DrillSummaryRow = {
  id: string;
  abbr: string;
  injectMs: number | null;
  detectMs: number | null;
  recoverMs: number | null;
  verifyMs: number | null;
  diff: number;
  file: string;
};

export const EOD_ROWS = summaryJson as DrillSummaryRow[];

export const eodReceiptsData = eodReceipts as {
  summary: { sha256: string; bytes: number };
  brokerSlo: { sha256: string; bytes: number };
  manifest: { sha256: string; bytes: number };
  drillFileHashes: Record<string, { sha256: string; bytes: number }>;
  sustainedThroughputEventsPerSecond: number;
  endToEndSeconds: number;
  allDiffsZero: boolean;
  drillCount: number;
  generatedAt: string;
};

// Single source of truth for the truncated (not rounded) throughput
// figure, so the hero stat tile and the instrument's counter line can
// never diverge the way they did before this function existed (review
// finding: the hero tile independently called `.toFixed(0)`, which rounds
// 1791.665 up to "1792" instead of matching the "1,791 events/s" phrasing
// already established elsewhere on the site — src/lib/projects.ts's eod
// entry, the homepage's evidence projection — for the same underlying
// measurement). Every caller of this number MUST go through this helper.
export function formattedThroughput(): string {
  return Math.floor(eodReceiptsData.sustainedThroughputEventsPerSecond).toLocaleString("en-US");
}

// Task F9's honesty line ("55.814s from the first MySQL write to zero
// Iceberg backlog"): broker_slo.json's own end-to-end measurement, routed
// through eod-receipts.json rather than typed as a literal in EodLog.tsx.
export function formattedEndToEndSeconds(): string {
  return eodReceiptsData.endToEndSeconds.toFixed(3);
}

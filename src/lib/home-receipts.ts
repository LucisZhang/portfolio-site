import homeReceiptsJson from "@/data/generated/home-receipts.json";

// Typed accessor for scripts/generate-home-receipts.mjs's output (task 1.2):
// the release.json / EOD manifest / privacy manifest SHA-256 values, build
// date, and gate status shown in exhibit 06 ("HOW THIS SITE IS BUILT AND
// CHECKED"). Kept separate from src/lib/home-stats.ts because the two
// generators are independently owned (home-stats.json is task 1.1's
// concurrently-maintained adapter; home-receipts.json is this task's own).
export interface HomeReceiptEntry {
  sha256: string;
  source: string;
}

export interface HomeReceipts {
  releaseJson: HomeReceiptEntry;
  eodManifest: HomeReceiptEntry;
  privacyManifest: HomeReceiptEntry;
  buildDate: string;
  gateStatus: string;
}

export const homeReceipts = homeReceiptsJson as HomeReceipts;

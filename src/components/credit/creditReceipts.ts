import { CREDIT_BACKTEST_ARTIFACT_SHA256 } from "@/lib/credit-backtest-identity";
import { CREDIT_POLICY_FRONTIER_REPORT_SHA256 } from "@/lib/credit-policy-frontier-identity";

// SHA-256 receipts for the Credit Policy Desk SOURCE/RECEIPTS exhibit (04).
// Committed-file hashes only -- not re-computed at runtime, matching the
// marginReceipts.ts / triageReceipts.ts precedent (docs/evidence/
// digits-credit.md documents the same table and how it was produced;
// pipelines/credit-backtest/README.md and PROVENANCE.md are the upstream
// source of truth for the Parquet artifact itself).
export const CREDIT_RECEIPTS = {
  backtestReport: { path: "public/case-studies/credit-policy-desk/backtest-report.json", sha256: "615db22426cb120e40b2eaf8cd4f7ffef61eac59ae46e408ed39e316f0ffffb2" },
  methodsEvidence: { path: "public/case-studies/credit-policy-desk/methods-evidence.json", sha256: "aed9bf83bfd71a914fd0da70a3425180ac468e437d0e50ff6a778aa9e7c54f0b" },
  compactPreview: { path: "public/case-studies/credit-policy-desk/credit-backtest-compact.json", sha256: "77637de537299d3e19dbfb8fecc8ac644aaa13f253a46f71f63418ca6843d3b6" },
  policyFrontierReport: { path: "public/case-studies/credit-policy-desk/policy-frontier-report.json", sha256: CREDIT_POLICY_FRONTIER_REPORT_SHA256 },
  scoredBacktestParquet: { path: "public/case-studies/credit-policy-desk/scored-backtest.parquet", sha256: CREDIT_BACKTEST_ARTIFACT_SHA256 },
} as const;

export const CREDIT_REPRODUCE_COMMANDS = [
  "python3 -m venv .venv && .venv/bin/pip install -r pipelines/credit-backtest/requirements.txt",
  ".venv/bin/python pipelines/credit-backtest/build.py --download",
  ".venv/bin/python pipelines/credit-backtest/build.py --verify-only",
  "npm run generate:credit-preview",
  "npm run generate:credit-policy-frontier",
] as const;

export const CREDIT_VERIFY_SQL = "SELECT * FROM read_parquet('scored-backtest.parquet')";

// SHA-256 receipts for the Margin Control Tower SOURCE/RECEIPTS exhibit
// (04). Committed-file hashes only -- not re-computed at runtime, matching
// the triageReceipts.ts / triage-router precedent (docs/evidence/
// digits-margin.md documents the same table and how it was produced;
// pipelines/olist-margin/README.md's own "Verified 2026-07-17" table is the
// upstream source of truth for the three pipeline-produced files).
export const MARGIN_RECEIPTS = {
  detectionReport: { path: "public/case-studies/margin-control-tower/detection-report.json", sha256: "71f9a444f3cc916056142f3ef128174cf7c0f0f8d598eedd9e1a8393e4653580" },
  elasticityReport: { path: "public/case-studies/margin-control-tower/elasticity-report.json", sha256: "8f5cf741575d5dfe290ecb7422f304eaf7065f6157b664b4ac36b367dcc4c10d" },
  metricRegistry: { path: "public/case-studies/margin-control-tower/metric-registry.json", sha256: "4eada1504cd4088a7986283c68a5f02a75b298305e423de467f326d916640ae9" },
  olistParquet: { path: "public/case-studies/margin-control-tower/olist-margin.parquet", sha256: "6921b7ed790367fe9d9ade878a7b97e6d7c2879b9488eef51b326ad9775722fb" },
} as const;

export const MARGIN_REPRODUCE_COMMANDS = [
  "python3 -m venv .venv && .venv/bin/pip install -r pipelines/olist-margin/requirements.txt",
  ".venv/bin/python pipelines/olist-margin/build.py --download",
  ".venv/bin/python pipelines/olist-margin/build.py --verify-only",
] as const;

export const MARGIN_VERIFY_SQL = "SELECT * FROM read_parquet('olist-margin.parquet')";

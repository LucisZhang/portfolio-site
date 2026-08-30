// SHA-256 of public/case-studies/credit-policy-desk/policy-frontier-report.json
// (task L4 [CLAUDE]) -- committed-file receipt, same convention as
// src/lib/credit-backtest-identity.ts and src/lib/olist-margin-identity.ts.
// scripts/generate-credit-policy-frontier.mjs produces this file
// deterministically from the already-locked credit-backtest-compact.json
// (`--check` re-verifies byte-for-byte, wired into `npm run verify:evidence`).
// This single constant is the source both src/components/credit/
// creditReceipts.ts's SOURCE/RECEIPTS row and docs/evidence/digits-credit.md
// read, so the two never drift from each other.
export const CREDIT_POLICY_FRONTIER_REPORT_SHA256 = "bba03c36b0b2923bc9c6250593eeb695a7e25eaae2c2c093005eb779b4c230cb";

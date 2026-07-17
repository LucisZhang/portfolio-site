# Project state - Analytics tandem

Last updated: 2026-07-16
Lane key: `analytics-tandem`
Execution owner: Codex (GPT-5.6 Sol)
Source notes: `~/Library/CloudStorage/OneDrive-个人/Learning/其他简历参考/Self-done Project`
Greenfield working copies: `~/margin-control-tower` at `68ef751` and
`~/credit-policy-lab` at `639fbc0`
Public artifacts: Tableau `Ecommerce_RFM_and_Funnel_Analysis/Dashboard1`; HF Space and GitHub
`Risk-Control-Portfolio`
Status: V1 COMBINED PAGE SUPERSEDED; TWO GREENFIELD OPERABLE CASE STUDIES COMPLETE; LEGACY URL PRESERVED

## Next action on resume

Preserve the split routes and the legacy migration page. Inherited Tableau/HF artifacts remain
prior work only; all values in the new demos must continue to derive from the committed fixed-seed
synthetic fixtures and must not be described as real business or model performance.

## Acceptance and boundaries

- Tableau and credit-risk/fraud public links resolve.
- The page contains zero unverified dataset, funnel, segment, imbalance, or model-performance
  numbers.
- The page distinguishes BI/funnel analysis from deployed risk exploration without presenting
  either as verified performance evidence.
- Inherited numbers remain excluded. New displayed values must be reproducibly computed from the
  versioned fixed-seed fixtures and retain their synthetic label.

## Greenfield rebuild checkpoint

- `Margin Control Tower`: 9,360 synthetic rows from seed `2026071301` across 52 weeks, 20 products,
  five categories, three regions, and three channels; ten data contracts, governed metric
  definitions, an explicit injected anomaly, a disclosed promotion elasticity assumption,
  synthetic holdout prompt, and deterministic action rule.
- `Credit Policy Lab`: 12,000 fictional applications and 9,945 booked-loan IDs from seed
  `2026071302`, split 6,000/3,000/3,000 across train/calibration/backtest and 12 vintages; ten
  data/policy contracts, score-calibration-policy separation, `PD x LGD x EAD`,
  approve/review/decline bands, analyst-capacity gating, synthetic Brier/PSI/vintage/slice
  monitoring, reason codes, and audit.
- Every generated fixture records a SHA-256 over its rows and is regenerated during build by
  `scripts/generate-analytics-fixtures.mjs`.
- Each project has a public README, architecture source, data or policy contract, provenance,
  limitations, failure conditions, monitoring design, and a stable in-portfolio demo.
- The old `/analytics/analytics-tandem` route is a migration page linking to both rebuilds. It is
  intentionally omitted from current homepage and track indexes but remains statically generated.
- No real commercial result, real applicant, model recovery, external dataset license, causal lift,
  production accuracy, regulatory compliance, or real-world fairness claim is made.

## Evidence anchor

- `public/case-studies/analytics-tandem/links.json`
- `public/case-studies/margin-control-tower/`
- `public/case-studies/credit-policy-lab/`
- A Tableau static image was intentionally rejected because the image itself exposed unverified
  dashboard values; v1 uses direct links and qualitative descriptions instead.

## Lane isolation

This state is independent of every other project. External-demo availability does not affect the
two static browser experiences.

# Analytics real-data sourcing audit

Audit date: 2026-07-17 (Asia/Shanghai)

## Finding before this work

Neither analytics project pulled an internet dataset. Margin Control Tower loaded the committed
fixed-seed `synthetic-margin-data.*` fixture (9,360 rows, seed `2026071301`), and Credit Policy Lab
loaded the committed fixed-seed `synthetic-credit-data.*` fixture (12,000 rows, seed `2026071302`).
The optional browser paths already referenced `olist-margin.parquet`, `detection-report.json`,
`elasticity-report.json`, and `scored-backtest.parquet`, but those real-data artifacts were absent.
Their absence correctly produced a visible pending state and a synthetic fallback.

## Sources selected

### Margin Control Tower

- Dataset authority: [Brazilian E-Commerce Public Dataset by Olist](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce)
- Retrieval date: 2026-07-17
- License: CC BY-NC-SA 4.0
- Scale/domain: 99,441 orders and 112,650 order items with customer state, payment, review, status,
  item price, and freight tables.
- Messiness/reconciliation: missing product categories and delivery fields; multi-row payments and
  reviews; payment versus item-plus-freight differences; relational joins before aggregation.
- Byte transport: immutable public Git LFS mirror pinned in
  `pipelines/olist-margin/source-lock.json`; all six file sizes match Kaggle's public manifest and
  every file is SHA-256 locked. Kaggle remains the authority.

Olist is the default choice in the brief and fits better than a pre-aggregated sales table because
the margin grain must be reconstructed from real relational records. Raw tables remain ignored.

### Credit Policy Lab

- Dataset authority: [Lending Club loan dataset for granting models](https://zenodo.org/records/11295916)
- DOI: `10.5281/zenodo.11295916`, version 0.1
- Retrieval date: 2026-07-17
- License: CC BY 4.0
- Scale/domain: 1,347,681 time-stamped granted applications with application-time variables and
  final fully-paid/default outcomes.
- Messiness/reconciliation: missing/mixed free text, `NI` employment encodings, long-tailed
  income/DTI, categorical normalization, chronological splits, and deterministic artifact sampling.
- Byte transport: immutable public Git LFS mirror pinned in
  `pipelines/credit-backtest/source-lock.json`; its 167,468,415-byte object matches Zenodo's
  published MD5 and the locked SHA-256. Zenodo remains the authority.

The UCM-curated granting-model version is stricter than the raw accepted-loans dump: it removes
post-decision variables and transitory outcomes, reducing target leakage while keeping application
scale and observed final outcomes. Raw rows remain ignored.

## Resulting architecture

Both labs request their committed, derived ZSTD Parquet artifacts by default and retain the
fixed-seed fixtures as separately labeled fallbacks and explicit comparison sources. Margin first
renders a hash-verified compact preview, then activates full DuckDB-WASM materialization after the
scheduled eight-second warm or an earlier qualifying interaction, reusing the same downloaded
bytes without a second Parquet request. Credit loads its scored backtest through DuckDB-WASM.
Missing or invalid real evidence fails closed to the synthetic fallback. Both Python pipelines fail
closed on source hashes and browser contracts, embed provenance metadata, and emit bilingual
on-page methods evidence. No raw upstream dataset is committed.

## Verified generated evidence

### Margin

- Derived artifact: 15,809 cells across 95 observed weeks and 74 categories; 14,313 analysis rows
  and 1,496 rows in exactly the final eight observed weeks.
- Discount reference prices are prior-only after an explicit cold-start rule: each category's
  first observed week falls back to current item price and therefore receives zero proxy discount.
- For STL, 95 observed totals are reindexed to a complete 106-Monday calendar; 11 Mondays with no
  derived Olist cells are explicitly zero-filled, and replay labels use observed Mondays only.
- Parquet: 672,410 bytes; SHA-256
  `6921b7ed790367fe9d9ade878a7b97e6d7c2879b9488eef51b326ad9775722fb`.
- Deterministic replay detector: 6 TP / 13 FP / 0 FN, precision 0.315789 and recall 1.000000.
- Analysis-fit associational log-log price coefficient: +0.039548, 95% CI [0.026085, 0.053010];
  later-eight-week MAPE 0.758549. This is not a causal demand estimate.

### Credit

- Derived artifact: 120,000 pseudonymous, linkable granted-loan applications; 72,000 train /
  24,000 calibration / 24,000 later backtest rows.
- Parquet: 4,931,892 bytes; SHA-256
  `2bbc97350d28123a1b056e4d475cdc90000954df1e6226d54d4fa35f2e7e0b95`.
- Later-backtest baseline isotonic Brier / log-loss / ROC AUC: 0.15928048 / 0.49340292 /
  0.67461544; challenger isotonic: 0.15925265 / 0.49431980 / 0.67526164.
- Observed later-backtest default rate: 0.21816667. The archive contains granted loans only, so
  rejected applicants and acceptance-population policy effects are not represented.
- The report metrics are computed after rereading the final float64-score Parquet; `--verify-only`
  independently recomputes AUC, Brier, log-loss, and default rate from those exact columns.

Both primary builds passed `--verify-only`. Independent pinned-environment rebuilds reproduced
every artifact, report, and methods-evidence hash exactly.

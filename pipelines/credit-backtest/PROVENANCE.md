# Credit backtest provenance

## Authority and retrieval

- Canonical record: [Lending Club loan dataset for granting models](https://zenodo.org/records/11295916)
- DOI: [10.5281/zenodo.11295916](https://doi.org/10.5281/zenodo.11295916), version 0.1
- Published: 2024-05-25; retrieved: 2026-07-17
- License: [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/) (`CC BY 4.0`)
- Creators: Miller Janny Ariza-Garzón and Mario Sanz-Guerrero (data curators), Javier Arroyo
  Gallardo (project leader), and Lending Club (data collector).
- Source file: `LC_loans_granting_model_dataset.csv`, 167,468,415 bytes,
  MD5 `b019384d6bc65bf2a3e839362e4ff502`,
  SHA-256 `207d65b2712f775a91404496ab27c786ac0da6b0f977f849e6d5d8149e925acc`.

## Byte transport and locks

Zenodo is the dataset authority. Direct Zenodo file transfer was unavailable in this environment,
so the exact bytes were transported from the public Git LFS repository `j4xie/5900incred` at
immutable commit `7a5ef5b1d986eac8df9df6245f8261d1a66b7aa7`, path
`data/LC_loans_granting_model_dataset.csv`. The LFS object ID is the same SHA-256 above, and the
download exactly matches Zenodo's published size and MD5. `source-lock.json` is fail-closed on all
three checks.

No raw Lending Club application is tracked. `.cache/raw/` is ignored. The pipeline deterministically
selects 120,000 rows inside disjoint time windows and publishes only hashed application/loan IDs,
normalized display fields, offline scores, final observed outcomes, and SHAP-derived reason codes.
Text, ZIP, and direct source IDs are excluded.

The hashes are pseudonymous and linkable within the derived artifact; they are not anonymous.

## Derived outputs

- `public/case-studies/credit-policy-lab/scored-backtest.parquet`
- `public/case-studies/credit-policy-lab/backtest-report.json`
- `public/case-studies/credit-policy-lab/methods-evidence.json`

The Parquet metadata embeds DOI, creators, license, source size/hashes, mirror commit, algorithm and
transform versions, time cutoffs, sampling rule, and LGD/display-field assumptions. Reason codes
use the three largest absolute XGBoost SHAP contributions and encode each contribution's direction.
The generated
`methods-evidence.json` records the current Parquet SHA-256 and links the on-page methods text to
those exact bytes.

The three score columns retain float64 precision. The pipeline computes report metrics only after
rereading the final Parquet, and `--verify-only` independently recomputes AUC, Brier, log-loss, and
default rate from those exact serialized columns.

Verified output identities (2026-07-17):

- `scored-backtest.parquet`: 4,931,892 bytes; SHA-256 `2bbc97350d28123a1b056e4d475cdc90000954df1e6226d54d4fa35f2e7e0b95`
- `backtest-report.json`: SHA-256 `615db22426cb120e40b2eaf8cd4f7ffef61eac59ae46e408ed39e316f0ffffb2`
- `methods-evidence.json`: SHA-256 `7536225b199f8e4fe7cd398e34e4ba2959239eb1f1a333228bafc04b741a0355`

Independent rebuilds with Homebrew `libomp` 22.1.8 and the host's LLVM 22.1.0 runtime reproduced
all hashes exactly.

Attribution is preserved here, in `source-lock.json`, in the pipeline README, and in Parquet
metadata. The derived backtest is an offline historical evaluation, not a live decision system.
Because the archive contains granted loans only, it does not represent rejected applicants or
identify acceptance-population policy effects.

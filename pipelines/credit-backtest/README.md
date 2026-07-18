# Credit backtest pipeline

This offline pipeline adds an optional real-data scored artifact for Credit Policy Lab. It does
not remove or overwrite the fixed-seed synthetic fixture, which remains the default and the
fallback when the Parquet file is absent.

## Source and selection

- Authority: [Lending Club loan dataset for granting models](https://zenodo.org/records/11295916)
- DOI: `10.5281/zenodo.11295916`, version 0.1, published 2024-05-25
- Retrieved: 2026-07-17
- License: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- Creators: Miller Janny Ariza-Garzón and Mario Sanz-Guerrero (data curators), Javier Arroyo
  Gallardo (project leader), and Lending Club (data collector).
- Scale: 1,347,681 granted applications with application month and final fully-paid/default
  outcomes.

The UCM-curated archive is preferable to the raw accepted-loans dump because it excludes
post-decision variables and transitory outcomes before modeling. It still contains real input
messiness: missing and mixed-type free text, `NI` employment encodings, long-tailed income/DTI,
and heterogeneous categorical values. `source-lock.json` records the exact 167,468,415-byte file,
Zenodo-published MD5, and SHA-256. Zenodo is the authority; the pinned Git LFS mirror is byte
transport only and its object matches all three checks. Raw data is ignored and never committed.
The CLI refuses an in-repository raw location outside the pipeline's ignored cache. Its exact
output-schema gate excludes direct source IDs, text, and ZIP; pseudonymous IDs must match the
documented 16-hex format.

Locked input identity: 167,468,415 bytes; MD5
`b019384d6bc65bf2a3e839362e4ff502`; SHA-256
`207d65b2712f775a91404496ab27c786ac0da6b0f977f849e6d5d8149e925acc`.

## Time split, models, and boundaries

1. Parse `issue_d`, deduplicate loan IDs, accept only final binary outcomes, and sort by month.
2. Choose whole-month cutoffs nearest 60% and 80% cumulative volume. Earlier months train, the
   next disjoint months calibrate, and all later months backtest.
3. Within each window, deterministically select 72,000 / 24,000 / 24,000 applications by a stable
   ID hash. This keeps the browser artifact reviewable without random leakage.
4. Fit preprocessing on train only: median/scaled numeric features and one-hot categorical
   features. Text and ZIP are excluded. DTI capping uses the train 99.5th percentile only.
5. Fit an L2-regularized logistic baseline and a 240-tree depth-4 XGBoost challenger on train.
6. Fit independent isotonic maps on calibration only. Preserve float64 score columns, write the
   final Parquet, reread those exact columns, and only then report Brier/log-loss/AUC on later
   backtest outcomes.
7. Emit the three largest absolute XGBoost SHAP contribution codes per application, with each code
   stating whether that contribution increases or decreases PD. EAD is requested amount; LGD is an
   explicit 45% assumption.

The browser's legacy display schema contains fields not supplied by this granting archive.
`utilization` is transparently mapped to requested-amount/income; `late_payments` and
`bureau_age_months` are `-1` unavailable sentinels; `channel` is `not_provided`. None of these
legacy display fields enters model training. `audit_group` is a descriptive home-ownership slice,
not a protected class and not fairness evidence.

The source contains granted loans only. Rejected applicants are not represented, so this backtest
cannot estimate approval-population selection effects or justify a new acceptance policy.

Published application and loan IDs are deterministic hashes: pseudonymous and linkable within the
artifact, not anonymous. Direct source IDs, text, and ZIP are not published.

## Reproduce

From the repository root with Python 3.12:

```bash
python3 -m venv .venv
.venv/bin/pip install -r pipelines/credit-backtest/requirements.txt
.venv/bin/python pipelines/credit-backtest/build.py --download
.venv/bin/python pipelines/credit-backtest/build.py --verify-only
```

XGBoost requires OpenMP on macOS. The verified arm64 host uses Homebrew `libomp` 22.1.8; install it
before building if it is absent:

```bash
brew install libomp
```

To use the already verified archive without a network call:

```bash
.venv/bin/python pipelines/credit-backtest/build.py \
  --input /absolute/path/LC_loans_granting_model_dataset.csv
```

Outputs:

- `public/case-studies/credit-policy-lab/scored-backtest.parquet` (ZSTD, embedded provenance)
- `public/case-studies/credit-policy-lab/backtest-report.json`
- `public/case-studies/credit-policy-lab/methods-evidence.json`

Verified 2026-07-17 on arm64 macOS with Python 3.12, Homebrew `libomp` 22.1.8, and the exact versions in
`requirements.txt`:

| Output | Bytes | SHA-256 |
| --- | ---: | --- |
| `scored-backtest.parquet` | 4,931,892 | `2bbc97350d28123a1b056e4d475cdc90000954df1e6226d54d4fa35f2e7e0b95` |
| `backtest-report.json` | 969 | `615db22426cb120e40b2eaf8cd4f7ffef61eac59ae46e408ed39e316f0ffffb2` |
| `methods-evidence.json` | 7,219 | `7536225b199f8e4fe7cd398e34e4ba2959239eb1f1a333228bafc04b741a0355` |

Independent rebuilds with Homebrew `libomp` 22.1.8 and the host's LLVM 22.1.0 runtime reproduced
all three hashes exactly.

The run is deterministic for the pinned input and versions on the verified environment. XGBoost
and BLAS thread scheduling can change low-order floating-point bytes across machines, so the output
hash is logged and linked from the generated methods evidence rather than claiming universal byte
identity. `--verify-only`
checks the exact browser schema, unique application grain, split coverage, bounds, observed outcome
types, exactly three directional SHAP reason codes, the 95 MiB browser budget, and
methods/report-to-Parquet hash links. It also recomputes AUC, Brier, log-loss, and default rate from
the final Parquet columns and requires exact equality with the JSON report.

No causal impact, production decisioning, acceptance-population effect, regulatory validation, or
fairness conclusion is claimed.

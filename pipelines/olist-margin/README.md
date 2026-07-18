# Olist margin pipeline

This offline pipeline replaces no existing fallback: it adds an optional real-data artifact for
Margin Control Tower while the fixed-seed synthetic fixture remains the default and remains usable
when the Parquet file is absent.

## Source and selection

- Authority: [Brazilian E-Commerce Public Dataset by Olist](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce)
- Retrieved: 2026-07-17
- License: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Scale: 99,441 orders and 112,650 order-item rows.
- Why it fits: order, item, customer, payment, review, status, and freight tables require genuine
  many-to-one reconciliation. Missing product categories, incomplete delivery fields, multiple
  payments, multiple reviews, and payment/item/freight gaps are retained or audited explicitly.

`source-lock.json` is authoritative for byte sizes and SHA-256 values. Kaggle is the dataset
authority. Because the unauthenticated Kaggle download endpoint was unavailable during the build,
the pipeline pins an immutable public Git LFS mirror as byte transport only. The six transported
file sizes exactly match Kaggle's public file manifest. Raw CSV files live under `.cache/raw/` and
are ignored; no upstream row-level table is committed.
The CLI refuses an in-repository raw location outside that ignored cache, and the exact output
schema contains no customer, order, or upstream product identifier.

Locked input SHA-256 values:

| File | SHA-256 |
| --- | --- |
| `olist_customers_dataset.csv` | `983a422239e1712ded753b3bf9ecf47dc73f144d306029dcfa99e70a226883d2` |
| `olist_order_items_dataset.csv` | `0bc4d068c4fe38cbb01bd90e8746e3c613fe7b4baef75fab7b0e329701c3e279` |
| `olist_order_payments_dataset.csv` | `4f713964f2815dbbaa40b9488268c55aac3627bfce5aa96cf58d1f3616de3cc0` |
| `olist_order_reviews_dataset.csv` | `012b61c7593e34f51fa614efdf802b9c7056ce6aae5307ddb93236e7cfc797d7` |
| `olist_orders_dataset.csv` | `8df58ef3d2d7e9944010f7beecd9b75367f5588ec6e3c91cec19ae3345ef9ecf` |
| `olist_products_dataset.csv` | `3e6569628a17fbc75fd206ee357b59e20364b9afa90f5b6cd5b4d624c58aa9cc` |

## Reconciliation and boundaries

1. Collapse multiple payments to the channel with the greatest summed payment value; ties are
   deterministic.
2. Collapse multiple reviews to the lowest score so an adverse report is not silently discarded.
3. Map Brazilian states to three display regions: North includes North + Northeast; South includes
   South + Southeast; West includes Central-West.
4. Retain missing categories as `unknown`; audit payment versus item-price-plus-freight gaps.
5. Aggregate to `week x product_category x region x dominant payment channel` only after joins.
6. Gross revenue uses an observed-or-higher shifted expanding category median reference price;
   discounts are the difference from observed item price and are capped at 50% by construction.
   A category's first observed week has no prior median, so those item rows explicitly fall back to
   their current price and receive zero proxy discount.
7. Returns are a documented deduction proxy: canceled/unavailable 50%, review 1 = 25%, review 2 =
   10%, otherwise 0%. COGS is a disclosed 60% proxy over observed item price. Fulfillment is
   observed item freight. These are not audited company economics.

The final eight observed weeks are holdout. After the disclosed cold-start fallback, reference
prices are shifted. The elasticity coefficient is fit on analysis rows only; later holdout rows
evaluate MAPE only.

The artifact has 95 observed Mondays across a 106-Monday calendar. Before STL, the weekly total is
reindexed to every Monday from 2016-08-29 through 2018-09-03; the 11 dates with no derived Olist
cell are explicitly treated as zero contribution margin. Six deterministic perturbations are
placed only on observed Mondays after 14-calendar-week boundary guards. Neither the zero-fill rows
nor replay perturbations are written into the real-data Parquet, and no manual real-anomaly label is
claimed.

## Reproduce

From the repository root with Python 3.12:

```bash
python3 -m venv .venv
.venv/bin/pip install -r pipelines/olist-margin/requirements.txt
.venv/bin/python pipelines/olist-margin/build.py --download
.venv/bin/python pipelines/olist-margin/build.py --verify-only
```

To use already verified raw bytes without a network call:

```bash
.venv/bin/python pipelines/olist-margin/build.py --input /absolute/path/to/olist-csv-directory
```

Outputs:

- `public/case-studies/margin-control-tower/olist-margin.parquet` (ZSTD, embedded provenance)
- `public/case-studies/margin-control-tower/detection-report.json`
- `public/case-studies/margin-control-tower/elasticity-report.json`
- `public/case-studies/margin-control-tower/methods-evidence.json`

Verified 2026-07-17 on arm64 macOS with Python 3.12 and the exact versions in
`requirements.txt`:

| Output | Bytes | SHA-256 |
| --- | ---: | --- |
| `olist-margin.parquet` | 672,410 | `6921b7ed790367fe9d9ade878a7b97e6d7c2879b9488eef51b326ad9775722fb` |
| `detection-report.json` | 4,571 | `71f9a444f3cc916056142f3ef128174cf7c0f0f8d598eedd9e1a8393e4653580` |
| `elasticity-report.json` | 681 | `8f5cf741575d5fe290ecb7422f304eaf7065f6157b664b4ac36b367dcc4c10d` |
| `methods-evidence.json` | 6,646 | `95afa502019c92c5027fd305089188baec472d01530383d74c689aa7a8ce1d1e` |

An independent second build on the same pinned environment reproduced all four hashes exactly.

The build is deterministic for the pinned inputs and dependency versions. `--verify-only` checks
the browser grain, rate bounds, three accounting identities, exact final eight-week holdout,
complete Monday calendar and zero-filled missing-week contract, versioned report contracts,
labeled-week reconciliation, the 95 MiB browser budget, and exact reconstruction of both reports
from the hash-linked Parquet. It fails closed on any mismatch.

No causal promotion lift, audited COGS, production decision, or manually verified real anomaly is
claimed.

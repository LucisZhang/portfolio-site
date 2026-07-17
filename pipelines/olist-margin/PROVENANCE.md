# Olist margin provenance

## Authority and retrieval

- Canonical dataset: [Brazilian E-Commerce Public Dataset by Olist](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce)
- Public metadata API: <https://www.kaggle.com/api/v1/datasets/view/olistbr/brazilian-ecommerce>
- Retrieved: 2026-07-17
- License: [Creative Commons Attribution-NonCommercial-ShareAlike 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) (`CC BY-NC-SA 4.0`)
- Owner-published scale: 99,441 orders; the six pipeline inputs total 64,735,796 bytes.

## Byte transport and locks

Kaggle is the dataset authority. Its unauthenticated archive endpoint was not usable in this
environment, so the raw tables were transported from the public Git LFS repository
`alphaiterations/multi-agent-chatbot` at immutable commit
`bdcfd77b0e209566bb9e08642951d9022b449b7f`. Each transported byte count matches Kaggle's public
file manifest. `source-lock.json` records every individual file size and SHA-256; the pipeline
refuses to run on any mismatch.

No raw Olist row is tracked. `.cache/raw/` is ignored. Only the derived week × category × mapped
region × dominant payment-channel aggregate and its reports are public.

## Derived outputs

- `public/case-studies/margin-control-tower/olist-margin.parquet`
- `public/case-studies/margin-control-tower/detection-report.json`
- `public/case-studies/margin-control-tower/elasticity-report.json`
- `public/case-studies/margin-control-tower/methods-evidence.json`

The pipeline embeds canonical URL, retrieval date, license, all raw SHA-256 values, mirror commit,
transform version, grain, holdout rule, and proxy boundaries in Parquet metadata. The generated
`methods-evidence.json` records the current Parquet SHA-256 and links the on-page methods text to
those exact bytes.

The discount reference is prior-only after a cold-start exception: item rows in each category's
first observed week have no historical median, so they fall back to current item price and receive
zero proxy discount. The elasticity coefficient is fit on the analysis window; the later
eight-week holdout evaluates MAPE only.

For STL only, 95 observed weekly totals are reindexed to the complete 106-Monday calendar from
2016-08-29 through 2018-09-03. The 11 Mondays with no derived Olist cell are explicitly assigned
zero contribution margin, and deterministic replay labels are placed only on observed Mondays.
Calendar-completion rows and replay perturbations never enter the Parquet artifact.

Verified output identities (2026-07-17):

- `olist-margin.parquet`: 672,410 bytes; SHA-256 `6921b7ed790367fe9d9ade878a7b97e6d7c2879b9488eef51b326ad9775722fb`
- `detection-report.json`: SHA-256 `71f9a444f3cc916056142f3ef128174cf7c0f0f8d598eedd9e1a8393e4653580`
- `elasticity-report.json`: SHA-256 `8f5cf741575d5fe290ecb7422f304eaf7065f6157b664b4ac36b367dcc4c10d`
- `methods-evidence.json`: SHA-256 `95afa502019c92c5027fd305089188baec472d01530383d74c689aa7a8ce1d1e`

A second build on the same pinned environment reproduced all hashes exactly.

Attribution and ShareAlike apply to the derived Olist artifact. The public portfolio is evidence
for non-commercial review; downstream reuse must comply with the upstream license.

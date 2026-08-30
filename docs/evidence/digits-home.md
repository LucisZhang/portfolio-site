# Homepage digits — number → file → path → SHA-256

G2 register for the Round-2 homepage (task 1.2, `/`). Every number rendered
by `src/components/home/*.tsx` is listed here with the file it was read
from, the JSON path (or field) inside that file, and that file's current
SHA-256. Components never carry a literal benchmark number typed directly
into a `.tsx` file — every one traces to one of three sources, all listed
below: the two generated adapters (`src/lib/home-stats.ts` /
`src/lib/home-receipts.ts`) and `src/lib/projects.ts`'s pre-existing,
sitewide-audited project catalog (exhibit 01's flagship summary paragraph,
and exhibits 02/05's metric chips).

Three sources feed numbers onto the page:

- `src/data/generated/home-stats.json` — task 1.1's adapter
  (`scripts/generate-home-data.mjs`), covering the hero tiles, the flagship
  claim chain, the negative-run table, and the stack-depth diagram.
- `src/data/generated/home-receipts.json` — this task's adapter
  (`scripts/generate-home-receipts.mjs`), covering exhibit 06's receipts
  (`<dl>` SHA-256 values, build date, gate status).
- `src/lib/projects.ts` — not a generated adapter; the existing, previously
  audited project catalog every other page on the site already reads
  (`docs/EVIDENCE_INDEX.md`). Task 1.2 reuses two of its fields verbatim
  rather than re-deriving new copy: `summary` (exhibit 01's flagship
  paragraph) and `metrics` (exhibits 02/05's mono chip lines). See the
  per-exhibit sections below for exactly which numbers this brings in and
  where each one traces back to.

Regenerate before re-auditing:

```
npm run generate:home-data      # home-stats.json (task 1.1, owned by that adapter)
node scripts/generate-home-receipts.mjs   # home-receipts.json (this task)
```

## Exhibit 00 — Hero (4 stat tiles)

Every hero tile (`Hero.tsx` → `StatGrid`) reads `home-stats.json`'s
`heroTiles` array verbatim; that array's own provenance (source file +
JSON path) is already registered per-field in the generated file itself and
in `docs/evidence/r2-source-map.md` (task 1.1). Restated here for the G2
homepage checklist:

| Value | Label | Source file | JSON path |
| --- | --- | --- | --- |
| `99.05%` | task success | `public/case-studies/frontier-forge/release.json` | `$.training.headline.task_success` |
| `$35.68` | measured spend | `release.json` + `phase7_1_gpu_ledger.jsonl` + `phase7_2_gpu_ledger.jsonl` | `$.project_spend.total_usd + $[*].usd + $[*].usd` |
| `0` (`@ 3×`) | upstream 5xx @ 3× | `release.json` | `$.phase7_1.gate.sustained_overload_cells[1].gateway_upstream_5xx_rate` (multiplier from the same cell) |
| `10` | failure classes drilled | `public/case-studies/exactly-once-drills/results/manifest.json` | `$.coverage.path_a_failure_classes + $.coverage.path_b_failure_classes` |

No other number appears in the hero: the eyebrow, CTA-style scope note
(`siteIdentity.directionLine`, `src/lib/site-config.ts`), and contact links
carry no digits.

## Exhibit 01 — Flagship claim chain (3 rows)

`FlagshipExhibit.tsx` renders `home-stats.json`'s `flagshipClaims` array.
Each row's `value` / `n` / `ci` / `command` / `sha256` fields are used
as-is; fields equal to the literal string `"MISSING"` are omitted from the
row rather than printed.

| Assert | Value | n | CI | Command | SHA-256 (of `release.json`) |
| --- | --- | --- | --- | --- | --- |
| `99.05% task success` | `99.05%` | `2000` | `[98.60%, 99.45%]` | see generated file | `9e547b3418ce1f633914e8dfe7b818fa6f7e064a891cee8e4c73837e6ce45f4d` |
| `0 upstream 5xx @ 3×` | `0` | `492` | `MISSING` → omitted | see generated file | same |
| `distilled SFT −14.2 pp vs rule SFT` | `−14.2 pp` | `MISSING` → omitted | `MISSING` → omitted | see generated file | same |

Source: `home-stats.json` → `$.flagshipClaims[0..2]`, ultimately derived
from `public/case-studies/frontier-forge/release.json` per task 1.1's own
adapter logic (`scripts/generate-home-data.mjs`). The negative Finding in
this exhibit renders `home-stats.json`'s `negativeRuns[0]` (see the row 04
table below for that same record).

### Exhibit 01 — flagship summary paragraph (`lib/projects.ts`)

`FlagshipExhibit.tsx`'s intro `<p>` renders `homepageProjects[slug=
"frontier-forge"].summary` verbatim (`src/lib/projects.ts`, same file/hash
as exhibit 02/05 below: sha256
`1ebfb7680459d15558a2837c069ae1289a382e219c4a674a0afd676e3cd799d7`). Three
of that paragraph's numbers (`99.05%`, `$35.68`, `14.2 pp`) restate values
already registered above via `home-stats.json`/`flagshipClaims` and
`negativeRuns` — not duplicated here. The remaining five do not appear in
`home-stats.json` and are registered directly against
`public/case-studies/frontier-forge/release.json` (sha256
`9e547b3418ce1f633914e8dfe7b818fa6f7e064a891cee8e4c73837e6ce45f4d`, same
file exhibit 01's claim chain already hashes):

| Value shown | JSON path | Note |
| --- | --- | --- |
| `1,450` | `$.training.ladder[1].label` | Rule-label count embedded in the ladder rung's own label string (`"R1 rule SFT (1,450)"`), not a separate numeric field. |
| `20,000` | `$.training.ladder[2].label` | Same pattern: `"R1b rule SFT (20,000)"`. |
| `66.35%` | `$.training.ladder[1].task_success` | `0.6635` — the pre-scale-up rule-SFT rung the paragraph contrasts against 99.05%. |
| `1→3→1` | `$.phase7_2.gateway_scaling.before.replicas.replicas` (`1`) → `$.phase7_2.gateway_scaling.max_ready_replicas` (`3`) → `$.phase7_2.gateway_scaling.scaled_down.replicas` (`1`) | k3s replica count before/at-peak/after the autoscale event. |
| `5×` | `$.phase7_1.gate.sustained_overload_cells[2].multiplier` | The overload cell where the paragraph says "bare vLLM crashed" — same cell's `bare_vllm_upstream_5xx_rate` is `0.0306` (nonzero), unlike the gateway's `0.0` at every multiplier. |

## Exhibit 02 — Agent systems (3 rows, mono metric chips)

`AgentSystemsExhibit.tsx` reads each row's one-line metric chip from
`src/lib/projects.ts`'s `metrics` field — pre-existing, sitewide-audited
content (unchanged by this task; the same field is also rendered on each
project's own page). File pin: `src/lib/projects.ts` sha256
`1ebfb7680459d15558a2837c069ae1289a382e219c4a674a0afd676e3cd799d7`.

| Project | Metrics text shown | Field | Cross-reference |
| --- | --- | --- | --- |
| Release Guardian | `132 live runs · 8/8 gates · 30/44 strict · citation fidelity 100%` | `projectCatalog[slug="release-guardian"].metrics` | `docs/EVIDENCE_INDEX.md` rows "8/8 aggregate gates passed across 132 funded live graph runs" / "30/44 strict residual" → `public/case-studies/release-guardian/data/evaluation-live.csv` |
| Triage Router | `+0.037 macro-F1 · −$120.58 / 1k calls · drift 2015–2026` | `projectCatalog[slug="triage-router"].metrics` | project page `/ai/triage-router` (task 3.x; not yet rebuilt) |
| Privacy Preflight | `96 worker tests · OCR 19/19 hits · 2 FP · local-only` | `projectCatalog[slug="privacy-preflight-mac"].metrics` | project page `/ai/privacy-preflight-mac` (task 3.x; not yet rebuilt) |

The eyebrow's `13-NODE GRAPH` is a fixed architecture label carried
verbatim from the design authority's spec §4 content script (like every
other exhibit eyebrow); it also matches Release Guardian's own public
description ("13-node LangGraph orchestration", `docs/EVIDENCE_INDEX.md`
/ `src/lib/projects.ts`'s `role` field for that project). The three
micro-instruments (node grid / distribution bars / masked block) are
`aria-hidden` pure-CSS decoration and carry no numeric text of their own.

## Exhibit 03 — Systems stack (5 layers + fault checkerboard)

`StackExhibit.tsx` renders `home-stats.json`'s `stackDepth` array verbatim.

| Layer | Projects | Metric text | JSON path |
| --- | --- | --- | --- |
| Gateway | Frontier Forge | `0 upstream 5xx @ 3× · n=492` | `$.stackDepth[0]` |
| Serving | Frontier Forge | `GPTQ-int4 p95 0.963 s @ 4 QPS` | `$.stackDepth[1]` |
| Stream | Exactly-Once Drills | `10 failure classes drilled` | `$.stackDepth[2]` |
| Storage | Exactly-Once Drills, Crossover Study | `0 snapshot diffs across 5 recovery drills` | `$.stackDepth[3]` |
| Orchestration | Release Guardian | `132 funded live graph runs` | `$.stackDepth[4]` |

The ten-cell exactly-once checkerboard's cell count is **not** a second
literal `10` — `StackExhibit.tsx` parses the leading integer off the
Stream layer's own `metric` string (`lib/home-stats.ts#leadingCount`), so
the cell count always matches whatever `home-stats.json` currently says.

## Exhibit 04 — Negative results (5 rows)

`NegativeRunsExhibit.tsx` renders `home-stats.json`'s `negativeRuns` array
verbatim (`n` omitted where `"MISSING"`).

| Conclusion | n | Receipt href | Underlying file |
| --- | --- | --- | --- |
| `Distilled SFT −14.2 pp vs rule SFT` | `MISSING` → omitted | `/artifact?src=%2Fcase-studies%2Ffrontier-forge%2Frelease.json&from=%2F` | `/case-studies/frontier-forge/release.json` |
| `GRPO +0.25 pp in both completed seeds; both CIs contain zero` | `2 × 2000; aborted seed n=0` | `/artifact?src=%2Fcase-studies%2Ffrontier-forge%2Frelease.json&from=%2F` | `/case-studies/frontier-forge/release.json` |
| `30 of 44 strict all-trials residuals` | `44` | `/artifact?src=%2Fcase-studies%2Frelease-guardian%2Fdata%2Fevaluation-live.csv&from=%2F` | `/case-studies/release-guardian/data/evaluation-live.csv` |
| `Amazon arm: null` | `228153` | `/artifact?src=%2Fcase-studies%2Fcrossover-study%2Fexhibits.json&from=%2F` | `/case-studies/crossover-study/exhibits.json` |
| `One-pass structured output: 0% task success` | `48` | `/artifact?src=%2Fcase-studies%2Ffrontier-forge%2Frelease.json&from=%2F` | `/case-studies/frontier-forge/release.json` |

Receipt hrefs route through the `/artifact` contextual viewer
(`src/lib/artifacts.ts#artifactViewerHref`, `from=/` back-link to the
homepage) rather than linking the raw project file directly — the same
convention `ProjectLinks`/`ArtifactLink` use elsewhere
(`scripts/check-links.mjs`'s "raw artifact" rule). The wrapped `src` param
still carries the exact underlying file path shown in the right-hand
column, so nothing about provenance changes.

Source: `home-stats.json` → `$.negativeRuns[0..4]`; each record's own
derivation from `release.json` / `evaluation-live.csv` / `exhibits.json` is
registered in task 1.1's report and `docs/evidence/r2-source-map.md`.

## Exhibit 05 — Secondary + archive shelf (5 rows)

`ShelfExhibit.tsx` renders each project's `metrics` field from
`src/lib/projects.ts` (same file/hash as exhibit 02 above), right-aligned,
archive rows muted.

| Tier | Project | Metrics text shown |
| --- | --- | --- |
| secondary | RAG Quality Lab | `4/12 questions regressed · 11,309 docs · 130 enterprise questions` |
| secondary | Crossover Study | `43.9M reviews ingested · 15.5M five-core interactions · crossover: not found` |
| secondary | Ask Portfolio | *(empty — `metrics: {en:"",zh:""}` in the source catalog)* |
| archive | Margin Control Tower | `15,809 Olist aggregate rows · 99,441 source orders · 10 fail-closed contract checks` |
| archive | Credit Policy Desk | `120,000 scored loans · 24,000 later backtest rows · capacity-gated policy audit` |

## Exhibit 06 — Receipts (`<dl>`)

`ReceiptsExhibit.tsx` renders `src/data/generated/home-receipts.json`
(`scripts/generate-home-receipts.mjs`, this task) verbatim.

| Field | Value (at last generation) | Source file hashed |
| --- | --- | --- |
| `release.json` | `sha256:9e547b3418ce1f633914e8dfe7b818fa6f7e064a891cee8e4c73837e6ce45f4d` | `public/case-studies/frontier-forge/release.json` |
| EOD manifest | `sha256:7867fb1ec1f91787ada2bb9141426b29273324f8d84b3eac6968572085120d32` | `public/case-studies/exactly-once-drills/results/manifest.json` |
| Privacy manifest | `sha256:cfa56cd3ba453227863bb997c937bfcb41cd6e01e339cf806ac00689eac3aebe` | `public/case-studies/privacy-preflight/manifest.json` |
| Build date | generated at `scripts/generate-home-receipts.mjs` run time (`new Date().toISOString().slice(0,10)`) | n/a (timestamp, not file-derived) |
| Gate status | verbatim last line of `node scripts/verify-r2-sources.mjs` output, captured at generation time | `scripts/verify-r2-sources.mjs` against `docs/evidence/r2-source-map.md` |

The gate-status line is deliberately a live re-run, not a cached result —
regenerating `home-receipts.json` reflects whatever `verify-r2-sources.mjs`
reports at that moment (including a failing/partial state, if the source
map and the generated files it checks are out of sync at generation time).

## Not registered here (by design)

- Rail/exhibit eyebrows, CTA text, and other UI-fabric strings (e.g.
  `13-NODE GRAPH`, `QWEN3.5-4B / RTX 4090 / $35.68 MEASURED / SHA-256
  GATED`) are literal content from the design authority's spec §4 table,
  not adapter output — the numbers embedded in them are architecture/model
  labels, not measured claims, and are not independently re-derived here.
- `?hero=a|b|c` hero title candidates carry no digits.

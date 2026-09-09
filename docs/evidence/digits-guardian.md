# Release Guardian digits — number → file → jsonPath/column → SHA-256

G2 register for the Round-2 Release Guardian "approval dossier" page (task
L1, `/ai/release-guardian`). Every number rendered by
`src/components/guardian/GuardianPage.tsx` traces to one of the two files
below, via the derivations in `src/components/guardian/guardianData.ts`
(exhibit 01/02) or `src/components/guardian/guardianEval.server.ts`
(exhibit 04) — none of them are typed literally into a `.tsx` file as a
result.

| File | Bytes | SHA-256 | Registered in |
| --- | ---: | --- | --- |
| `public/case-studies/release-guardian/recorded-stub-runs.json` | 5,762 | `e435951a17bd6017207cd739bce512c625a39dd0cdee7e55fea0a60efe392a69` | `docs/evidence/r2-source-map.md` ("Release Guardian recorded stub replay") |
| `public/case-studies/release-guardian/data/evaluation-live.csv` | — | `29eca7eddbc8885c0eb96705af46883c5986f61dda46f6a34c261e86aa49a892` | `docs/evidence/r2-source-map.md` ("Homepage Release Guardian live input") |
| `public/case-studies/release-guardian/data/evaluation-stub.csv` | — | `a312feb6599f7e63732ad36387c3bb390bc73f18a67695e9437182dcd01b1bfe` | `docs/evidence/r2-source-map.md` (new row added this task, "Task L1 Release Guardian stub evaluation ledger") |
| `public/case-studies/release-guardian/manifest.json` | — | `f37967289db4816cfd5f23bdad7ca281b979f52420c4bf65b34b0383a6796eb8` | `docs/release-guardian-claims.md` §1 (pre-existing) |
| `public/case-studies/release-guardian/data/findings.csv` | 14 lines (13 records + header) | `8f479171837a543ff8e8439ac983d37fc4b3bb1ccb3792486e037a828d7f9b95` | `docs/release-guardian-claims.md` §1 (pre-existing); linked, not re-rendered, from exhibit 05 |
| `public/case-studies/release-guardian/architecture.mmd` | — | `ca53cb3aab82d1d02ad14a11f6e394a710be81a0ff3f5c48feefac093d70ddba` | `docs/release-guardian-claims.md` §1 (pre-existing); linked, not re-rendered, from exhibit 05 |

All are re-verified on every `npm run verify:r2-sources` run (the two CSVs
and the JSON trace; `manifest.json`/`findings.csv`/`architecture.mmd`'s
hashes are quoted verbatim in exhibit 05's `<dl>` from the pre-existing,
already-approved `docs/release-guardian-claims.md` §1 table — they are not
independently re-registered rows since their content is linked, not
parsed into a number).

## Exhibit 01 — the dossier (memo + filing stub + gate)

`recorded-stub-runs.json` is the REAL output of `release_guardian`'s own
`exhibits/export_recorded_runs.py`, run with `RG_LLM_MODE=stub
RG_RERANK_MODE=lexical` (see the reproduction command registered in
`r2-source-map.md`) — 13 recorded nodes for scenario `scn-020`, a
`schema_migration` dropping `payments.legacy_processor_ref`. Two of the
13 nodes' `io.out` fields are truncated by the export script itself at 240
bytes (ending in a literal `…`); `guardianData.ts`'s header comment
documents which three (`n03`, `n04`, `n06`) this page reads from, and why
it regex-extracts only the fields that finish before the cutoff rather
than `JSON.parse()`-ing them.

| Rendered value | Source | Path/derivation |
| --- | --- | --- |
| `scn-020` (run of record) | `recorded-stub-runs.json` | `$.scenario_id` |
| `schema_migration` (instrument class) | fixed UI label (the recorded change's own classification, `n02.io.out`'s leading token) | `$.nodes[id="n02"].io.out` |
| `BLOCK-RECOMMENDED` (recorded verdict) | `recorded-stub-runs.json` | `$.total.verdict` |
| 7-line compressed trace (`t+0 ms … t+353 ms`, `N01 … N12–N13`) | `recorded-stub-runs.json` | `guardianData.ts`'s `traceLines`: each line's `tStartMs` is the first node id in that group's own `$.nodes[id=…].tStartMs`; group boundaries (`[n01]`, `[n02,n03]`, `[n04..n07]`, `[n08]`, gate `n09`, `$.gate.branches.approve`, `$.gate.branches.block`) are this fixed run's own graph shape, not re-typed numbers |
| `13` recorded nodes · `365` ms · `12,234` tokens | `recorded-stub-runs.json` | `$.nodes.length`, `$.total.ms`, `$.total.tokens` |
| `REF SCN-020 / N08` | `recorded-stub-runs.json` | `$.scenario_id`, `$.nodes[id="n08"].id` |
| `SUBJECT Drop payments legacy processor reference` | `recorded-stub-runs.json` | `$.nodes[id="n01"].io.out` |
| `VALIDATED t+131 ms` | `recorded-stub-runs.json` | `$.nodes[id="n08"].tEndMs` |
| `Instrument` clause (`ALTER TABLE payments DROP COLUMN legacy_processor_ref;`) | `recorded-stub-runs.json` | `$.nodes[id="n01"].io.in` |
| `Risk assessment`: `Critical`, score `75` of 100 | `recorded-stub-runs.json` | `JSON.parse($.nodes[id="n08"].io.out).risk.{band,score}` (n08's output is complete, valid JSON — no truncation) |
| Risk factors small print (`base change type +25 (rule)`, `drop_column detected for payments.legacy_processor_ref +35`) | `recorded-stub-runs.json` (truncated field, regex-parsed) | `$.nodes[id="n03"].io.out` — `guardianData.ts`'s `factorPattern` regex; factor 1's `name`/`source` are complete before the 240-byte cutoff, factor 2's `name` is not (the regex's optional group correctly fails to match past the cutoff rather than fabricating a value) |
| `Blast radius`: `4` consumers, `payments-service GET /v1/payments/{payment_id}` | `recorded-stub-runs.json` | `JSON.parse($.nodes[id="n08"].io.out).affectedCount`; consumer name from `$.nodes[id="n04"].io.out`'s first (complete) array element |
| `verified 0.90 · ev-0ffe1680fc7f`, `verified 0.95 · corroborated by tools N04, N05, N07` | `recorded-stub-runs.json` (truncated field, regex-parsed) | `$.nodes[id="n04"].io.out` — first/second `"confidence"` matches and the first `"provenance"` entry; `n05`/`n07` share the identical evidence prefix (same tool call pattern), cited as corroborating ids per the design-authority mock, not independently re-parsed |
| `Rollout terms`: `5` stages, abort condition, first action, idempotency key | `recorded-stub-runs.json` | `JSON.parse($.nodes[id="n08"].io.out).rolloutStages`; `$.nodes[id="n06"].io.out`'s `abort_condition` and `actions[0].{description,idempotency_key}` (all complete before the 240-byte cutoff) |
| Disposition timestamps/dispositions (`t+142 ms → t+207 ms`, `published`; `t+353 ms → t+365 ms`, `rejected`) | `recorded-stub-runs.json` | `$.gate.branches.approve[0].tStartMs` / `approve[-1].{tEndMs,io.out}`; `$.gate.branches.block[0].tStartMs` / `block[-1].{tEndMs,io.out}` |
| Branch-trace reveal (each node's id/label/timing/io on APPROVE or BLOCK) | `recorded-stub-runs.json` | `$.gate.branches.approve[]` / `$.gate.branches.block[]`, rendered verbatim |

## Exhibit 02 — full 13-node recorded trace table

`$.nodes[0..12]` rendered verbatim (id, type, label, `tStartMs`/`tEndMs`,
status) as a server-rendered `<table>`-equivalent — the same 13 nodes
exhibit 01's filing stub compresses into 7 lines, shown here uncompressed.
The exhibit's own eyebrow (`N NODES · RECORDED / DETERMINISTIC STUB`) reads
`{allNodes.length}` (`guardianData.ts`'s `$.nodes.length`), not a re-typed
`13` — fix round 1 (review finding, Important) caught this literal and
`tests/e2e/guardian-r2.spec.ts` now asserts the eyebrow text equals
`${allNodes.length} NODES`, so a change to the recorded fixture's node
count would fail the test rather than silently drift from the copy.

## Exhibit 03 — approval gate / audit chain narrative

Two sentences quoted from `project.architecture` (`src/lib/projects.ts`,
pre-existing fact-checked content, unmodified by this task): the
`Approval` step's detail ("Pause and wait for a human decision before
publish.") and the `Audit` step's detail ("Publish through the approved
branch and record the decision."). No new numbers are introduced on this
exhibit.

## Exhibit 04 — recorded outcomes / eval disclosure

`src/app/ai/release-guardian/page.tsx` (a Server Component) reads both
CSVs with Node's `fs` via `guardianEval.server.ts`'s minimal RFC4180
parser and passes the 8+8 parsed rows down as props — this is the one
exhibit whose numbers come from CSV, not the JSON trace, because CSV is
not a `resolveJsonModule` bundler import the way `recorded-stub-runs.json`
is.

| Rendered value | Source | Column |
| --- | --- | --- |
| Headline `does not erase N strict failures` / `但 N 项严格残差依旧摆在那里` | `evaluation-live.csv` (row 0) | `strict_flagged_scenarios` — fix round 1 (review finding, Important) caught this headline hardcoding `30` a paragraph above where `liveFirst.strictFlaggedScenarios` (the same `30`) is already bound and used; both locales now interpolate `{liveFirst.strictFlaggedScenarios}` instead |
| `132` graph runs, `44` scenarios | `evaluation-live.csv` (row 0; identical across all 8 rows) | `graph_runs`, `strict_total_scenarios` |
| Per-metric LIVE value/threshold/pass, all 8 rows | `evaluation-live.csv` | `metric`, `value`, `threshold`, `direction`, `aggregate_gate_pass` |
| Per-metric STUB value, all 8 rows | `evaluation-stub.csv` | `value` (same 8 `metric` rows, same row order) |
| `30` of `44` strict-flagged (live) | `evaluation-live.csv` (row 0) | `strict_flagged_scenarios` / `strict_total_scenarios` |
| `15` of `44` strict-flagged (stub) | `evaluation-stub.csv` (row 0) | `strict_flagged_scenarios` / `strict_total_scenarios` |
| `llm_mode: stub` disclosure | fixed UI label, the real env var from the registered reproduction command (`RG_LLM_MODE=stub`, `r2-source-map.md`) | not a data-file field — a literal, accurate label for how the stub ledger was produced |

This task deliberately drops the old page's `$8.1214` / `~35.08 s` funded-
run totals: they traced to `docs/release-guardian-claims.md` §2 (a private
`cost_report.json`/eval-report derivation, not a file with a registered,
re-verifiable SHA-256 in `r2-source-map.md`), and are not part of this
task's required later-exhibit content list (44 scenarios · 132 runs ·
`llm_mode: stub`). Dropping them narrows exhibit 04 to numbers this page
can re-verify on every `npm run verify:r2-sources` run.

## Exhibit 05 — install + SOURCE/RECEIPTS

- `docker compose -f docker-compose.full.yml up` — copied verbatim from
  `$SOURCE_ROOT/release_guardian/README.md`'s "One-command full
  stack" section (real, current as of that repo's 2026-08-22 README).
- `claude mcp add --transport http release-guardian
  https://mcp.xiangguozhang.com/mcp` — copied verbatim from
  `docs/superpowers/specs/2026-08-22-r2-attachments/research-2-agent-ops.md`
  §6 / `2026-08-22-site-revamp-r2-design.md` §6.2's install-region spec.
  Rendered with `data-pending="true"` / "PACKAGING IN PROGRESS" labeling
  (this codebase's existing `ProjectLink.pending` convention, spec §10's
  binding rule) because `https://mcp.xiangguozhang.com/mcp` is not yet
  deployed — the command is real, but this page never fabricates a
  connection echo for it.
- `manifest.json` / `recorded-stub-runs.json` SHA-256 receipts and the
  reproduction command — see the file table above.

## Report layer (Architecture / Results & negatives / Limitations)

Renders `project.architecture` / `project.fieldNotes` / `project.boundaries`
from `src/lib/projects.ts` verbatim (pre-existing, fact-checked content,
unmodified by this task) — the same fields `TriagePage.tsx`/`ForgePage.tsx`
render for their own report layers.

## Concerns (honest disclosure boundary)

1. **Two truncated-field regexes (`n03`, `n04`, `n06`) extract only what
   the export itself left intact.** The 240-byte cutoff is a real property
   of `export_recorded_runs.py`'s output, not something this page's code
   introduces — `guardianData.ts`'s module comment documents the exact
   byte length and which five nodes (`n03`–`n07`) share it, and every
   regex is written to fail closed (return `undefined`, never a
   half-parsed fabricated string) past the cutoff point.
2. **The $8.1214/~35.08s funded-run totals from the pre-rebuild page are
   dropped, not carried forward.** See the exhibit 04 section above for
   why — narrower scope, but every remaining number now has a registered,
   re-verifiable SHA-256 source.
3. **`findings.csv`'s 13 sanitized findings are linked, not re-rendered.**
   The pre-rebuild page hand-copied 6 of the 13 findings into a literal
   JSX array (`releaseFindings`); this rebuild instead links the real file
   through the existing `/artifact` viewer (already covered by
   `tests/e2e/quality.spec.ts`'s "artifact viewer renders and operates
   every supported project file type" test, which asserts all 13 records
   render there), avoiding both the duplication and the risk of the
   inline copy drifting from the source file.

## Fix round 1 (review finding, Important)

Two hardcoded numeric literals slipped past this file's own "zero
hardcoded numbers" claim at first landing:

1. Exhibit 02's eyebrow typed `13 NODES` literally instead of
   `{allNodes.length}`. Fixed to read from `guardianData.ts`'s
   `allNodes.length` (already exported, already used elsewhere on the
   page) — see the exhibit 02 section above.
2. Exhibit 04's headline typed `does not erase 30 strict failures` /
   `但 30 项严格残差依旧摆在那里` literally, one paragraph above where
   `liveFirst.strictFlaggedScenarios` (the same value, `30`) is already
   bound and rendered. Fixed to interpolate `{liveFirst
   .strictFlaggedScenarios}` in both locales — see the exhibit 04 table
   above.

`tests/e2e/guardian-r2.spec.ts`'s "exhibit 02 eyebrow and exhibit 04
headline bind their counts to the JSON/CSV, not a literal" test locks both:
it asserts exhibit 02's eyebrow text equals `` `${allNodes.length} NODES` ``
and exhibit 04's headline contains `` `${liveFirst.strictFlaggedScenarios}`
`` — either assertion would fail if the count were ever re-hardcoded or the
underlying fixture's node/scenario count changed without the copy
following it.

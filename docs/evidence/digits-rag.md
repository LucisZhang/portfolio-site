# RAG Quality Lab digits — number → file → jsonPath → SHA-256

G2 register for the Round-2 RAG Quality Lab diff/对照 page (task L3
[CLAUDE], `/ai/rag-quality-lab`, spec §6.7's 3-exhibit light prescription
mapped onto output/design-genres/genre-rag-diff.html). Every VERIFIED
number rendered by `src/components/ragdiff/*.tsx` traces to
`public/case-studies/rag-quality-lab/claim-registry.json` or
`public/case-studies/rag-quality-lab/c3-timebox/dependency-preflight.json`,
statically imported and assertion-validated by `src/components/ragdiff/
ragData.ts` — an invalid or missing-field registry fails the build, not a
client render. None of these two files is typed literally as a number in a
`.tsx` file.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `public/case-studies/rag-quality-lab/claim-registry.json` | 2,603 | `95b3380728df1c2de4df7bb69a1c525c10f0e8818f79577ab336c1c5ebc544ba` |
| `public/case-studies/rag-quality-lab/c3-timebox/dependency-preflight.json` | 1,584 | `78ab99f3c9d40c1e96f272dad9992acda2035e5af7750c401e46dd70f563418e` |
| `public/case-studies/rag-quality-lab/c3-timebox/README.md` | 2,453 | `beecb175221d299f3a5513a880244b74d37017a9d7a34d37014c87b2212c9047` |

The second row's bytes/SHA-256 exactly match `claim-registry.json`'s own
`c3.results` claim (`source_sha256`) — this file re-registers the same
value for the site's G2 convention rather than re-deriving it. All three
hashes were computed via `shasum -a 256 <file>` / `wc -c < <file>` on
2026-08-30 and are re-verifiable at any time by re-running those two
commands against the committed files.

## 01 — The drift lab (`RagDiffLab.tsx`)

| Rendered value | Source | jsonPath |
| --- | --- | --- |
| Verified stat line (11,309 / 130 / 68) | `claim-registry.json` | `.baseline_manifest.documents`, `.questions`, `.tests_passed` |
| Eyebrow checkpoint + verification date | `claim-registry.json` | `.evidence_checkpoint.commit`, `.verification_date` |

Everything else in this exhibit — the two-pane document diff, the 12
deterministic checks, and the four-word verdict — is **not** a claim
number: it is the runtime-deterministic output of comparing whatever text
sits in the "working copy" textarea (seeded from `ragDiffFixture.ts`'s
`RAG_DIFF_DEFAULT_WORKING_TEXT`, the mock's own illustrative "24 hours" →
"30 days" edit) against the fixed baseline (`RAG_DIFF_BASELINE_TEXT`),
computed live by `ragDiffEngine.ts`'s `computeLineDiff` / `computeChecks` /
`summarizeVerdict`. It is labeled `demo · deterministic` throughout and is
never presented as, or read from, a claim-registry value. Re-running the
same edit always reproduces the same diff and the same 12 check results —
that determinism is unit-verifiable directly against `ragDiffEngine.ts`
(pure functions, no I/O) and is exercised end-to-end in
`tests/e2e/rag-r2.spec.ts`.

## 02 — Evidence claims (`RagEvidenceClaims.tsx`)

| Rendered value | Source | jsonPath |
| --- | --- | --- |
| Verified claims table (documents/questions/tests rows) | `claim-registry.json` | `.claims[].id/.display/.source/.source_sha256/.boundary` filtered to `status === "verified"` |
| Blocked claim row (C3) | `claim-registry.json` | `.claims[]` filtered to `status === "blocked_no_results"` (the single `c3.results` entry) |
| Public-repository baseline commit + GitHub link | `claim-registry.json` | `.public_repository.baseline_commit`, `.url` |
| Missing/available Python packages | `dependency-preflight.json` | `.python_modules.missing[]`, `Object.keys(.python_modules.available)` |
| Preflight scope + status | `dependency-preflight.json` | `.scope`, `.status` |

The registry's own `forbidden_current_claims` array is **never** rendered
verbatim anywhere on this page — see "Forbidden-claims audit" in
`task-L3-report.md` for why (repeating the exact retired figures to
disavow them would itself put them on the page). The closing note in this
exhibit describes the discipline without quoting those numbers.

## 03 — Source & receipts (`RagSourceReceipts.tsx`)

The three-row table at the top of this file is `RAG_RECEIPTS`
(`src/components/ragdiff/ragData.ts`), rendered directly by
`RagSourceReceipts.tsx` — the same "receipts exhibit is a plain static
import" convention as `MARGIN_RECEIPTS` / `TRIAGE_RECEIPTS`. The
`dependency-preflight.json` row's path and SHA-256 are read straight off
the registry's own `c3.results` claim (`ragData.ts` throws at import time
if that claim or its `source_sha256` is ever missing) rather than being a
second, independently-typed copy of the same hash.

## Report layer (Architecture / Results & negatives / Limitations)

Reads `project.role`, `.architecture`, `.outcome`, `.fieldNotes`, and
`.boundaries` straight from `src/lib/projects.ts`'s existing
`rag-quality-lab` entry (unmodified by this task) — the same
already-fact-checked bilingual content the pre-rebuild page rendered via
`RagProof.tsx`/`ProjectPageView`, now rendered directly by `RagPage.tsx`
per the Triage Router / Margin / Guardian report-layer precedent. Note
that this content's own historical figures (e.g. the controlled
12-question run's 0.988 → 0.867 faithfulness, distinct from and not to be
confused with the forbidden 0.809–0.944 range) are pre-existing,
unmodified `projects.ts` content, not introduced by this task.

## Forbidden-claims audit

None of `498,725`, `0.809`, `0.944`, a completed C3 retrieval/answer-
quality/fallback metric, or "C2 code already synced to the public
repository" appears anywhere in `src/components/ragdiff/*.tsx`, `RagPage`,
or its rendered output — asserted directly in
`tests/e2e/rag-r2.spec.ts`'s "forbidden claim strings never render" test,
which loads the live page and asserts each forbidden string's absence
rather than trusting a source-code grep alone.

## Superseded: the pre-rebuild interactive workbench

`src/components/rag/RagManifestDriftLab.tsx` (JSON-manifest-drift
scenario buttons, a separate synthetic-document normalization lab) and
`src/components/RagProof.tsx` are **not deleted** by this task, but are no
longer routed — `/ai/rag-quality-lab` now resolves to
`src/app/ai/rag-quality-lab/page.tsx` (`RagPage.tsx`), added to the
`[track]/[project]/page.tsx` catch-all's `STANDALONE_ROUTE_SLUGS` set. See
`task-L3-report.md` for the full old-assertion → new-assertion replacement
inventory required by the task brief ("replace old RAG assertions
equivalent-or-stronger").

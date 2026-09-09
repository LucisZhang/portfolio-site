# Layered project receipts

The homepage and all ten current project pages present a short verification summary,
evidence class and material boundary before a native `details` disclosure. File paths,
hashes, commands, timestamps, provenance and existing project-specific methods remain
inside that disclosure. Crossover retains its six individual run disclosures. All receipt
content remains in the initial HTML; the two analytics methods reports now also render
from their committed JSON, including dataset licenses, without hydration.

## Exact file identities

`receipt-link-sources.json` records reviewed public repository metadata, full revisions,
remote paths and SHA-256 identities, or an explicit `local` status for unpublished files.
`scripts/generate-evidence-links.mjs` produces the route-scoped file map. It requires
anonymous HTTP 200 and a byte-for-byte SHA-256 match before writing a public link.
The committed projection retains each file's SHA-256, so updating a declared local hash
while retaining an old public URL fails the offline projection check. Offline checks bind
site copies to those same identities and bind
Crossover configs to each historical run's own revision and config hash. Runtime rendering
uses this allowlist only; it never constructs a URL from an arbitrary displayed path.
The server supplies only the current route's summary and file metadata through a small
evidence context, so the whole registry and every project's copy stay out of the shared
client JavaScript.

Validated on 2026-09-05 after the F-04 correction: **39 exact public files**, **three
commit-local unpublished files**, plus one explicit unavailable Git file.
This is a verification of frozen files, not a new experiment or a publication approval.

| Surface | Public file coverage | Boundary retained |
| --- | --- | --- |
| Home | Forge release, EOD manifest, Privacy manifest | Captured checks and project-specific evidence classes |
| Frontier Forge | Release registry and A10 overload receipt in the Forge repository | Recorded training/serving workloads, GRPO negative result, hardware separation |
| Release Guardian | Stub replay and publication manifest in the public portfolio repository | Funded-live aggregate gates with 30/44 strict residual; separate 15/44 stub residual; exact-hash publication gate |
| Triage Router | Six compact site exports and the upstream Python parity fixture | Pending B1 drift, curated parity, separately served model |
| Exactly-Once Drills | Site summary/manifest and upstream broker SLO record | Recorded faults/environments, historical May and July U6 separation |
| Crossover Study | Six configs at their individual run revisions, plus the site exhibit projection | Amazon null, ML-32M recall failure, non-causal batch-only result |
| RAG Quality Lab | Site claim registry and upstream C3 preflight/README | C2 foundation only, no C3 metric or fallback comparison, earlier public baseline |
| Privacy Preflight | OCR fixture, worker-test, browser-test and manifest files in the public portfolio repository | Fictional fixtures, distinct browser/worker/packaging evidence, restricted Mac compatibility |
| Margin Control Tower | Detection, elasticity, Parquet and methods upstream; governance registry in the portfolio repository | Real aggregates vs synthetic fixtures/perturbation labels, proxies, non-causal economics, CC BY-NC-SA 4.0 |
| Credit Policy Desk | Backtest, methods and Parquet under the upstream historical `credit-policy-lab` directory; site compact/frontier projections | Granted-only sample, assumed LGD, non-causal/non-production/no fairness claims, CC BY 4.0 |
| Ask Portfolio | Recorded-example generator at its public revision; retrieval code, knowledge snapshot and question-bank generator as commit-local SHA-256 receipts | Authored/recorded/live distinction, keyword retrieval, private-profile boundary and unpublished file status |

A site derivative links to the **public portfolio repository's exact copy** when the
project repository does not contain identical bytes. A public file link does not imply
that the upstream implementation contains the current site UI or that the historical
evidence checkpoint has changed. The note beside each link identifies the hosting
repository and pinned revision. Crossover's config links are pinned to the recorded run,
not to today's repository head.

Unpublished files carry their safe repository-relative local path and exact SHA-256,
with a bilingual commit-local status and no public repository, revision or clickable
link. The knowledge snapshot is built from pinned public sources; that provenance does
not make the current generated file public. Promoting a local receipt to a public link
requires the same anonymous exact-byte verification as every other public receipt.

The Triage ONNX file is served separately and is not committed to Git; its existing
SHA-256 remains visible with an explicit unavailable GitHub-file state. No link is
invented. The Triage export command uses relative sibling checkouts in place of the
owner's home-directory paths; the interpreter, export script and output location retain
the source map's meaning.

## Verification

```sh
node scripts/generate-evidence-links.mjs --check
node scripts/generate-evidence-links.mjs --verify-remote
node scripts/generate-evidence-links.mjs --verify-remote --write
npm run verify:evidence
npm run verify:r2-sources
npm run check:links -- --url http://127.0.0.1:4186
```

The receipt tests check file identity, renamed paths, historical pins, rejected unsafe
paths and explicit local/unavailable evidence. A regression changes local bytes and the
declared hash while retaining a public URL: offline checking rejects the stale projection,
remote regeneration rejects the mismatched public bytes and preserves the last verified
projection, and only an explicit local receipt can be generated without a public link.
Browser tests cover all eleven surfaces in both
languages, collapsed-first presentation, Enter/Space operation, no-JS discoverability,
license visibility, mobile wrapping and exact rendered URLs. Existing SQL and no-JS route
tests open the new outer disclosure before their original assertions.

No existing source artifact, receipt hash, metric or publication state is regenerated by
this interface change. Release and deployment remain outside this task.

## G-04 local validation

The production build and the 12 focused desktop receipt tests passed after the server
split, including the complete no-JS route pass. Typecheck, lint (three pre-existing
warnings), evidence verification (16 tests plus artifact checks), source-map verification
(43 verified / 16 existing TBD rows), the 116 assistant tests, localization, glyph
coverage, heavy-asset checks and the production dependency audit all passed. The full
browser matrix is assigned to the integration task by the owner's final instruction;
the duplicate local matrix was stopped rather than claimed complete.

Lighthouse 13.4.1 mobile: Performance **93**, Accessibility **100**, Best Practices
**100**, SEO **100**. Desktop Forge and mobile Guardian, Margin and Crossover evidence
panels were visually inspected; their document widths matched the viewport widths.

Link traversal checked 13 routes, 103 internal targets and 56 external targets with no
errors. Ten GitHub HTML targets returned HTTP 429 and LinkedIn returned HTTP 999; all
42 pinned file contents at the G-04 checkpoint separately returned anonymous HTTP 200
with matching SHA-256. The subsequent integration changed three Ask files; the F-04
correction below supersedes that count for the current checkout.
These automated HTML access limits remain recorded, rather than treated as missing files.

The byte-budget script still reports two provisional initial-JavaScript overages. A clean
build of the unchanged integration base `beb57ee9f77f9e4ed1e3a06b35e32202df831b58`
reproduced both existing overages. No budget was loosened:

| Route | Existing ceiling, gzip bytes | Unchanged base | G-04 | Difference |
| --- | ---: | ---: | ---: | ---: |
| `/` | 183,605 | 185,311 | 186,039 | +728 |
| `/artifact` | 230,358 | 230,999 | 230,831 | -168 |

All route-owned ceilings pass. The homepage Lighthouse requirement passes; the two
provisional initial-byte budget failures remain an integration follow-up.

## F-04 Ask receipt integrity correction

The integration base `22d36ca2003a649f6e416ed0c14705ab57a55f50` declared current local
hashes for three Ask files while linking to older bytes at public revision
`acf05ae78859d95be2a3f68920f0bc08ea31f5d8`. On 2026-09-05 the 22 live public branch
refs matched the recorded refs; none of the reachable file revisions matched the current
retrieval code, knowledge snapshot or question-bank generator. A check of all reachable
Git objects also found none of those three current file blobs. They now have explicit
local receipts. The recorded-example generator still matches its public copy and retains
that link.

All 39 retained public files passed anonymous HTTP 200 and exact SHA-256 verification
during regeneration. All original local source hashes are preserved. This correction
changes receipt status, projection validation and presentation; publication is a separate gate.
Ask receipt descriptions inherit the panel foreground to keep their contrast readable
alongside the new file status and hash.

F-04 validation on 2026-09-05:

- Eight focused receipt tests passed, including stale projection, public-byte mismatch,
  local-byte drift, unsafe paths and ambiguous status rejection.
- Typecheck, lint (three existing warnings), `verify:evidence`, and `verify:r2-sources`
  passed. The source map has 43 verified rows and 16 existing TBD rows. The production
  dependency audit reported zero vulnerabilities.
- `npm run test:e2e -- tests/e2e/evidence-receipts.spec.ts tests/e2e/ask-r2.spec.ts tests/e2e/home-performance.spec.ts`
  passed after the final style change: 67 browser tests passed, eight intentional
  device-specific skips. Its prerequisites passed all 232 assistant tests and six
  artifact tests; the production build keeps Ask Portfolio statically generated.
- Localization and glyph checks passed (zero localization errors; 53 heuristic warnings
  for existing control/technical labels). All 1,391 required glyphs remain available.
- The expanded Ask receipt section passed axe-core with zero violations in English and
  Chinese at desktop and mobile widths. Visual inspection confirmed readable descriptions
  and wrapping; document widths matched the 1,440 px and 390 px viewports.
- Lighthouse 13.4.1 mobile, final local production build: Performance **97**,
  Accessibility **100**, Best Practices **100**, SEO **100**.

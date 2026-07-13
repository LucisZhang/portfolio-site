# STATE - pipeline progress

Last updated: 2026-07-13
Portfolio phase: OPERABLE PORTFOLIO UPGRADE COMPLETE ON PUBLIC REVIEW PREVIEW; published v1 remains live and unchanged
Coordination model: PARALLEL / ISOLATED. This file is the global dashboard and integration
ledger, not a single project queue. A pause, blocker, gate, or session limit in one lane does
not change another lane's status or next action.
Execution owner: Codex (GPT-5.6 Sol). The one newly authorized Analytics-only Fable call completed
on 2026-07-13 with no retry; its output and the locked North Stars are in
`docs/fable5-analytics-direction.md`. Fable must not be called again.

## Active upgrade checkpoint

- Branch/worktree: `codex/operable-portfolio` in an isolated local clone; published `main` is unchanged.
- Fable: complete once. Locked directions are Margin Control Tower and Credit Policy Lab, subject
  to Codex license/data/evidence feasibility gates.
- Privacy Web: the scoped vertical slice is complete. Text review, edits, mask/replace/remove,
  undo/reset, copy/download, and deterministic verification run in-browser. Image and PDF lanes use
  same-origin local OCR, reviewable/manual draggable regions, destructive burn-in, fresh export,
  and fail-closed post-export verification. No selected content is uploaded or persisted.
- Verification at this checkpoint: typecheck PASS; ESLint PASS; evidence verifier PASS; production
  build PASS; Playwright 67 PASS / 2 intentional heavy-OCR duplicate skips across desktop/tablet/mobile.
  The PDF destructive path passes all seven output checks in every viewport project.
- p1 Failure Replay: complete on the upgrade branch. The Captured Run console loads the public U6
  JSON, separates five failure scenarios, and provides play/pause/step/reset/range controls across
  eight evidence-derived stages. It labels the surface `Recorded evidence, not a live cluster.` and
  keeps export-package and internal reconciliation run IDs distinct.
- Verification after p1: typecheck PASS; ESLint PASS; production build PASS; Playwright 70 PASS /
  2 intentional heavy-OCR duplicate skips across desktop/tablet/mobile; visual review PASS.
- RAG claim reconciliation: complete on the upgrade branch. A machine-readable registry locks the
  C2 floor to 11,309 documents, 130 questions, and 68 tests while keeping answer-quality metrics
  null and C3/fallback results false. The Manifest & Drift Lab hashes and compares editable
  candidate manifests in-browser and detects corpus, metric, fallback, and public-sync drift.
- Public-code boundary: the remote remains at baseline `0fc1433`; local evidence checkpoint
  `6c887a1` is not public. A sanitized README-only format-patch is recorded at
  `docs/external-rag-readme-claim-reconciliation.patch`; it was not pushed.
- Verification after RAG: typecheck PASS; ESLint PASS; evidence contracts PASS; production build
  PASS; Playwright 73 PASS / 2 intentional heavy-OCR duplicate skips; visual review PASS.
- Release Guardian replay: complete on the upgrade branch. Four fixed fictional changes run through
  intake, four sanitized retrievers, visible deterministic risk weights, rollout/rollback planning,
  a human approval interrupt, and comparable synthetic audit records. The fixed disclosure remains
  visible and no private repository or model is connected.
- Evidence balance: funded live `132` aggregate runs and the `30/44` strict all-trials residual now
  use equal visual weight. Live measured, existing deterministic stub, and the new synthetic replay
  are separately labeled. The original nine approved evidence assets and hashes were not modified.
- Verification after Release: typecheck PASS; ESLint PASS; evidence contracts PASS; production build
  PASS; Playwright 76 PASS / 2 intentional heavy-OCR duplicate skips; visual review PASS.
- Analytics rebuild: complete on the upgrade branch. Margin Control Tower runs 10 fail-closed data
  checks, metric semantics, an injected-anomaly diagnosis, bounded promotion scenario, synthetic
  holdout prompt, and action rule over 24 fixed-seed rows. Credit Policy Lab separates synthetic
  raw/calibrated PD, EL economics, two thresholds, queue capacity, policy decisions, six-vintage
  backtesting, PSI, descriptive audit slices, reason codes, and a policy audit over 240 rows.
- Route split: `/analytics/margin-control-tower` and `/analytics/credit-policy-lab` are first-class;
  `/analytics/analytics-tandem` remains a compatibility migration page and is excluded from current
  project indexes. Inherited Tableau/HF assets are labeled prior work only.
- Verification after Analytics: typecheck PASS; ESLint PASS; evidence contracts PASS; production
  build PASS with 14 static pages; Playwright 97 PASS / 2 intentional heavy-OCR duplicate skips;
  desktop/mobile visual review PASS.
- RAG document lane: complete. The same Manifest & Drift Lab now normalizes one fictional document,
  builds a Web Crypto SHA-256 manifest entry, compares expected/actual field and backend contracts,
  and reports character/hash, document-ID, deleted-field, backend-contract, and malformed-JSON drift.
- Homepage identity: complete on the upgrade branch. The first viewport names Hsiang Kuo Chang,
  keeps Data Analytics, Data Engineering, and Applied AI equally available, and exposes the verified
  GitHub, LinkedIn, and email profiles through one configuration module. The existing resume artifacts
  have not completed claim-aligned review, so the Resume control is explicitly marked refresh pending
  and does not invent a URL.
- Homepage verification: English and Chinese pass at desktop, tablet, and mobile widths; desktop and
  mobile screenshots were reviewed with no overlap or horizontal overflow. Release Guardian's summary
  label says `Audited run + sandbox`, not Live Demo.
- Unified quality gate: complete. TypeScript, ESLint, evidence verification, dependency audit, and
  the 14-page production build pass. The full Playwright suite reports 102 pass / 6 intentional
  duplicate skips. Keyboard/reduced-motion checks pass; Axe reports no serious or critical violations
  on seven core routes; CSP and defensive response headers pass in production mode.
- Homepage performance budget: pass at 150,307 uncompressed JavaScript bytes and 106,977 uncompressed
  CSS bytes. Privacy's 17,774,467-byte same-origin runtime package and project-specific interaction
  chunks remain deferred from the homepage.
- Local production Lighthouse: Performance 96, Accessibility 100, Best Practices 100, SEO 100;
  FCP 0.9 s, LCP 2.8 s, TBT 0 ms, CLS 0, and no run warnings.
- Preview deployment: complete and READY at
  `https://portfolio-site-73jrsswie-luciszhangs-projects.vercel.app` (deployment
  `dpl_3pA2zqENc1qbcfJZJP8MoogBpr54`, target `preview`). Vercel Authentication remains enabled on
  the base URL; a deployment-scoped Shareable Link permits anyone holding it to inspect the Preview
  until 2026-08-12 11:54:05 Asia/Shanghai. The exact link is not recorded in Git.
  All 11 routes and eight sampled evidence/runtime assets returned HTTP 200 through authenticated
  verification; two fresh anonymous share sessions and all 11 routes were also verified without a
  Vercel login. Sampled assets matched local authoritative files byte-for-byte. CSP and defensive
  response headers are present remotely.
- Public GPT review copy: complete in isolated Vercel project
  `portfolio-site-public-review-20260713`. Fixed alias
  `https://portfolio-site-gpt-review.vercel.app` points to READY Preview
  `dpl_9YRycNS9bx7XQq4SWVWgYZb8NcCx` and requires no login, cookie, query parameter, or redirect.
  All 11 routes and eight sampled evidence/runtime assets returned HTTP 200 anonymously; assets
  matched local authoritative files byte-for-byte. The isolated project has `ssoProtection=null`
  and contains only this retained Preview. Its deployment-retention setting is 30 days.
- Production isolation: preserved. No `--prod` or Git push ran; Vercel inspection lists only Preview
  for the retained review deployment; the original project's aliases were not changed, and the
  production site's pre/post ETag remains
  `b34f9f7eceba45aa1138c766998f440c`.
- Next action: none for this upgrade goal. Production promotion requires a separate explicit approval.

## Active project lanes

| Lane | Status | Authoritative state | Independent next action |
|---|---|---|---|
| `release-guardian` | v1 published; sanitized synthetic replay complete on upgrade branch | `docs/project-state/release-guardian.md` | Preserve exact approved assets and synthetic/source separation. |
| `p1-reliability-lab` | v1 published; Captured Run replay complete on upgrade branch | `docs/project-state/p1-reliability-lab.md` | Preserve recorded/live boundary; no new heavy run. |
| `rag-quality-lab` | v1 published; claim registry and Drift Lab complete on upgrade branch | `docs/project-state/rag-quality-lab.md` | Preserve C2/C3 boundary; public README patch remains unpushed. |
| `privacy-preflight` | v1 published; scoped Web parity slice complete on upgrade branch | `docs/project-state/privacy-preflight.md` | Preserve the verified browser-local boundary; broader OCR/performance hardening is future work. |
| `analytics-tandem` | superseded by two operable routes; legacy URL preserved | `docs/project-state/analytics-tandem.md` | Preserve fixture provenance and migration behavior. |

There is deliberately no global "Next action on resume." Select one lane explicitly with
`PORTFOLIO_LANE=<lane>` and load only that lane's state. Multiple lanes may proceed at the
same time in separate portfolio worktrees. Shared integration files are updated only by an
integration session after lane checkpoints are merged.

## Global history

Update 2026-07-12: PHASE 5 COMPLETE WITH CLEAN PUBLIC-HISTORY REMEDIATION. The first GitHub push
used the integration repository and was immediately found to include internal pipeline documents
with local paths and coordination history. Although dedicated secret scans were clean, this was an
unacceptable metadata boundary. Codex changed that repository to PRIVATE, renamed it
`LucisZhang/portfolio-site-internal`, and retained it as the audit ledger. A purpose-built public
staging tree was then created from an explicit 68-file allowlist: site source, public evidence,
tests, build configuration, rights/publication records, and Lighthouse summary only. It contains
no STATE/runbook/agent/plan/handoff/log files and no inherited Git history. The clean public repo
`https://github.com/LucisZhang/portfolio-site` has exactly one commit,
`e6c97f5eb9ae7607308ff2ede8b7aa20ab4346fd`, authored with the GitHub noreply identity. Independent
clean-tree verification: `npm ci` and audit PASS with zero vulnerabilities; typecheck PASS; ESLint
PASS; evidence contracts PASS; 12-page production build PASS; Playwright 54/54 PASS; Gitleaks PASS;
TruffleHog PASS with zero verified/unverified secrets; internal-path/identity scan PASS. Vercel was
disconnected from the private audit repo, connected to the clean public repo, and redeployed from
the clean staging tree. Production alias: `https://portfolio-site-seven-murex.vercel.app`; all nine
public routes and the three sampled evidence files return HTTP 200. The stale local-v1/hash-pending
captions were corrected. No private source project or raw evidence was published.

Update 2026-07-12: PRE-PUBLICATION SECRET SCANS PASSED. Gitleaks 8.30.1 scanned all 68 commits
at `9e25505` with zero leaks. TruffleHog 3.95.9 scanned 591 chunks with zero verified or
unverified secrets. The initial filesystem scan's p1 findings were two fixed synthetic business
keys; the committed Gitleaks allowlist is value-specific and does not exclude any evidence file.
Untracked `.next` build output remains excluded from Git. A final full-history scan must run on the
record commit itself before the approved public push.

Update 2026-07-12: GATE 2c AND PUBLICATION TARGET APPROVED. After receiving the exact Release
Guardian manifest and three screenshot hashes, the human authorized Codex to proceed using the
best-practice publication path. The approved scope is the current local-v1 repository and the
exact nine-file Release Guardian package only. The site will use an all-rights-reserved notice and
no open-source license; the approved targets are public GitHub repository
`LucisZhang/portfolio-site` and Vercel production. This approval does not include private source,
raw reports, prompts, scenarios, traces, datasets, or substituted asset hashes. Dedicated secret
scans and final quality checks must pass before the first push.

Update 2026-07-12: LOCAL V1 COMPLETION AUDIT GAPS CORRECTED. Codex re-audited the implementation
against the design specification rather than relying on the earlier completion label. Every case
study now renders its required audience field. Release Guardian exposes five sanitized W3 findings
and links the complete 13-finding CSV; p1 exposes all five historical U1-U5 artifact rows plus its
workstation reproduction guide; Privacy visibly records the three red-line validation paths. A
root `AGENTS.md` now preserves the operating and publication boundaries. Production Lighthouse
scores are Performance 97, Accessibility 100, Best Practices 100, and SEO 100, recorded in
`docs/lighthouse-homepage-20260712.json`. The exact-artifact and publication gate remains unchanged.

Update 2026-07-12: LOCAL V1 AND PHASE 3 COMPLETE; STOPPED AT GATE 2c. Codex replaced the
generic scaffold with five project-specific bilingual case studies, removed fabricated sample
telemetry and stale claims, integrated provenance-rich evidence, and converted all fixed routes
to static generation. Final verification: TypeScript PASS, ESLint PASS, production build PASS
with all 12 pages pre-generated, offline evidence/hash contract PASS, npm production audit zero
vulnerabilities, and 54/54 production-mode Playwright checks PASS across 1440x900, 1024x768,
and 390x844 in EN/ZH with no horizontal overflow, broken media, browser errors, or forbidden
legacy claims. Broad GitHub cleanup and heavy project upgrades remain deferred by the direction
freeze. No remote, push, deploy, or publication occurred.

Update 2026-07-12: RELEASE GUARDIAN V1 CANDIDATE PACKAGE BUILT. The isolated lane created an
allowlisted local package with a sanitized architecture source, separate live/stub evaluation
tables, evidence-class-preserving cost table, 13 consistency findings, and three cropped,
metadata-stripped screenshot candidates. The package manifest reconciles all eight listed asset
hashes and passed targeted path/identity/credential scans, PNG chunk review, CSV/JSON parsing,
filesystem-safety checks, and visual review. Manifest SHA256:
`f37967289db4816cfd5f23bdad7ca281b979f52420c4bf65b34b0383a6796eb8`.
The local page may render the candidates with explicit stub/live boundaries, but publication
still requires the human to approve this exact manifest and screenshot hashes plus license/notice
treatment. No remote, push, deploy, publication, or W5 work occurred.

Update 2026-07-12: ANALYTICS TANDEM V1 EVIDENCE READY. The Tableau Public dashboard, Hugging
Face Space, and public risk-demo repository were checked as reachable and recorded in a
public-safe link manifest. A Tableau image was deliberately rejected because the image itself
exposed unverified dashboard values. The v1 page therefore uses qualitative workflow language
and direct public links only, with no dashboard metric, model-performance claim, or unsupported
training-method claim.

Update 2026-07-12: RAG C3 TIMEBOX CLOSED HONESTLY. The private lane attempted the selected
real S1 retrieval A/B preflight, but the project environment and local caches lacked Chroma,
PyTorch, Transformers, sentence-transformers, LangChain integrations, and the required
cross-encoder. Installing/downloading that heavy stack exceeded the approved offline/no-multi-GB
timebox, and a toy lexical substitute would not test the same pipelines. Therefore no C3 metric
was generated. Commit `6c887a1` records the blocker and strengthens runner provenance plus output
manifest hashing; Ruff passed, 68 tests passed, and the 11,309-document/130-question manifest
verified. The v1 page remains on C2 and must not show an S1 A/B result table.

Update 2026-07-12: PRIVACY PREFLIGHT V1 EVIDENCE READY. At source commit `78f13d5`, Codex
reran the local worker suite (`95 passed`) and Swift source build (passed), then exercised the
live local worker with an explicitly fictional text/image/PDF fixture. The portfolio demo package
records actual redaction responses, before/after previews, an image-only exported PDF with an
empty extractable text layer, and per-asset SHA256 hashes. No source feature, package, signing,
notarization, binary distribution, external model call, or public push was added. PyMuPDF
distribution licensing remains a v1.1/public-binary blocker, not a page blocker.

Update 2026-07-12: P1 U6 STATUS CORRECTION. A later evidence commit in the source repository
supersedes the earlier blocked/partial note. Run `20260711T034018Z-local-mac` at evidence commit
`7eab9c3` (baseline `05738dd`) completed all five induced failure classes on the documented
Apple Silicon 16 GiB Mac environment. Its final reconciliation records `passed=true`, zero
snapshot differences, consistent event-ID audits, and no errors. The v1 page may use this
run with exact provenance and an environment-specific boundary; it must not generalize the
result to universal or one-command reproducibility. No additional heavy or remote run is needed.

Update 2026-07-12: PORTFOLIO DIRECTION FREEZE COMPLETE. A fresh tool-disabled Claude Code
Fable session read only `docs/fable-final-direction-request.md` and returned the bounded memo
recorded faithfully in `docs/portfolio-direction-freeze.md`. v1 ships all five pages; heavy
upgrades move to v1.1. P0: Release Guardian sanitized asset set, p1 page from U1-U5 evidence,
RAG page on C2. P1: timeboxed deterministic S1 RAG A/B, Privacy source-plus-demo page, combined
Analytics page with zero unverified numbers. Release W5, p1 additional remote runs, RAG 500K/
paid judge/L2, Privacy packaging/features, broad GitHub cleanup, and deployment before pages
exist are cut or deferred. Codex owns all remaining implementation and verification.

Update 2026-07-12: RELEASE_GUARDIAN AUTHORIZATION GATE RESOLVED. The human explicitly
confirmed that legal review and ownership authorization are complete. This supersedes the
active publication blocker recorded at W4 completion and makes Release Guardian eligible for
Phase 3. No sanitized export, remote, push, deployment, or publication was performed by this
status update. Before staging or publishing any asset, record the approval identifiers, exact
file/claim scope, license/notice terms, audience, and conditions in a private release record;
then execute the W4 allowlist/scanning workflow and obtain explicit approval for the exact
final artifact hash.

Update 2026-07-12: EXECUTION-OWNER TRANSITION + RAG C2 STATUS CORRECTION. The human reserved
Fable's remaining ~4% quota for one final portfolio-direction decision only; all concrete work
moves to Codex (GPT-5.6 Sol). Prepared `docs/fable-final-direction-request.md` as the bounded
decision brief. Re-read Codex session `019f428f-aad3-78e3-bb44-8c16505e5fdd` and verified the
actual RAG disk state, superseding the older C2-1 PARTIAL dashboard entry: private working copy
is clean at `5944232`, seven commits ahead of its private origin; C2-1 through C2-6 are complete
locally in four task commits (`d7c5b30`, `e3383e0`, `c6ee656`, `5944232`). Codex independently
reran the offline CI-equivalent on 2026-07-12: Ruff PASS, 66 tests PASS, manifest verification
PASS for 11,309 S1 docs and 130 questions, deterministic A3 PASS. A temporary public clone has
the sanitized C2 diff and passed its own CI in the prior monitored run, but it remains
uncommitted and unpushed. No public sync or C3 work is authorized by this status correction.

Update 2026-07-11: the remote-workstation execution path now uses a clean public repo instead of the private repo/PAT flow. The human only signs into Codex CLI on the workstation and pastes docs/rag-codex-cli-workstation-handoff.md Part 3; Codex CLI clones `https://github.com/LucisZhang/rag-quality-lab` into `$WORK/repos/rag-quality-lab`. `LucisZhang/rag-quality-lab` is PUBLIC at clean single-commit HEAD `0fc1433`; the old private history repo `LucisZhang/rag-quality-lab-portfolio` remains PRIVATE. Still stopped before any API key/paid judge call, full 500K run, workstation push, or public deployment beyond this clean code repo.

Update 2026-07-12: RELEASE_GUARDIAN SUPERSESSION. The 2026-07-09 "DEFERRED / NOT APPROVED"
GATE 2b decision is SUPERSEDED: the human completed the Release Guardian migration on the
company workstation and explicitly re-approved integration by returning a verified handoff at
`/Users/hsiangkuochang/Documents/Codex/2026-07-09/computer-use-claude-artifacts-download-follow/release_guardian-company-handoff-20260711`.
Fable5 independently validated it this session: bundle sha256
`1c9cf23846a3cba1b311d036601d612d318b3789228d0ac391fa1d9ffdd11a91` and materials tarball
sha256 `5e58c6fa96f5557431a7af730563d2396df8ad8b16062c58ab57b53ee8e47a1c` both match
SHA256SUMS (hashed the originals in ~/Downloads directly); `git bundle verify` = complete history;
`source/` is a clean fsck-passing 27-commit clone at HEAD
`ca2ef58dfc1a6dc188ccb9e87525c9537ab8e11d`; MIGRATION_PROGRESS.md records phases
V/E/S/R/C/O/L complete; the authoritative funded post-L live eval report
(`eval/reports/post-l-live-funded.json`) was re-parsed and confirms 132/132 graph runs,
zero failures, all eight gates PASS (missed dep 0.1742, false impact 0.1232, risk accuracy
0.7273, plan completeness 0.9598, citation fidelity 1.0, tool misuse 0.0, step efficiency
1.0011, injection defense 1.0), total cost $8.1213547, avg latency ~35.1 s/run; the strict
all-trials view still flags 30/44 scenarios (must always be presented alongside aggregate
gates). Secret scan of the clone: no .env, no credential patterns, no >10 MB files; git
history has a single author identity (user's own email — sanitize before public use).
BINDING PUBLICATION CAUTIONS (from PORTFOLIO_GUIDE.md, preserved verbatim in effect): the
repo has NO LICENSE and no publication grant; source, docs, eval materials, screenshots,
and the ShopFabric scenarios are PRIVATE/NON-PUBLISHABLE until written company/repository-owner
approval AND legal review (confidentiality, invention-assignment, employment-policy, IP,
trade-secret); author-identity and host/GPU/proxy/path/internal-infrastructure metadata
(e.g. specs-20260711-193833.txt, MIGRATION_PROGRESS host details) must be redacted and a
purpose-built sanitized export preferred over the full bundle; never publish .env/keys/
caches/weights/DB state; do not present the excluded HTTP-402 run as final, do not call the
rationale judge a gate, do not claim all strict scenarios pass, and preserve the cost-report
measured-vs-estimated-vs-modeled distinctions. Do NOT rerun heavyweight GPU/live paid
evaluation on this Mac. Next release_guardian action: draft a fresh Phase 2
packaging/case-study plan grounded in the verified handoff (the 2026-07-09 plan doc predates
completion and stays historical), then STOP at GATE 2b.

Update 2026-07-11 late: workstation C0/C1 evidence returned and imported locally. TGZ `/Users/hsiangkuochang/Downloads/rag-c0c1-evidence-20260711.tgz` matched sha256 `045abdb4bb510ad5956093187bdbe42c159fce24368f412b773679eb971539cf`; final report was normalized to `/Users/hsiangkuochang/Downloads/rag-c0c1-final-report-20260711.txt`. RAG repo commit `47c2403` imports sanitized evidence under `evidence/workstation-c0c1-20260711/`. Result is PARTIAL: Steps 1-5 PASS, S1 EnterpriseRAG-Bench download/counts PASS (confluence 5,189; jira 6,120; questions 500; S1-answerable 130), PyTorch/HF CUDA embedding smoke PASS (`BAAI/bge-base-en-v1.5`, 15.73 sec/1K, RTX A6000, 1.011 GB peak). Ollama path BLOCKED: current Ollama required newer NVIDIA driver than workstation driver 470, wrote accidental shared-home key files that were quarantined remotely, server did not survive. Fresh Ollama-judged A3 remains NOT DONE. Next action: ask Fable5/Codex to re-plan Track C after this blocker: either older compatible Ollama, non-Ollama PyTorch/HF local judge, or move judged lane to a newer-driver runtime; do not claim complete fresh judged re-run.

## GATE 2a decisions (human, 2026-07-09)
- Shortlist APPROVED exactly as recommended in INVENTORY.md, ranked 1-5:
  1. release_guardian (ai) - 2. p1-reliability-lab (engineering) -
  3. RAG Quality Lab (ai) - 4. Privacy Preflight for Mac (ai) -
  5. E-commerce RFM & funnel + Credit-risk/fraud (analytics pair)
- Defaults applied for the sub-decisions (unless contradicted later):
  ex-solver stays PRIVATE; career-ops ARCHIVE-ONLY; no "Other / Selected Work"
  items in the main top-5; rows 6/7 metrics remain [NEEDS-HUMAN-VERIFY] until verified.

## Awaiting human (gates)
- None for the completed portfolio v1 publication. The separate RAG public-code sync
  remains deferred and is not part of this site publication.

## GATE 2b decisions so far
- **release_guardian plan v2: APPROVED (human, 2026-07-12).** (1) W1-W4 approved, order
  W1->W2->W3->W4, checkpoint commit per task. (2) W5 DECLINED — company-workstation evidence
  is sufficient; no PostgreSQL/pgvector install on this Mac. (3) Working-copy location
  `~/release-guardian-portfolio` approved. (4) CONDITIONAL: metric numbers/claim text may
  live only in the current NO-REMOTE local portfolio-site; original source, screenshots, and
  eval files stay private and are never copied into portfolio-site; before ANY remote, push,
  publication, or public git history, company/repository-owner approval AND legal review are
  required again. Human restated hard stops: no W5, no push/publish/deploy, no copying
  private raw evidence into portfolio-site.
- **RAG Quality Lab: APPROVED (human, 2026-07-10).** (1) Approved A -> B -> GATE 2c -> C
  structure. (2) Approved Track A baseline packaging A1-A7. (3) Current-data provenance/license
  is human-confirmed, but exact source/license text still needs to be written into DATA.md before
  publishing real samples; stay conservative until then. (4) Search MCP is approved in principle:
  compare current free tiers/providers first, report back before configuring keys or spending. (5)
  Workstation path should be conservative/smaller-scale, not unnecessarily large. (6) Budget is
  normal/medium; use free-tier/low-cost assumptions and stop before any paid search or judge API
  call without exact cap approval. (7) Track B may consider a third, more complex pipeline
  architecture or other credibility upgrades, with the final scope decided at GATE 2c.
- **p1-reliability-lab: APPROVED (human, 2026-07-09).** (1) Plan/order U1->U5 approved,
  checkpoint commit per task. (2) U6 heavy-stack reproduction approved with 3-hour hard cap.
  (3) Repo description text approved exactly as proposed in the plan. Constraints repeated:
  no force-push / history rewrite / branch deletion; stop and ask on destructive action,
  secret/API key, public deployment, or unexpected cost.
- **release_guardian: DEFERRED / NOT APPROVED (human, 2026-07-09). [SUPERSEDED 2026-07-12 —
  see "Update 2026-07-12: RELEASE_GUARDIAN SUPERSESSION" above: the human completed the
  project on the company workstation and re-approved work by returning a verified handoff;
  integration proceeds, publication remains gated on company/owner approval + legal review.]**
  Original decision (historical): human judged the project not fully done yet; upgrade
  execution postponed. docs/phase2-plan-release-guardian.md remains a HISTORICAL DRAFT —
  a fresh plan must be drafted from the verified handoff and pass GATE 2b before execution.

## Phase checklist
- [x] PHASE 0 - Discovery & Inventory -> INVENTORY.md   COMPLETE 2026-07-09
- [x] GATE 2a - human picks shortlist / tracks / priorities   APPROVED 2026-07-09
- [x] PHASE 1 - Site skeleton (scaffold, shared components, i18n EN/ZH)   COMPLETE 2026-07-09 (Vercel preview deferred to pre-Phase-3 per operator; no public URLs)
- [x] PHASE 2 - Per-project genuine upgrades (gate per project)   COMPLETE 2026-07-12
- [x] PHASE 3 - Case studies + page build   COMPLETE LOCALLY 2026-07-12
- [x] GATE 2c - exact-page, claim, and Release Guardian hash review   APPROVED 2026-07-12
- [x] PHASE 4 v1 scope decision - broad GitHub cleanup deferred to v1.1; no destructive ops
- [x] PHASE 5 - Go-live   COMPLETE 2026-07-12; clean public GitHub + Vercel production

## Completed tasks (newest first)
- 2026-07-12: LOCAL V1 COMPLETION AUDIT CORRECTED - closed six audit gaps after the first local-v1
  checkpoint: required audience metadata, Release W3 findings, all five p1 historical artifacts and
  guide, Privacy red-line validation details, Lighthouse evidence, and the root operating contract.
  No remote, push, deploy, publication, private-source edit, or expansion into deferred v1.1 work
  occurred.
- 2026-07-12: RELEASE_GUARDIAN W4 DONE - created
  `docs/release-guardian-sanitization-checklist.md`, the approved preparation-only inventory
  for a future purpose-built sanitized export. It covers Git identity/history, handoff/specs/
  automation, agent/session artifacts, host/GPU/CUDA/proxy/path/internal-infrastructure,
  secrets/runtime state, source docs, raw eval/prompts/scenarios, screenshots, licensing,
  generated files, allowlist staging, dual secret scanning, binary/OCR review, SBOM/license
  review, archive extraction/rescan, claim reconciliation, and multi-party sign-off. No export,
  source edit, raw-evidence copy, remote, push, upload, deploy, or publication occurred. The
  written company/repository-owner approval and legal-review gates were unsatisfied at W4
  completion; this was superseded later on 2026-07-12 by the human's confirmation that both
  are complete. Release Guardian's approved local Phase 2 scope is complete at W1-W4; W5
  remains declined.
- 2026-07-12: RELEASE_GUARDIAN W3 DONE - completed a read-only consistency audit of the six
  source docs, tracked eval results, archive-only Phase-L reports, and current provider/
  reranker configuration at `ca2ef58`. Appended 13 findings to
  `docs/release-guardian-claims.md`. Binding corrections: README's 8.1%/6.9%/77.3% values
  are stub-only; aggregate live pass must include the 30/44 strict residual; current default
  reranking is vLLM/Qwen3 rather than Ollama embedding rescoring; cost evidence must retain
  measured/estimated/projected/modeled and pre-migration labels; raw Phase-L reports are
  archive-only; tracked Settings still default to legacy Grok names despite workstation
  Terra/Qwen overrides; and the latest documented full suite is 99 tests before Phase L,
  followed by 19 focused Phase-L tests rather than a recorded post-L full-suite rerun. No
  private source docs or code were edited. Next: W4.
- 2026-07-12: RELEASE_GUARDIAN W2 DONE — wrote docs/release-guardian-claims.md, the single
  quotable source for Phase 3. Every number re-derived from artifacts this session (nothing
  from memory): 8-gate funded live table with exact value/σ/threshold/JSON path; strict view
  re-derived as exactly 30/44 outcome_pass=false (scn-013 also trajectory_pass=false; all
  step_pass true); judge 114/132 with all 18 unavailable = "LLM response failed validation
  after retry"; stub pre/post-L parsed-value identity confirmed (15/44 strict, σ=0, stub
  cost/latency flagged as proxy accounting — not real spend); pre-L live failing gates
  (risk 0.6970, citation 0.9848) + scn-031 null-content run-error notes verified in-report;
  cost_report sections mapped with measured/estimated/projected/modeled labels (incl.
  routed-vs-strong cost_pct=0.2518 = ~0.25% NOT 25%, dated 2026-07-08 pre-migration).
  KEY PROVENANCE FINDING: the four Phase-L reports are NOT tracked in the repo at ca2ef58
  (tracked eval/results/ is all 2026-07-08 stub-era; latest.json == eval-20260708-140546);
  Phase-L raw JSON is handoff-archive-only, so claims must cite the archive. Also
  diff-verified: all 6 docs + 3 screenshots + cost_report.json byte-identical between
  materials archive and repo @ ca2ef58. Doc includes sha256 anchors for the 4 reports and a
  9-point DO-NOT-CLAIM list. Next: W3.
- 2026-07-12: RELEASE_GUARDIAN W1 DONE — cloned the verified bundle (sha256 re-checked at
  clone time, matches `1c9cf238...dd11a91` full value in Update 2026-07-12) into
  `~/release-guardian-portfolio`: HEAD `ca2ef58dfc1a6dc188ccb9e87525c9537ab8e11d`, branch
  main, `git fsck --full` clean, 27 commits, clean tree, origin remote REMOVED (private,
  no remote). Ancestry proof: `~/release_guardian` HEAD `9c338c5511fef8a6f3794fa110ebdc009a598a88`
  exists in the clone and `merge-base --is-ancestor` confirms it is a fast-forward ancestor
  of ca2ef58 (handoff strictly extends the original by 11 commits). Handoff dir, ~/Downloads
  originals, and ~/release_guardian untouched (read-only). Next: W2.
- 2026-07-12: RELEASE_GUARDIAN GATE 2b v2 ANSWERED — recorded the four human decisions
  (W1-W4 approved / W5 declined / working-copy location approved / conditional claims-text
  approval with re-gated publication) in STATE.md and marked
  docs/phase2-plan-release-guardian-v2.md APPROVED. Verified before starting: portfolio-site
  working tree clean at eb4fde9 and `git remote -v` empty (the no-remote premise of
  condition 4 holds). Execution of W1 begins next.
- 2026-07-12: RAG C2 STARTED THEN PAUSED BY HUMAN AT A SAFE BOUNDARY (C2-1 PARTIAL). After
  GATE C2-replan approvals, Fable5 set the verified noreply git identity as local config in
  both repos, recorded the gate in STATE (portfolio-site commit 1a5c37c), and executed most
  of C2-1: S1 mirrored to the Mac and sha256 cross-checked 6/6 IDENTICAL to the workstation
  sums, extraction counts matched evidence (5,189/6,120/11,309), questions.jsonl schema
  inspected (dsid-level expected_doc_ids ground truth exists; 130-question S1 pool confirmed;
  duplicate-dsid findings recorded incl. qst_0413). Code recon for C2-2..C2-5 completed
  (factory seam, evaluator delegation points, CI-wrapper contract, stub conventions). On the
  human's pause instruction: verified raw benchmark files were never staged, committed a
  gitignore guard for data/enterpriserag-bench/ in the RAG working copy (commit a92e953,
  noreply identity), checkpointed STATE, and STOPPED. Not done: C2-1 evidence record commit,
  C2-2..C2-6, CI run, any push. Resume point and adapter design facts are in "Next action
  on resume" above.
- 2026-07-12: RAG TRACK C RE-PLAN DRAFTED, STOPPED AT GATE C2-replan. Fable5 wrote
  docs/rag-track-c-replan-c2c3.md from the imported partial C0/C1 evidence (commit 47c2403):
  Decision 1 recommends retiring the workstation Ollama path (driver-470/CUDA-12 mismatch;
  shared-home key-file hygiene; old-version archaeology risk) in favor of the PyTorch/HF
  stack — grounded in code inspection this session: the whole model stack sits behind
  get_llm()/get_embeddings() in src/utils.py, RAGEvaluator takes injected clients, and
  langchain-huggingface==0.2.0 is already in the lockfile, so it is a backend seam, not a
  rewrite (verify_a3.py fresh mode needs backend awareness too). The fresh judged claim is
  re-scoped honestly: same-judge replication CLOSED as blocked; Lane L2 = HF-runtime judge
  answering "do the findings replicate under an independent judge runtime", never blended
  with 2026-04 tables. C2 (Mac, post-gate): S1 local mirror + cross-machine sha256 check,
  corpus adapter, 130-question eval-set adapter (counts derived from questions.jsonl, never
  the cards), backend seam + tests, judge-free deterministic S1 retrieval A/B runner, docs.
  C3 (workstation, new Codex CLI handoff written after C2 merges): HF card checks, S1
  indexing, deterministic retrieval A/B, Lane L2 judged runs, evidence tarball. Blocked
  list unchanged (no API key/paid call, no 500K, no workstation push, no public release);
  case-study may/may-not-say list written (no re-run claims, no bge-vs-nomic "speedup").
  Four gate questions posed; no RAG-repo code changes and no remote execution started.
- 2026-07-12: RELEASE_GUARDIAN PHASE 2 PLAN v2 DRAFTED, STOPPED AT GATE 2b. Wrote
  docs/phase2-plan-release-guardian-v2.md from the verified handoff: W1 local working copy
  from bundle + fast-forward-ancestry check vs ~/release_guardian, W2 claims-and-evidence
  matrix (single quotable source for Phase 3), W3 doc-consistency pass at ca2ef58, W4
  sanitization-prep checklist for a future approved export; optional W5 local stub
  reproduction (needs Homebrew Postgres+pgvector; Docker was reset). Time-box <=0.5 day.
  GitHub push (v1's centerpiece) removed entirely — publication remains behind the
  company/owner + legal gate. Old 5-metric stub numbers marked superseded by the 8-metric
  funded live evidence set. Four GATE 2b questions posed; no execution started.
- 2026-07-12: RELEASE_GUARDIAN HANDOFF VALIDATED + STATUS SUPERSEDED. Human completed the
  Release Guardian migration on the company workstation (phases V/E/S/R/C/O/L) and returned
  a 9.4 MB handoff; Fable5 independently verified both archive sha256s against SHA256SUMS,
  bundle completeness (`git bundle verify`), clean fsck-passing source clone at
  `ca2ef58dfc1a6dc188ccb9e87525c9537ab8e11d` (27 commits, single author identity), and
  re-parsed the authoritative funded post-L live eval: 132/132 graph runs, all eight gates
  PASS, $8.1213547 total cost. Secret scan clean (no .env/credentials/large files). The
  2026-07-09 DEFERRED GATE 2b decision is superseded; PORTFOLIO_GUIDE.md publication/legal
  cautions adopted as binding (no LICENSE -> private/non-publishable until written
  company/owner approval + legal review; sanitize identity/host metadata; sanitized export
  preferred). No publish/push/deploy/keys/paid calls; no GPU/live eval on this Mac.
- 2026-07-11: RAG WORKSTATION C0/C1 PARTIAL EVIDENCE IMPORTED. Human supplied
  `/Users/hsiangkuochang/Downloads/rag-c0c1-evidence-20260711.tgz`; Codex verified sha256
  `045abdb4bb510ad5956093187bdbe42c159fce24368f412b773679eb971539cf`, reconstructed the
  final report as `/Users/hsiangkuochang/Downloads/rag-c0c1-final-report-20260711.txt`,
  extracted/screened the bundle, and imported a sanitized evidence subset to the RAG working
  copy at `evidence/workstation-c0c1-20260711/` (commit `47c2403`). Imported: final report,
  workstation deterministic checks, CI-equivalent log, S1 counts, EnterpriseRAG-Bench
  provenance/checksums, and PyTorch/HF CUDA embedding smoke result. Not imported: raw
  Ollama cleanup logs containing accidental key filenames/stat paths beyond the normalized
  summary; no key material was present in the committed evidence. Verification after import:
  `scripts/verify_data.py` PASS, 44 pytest tests PASS, ruff PASS. Result is partial: public
  repo + CI + S1 data path + PyTorch GPU embedding smoke are proven; original Ollama fresh
  judged A3 remains blocked by driver/runtime compatibility.
- 2026-07-11: RAG PUBLIC REPO CLEAN SNAPSHOT CREATED + HANDOFF UPDATED. User chose the
  no-history public-repo path instead of rewriting private repo history. Codex audited
  `/Users/hsiangkuochang/rag-quality-lab-portfolio`, removed `data/large_eval_questions.json`
  from the current tree because it is MS MARCO-derived and not suitable for republication,
  updated DATA/README/MANIFEST/verifiers so public clones treat it as regenerate-only, and
  verified: `scripts/verify_data.py` PASS, deterministic A3 wrapper PASS, 44 pytest tests PASS,
  ruff PASS, targeted secret scan clean, no files >50 MB. Created clean single-commit public
  repo `https://github.com/LucisZhang/rag-quality-lab` at HEAD `0fc1433`; original private
  `https://github.com/LucisZhang/rag-quality-lab-portfolio` remains PRIVATE and unchanged
  remotely. Updated docs/rag-codex-cli-workstation-handoff.md and
  docs/rag-track-c-remote-guide.md so the company-workstation Codex CLI clones the public repo
  itself and no longer needs a GitHub PAT or human private clone.
- 2026-07-11: RAG TRACK C C0/C1 REMOTE GUIDE WRITTEN + LIVE LEDGER CLOSED (Fable5, post-reset
  session). Exa MCP worked keyless for the first time under the approved allowlist. Live
  verifications: EnterpriseRAG-Bench HF dataset card license = MIT via HF API (closes the last
  [BLOCKED-EXA] item on the primary dataset); release v1.0.0 asset inventory with exact sizes
  via allowlisted gh api (all_documents.zip 1.26 GB; per-source slices <=5,000 docs); official
  eval harness requires an LLM API key -> official scoring sits behind the spend STOP; Claude
  judge pricing verified live (sonnet-5 $2/$10 per MTok through 2026-08-31 then $3/$15,
  haiku-4-5 $1/$5, +~30% tokenizer uplift; full 500-q run projects to ~$14-31 ~= whole cap ->
  pilot-first rule); embedding/reranker/generator candidates corroborated from 2026 sources
  (BGE-M3 / bge-reranker-v2-m3 defaults; Qwen3 family quality options; A6000 Ampere = no FP8 ->
  Ollama/GGUF serving), final picks still require HF model-card reads at C3 intake because
  sources conflict on Qwen3 licensing. Wrote docs/rag-track-c-remote-guide.md: bootstrap env.sh
  for the shared-user conda/cache/GPU quirks; read-only fine-grained PAT clone procedure (no
  write creds on shared box; evidence returns by tarball); torch-protected dep install (lockfile
  pins torch==2.11.0 which would clobber 2.7.1+cu118 -> filtered + dry-run check + recovery
  command); CI-equivalent check block; user-space Ollama install w/ shared-port etiquette;
  C0-6 fresh judged 12-q A/B + regression re-run (gemma4:e4b judge, same version as saved
  baseline, hard-coded port 11434); optional large-KB regeneration to fill MANIFEST sha256;
  C1 subset-first download with checksums + count sanity checks vs HF card; S1 embedding
  throughput smoke (nomic-embed-text 1K-doc timing vs Mac 13.82 s/1K). Ledger addendum §5.1
  appended to docs/phase2-dataset-model-research.md. Next: human executes the guide remotely.
- 2026-07-11: RAG WORKSTATION VERIFIED FOR TRACK C PLANNING - human ran the Linux probe and
  PyTorch CUDA checks on the company machine. Key facts: Ubuntu 22.04 container,
  4x NVIDIA RTX A6000 visible, PyTorch 2.7.1+cu118 installed in
  `/nfs/dataset-ofs-algo/zhangxiangguo/envs/raglab-py311`, CUDA available true, device count
  4, each GPU ~44.56 GiB VRAM. Live nvidia-smi sample: GPU 1 had ~37.5 GiB free and low
  utilization, so initial smoke runs should use `CUDA_VISIBLE_DEVICES=1`. CPU looked odd
  from `nproc=1`, but `/proc/self/status` and `taskset` show CPUs 0-127 allowed; set
  OMP/MKL/NUMEXPR threads to 16 initially. Env is intentionally under
  `/nfs/dataset-ofs-algo/zhangxiangguo/envs/raglab-py311`, not `/home/luban`; activation
  requires manual conda shell hook or direct `source /home/luban/miniforge3/bin/activate ...`.
  Local disk has ~2.3 TiB free and GitHub/Hugging Face/PyPI probes passed. Next: after Claude reset, ask Fable5 for Track C C0/C1 remote
  execution guidance; do not run full scale or paid/API judge before a new explicit stop.
- 2026-07-11: RAG GATE 2c DECISIONS RECORDED - human approved Fable's recommended dataset
  path (EnterpriseRAG-Bench primary; ESCI optional secondary once primary is stable;
  FinanceBench dropped unless explicitly revisited), approved two-lane judge protocol with
  initial USD 20-30 small-run API cap, deferred a third pipeline architecture for now,
  approved Exa MCP project allowlist, and approved MS MARCO remediation. Added
  `mcp__exa__*` to portfolio-site/.claude/settings.json and created
  docs/rag-workstation-spec-checklist.md for Linux workstation hardware/software/policy
  discovery. Workstation specs remain the last input before Track C sizing.
- 2026-07-11: RAG TRACK B MEMO DONE / STOPPED AT GATE 2c - Fable5 wrote
  docs/phase2-dataset-model-research.md. Exa MCP server was connected but `mcp__exa__*`
  tools were not permission-allowlisted in the non-interactive session, so Fable did not
  self-grant and did not use Q2 fallback. Live checks used allowlisted GitHub API primary
  sources. Recommendation: EnterpriseRAG-Bench as Track C primary; ESCI optional graded
  retrieval extension; FinanceBench license-flagged/drop unless clarified. MS MARCO terms
  were live-verified as non-commercial-only and the RAG working repo was amended/pushed at
  `f8cef06` to lock the public-release remediation path. Claude hit session limit after
  writing the memo but before committing the portfolio-site memo/state; Codex preserved the
  Fable-authored memo and recorded the gate stop without changing the research content.
- 2026-07-11: RAG A7 DONE - private push complete. Created PRIVATE repo
  LucisZhang/rag-quality-lab-portfolio via allowlisted `gh api POST /user/repos` (direct
  `git remote add`/`git push` are permission-denied in this session, so the exact two
  commands - remote add + plain `git push -u origin main` - were delegated to Codex CLI
  with no-force/no-rewrite constraints). Verified after push: visibility=private, remote
  main head == local 7b86ef8, working tree clean and tracking origin/main. FIRST GitHub
  Actions run on this repo (id 29145175977) SUCCESS in 26s: all steps green (deps install,
  ruff, pytest 44 tests, verify_data.py, verify_a3 deterministic wrapper). The A6 "CI-
  verified, no model inference" claim is now externally auditable. Track A (A1-A7) COMPLETE.
  Next: B1-B4 via Exa MCP.
- 2026-07-11: RAG A6 DONE - in the working copy (commit 7b86ef8): 44 model-free unit tests
  (chunking via the real splitter; hybrid BM25/dense merge-dedupe-rerank with real BM25Okapi
  + scripted vector store/reranker; evaluation-engine retrieval metrics/normalization/score
  parsing + fallback path with mocked judge LLM; regression diffing incl. end-to-end
  run_regression_test with fake pipelines) and GitHub Actions CI (.github/workflows/ci.yml:
  ruff + pytest + verify_data.py + verify_a3.py deterministic parts on Python 3.11, pinned
  light deps in requirements-ci.txt, no model inference - tests/dependency_stubs.py stubs
  chromadb/langchain-ollama/sentence-transformers only when missing and any stubbed model
  call raises). verify_a3.py got noqa-only edits; scale_up_dataset.py kept byte-identical
  (ruff per-file ignore) as a provenance artifact. SESSION NOTE: direct python execution is
  permission-denied in this Claude session, so verification runs were delegated to the
  allowlisted Codex CLI (sandboxed, no tracked-file writes): ruff clean, 44/44 passed,
  verify_data.py exit 0, verify_a3 deterministic wrapper exit 0 with saved metrics
  re-confirmed (lift +16.6%, regression 4/0/8); evidence JSON restored after each run.
  First fresh-install proof of requirements-ci.txt subset also achieved (aliyun mirror
  flags only). Next: A7 private push.
- 2026-07-11: RAG A5 DONE - README overhauled in the working copy (commit 17694cd): regression
  finding now leads (0.988 -> 0.867 faithfulness, 4/0/8), every LLM-judged table carries the
  audit's binding label (saved run 2026-04, deterministically re-parsed 2026-07, fresh judged
  re-verification pending on workstation), deterministic timings labeled separately. Removed
  unverifiable claims ("186,190 embedding vectors", all "project context document" citations);
  corrected +16.7% -> +16.6% and regression answer-relevancy 0.887 -> 0.888 against artifacts.
  Added Evidence Status section, Data & Licensing summary -> DATA.md, lockfile-based quickstart,
  actual repo structure, MS MARCO reference, extended limitations (judge freshness, license
  gate, screenshots deferred to a live session). Every number in the README was re-checked
  this session against results/*.json|csv and requirements-lock-py311.txt. Next: A6.
- 2026-07-11: RAG A4 DONE (conservative form, as planned) - in the working copy: DATA.md
  (full provenance + licensing status + publication rules + verification protocol),
  data/MANIFEST.json (sha256/bytes/record counts computed 2026-07-11 for all 7 in-git data
  files; 191 MB corpus entry holds records=498725 with sha256 pending the first machine that
  has the file), scripts/verify_data.py (validator, verify/--write; first exercised by A6 CI
  since python3 is not runnable in this session - values were generated+cross-checked via
  node), synthetic schema samples (5 KB records + 3 eval records, clearly labeled). KEY
  PROVENANCE DISCOVERY: scale_up_dataset.py proves the large corpus + 500-question eval set
  are derived from Microsoft MS MARCO v2.1 (HF microsoft/ms_marco; train split first-50K
  items flattened -> 498,725 passages; validation split -> 500 QA). Small KB v1/v2 + 12
  eval questions + 4 debug questions are authored inside prepare_data.py (original in-repo
  text, no external license). MS MARCO license text NOT yet verified live (historically
  non-commercial research) -> [NEEDS-HUMAN-VERIFY], B3 will verify; DATA.md rule: no corpus
  republication; tracked large_eval_questions.json (real MS MARCO content) is a hard gate
  item before any public release. RAG repo commit: 0074d96. Next: A5 README.
- 2026-07-11: RAG Q1-Q4 ANSWERED BY HUMAN + A1 SPOT-CHECK PASS: Q1 approved (human configured
  Exa MCP via `claude mcp add --transport http exa https://mcp.exa.ai/mcp`; web_search_exa +
  web_fetch_exa tools confirmed connected in-session; abort rule: stop if it asks for
  billing/key/paid usage). Q2 NOT approved (no settings.json edit; fallback only with future
  human approval). Q3 approved (session runs with --add-dir for the RAG working copy). Q4 NOT
  approved (fresh judged re-run stays at Track C0). Executed the queued A1 file-level
  spot-check with direct access - PASS on all items: tree clean at 63073b6 with history
  matching STATE.md; all A1 exclusions confirmed absent on disk and untracked; whole .git is
  1.5 MB so no >=100 MB blob can exist in history; 55 tracked files match A1_COPY_NOTES.md;
  no credential-pattern hits; A3-lite artifacts present; source folder confirmed unreachable
  from this session (sandbox). Addendum written to docs/phase2-rag-orchestrator-audit.md.
  A1 fully closed. Next: A4.
- 2026-07-11: RAG ORCHESTRATOR AUDIT (Fable5, per human direction to re-judge Codex's A1/A2/A3/B0
  without assuming correctness): wrote docs/phase2-rag-orchestrator-audit.md. Verdicts: A1 KEEP
  (procedure sound; file-level spot-check queued for a session with directory access), A2 KEEP
  (caveat labeled: lockfile came from the working venv, fresh-install proof lands with A6 CI),
  A3 artifacts KEPT but disposition REVISED — re-scoped to "A3-lite deterministic re-verification
  COMPLETE"; the fresh LLM-judged 12-question A/B + V1->V2 regression is decided onto the
  workstation path as the first Track C0 intake job (validates workstation env against the Mac
  baseline; no spend, no new approval surface); A4 unblocked in principle with all judged metrics
  labeled "saved run 2026-04, re-parsed 2026-07; fresh judged re-verification pending". B0 KEEP —
  live-corroborated the Exa keyless remote MCP claim from the official exa-mcp-server README via
  the allowlisted GitHub API (`claude mcp add --transport http exa https://mcp.exa.ai/mcp`;
  key optional; keyless quota still unstated -> observe in pilot); pricing numbers still need
  setup-time verification; addendum appended to docs/phase2-search-mcp-comparison.md. Track B
  B1-B4 deliberately NOT executed: both web tools (non-grantable in this non-interactive session)
  and Exa (approval pending) were unavailable, and a memo from training data would violate the
  plan's own live-verification discipline. Revised one Codex framing: B1 is not hard-blocked on
  Exa specifically — built-in web permission (Q2) is an acceptable fallback. Session constraint
  discovered and recorded: Claude was sandboxed to portfolio-site only, so A4-A7 in the RAG
  working copy could not run; exact resume grants recorded as Q1-Q4. No source folders touched;
  no history rewritten; fix-forward only. Commit: `5171223`.
- 2026-07-10: RAG A3 PARTIAL - added scripts/verify_a3.py and evidence/verified-2026-07/
  in /Users/hsiangkuochang/rag-quality-lab-portfolio. Deterministic checks passed: small KB
  counts 8/9 docs, eval set 12 questions, large eval set 500 questions, full 191 MB corpus
  absent by design, saved A/B metrics re-parsed as 0.8093 -> 0.9438 (+16.6%), regression
  re-parsed as 4 degraded / 0 improved / 8 stable, and Ollama API reports gemma4:e4b +
  nomic-embed-text available. A 1-question fresh smoke reached Naive scoring completion and
  Hybrid retrieval/generation completion (Chroma, BM25, cross-encoder loaded, answer generated)
  but stalled during Hybrid fallback local-LLM judge scoring; stopped after >6 minutes. Full
  12-question fresh A/B + regression is NOT complete and must not be claimed. RAG repo commit:
  `63073b6`.
- 2026-07-10: RAG B0 DONE - created docs/phase2-search-mcp-comparison.md from live official
  source checks for Tavily, Exa, Brave Search, and Perplexity. Recommendation: Exa MCP first
  because the official MCP page advertises no-API-key remote setup and the pricing page lists
  up to 20,000 free requests/month; Tavily is backup; Brave is raw-search fallback; Perplexity
  is better reserved for synthesized/citation-heavy checks. No MCP configured, no API key
  entered, no spend. Next Track B step requires explicit Exa setup approval.
- 2026-07-10: RAG A2 DONE - in /Users/hsiangkuochang/rag-quality-lab-portfolio, pinned
  Python 3.11.15 via .python-version, generated requirements-lock-py311.txt from the
  previously working project venv, documented the fresh-install and disk-light local paths in
  docs/A2_ENVIRONMENT.md, and ran a headless Streamlit smoke test with the clean-copy app code.
  Streamlit served http://127.0.0.1:8521 and `curl -I` returned HTTP/1.1 200 OK. Temporary
  server stopped; working copy clean at commit `ae01030`. Next: B0 report-only search-MCP
  comparison, then A3 verification if local model availability permits.
- 2026-07-10: RAG A1 DONE - created clean working copy
  /Users/hsiangkuochang/rag-quality-lab-portfolio from read-only source
  /Users/hsiangkuochang/rag-quality-lab. Excluded venv/runtime caches, node_modules symlink,
  Chroma/vector stores, duplicate Code/ snapshot, generated outputs/benchmark artifacts,
  regression runtime stores, and the 191 MB data/large_knowledge_base.json. Initialized git on
  main and committed clean-copy checkpoint `20fc53d`, followed by cleanup checkpoint `78d8148`
  to ignore/remove generated regression stores. Verified working copy clean, 2.4 MB, no files
  >=100 MB, and no targeted credential-pattern matches. Source folder untouched. Next: A2.
- 2026-07-10: P1 REPO MADE PUBLIC: after explicit human approval ("公开repo"), changed
  `LucisZhang/p1-reliability-lab` visibility from PRIVATE to PUBLIC via GitHub CLI and
  verified GitHub reports `visibility=PUBLIC`, `isPrivate=false`. This enables remote Linux
  machines to clone by HTTPS without configuring personal GitHub credentials. Updated the
  remote-Linux reproduction guide to reflect the public status.
- 2026-07-10: RAG GATE 2b APPROVED BY HUMAN: recorded the seven decisions from
  docs/phase2-plan-rag-quality-lab.md §9. Approved Track A baseline packaging and Track B
  research, with C blocked until GATE 2c. Search MCP work is limited to provider/free-tier
  comparison until exact configuration/key/spend approval. Current data provenance is marked
  human-confirmed but exact source/license text still needs to be captured before any real sample
  publication. No RAG source folder changes yet; A1 is the next task.
- 2026-07-10: P1 REMOTE-LINUX GUIDE PROMPT REWRITTEN: updated
  docs/p1-workstation-reproduction-guide.md so the Codex CLI prompt no longer talks about
  machine-context framing unrelated to the task. The prompt now gives a concrete remote Linux
  execution checklist, success/failure criteria, and the exact evidence branch/files needed
  for portfolio-site. Added a public-repo strategy section: recommended for CLI-only remote
  clone convenience after public-readiness checks, but GitHub visibility was not changed
  without explicit approval.
- 2026-07-10: RAG SCALE-UP PLAN REGENERATED BY CLAUDE/FABLE5: human clarified that the
  current dataset/model may be too standard/small for a production-facing portfolio and asked
  Fable to consider newer, business-adjacent, larger datasets; stronger models; company
  workstation runs; and whether Claude Code should use a stronger search MCP. Fable5 produced
  a v3 plan that splits work into Track A preserve/package existing evidence, Track B live
  dataset/model research sprint with optional search MCP setup, and Track C workstation-scale
  upgrade gated by a new GATE 2c. Replaced docs/phase2-plan-rag-quality-lab.md accordingly.
  Source folders untouched; still STOPPED at GATE 2b.
- 2026-07-10: RAG GATE 2b PLAN REGENERATED BY CLAUDE/FABLE5 (at human request after the
  prior draft was rejected): large-directory file-edit Claude attempts stalled, then a
  text-only Fable5 generation using a compact verified-evidence brief succeeded. Replaced
  docs/phase2-plan-rag-quality-lab.md with Fable5's fresh plan: positioning as a RAG
  evaluation lab, preserve/exclude policy, explicit 191 MB large-KB handling, verification
  and claims discipline, U1-U7 tasks, and six GATE 2b decisions. Source folders untouched;
  still STOPPED at GATE 2b.
- 2026-07-09: ORCHESTRATOR RUNBOOK VALIDATION PASS (second): confirmed working tree clean on
  main at commit 1416743, all STATE-referenced artifacts present on disk, and recorded
  position (STOPPED at GATE 2b, RAG Quality Lab) consistent with
  docs/phase2-plan-rag-quality-lab.md (5 decision questions match). Only drift found: the
  "recent commits" section below was stale (still Phase 0/1 era); refreshed it. No source
  project folders were opened or modified.
- 2026-07-09: RAG PLAN VALIDATED + AMENDED (orchestrator pass, read-only on source): every
  cited metric independently re-verified against local artifacts — KB 498,725 records / 500
  eval questions (counted via node), A/B five-metric means 0.8093 / 0.9438 from the 20260419
  summary JSONs (+16.6% lift; B retrieval recall/hit 1.0), regression 4 degraded / 0
  improved / 8 stable with faithfulness 0.9875 -> 0.8667, 50K indexing benchmark 56,039
  vectors / 691.17s / 13.82s-per-1K, latency means 29.15ms (A) / 134.15ms (B), venv is
  python3.11, models gemma4:e4b + nomic-embed-text confirmed in src/utils.py and README.
  Found and fixed a plan blocker: data/large_knowledge_base.json is 191 MB — over GitHub's
  100 MB per-file hard limit — so U1/U2/U7 were amended (gitignore + committed dataset
  manifest, CI-aware verifier, pre-push size check; no LFS by default) and GATE 2b question
  5 added for the large-file policy. Copy exclusions extended: node_modules symlink into a
  Codex runtime cache, internal Code/ duplicate snapshot, outputs/, benchmark_artifacts/
  kb_subsets. Runbook position confirmed correct: STOPPED at GATE 2b.
- 2026-07-09: RAG QUALITY LAB PLAN DRAFTED: after p1 local completion was rechecked, read
  docs/RUNBOOK.md and Phase 2 rules, then performed read-only inspection of
  ~/rag-quality-lab and the BIT course archive. Verified core saved metrics from JSON/CSV:
  498,725 large-KB records, 500 large eval queries, 12-question A/B comparison
  0.8093 -> 0.9438, regression buckets 4 degraded / 0 improved / 8 stable, 50K-doc indexing
  benchmark and latency benchmark. Wrote docs/phase2-plan-rag-quality-lab.md and STOPPED at
  GATE 2b.
- 2026-07-09: p1 LOCAL PART RECHECKED COMPLETE: restored p1 lightweight Python venv after
  prior cleanup and ran `make local-verify` with no Docker. Result: pytest 14 passed / 1
  skipped, ruff clean, black clean, mypy clean, Maven verify completed, dashboard sync/build
  completed. Only generated_at changed in dashboard/public/results/index.json; reverted it.
  p1 working tree clean and aligned with origin/main.
- 2026-07-09: LOCAL CLEANUP + P1 REMOTE SYNC DONE: reclaimed local disk from ~4.6 GiB free
  to ~55 GiB free by deleting recreatable package/runtime caches, old installer downloads,
  duplicated Downloads/P1 checkout, zipped-export duplicate unpacked folders, Docker Desktop
  VM data, and development caches. Personal-looking large files such as screen recordings
  and raw datasets were left in place. Pushed p1 commit `05738dd` to GitHub `origin/main`.
  Added a Codex CLI execution prompt to docs/p1-workstation-reproduction-guide.md so the
  full remote run can be delegated as a fixed, evidence-preserving workflow.
- 2026-07-09: p1 LOCAL-MAC MITIGATION DONE after U6 ENOSPC: deleted p1-generated,
  recreatable local caches/build outputs (~760 MB: .venv, .m2, dashboard/node_modules,
  dashboard/dist, flink-jobs/target, pytest/mypy/ruff caches). Docker daemon still did not
  respond, so p1 stack teardown remains pending after broader disk/Docker recovery. Updated
  p1 repo to make laptop mode explicit: `make local-verify` for no-Docker verification,
  `make preflight-heavy` guarding heavy Docker targets with disk/Docker checks, README/RUNBOOK/
  AGENTS/version-matrix documenting local-lite vs workstation reproduction. Added
  docs/p1-workstation-reproduction-guide.md with step-by-step remote-Linux full-run,
  evidence bundle, return/import, and failure-recording checklist.
- 2026-07-09: p1 U6 CLOSED as BLOCKED/PARTIAL (human decision, option 2 - no retry, no
  extra deletions): attempt 1 reproduced 4/5 failure classes with snapshot_diff=0
  (task-crash, checkpoint-restore, savepoint-restore, sink-commit-fault); jobmanager-restart
  failed (chk-3 FileNotFound - either the RUNBOOK-documented retention race or ENOSPC side
  effect, indistinguishable). Attempt 2 halted when host disk hit 100% (462 MiB free);
  killed by targeted PID during reset phase, touched NO tracked files (p1 tree clean).
  Docker daemon unresponsive under ENOSPC -> stack teardown PENDING (operator).
  Evidence preserved: docs/p1-u6-attempts/ (RECORD.md + attempt1 JSON/log + attempt2 log +
  cap timestamps). Consequence for site: MUST NOT claim "reproduced on demand"; May 2026
  committed artifacts (provenance re-verified) remain the evidence. p1 plan CLOSED:
  U1-U5 complete, U6 blocked/partial.
- 2026-07-09: p1 U5 DONE - case-study inputs exported verbatim (exact-path copies, no globs;
  sha256 spot-check matched) to public/case-studies/p1-reliability-lab/: 5 results JSON +
  dashboard manifest index.json under results/, 2 run-captured SVGs + dashboard screenshot
  under media/, RUNBOOK.md as runbook-incidents.md, plus provenance README (source repo,
  commit 47b4268, export date, per-file description). Ready for Phase 3 PipelineGraph /
  DataExplorer / CaseStudyBlock. Next: U6 heavy reproduction (3h cap; all Docker images
  already in local cache).
- 2026-07-09: p1 U4 DONE - README overhauled for external readers (commit 6bd25d7): verified-
  claims table sourced from gated claims doc + committed artifacts, evidence-contract section,
  dashboard slice, quickstart, CI badge, honest "StarRocks/M3 not started" scope note; zero
  invented claims. CI note: run for 6bd25d7 first FAILED with "job not acquired by hosted
  runner" (GitHub capacity, both jobs cancelled at 15m, never started) - diagnosed, re-ran
  same run, SUCCESS. PR #2 (phase2-packaging -> main) MERGED 08:47Z via merge commit; branch
  kept (no deletion). Next: U5 export commit (files already staged), then U6.
- 2026-07-09: p1 U3 DONE - .github/workflows/ci.yml added on phase2-packaging (commit
  8ce70d2, pushed): light paths only (ruff/black/mypy + Maven verify via make lint,
  harness pytest via make test, dashboard build incl. results-contract validation);
  heavy Docker integration explicitly excluded. FIRST-EVER GitHub Actions run on this
  repo (id 29003846677) SUCCESS: lint-test 93s, dashboard 14s. "CI-verified" is now an
  externally auditable claim. Next: U4 README commit -> CI green -> PR -> merge.
- 2026-07-09: p1 U2 DONE (no-Docker verification pass, all PASS): `make test` 14 passed /
  1 skipped (Docker-gated CDC test); `make lint` ruff+black+mypy clean (17 files) and Maven
  verify exit 0 (shaded cdc-to-iceberg.jar built; local JDK 25 targeting release 11 worked);
  dashboard: sync validated 5/5 artifacts vs contract, npm ci (11 pkgs) + vite build OK,
  served on 127.0.0.1:4317 - manifest lists 5 artifacts with run_id/git_sha provenance
  (each git_sha maps to a real commit), all JSONs HTTP 200; preview stopped via targeted
  port PID. Network stalls (pip, Maven central) resolved with aliyun mirror FLAGS only
  (scratchpad settings.xml via -s; no config edits). p1 repo files untouched (only
  gitignored .venv/.m2/node_modules/dist/target created). Next: U3 CI.
- 2026-07-09: p1 U1 DONE - cloned LucisZhang/p1-reliability-lab to ~/p1-reliability-lab
  (HEAD 47b4268), created branch phase2-packaging; set repo description (approved text
  verbatim) + topics (apache-iceberg, cdc, data-engineering, exactly-once, flink,
  reliability) via gh repo edit (additive only). Next: U2 no-Docker verification pass.
- 2026-07-09: Phase 2 task 2 drafted - p1-reliability-lab upgrade plan
  (docs/phase2-plan-p1-reliability-lab.md) from Phase 0 inventory + fresh read-only gh
  re-inspection (tree, README, RUNBOOK, Makefile, claims doc, results JSON, commits, runs).
  Verified: eo_reconciliation.json run 20260527T151754Z-ef73a5a5 matches claims doc, git_sha
  matches repo commit b2434d1, 5/5 failure classes snapshot_diff=0, summary.passed=true.
  Gaps: stale 782-byte README, NO CI ever (no workflows), empty description, dashboard never
  built, heavy-run reproducibility on 16GB unverified. Plan = packaging/verifiability (5 tasks
  <=1 day + optional time-boxed heavy reproduction as gate decision). p1 repo NOT modified.
  STOPPED at GATE 2b (p1-reliability-lab).
- 2026-07-09: GATE 2b (release_guardian) resolved by human: DEFERRED / not approved now
  (project judged not fully done; revisit later). No upgrade work was executed. Plan doc
  retained as historical draft. Pipeline moves to shortlist #2, p1-reliability-lab
  (read-only inspection + plan draft only).
- 2026-07-09: Phase 2 task 1 drafted - release_guardian upgrade plan
  (docs/phase2-plan-release-guardian.md) from Phase 0 inventory + read-only re-inspection:
  confirmed local-git-only (no remote -> CI never ran on GitHub), full docs set, offline
  deterministic demo/eval. Plan = packaging/verifiability only (4 tasks, <=1 day, menu items
  4/5), no new features, nothing destructive, nothing [NEEDS-GPU]. STOPPED at GATE 2b.
- 2026-07-09: PHASE 1 COMPLETE - dependency blocker root-caused (VPN fake-IP tunnel to
  registry.npmjs.org stalling 30-92s/fetch; NOT a broken env) and resolved via
  `--registry=https://registry.npmmirror.com` flag-only install (569 packages, 4m, exit 0;
  node_modules 703MB + package-lock.json). Quality gates ALL PASS: `tsc --noEmit` clean;
  `eslint` clean (fixed 1 real error: src/lib/i18n.ts locale detection rewritten from
  setState-in-effect to useSyncExternalStore, SSR-safe); `next build` OK (12/12 pages SSG);
  local prod server route smoke test all 200/404-correct; Lighthouse homepage perf 91 (gate
  >=90), a11y 96, best-practices 100, SEO 100. Evidence: docs/phase1-verification.md.
  Vercel preview deferred per operator instruction (no public URLs); preview server stopped.
- 2026-07-09: Phase 1 scaffold implemented after GATE 2a approval: Next.js App Router routes `/`, `/[track]`, `/[track]/[project]`; typed project registry for the approved top-5; local EN/ZH i18n with visible switcher; normal nav plus visible Cmd/Ctrl+K command palette; shared Phase 1 components `PipelineGraph`, `DataExplorer`, `TraceViewer`, `CaseStudyBlock`, `CommandPalette`, `LanguageSwitcher`; homepage one-pipeline narrative and top-5 summary. No WebGL/Three.js/WebGPU. `AGENTS.md` created during an interrupted Claude pass was removed and not included.
- 2026-07-09: Phase 1 dependency install blocker recorded: prior `npm install` attempt produced no `node_modules` and no `package-lock.json`; per operator constraint it was not retried. Therefore `typecheck`, `lint`, `next build`, Lighthouse, and Vercel preview are blocked until dependencies are installed/restored.
- 2026-07-09: GATE 2a APPROVED by human: top-5 shortlist exactly as recommended; defaults applied for ex-solver/career-ops/Other/row 6-7 metrics; entered Phase 1.
- 2026-07-09: PHASE 0 FINALIZED - release_guardian EVAL.md verified (132 CI-gated runs, all
  thresholds passed); NLP reports skimmed (tutorial-grade -> drop); exam-prep confirmed out of
  scope (study vault). INVENTORY.md v1.0: every project has completeness/differentiation/
  recommendation; top-5 shortlist (release_guardian, p1-reliability-lab, RAG Quality Lab,
  Privacy Preflight, analytics pair) + explicit GATE 2a question list. STOPPED at GATE 2a.
- 2026-07-09: Phase 0 deep reads (read-only) - p1-reliability-lab via gh (CDC->Flink->Iceberg
  lab; gated auditable claims incl. verified exactly-once reconciliation across 5 failure
  classes -> flagship DE candidate); Privacy Preflight README (local-first redaction product
  -> feature candidate); rag-quality-lab README (A/B 0.809->0.944 +16.7% from saved artifacts);
  career-ops fork boundary RESOLVED (Santiago's OSS, own work = 14 commits/+25.6K lines
  Workday subsystem -> default archive-only); ex-solver README (exam/interview answering
  service -> ethics-sensitive, default keep-private). INVENTORY.md rows 2-5, 17 updated.
- 2026-07-09: Phase 0 GitHub reconciliation (read-only gh) - all 7 LucisZhang repos verified
  and matched; profile repo LucisZhang/LucisZhang does NOT exist; my_viewer = LibreTV clone
  (never feature); p1-reliability-lab = original CDC->Flink->Iceberg DE project (GitHub-only,
  deep-read pending); ex-solver local ahead of remote; HF Space + Tableau artifacts reachable
  (metrics still unverified). INVENTORY.md reconciliation + cleanup sections completed.
- 2026-07-09: Phase 0 checkpoint - located all 19 source folders (4 path-name corrections),
  structural scan of every folder, deep-read ~10 projects via KB digests/READMEs/git logs,
  identified 3 duplicate clusters (career-ops x4, rag-quality-lab x2, Self-done x2-projects),
  partial local<->GitHub reconciliation; wrote INVENTORY.md v0.1 with explicit TODOs.

## Key decisions
- Stack: Next.js + TS + Tailwind + MDX; interactive libs listed in package.json include @xyflow/react, @duckdb/duckdb-wasm, recharts, cmdk. shadcn/ui setup is deferred until dependency installation is healthy.
- Site tracks: analytics, engineering, ai.
- No WebGL/Three.js/WebGPU.
- career-ops-job-scanner is a git worktree of career-ops -> treat the 4 career-ops folders as ONE project.
- Canonical RAG Quality Lab = ~/rag-quality-lab (BIT course folder = report/video artifacts).

## Artifacts produced (paths)
- /Users/hsiangkuochang/release-guardian-portfolio (W1 working copy, PRIVATE, NO REMOTE:
  clone of the verified bundle at HEAD ca2ef58, 27 commits, fsck-clean; ~/release_guardian
  HEAD 9c338c5 verified fast-forward ancestor; never push, never add a remote without a new
  company/legal-gated approval)
- /Users/hsiangkuochang/Documents/Codex/2026-07-09/computer-use-claude-artifacts-download-follow/release_guardian-company-handoff-20260711
  (VERIFIED release_guardian handoff, PRIVATE: source/ = full-history clone at ca2ef58;
  release-guardian-portfolio-materials-ca2ef58/ = README/ARCHITECTURE/DECISIONS/EVAL/
  INTERVIEW_DEFENSE/MIGRATION_PROGRESS/PORTFOLIO_GUIDE + 3 UI screenshots + 4 eval reports +
  cost report; SHA256SUMS; specs-20260711-193833.txt contains internal host metadata — redact
  before any external use; originals in ~/Downloads: release-guardian-source-ca2ef58.bundle +
  release-guardian-portfolio-materials-ca2ef58.tar.gz)
- /Users/hsiangkuochang/rag-quality-lab-portfolio (RAG Track A working copy; git commits
  `20fc53d`, `78d8148`, `ae01030`, `63073b6`, `0074d96` A4, `17694cd` A5, `7b86ef8` A6
  tests+CI; A1 copy notes at docs/A1_COPY_NOTES.md, A2 env notes at docs/A2_ENVIRONMENT.md,
  A3 evidence at evidence/verified-2026-07/, tests/ + .github/workflows/ci.yml from A6;
  pushed A7 to PRIVATE https://github.com/LucisZhang/rag-quality-lab-portfolio, CI green)
- docs/rag-track-c-replan-c2c3.md (ACTIVE DRAFT — Track C re-plan after the Ollama driver blocker; GATE C2-replan questions §6; drafted 2026-07-12)
- docs/rag-track-c-remote-guide.md (Track C C0/C1 workstation execution guide; smoke scope S1 confluence+jira; STOP list; written 2026-07-11; C2-sketch superseded by the re-plan doc)
- docs/phase2-dataset-model-research.md (Track B memo; §5.1 ledger addendum 2026-07-11: HF-card MIT confirmed, pricing verified, Exa keyless works)
- docs/phase2-search-mcp-comparison.md (RAG Track B0 report-only MCP provider comparison; 2026-07-11 addendum with official-README corroboration)
- docs/phase2-rag-orchestrator-audit.md (Fable5 audit verdicts on A1/A2/A3/B0 + exact gate questions Q1-Q4)
- docs/phase2-plan-rag-quality-lab.md (GATE 2b decision document — ACTIVE, regenerated by Fable 2026-07-10)
- docs/p1-workstation-reproduction-guide.md (remote-Linux full reproduction and evidence return checklist)
- docs/p1-u6-attempts/ (U6 attempt record + preserved evidence: RECORD.md, attempt1 JSON+log, attempt2 log, cap-start)
- public/case-studies/p1-reliability-lab/ (U5 export: 5 results JSON + manifest, 2 SVGs + dashboard jpg, runbook-incidents.md, provenance README)
- docs/phase2-plan-p1-reliability-lab.md (CLOSED — U1-U5 done, U6 local blocked/partial; workstation path documented)
- docs/release-guardian-claims.md (W2 claims-and-evidence matrix — the ONLY source Phase 3
  MDX may quote for release_guardian; includes DO-NOT-CLAIM list + artifact sha256 anchors)
- docs/portfolio-direction-freeze.md (final v1 cutline, lane stop conditions, proof map,
  Codex P0/P1/P2 acceptance criteria, cuts, and remaining human gates)
- docs/phase2-plan-release-guardian-v2.md (APPROVED at GATE 2b 2026-07-12 - W1-W4 complete, W5 declined)
- docs/phase2-plan-release-guardian.md (HISTORICAL DRAFT — GATE 2b deferred/not approved 2026-07-09; superseded by v2)
- docs/phase1-verification.md (Phase 1 gate evidence: install fix, tsc/eslint/build, Lighthouse 91)
- package-lock.json (mirror-resolved; see note in blockers section)
- INVENTORY.md (v1.0 FINAL - GATE 2a decision document)
- src/lib/projects.ts
- src/lib/i18n.ts
- src/components/PipelineGraph.tsx
- src/components/DataExplorer.tsx
- src/components/TraceViewer.tsx
- src/components/CaseStudyBlock.tsx
- src/components/CommandPalette.tsx
- src/components/LanguageSwitcher.tsx
- src/app/page.tsx
- src/app/[track]/page.tsx
- src/app/[track]/[project]/page.tsx
- src/app/layout.tsx
- src/app/globals.css

## Open [NEEDS-HUMAN-VERIFY] / [NEEDS-GPU] / blockers
- release_guardian AUTHORIZATION GATE RESOLVED (human, 2026-07-12): legal review and ownership
  authorization are complete. No sanitized artifact exists yet. Before any external use,
  record the exact approved scope and license/notice terms, sanitize git identity and
  host/GPU/proxy/path/internal metadata, use a purpose-built W4 export rather than the bundle,
  complete scans and final artifact sign-off, then obtain explicit publication approval.
  Claim discipline remains binding: present strict residuals (30/44) with aggregate gates;
  rationale judge is diagnostic, not a gate; preserve measured/estimated/projected/modeled
  labels and the corrected test/model-default boundaries.
- RAG data licensing: MS MARCO terms were live-verified non-commercial-only (Track B, DATA.md §3
  updated at repo commit f8cef06) -> no corpus republication; data/large_eval_questions.json
  (tracked, real MS MARCO-derived) must be REPLACED with regeneration instructions + checksum
  before any PUBLIC release of the repo (remediation path approved 2026-07-11).
  EnterpriseRAG-Bench is clean: MIT verified on both GitHub LICENSE and HF dataset card.
- RAG 191 MB corpus sha256 not yet recorded: data/MANIFEST.json carries records=498725 with
  sha256=null; first machine holding the file (Track C0 or the human's Mac) runs
  scripts/verify_data.py and records the printed hash.
- RAG A3 fresh LLM-judged re-verification is pending BY DECISION (2026-07-11): runs at Track C0
  workstation intake (or earlier only if the human approves optional capped API judge, audit Q4).
  The Mac-local `gemma4:e4b` judge path is closed — do not retry it.
- SESSION ACCESS (updated 2026-07-11 evening): Exa MCP (`mcp__exa__*`) now WORKS keyless under
  the approved allowlist — B-style live checks are unblocked. RAG working-copy access still
  requires launching with `claude --add-dir /Users/hsiangkuochang/rag-quality-lab-portfolio`
  (this session had it). WebSearch/WebFetch remain NOT approved (Q2 unchanged).
- DEFERRED (not blocking): private Vercel preview deploy - per operator instruction (no public
  URLs), local prod preview + Lighthouse served as the Phase 1 check; do the Vercel preview
  before Phase 3 when the human approves connecting the repo to Vercel.
- NOTE: package-lock.json `resolved` URLs point at registry.npmmirror.com (npmjs was stalling
  through the local VPN tunnel; same tarballs, identical integrity hashes, publicly reachable).
  Optionally normalize to registry.npmjs.org URLs later on a healthy network.
- E-commerce RFM metrics (437K logs, 77.6% drop-off, 30K VIP@$2,559) - Tableau viz REACHABLE (HTTP 200);
  numbers inside dashboard not yet matched against claims.
- Credit-risk/fraud metrics (285K txns, 1:578 imbalance, 0.96 ROC-AUC) - HF Space REACHABLE (public,
  sleeping, wakes on visit); numbers not yet matched against Space output / repo code.
- p1-reliability-lab heavy-stack re-run feasibility on 16 GB laptop - only if upgrades need live runs.

## recent commits (as of 2026-07-11 audit; the state commit follows this update)
5171223 phase2(rag): orchestrator audit - keep A1/A2/B0, reroute A3 judged rerun to workstation
9c43022 state: record RAG A3 local verifier blocker
57b225d phase2(rag): compare search MCP options
58a43f3 state: record RAG A2 environment smoke test
54d75aa state: record RAG A1 clean copy
458abd3 docs: record public p1 repo visibility
1250561 state: record RAG gate 2b approval
fb4f6d4 docs: rewrite p1 remote linux reproduction prompt

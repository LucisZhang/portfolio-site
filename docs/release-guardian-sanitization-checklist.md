# Release Guardian - sanitization-preparation checklist (W4)

Status: **PREPARATION COMPLETE; LEGAL/OWNERSHIP GATE CLEARED; NO EXPORT CREATED.**

Prepared: 2026-07-12 from a read-only review of the private working copy at source commit
`ca2ef58` and the verified handoff. This document contains inventory and procedure only. It
does not itself grant publication rights and is not evidence that any artifact is sanitized.
Authorization update: on 2026-07-12 the human confirmed that legal review and ownership
authorization are complete. Formal identifiers, exact asset scope, license/notice terms, and
the final artifact hash are not stored here and must be recorded privately before publication.

## 0. Hard gate and non-goals

- [x] Legal review and company/repository-owner authorization: **HUMAN-CONFIRMED COMPLETE,
  2026-07-12**.
- [ ] Record the approval identifiers, approvers, date, allowed files/claims, audience,
  license, and expiration or revocation terms in a private release record.
- [ ] Obtain a separate explicit human approval immediately before creating any remote or
  publishing, even after the company/legal gate has passed.
- [x] W4 does **not** create a sanitized export, edit the private source, rewrite history,
  copy raw evidence into portfolio-site, or run a publication command.
- [x] W5 remains declined: no PostgreSQL/pgvector install and no reproduction claim on this Mac.

The authorization gate is cleared, but no raw artifact may enter staging until the private
release record defines its approved scope and license/notice terms. Until then, Phase 3 uses
the claims matrix in this local no-remote repository.

## 1. Current inventory and default disposition

Paths below are relative to the private working copy unless prefixed `handoff/`.

| Surface | Exact paths or patterns | Default disposition | Required review/action |
|---|---|---|---|
| Git identity and history | `.git/**`; `handoff/source/.git/**`; bundles, refs, reflogs, hooks, objects, commit messages, author/committer names and emails | **EXCLUDE** | Never copy the repository directory or publish the bundle. Build an allowlisted tree with no VCS metadata. If an approved public repo is later needed, initialize a new history only after identity and authorship review. |
| Original handoff payloads | original source bundle and materials archive in Downloads; `handoff/SHA256SUMS`; `handoff/source/**`; `handoff/release-guardian-portfolio-materials-*/**` | **EXCLUDE** | W1 verified the originals, but the extracted handoff manifest references archives outside the extracted directory and must not be reused as an export manifest. Generate a new manifest from the final approved export. |
| Workstation specifications | `handoff/specs-20260711-193833.txt` | **EXCLUDE** | Contains host/system/environment details. A public capability summary, if approved, must be newly written and generalized. |
| Machine automation | `handoff/automation/**` | **EXCLUDE** | Contains machine-specific schedules, paths, URLs, and execution details. Do not adapt it into the export. |
| Agent/session artifacts | `.scratch/**`; `.claude/**`; `.codex-zhangxiangguo/**`; `AGENTS.md`; `claude.md`; `Release_Guardian_Fable5_Build_Prompt.md` | **EXCLUDE by default** | These expose prompts, transcripts/logs, tool configuration, personal namespaces, and build workflow. Include only files explicitly named in the recorded approved scope. |
| Runtime secrets and state | `.env*`; API keys/tokens; provider headers; database dumps; telemetry/logs; `.rg-local/**`; model caches/weights; vLLM/conda/uv environments; tmux state | **EXCLUDE** | Only an independently reviewed placeholder-only `.env.example` may be created after approval. Confirm all examples are synthetic and unmistakably marked. |
| Host and infrastructure narrative | `MIGRATION_PROGRESS.md`; README setup sections; DECISIONS D-4/D-26/D-27; scripts; Makefile; Docker/CI/service config | **REWRITE or EXCLUDE** | Remove/generalize host, GPU/CUDA/driver, proxy, shared-filesystem, absolute-path, internal-port/URL, cluster, local-user, cache, and workstation assumptions. Preserve no exact private value merely because it is not a secret. |
| Core source docs | `README.md`; `ARCHITECTURE.md`; `DECISIONS.md`; `EVAL.md`; `INTERVIEW_DEFENSE.md` | **REWRITE from allowlisted claims** | Resolve or avoid every W3 finding. Do not copy stale Ollama/default-model/test-count/cost language. Use the claims matrix as the only source of public prose. |
| Raw evaluation outputs | `eval/results/*.json`; archive-only `eval/reports/*.json`; traces, node outputs, prompts, judge responses, errors, run IDs | **EXCLUDE by default** | Include only if the recorded approval scope explicitly covers scenario content and model outputs. Prefer a newly generated aggregate-only table with provenance and mode labels over raw JSON. |
| Cost evidence | `eval/results/cost_report.json` and generated tables | **CONDITIONAL** | If approved, expose only reviewed aggregate values. Preserve the 2026-07-08 pre-migration date and measured/estimated/projected/modeled labels; never expose request payloads or imply current prices. |
| Synthetic world and scenarios | `mockworld/data/**`; runbooks; codebase fixtures; OpenAPI/schema/query indices; incidents; CI history; scenario labels and adversarial inputs | **EXCLUDE by default** | "Synthetic" does not establish ownership or publication rights. Document independent provenance and obtain specific approval before any sample or derived screenshot is used. |
| Product screenshots | `docs/screenshots/change-view.png`; `trace-view.png`; `eval-view.png` and archive copies | **EXCLUDE by default** | Require separate visual/IP approval, metadata stripping, OCR, pixel-level manual review, and comparison of the sanitized copy with the original. Never edit or publish the private originals. |
| Application source | `agent/**`; `services/**`; `frontend/**`; `seed/**`; scripts; workflow and config files | **CONDITIONAL on recorded scope/license** | No LICENSE file exists in the private repo. Apply the completed legal/ownership determination by recording the approved source scope, public license, notices, attribution, and generated/copied-material treatment before staging. |
| Generated/build files | `node_modules/**`; `.next/**`; `.venv/**`; `__pycache__/**`; `.pytest_cache/**`; compiled objects; coverage; DB files; logs; archives; symlinks to runtime environments | **EXCLUDE** | Verify absence from the staging tree and from the final archive, including hidden files and symlink targets. |
| Dependency metadata | `frontend/package-lock.json`; Python dependency metadata; Go module files; Maven POM | **CONDITIONAL** | Generate an SBOM and dependency-license report. Legal review of project ownership remains separate from dependency-license compliance. |

Notable current-state observations:

- The private working copy is clean and has no remote.
- The inspected clean clone contains no ignored runtime environment or database state, but
  this is not secret clearance and does not replace full-history scanning.
- One author identity tuple exists in the 27-commit history; the value remains private.
- No LICENSE, COPYING, NOTICE, AUTHORS, or equivalent publication grant was found.
- Basic credential-prefix scanning found no confirmed credential, but broad matches exist in
  tests/config/prompts and require a real scanner plus manual triage. Gitleaks/TruffleHog were
  not installed or run during W4.

## 2. Screenshot review checklist

For each separately approved staged copy, never the private original:

- [ ] Remove EXIF, text chunks, comments, color-profile comments, timestamps, and editor data;
  record the tool/version and before/after hashes privately.
- [ ] Run metadata/chunk inspection (for example ExifTool plus a PNG structure checker).
- [ ] Run OCR, then inspect every recognized and unrecognized region at 100% zoom.
- [ ] Check visible user names, host names, URLs, ports, paths, browser chrome, tabs,
  notifications, clocks/time zones, run/evidence/trace IDs, service/schema names, scenario and
  adversarial text, model/provider names, cost, token, latency, and evaluation results.
- [ ] Check terminal panels, hover states, hidden/cropped edges, transparency, thumbnails, and
  embedded previews; cropping is not a substitute for redaction review.
- [ ] Verify that every metric shown complies with the W2/W3 claim rules, including mode,
  date, strict residual, cost label, and test chronology.
- [ ] Visually compare the final staged image with the approved redaction specification.
- [ ] Obtain named product/IP, privacy/security, repository-owner/company, and legal sign-off
  for the exact final image hash.

## 3. Evaluation, prompt, and scenario review

- [ ] Treat prompts, system messages, tool schemas, model outputs, traces, judge rationales,
  error text, and evaluation notes as content requiring ownership and confidentiality review.
- [ ] Review scenario payloads, labels, expected resources, rollback elements, adversarial
  instructions, mock code, incidents, runbooks, schemas, and service names for company-derived
  concepts or recognizable internal structure.
- [ ] Do not publish row-level or trial-level raw reports by default. Create a new aggregate
  artifact only from explicitly approved fields.
- [ ] Recompute every aggregate in the staging process and reconcile it with the private raw
  report; retain the reconciliation log privately.
- [ ] For any approved metrics, state mode and date and pair all eight funded-live aggregate
  gates with the 30/44 strict residual; label the 15/44 residual as deterministic stub only.
- [ ] Keep the rationale judge non-gating, the pre-L comparison operational rather than
  causal, and the credit-exhausted run out of final claims.
- [ ] Keep stub dollar values labeled proxy accounting, not spend. Preserve cost-report labels
  and do not describe the modeled ReAct comparator as measured.
- [ ] State the test chronology as 99 full-suite tests before Phase L plus 19 focused Phase-L
  tests unless a separately verified post-L full-suite artifact is later produced.
- [ ] State Terra/Qwen as the verified workstation selection, not tracked code defaults, unless
  a separately approved source fix changes and tests those defaults.

## 4. Allowlist-only export procedure (run only after Gate 0 approval)

1. [ ] Freeze the exact private source commit and approval scope; record hashes in a private
   release record.
2. [ ] Create a new empty staging directory outside the private repository, with no remote and
   no inherited `.git` directory. Do not use a broad recursive copy of the repo.
3. [ ] Write a file-level allowlist from the approved scope. Copy only allowlisted files into
   staging, one category at a time; record source hash, staged hash, reviewer, and disposition.
4. [ ] Rewrite approved docs from the claims matrix and W3 dispositions. Do not sanitize by
   search-and-replace over the private originals.
5. [ ] Add only the license, notices, attributions, and authorship statement approved by legal
   and the repository owner/company.
6. [ ] Generate a fresh SBOM and dependency-license report for the staged dependency set.
7. [ ] Run the automated and manual scans in §5 against both the private full history and the
   staged tree. Store reports privately; never include scan logs containing matched values.
8. [ ] Run the staged validation suite appropriate to the allowed surface. If a runnable source
   export is approved, include Python, Go, Maven, frontend, mockworld, and deterministic eval
   validation in an isolated environment with synthetic credentials only.
9. [ ] Generate a new sorted file manifest and cryptographic hashes from staging. Reject
   unexpected files, hidden files, symlinks, sockets, FIFOs, devices, nested archives, and VCS
   metadata.
10. [ ] Package into a new archive, extract it into a second empty directory, verify every
    manifest entry, then repeat secret/path/identity/license/malware/archive checks on the
    extracted result.
11. [ ] Obtain final engineering, privacy/security, owner/company, and legal sign-off on the
    exact archive hash and the exact claim/screenshot list.
12. [ ] Stop. A remote, push, upload, portfolio integration, or publication still requires a
    separate explicit human approval for the signed-off hash.

## 5. Required scans and manual review

Pin tool versions and command syntax in the private release record when export is authorized.
At minimum:

- [ ] **History/identity:** enumerate every revision, ref, object path, author/committer field,
  email, commit message, tag, and historical occurrence of excluded files. Do not scan HEAD only.
- [ ] **Secrets:** run a current Gitleaks history scan and staged-directory scan, plus a second
  independent detector such as TruffleHog in verified-only mode. Triage every finding without
  copying matched values into public logs.
- [ ] **Text metadata:** recursively scan hidden and normal files for absolute paths, home/user
  names, emails, hostnames, IPs, URLs, proxy variables, infrastructure terms, environment
  variables, credentials, tokens, database strings, provider headers, and internal namespaces.
- [ ] **Binary metadata:** inspect image metadata/chunks, OCR/screenshots, archive members,
  executable strings where applicable, office/PDF metadata, and source maps.
- [ ] **Filesystem safety:** reject symlinks, hard-link surprises, sockets, FIFOs, devices,
  path traversal, duplicate archive paths, case-collision paths, executable files not on the
  allowlist, and files outside expected size limits.
- [ ] **Licensing/provenance:** run SBOM and dependency-license tooling; manually review copied
  snippets, generated code, templates, prompts, fixtures, model assets, screenshots, and docs.
- [ ] **Malware/supply chain:** scan the archive and extracted tree; verify dependency lockfiles
  and all fetched build inputs under the approved build procedure.
- [ ] **Claims:** diff every staged claim against `docs/release-guardian-claims.md`; reject any
  metric or statement lacking its required mode/date/evidence label/caveat.
- [ ] **Human review:** two-person review of the complete staged diff and file manifest, with at
  least one reviewer independent of the export author.

Suggested pattern classes for the text scan (never an exhaustive secret scanner):

```text
absolute paths: /Users/, /home/, /tmp/, drive-letter paths, UNC paths
identity: author/committer fields, email addresses, user and personal namespaces
infrastructure: host, GPU, CUDA, driver, proxy, cluster, shared filesystem, internal URL/IP
credentials: private-key headers, API-key/token/password/secret assignments, auth headers
runtime: .env, databases, logs, traces, caches, model weights, virtual environments
```

## 6. W4 completion and remaining gates

- [x] Exact private surfaces and default dispositions are inventoried.
- [x] Git identity/history, host/GPU/proxy/path/internal-infrastructure, specs, automation,
  screenshots, raw eval, prompt/scenario IP, source licensing, and generated/runtime surfaces
  are covered.
- [x] An allowlist-only future export procedure and verification gates are defined.
- [x] No raw source, screenshot, eval file, secret, scan output, or private metadata was copied
  into portfolio-site.
- [x] No source edit, history rewrite, remote, push, upload, deployment, or export occurred.
- [x] Written company/repository-owner authorization: **HUMAN-CONFIRMED COMPLETE 2026-07-12**.
- [x] Legal review: **HUMAN-CONFIRMED COMPLETE 2026-07-12**.
- [ ] Private release record with exact scope/identifiers/license terms: **NOT YET RECORDED**.
- [ ] Purpose-built sanitized export: **NOT CREATED (INTENTIONAL HARD STOP)**.
- [x] Portfolio-use governance gate: **CLEARED**.
- [ ] Final sanitized artifact publication: **NOT YET APPROVED OR PERFORMED**.

W4 is complete because its approved scope was preparation only. Release Guardian's Phase 2
work is complete and the legal/ownership gate is cleared. Phase 3 may proceed, while any
artifact export or publication remains gated on the private release record, W4 execution,
final artifact sign-off, and explicit publication approval.

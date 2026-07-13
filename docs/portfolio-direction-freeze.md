# Portfolio direction freeze

Status: **COMPLETE**
Decision source: fresh bounded Claude Code / Fable session
Recorded: 2026-07-12

## Portfolio north star

Ship a five-page portfolio where every claim is backed by an artifact a stranger can inspect,
and every boundary (what was not reproduced, verified, or shipped) is stated on the page itself.
The differentiator is auditable honesty, not feature count: three deep evidence pages (Release
Guardian, p1-reliability-lab, RAG Quality Lab) carry the technical weight; Privacy Preflight and
the analytics tandem provide breadth at low cost. Nothing gets upgraded further once its page
can honestly demonstrate its core claim.

## v1 cutline

| Project | Ship | Reason |
|---|---|---|
| Release Guardian | v1 | Legal/ownership cleared, W1-W4 done; flagship data-engineering story. Only export + approval remain. |
| p1-reliability-lab | v1 | U1-U5 evidence already exported and audited; cheapest deep page in the set. |
| RAG Quality Lab | v1 | C2 independently verified; page can ship on C2 evidence alone, A/B lands if ready. |
| Privacy Preflight | v1 (page + demo media only) | Product is credible; packaging is not required for a case study. App packaging goes to v1.1. |
| Analytics tandem | v1 (one combined page) | Live artifacts already reachable; ships with unverified figures stripped. Verified headline metrics go to v1.1. |

All five pages ship in v1; what stages to v1.1 is the heavy upgrades, not the pages.

## Lane decisions

| Project | Do now | Stop when | Defer / drop | Claim boundary |
|---|---|---|---|---|
| Release Guardian | Export smallest sanitized set through W4 allowlist: architecture diagram, one sanitized consistency-findings/eval table (from the 13 W3 findings), 2-3 redacted screenshots. Queue for human approval. | That asset set passes allowlist and human approval. No W5, no new assets beyond the set. | Drop W5 pgvector reproduction. No additional screenshots or eval exports. | Design and locally verified behavior only. No employer metrics, production-impact numbers, or business outcomes. Everything shown passed the W4 allowlist. |
| p1-reliability-lab | Accept existing audited U1-U5 evidence. Write the reproduction-boundary disclosure and link the remote Linux guide. | Page renders the exported evidence with the boundary note. | Drop any further remote reproduction run for v1. U6 stays closed as blocked/partial. | Results valid in the documented environment; heavy reproduction unverified on this Mac, reproducible via the Linux guide. No "fully reproducible anywhere" claims. |
| RAG Quality Lab | Option (b): C3 deterministic S1 retrieval A/B only (indexing the 11,309-doc S1 set as needed), timeboxed. Draft the page on C2 evidence in parallel so the page never blocks on C3. | One deterministic A/B comparison table with manifest hashes exists, or the timebox expires and the page ships on C2 alone with A/B as a v1.1 addendum. | Defer Lane L2 judged replication to v1.1. Full 500K and paid API judge stay stopped. Public push stays a human gate. | Claims scoped to S1 (11,309 docs, 130 questions), deterministic, judge-free. No answer-quality or LLM-judged claims; no extrapolation to 500K. |
| Privacy Preflight | Record demo media of text/image/destructive-PDF redaction and the red-line tests passing; write build-from-source instructions. | Demo media + page exist. Do not freeze a Phase 2 packaging plan for v1. | Defer signing, notarization, bundled runtime, and hotkeys to v1.1. No new features. | "Local-first privacy tool, runs from source, not notarized or distributed as a signed app." No shipping-product claims. |
| Analytics tandem | One combined case-study page linking the live Tableau dashboard and credit-risk/fraud demo. Strip every `[NEEDS-HUMAN-VERIFY]` figure; keep qualitative descriptions. | Page ships with zero unverified numbers. | Defer metric verification plan and any page split to v1.1. Split only if verified content later justifies two pages. | A number appears only with a human-verified artifact behind it. Until then: live links plus qualitative claims only. |

### RAG rationale

Use option (b). C2 alone proves infrastructure; one deterministic A/B turns the page into a
result that a reviewer can check hash-for-hash at near-zero cost and zero external dependencies.
Lane L2 judged replication reintroduces runtime variance and open-ended debugging for marginal
narrative gain. Option (a) is the fallback if the timebox expires: the page must never wait on C3.

## Phase 3 proof map

- **Release Guardian:** PipelineGraph as primary surface, backed by the sanitized findings table.
  Proves guardrail design, not production outcomes.
- **p1-reliability-lab:** static evidence table from exported U1-U5 artifacts, with the
  reproduction-boundary note adjacent. Proves experiments, not universal reproducibility.
- **RAG Quality Lab:** DataExplorer over the S1 manifest plus the deterministic A/B table. Proves
  the eval harness, not answer quality.
- **Privacy Preflight:** demo media of redaction plus red-line tests. Proves the tool works, not
  that it is distributable.
- **Analytics tandem:** live dashboard/demo links plus a verified-only metrics table (empty is
  acceptable at launch). Proves the artifacts exist, not unverified performance figures.

## Codex execution tiers

### P0 - evidence pages exist (v1 blockers)

1. Release Guardian sanitized export. Acceptance: named asset set passes W4 allowlist checks;
   approval packet is prepared; nothing outside the set is staged.
2. p1-reliability-lab page. Acceptance: all exported U1-U5 evidence renders; every figure traces
   to an exported artifact; boundary disclosure is present; Linux guide is linked.
3. RAG page draft on C2 evidence. Acceptance: page builds citing only Ruff PASS, 66 tests,
   manifest PASS, and deterministic A3; no C3 claim appears before its artifact exists.

### P1 - breadth and the one new result

4. C3 deterministic S1 A/B, one timeboxed run. Acceptance: reproducible A/B table with manifest
   hashes committed privately; expired timebox means ship on C2.
5. Privacy Preflight demo media + page. Acceptance: media shows text, image, and destructive-PDF
   redaction plus red-line tests; page states the not-notarized boundary.
6. Analytics combined page. Acceptance: zero unverified numbers; both live links resolve;
   per-metric verification checklist is recorded privately for v1.1.

### P2 - v1.1 staging (only after P0/P1 pages ship)

7. Analytics metric verification; Lane L2 replication scoping; Privacy packaging scoping;
   site polish and cross-page navigation.

Tiers are scheduling priority only; lanes remain independent and parallel.

## Cuts

- Release Guardian W5 local reproduction: dropped.
- Additional p1 remote runs before v1: dropped.
- RAG 500K corpus, paid API judge, and Lane L2 before v1: stopped/deferred.
- Privacy signing, notarization, bundled runtime, hotkeys, and new features: deferred to v1.1.
- Broad GitHub history cleanup, repo reorganization, CI/deployment infrastructure polish, and
  deployment before all P0/P1 pages exist: deferred.
- Any new feature work in any lane: dropped from v1; Phase 3 is evidence presentation only.

## Human gates still required

- Release Guardian: explicit approval of the final sanitized asset set, with scope and license
  terms recorded privately, before any remote, publication, or public Git history.
- RAG Quality Lab: public sync push remains a human action; this memo does not authorize it.
- Analytics: every figure requires a human-verified artifact before it appears.
- Site publication/deploy of v1 requires explicit human approval.
- Privacy Preflight: any binary distribution requires a separate human decision; v1 is
  source-plus-demo only.

DIRECTION FREEZE COMPLETE

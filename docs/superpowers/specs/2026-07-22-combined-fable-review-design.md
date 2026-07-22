# Combined Fable5 Repository Review Design

**Date:** 2026-07-22  
**Status:** Approved direction, pending written-spec confirmation  
**Budget gate:** Claude monthly spend limit raised by the owner from USD 20 to USD 70

## Decision

Replace the former two-task Fable5 sequence with one English-finalization task per repository.
Within a single `claude-fable-5` invocation, Fable5 performs two explicitly ordered phases:

1. **Senior GitHub user phase:** compare the repository homepage with the accepted shared
   benchmark, identify gaps, and edit the English homepage within the repository-specific
   evidence boundary.
2. **Target recruiter phase:** review the resulting English homepage as a recruiter for AI
   application engineering, data engineering, and data analysis roles; improve 30-second scan,
   technical signal, outcome credibility, and role fit without inventing employment, ownership,
   adoption, production, or business-impact facts.

Both phase verdicts must be recorded independently inside one receipt. The invocation is accepted
only when both phases pass and the returned model identity is exactly `claude-fable-5`.

## Language sequence

The combined Fable5 task finalizes English before Chinese generation:

1. Fable5 completes both English review phases and emits
   `COMBINED_ENGLISH_PASS_ACCEPTED`.
2. Kimi K3 receives only the final accepted English homepage plus the project scope and writes
   `README.zh-CN.md` once.
3. The controller requires exact returned model identity `moonshotai/kimi-k3`.
4. Local deterministic checks and an independent Codex task review validate the language switch,
   structure, numbers, paths, links, status boundaries, licenses, evidence equivalence, and
   protected-file hashes.

There is no automatic Kimi revision round and no post-Kimi Fable5 recruiter review. Fable5 does
not edit Chinese. If local checks find a material factual or bilingual defect, the repository is
blocked for owner review rather than silently published or charged for another Fable5 call.

## RAG Quality Lab transition

RAG Quality Lab already completed its standalone GitHub-user Fable5 pass and initial Kimi Chinese
generation. It receives one combined Fable5 English task under this design so that the recruiter
phase is present in the same final receipt format used by the remaining repositories. If that task
changes English, Kimi regenerates Chinese once from the new final English. If English is unchanged,
the existing byte-bound Kimi output may be retained after the same local equivalence checks.

The failed recruiter-only attempt remains an audit record. It consumed zero model tokens and zero
USD and does not count as a completed review.

## Remaining repositories

Privacy Preflight Web, Streaming Reliability Lab, Margin Control Tower, Credit Policy Lab, and
Release Guardian each receive exactly one combined Fable5 English task, followed by one Kimi
Chinese generation and local bilingual verification.

Repository-specific evidence and publication boundaries remain unchanged. In particular:

- Streaming Reliability Lab compatibility identifiers and historical artifacts remain immutable.
- Release Guardian keeps live and deterministic-stub evidence separate and places the strict
  residual beside aggregate gate claims.
- Privacy, analytics, credit-policy, and RAG claims retain their existing provenance, licensing,
  non-production, and historical-versus-current cutlines.

## Receipt and failure contract

Each combined Fable5 receipt contains:

- exact runtime model identity evidence;
- a `github_user_phase` verdict and gap matrix;
- a separate `recruiter_phase` verdict for the final English text;
- claims-to-evidence mappings;
- exact edited-file boundary and protected-path verification;
- final English SHA-256;
- terminal token `COMBINED_ENGLISH_PASS_ACCEPTED` only when both phases pass.

A quota error, model mismatch, missing evidence, unsupported claim, out-of-contract edit, or either
failed phase blocks that repository. The controller does not switch models or purchase additional
credits automatically.

## Cost control

Six combined Fable5 calls remain, including the RAG transition call. Based on completed local
receipts, the expected remaining Fable5 cost is approximately USD 25–40. The owner's USD 70 monthly
limit provides roughly USD 50 of new headroom relative to the former USD 20 cap. Outer runtime
receipts record the actual cost after every call; work stops before knowingly exceeding the
configured limit.

Kimi K3 usage is billed separately through OpenRouter and does not consume Claude credits.

## Acceptance criteria

- One Fable5 invocation per repository, with two ordered and separately recorded English phases.
- No Fable5 Chinese editing or post-Kimi recruiter call.
- One Kimi Chinese generation per final English version.
- Exact model identities and terminal tokens are verified from runtime metadata.
- Repository-specific test suites, README-pair verification, evidence checks, and protected hashes
  pass before commit or publication.
- Existing PR, merge, remote-rename, and production-deployment gates remain unchanged.

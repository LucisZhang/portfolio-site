# Project state - Privacy Preflight for Mac

Last updated: 2026-07-13
Lane key: `privacy-preflight`
Execution owner: Codex (GPT-5.6 Sol)
Source working copy: `~/Privacy Preflight for Mac`
Status: V1 SOURCE-PLUS-DEMO PAGE PUBLISHED; SCOPED WEB PARITY SLICE COMPLETE ON ISOLATED BRANCH

## Next action on resume

Preserve the completed browser-local text/image/PDF workflow while the portfolio proceeds to the
p1 Failure Replay lane. Broader OCR fixtures, worker offloading, and performance instrumentation
remain future hardening and do not weaken the current bounded claims.

## Acceptance and boundaries

- Demo assets cover all three redaction paths with fictional data only; the manifest records
  source commit and SHA256 hashes.
- Worker tests were rerun: `95 passed`; Swift source build was rerun successfully.
- Build-from-source instructions are recorded for the current source tree.
- Page states: local-first privacy tool, runs from source, not notarized or distributed as a
  signed app.
- Signing, notarization, bundled runtime, hotkeys, binary distribution, and new features are
  v1.1 work behind a separate human decision.

## Evidence anchors

- Source commit: `78f13d5`
- Demo package: `public/case-studies/privacy-preflight/manifest.json`
- Worker verification: `services/worker/.venv/bin/python -m pytest -q` -> `95 passed`
- Swift verification: `cd apps/macos && swift build` -> passed
- Build notes: `docs/privacy-preflight-build-from-source.md`
- Distribution blocker: source dependency audit identifies PyMuPDF AGPL/commercial licensing;
  no binary distribution is included in v1.
- Web checkpoint: deterministic text review, same-origin local OCR, direct/manual image and PDF
  regions, destructive image/PDF export, and fail-closed output verification are implemented
  without content egress. Full e2e is 67 passed / 2 intentional heavy-OCR duplicate skips.

## Lane isolation

This state is independent of every other project. No packaging blocker may delay the v1 page.

# Project state - Privacy Preflight for Mac

Last updated: 2026-07-17
Lane key: `privacy-preflight`
Execution owner: Codex (GPT-5.6 Sol)
Source working copy: `~/Privacy Preflight for Mac`
Status: WEB PARITY REMEDIATED; ARM64 UNNOTARIZED MAC PREVIEW VERIFIED LOCALLY

## Next action on resume

Preserve the exact artifact hashes and unnotarized boundary while the shared project copy is
updated to link the verified preview/source/notices. A clean-Mac quarantine run remains future
hardening and must not be inferred from the local extracted-archive smoke.

## Acceptance and boundaries

- Demo assets cover all three redaction paths with fictional data only; the manifest records the
  source base checkpoint, honest uncommitted-candidate state, and SHA-256 asset identities.
- Worker replacement-backend tests were rerun under the embedded runtime: `95 passed`; the Swift app and compiled Vision helper built successfully.
- Build-from-source instructions are recorded for the current source tree.
- Page state: browser-local workbench plus a standalone Apple-silicon Mac preview. The Mac preview is ad-hoc signed, unnotarized, and requires the documented manual first-open path.
- Developer ID signing, notarization, App Sandbox validation, Intel support, and clean-Mac quarantine verification remain separate future gates.

## Evidence anchors

- Source base commit: `2f9b5a08371d02ba441abbc439faf33ffc72cdac`; the generated source state was a local Goal candidate, uncommitted, so the published asset hashes are authoritative.
- Demo package: `public/case-studies/privacy-preflight/manifest.json`
- Worker verification: `services/worker/.venv/bin/python -m pytest -q` -> `95 passed`
- Swift verification: `cd apps/macos && swift build` -> passed
- Build notes: `docs/privacy-preflight-build-from-source.md`
- Distribution remediation: the preview replaces the former PDF engine with pypdfium2/PDFium,
  pypdf, Pillow, and ReportLab; runtime scans found no former package/module. Companion source,
  dependency lock, CPython license, SPDX runtime SBOM, and notices ship beside the app.
- Web checkpoint: deterministic text review, same-origin local OCR, direct/manual image and PDF
  regions, destructive image/PDF export, and fail-closed output verification are implemented
  without content egress. The latest fixed OCR benchmark runs the complete browser-equivalent
  multi-pass union: 19/19 expected-value hits, 21 detections, 2 false positives, and 90.5%
  precision. This is a synthetic fixture result, not a general OCR claim.

## Lane isolation

This state is independent of every other project. No packaging blocker may delay the v1 page.

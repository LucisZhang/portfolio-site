# Privacy Preflight 0.1.0 build-and-package record

Historical source verification: 2026-07-12 at `78f13d5`
Release-package verification: 2026-07-18
Source: runtime-matching source snapshot distributed beside the app ZIP
Release source identity: source ZIP SHA-256
`4138cd3b61a17b4f7b36a5e104389aa229f5e638c3d3a019ce6aa26171624295`

## Worker

The existing local environment was verified with:

```bash
cd services/worker
.venv/bin/python -m pytest -q
```

Historical source-environment result: `95 passed`, with five non-failing PyMuPDF/SWIG
deprecation warnings. That number predates the general Chinese-mobile regression. The final 0.1.0
source snapshot was rerun with the CPython 3.12.13 interpreter and application dependencies
extracted from the exact app ZIP: `96 passed`, with the separately supplied pytest 8.4.2 frontend
used only as test harness. The packaged runtime does not include PyMuPDF/fitz or pytest; the
machine-readable result and artifact fingerprints are in
`public/case-studies/privacy-preflight/worker-tests-goal-candidate.json`.

For a clean local setup, follow the source README and create the worker environment before
starting the local-only service:

```bash
cd services/worker
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e '.[dev]'
python -m uvicorn app.main:app --host 127.0.0.1 --port 8765
```

## macOS app

The current Swift package was verified with:

```bash
cd apps/macos
swift build
```

The development app can still be run from source with `swift run PrivacyPreflightApp` while the
worker is available. Separately, the 0.1.0 preview bundles CPython 3.12.13, the local worker, and a
compiled macOS Vision OCR helper. It targets arm64 and macOS 14 or later, is ad-hoc signed only,
is not Developer ID signed or notarized. Gatekeeper acceptance was not established on the build
Mac because the local `spctl`/`stapler` checks returned subsystem errors; use the documented manual
first-open path and recheck on a clean Mac.

The distributed source excludes internal coordination documents, caches, and build outputs. Its
release script builds Swift with `-Xswiftc -gnone`, strips symbols, deletes the worker's editable-
install `direct_url.json` and matching `RECORD` row, then signs the bundle. The source ZIP was
generated twice with byte-identical output. An isolated extraction of the app ZIP passed deep
strict signature verification, launched with its bundled Python runtime, returned a healthy worker
response, and stopped the worker on graceful quit.

## Demo boundary

`public/case-studies/privacy-preflight/` was generated against a worker bound to
`127.0.0.1:8891`. Every input identity and contact detail is explicitly fictional. The package
contains actual endpoint results, before/after raster previews, an image-only redacted PDF, and
SHA256 hashes in `manifest.json`.

This record does not establish legal-grade redaction, perfect detection, universal offline
operation when external providers are enabled, clean-Mac compatibility, notarization, or Apple
approval. The 0.1.0 runtime replaces the earlier PyMuPDF path with pypdfium2/PDFium, pypdf,
Pillow, and ReportLab; PyMuPDF/fitz is not installed or bundled. An SPDX 2.3 SBOM records 26
runtime packages, and the exact bundled CPython license is distributed alongside and inside the
runtime-matching source ZIP. After app packaging, nine deterministic test-only values in that
source snapshot were changed to the low-entropy fixture value
`fixture-key-0000000000000000`; runtime source was unchanged, the four affected detector suites
passed all 37 tests, and an archive-expanded Gitleaks scan reported zero findings. This resolves
the specific preview-packaging blocker; it is not legal advice
or a project-wide license-clearance claim.

The staged app ZIP is 33,930,369 bytes with SHA-256
`360083a7fab6b60600f597b28a32c533a9df932766c21b80cba80e6c56350911`. The runtime-matching
source ZIP is 202,613 bytes with SHA-256
`4138cd3b61a17b4f7b36a5e104389aa229f5e638c3d3a019ce6aa26171624295`. Opening instructions
and all companion-file identities are recorded in
`public/case-studies/privacy-preflight/downloads/README.md` and `release-manifest.json`.

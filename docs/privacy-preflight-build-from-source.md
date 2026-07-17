# Privacy Preflight 0.1.0 build-and-package record

Historical source verification: 2026-07-12 at `78f13d5`
Release-package verification: 2026-07-17
Source: `~/Privacy Preflight for Mac`
Release source base: `2f9b5a08371d02ba441abbc439faf33ffc72cdac`
Release source state: local Goal candidate, uncommitted when generated; artifact hashes authoritative

## Worker

The existing local environment was verified with:

```bash
cd services/worker
.venv/bin/python -m pytest -q
```

Historical source-environment result: `95 passed`, with five non-failing PyMuPDF/SWIG
deprecation warnings. The 0.1.0 package was separately verified with `95 passed` under its exact
embedded CPython 3.12.13 runtime before release pruning; that packaged runtime does not include
PyMuPDF/fitz.

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

The staged app ZIP is 33,991,551 bytes with SHA-256
`dcb1735e90c59e5f33e367f925e49a50e8c1ea60ea21f25e84d283040ff83213`. The runtime-matching
source ZIP is 208,775 bytes with SHA-256
`545c4a6ef538291ca75a9fc93651f462a846190316f6d886657707831b5a492f`. Opening instructions
and all companion-file identities are recorded in
`public/case-studies/privacy-preflight/downloads/README.md` and `release-manifest.json`.

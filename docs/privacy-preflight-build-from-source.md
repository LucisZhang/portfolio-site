# Privacy Preflight v1 build-from-source record

Verified: 2026-07-12
Source: `~/Privacy Preflight for Mac`
Source commit: `78f13d5`

## Worker

The existing local environment was verified with:

```bash
cd services/worker
.venv/bin/python -m pytest -q
```

Result: `95 passed`, with five non-failing PyMuPDF/SWIG deprecation warnings.

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

The development app can then be run from source with `swift run PrivacyPreflightApp` while the
worker is available. The repository also has a development-bundle script, but the output is not
a public release: it is not notarized, is not verified for sandboxed distribution, and does not
bundle a self-contained Python runtime.

## Demo boundary

`public/case-studies/privacy-preflight/` was generated against a worker bound to
`127.0.0.1:8891`. Every input identity and contact detail is explicitly fictional. The package
contains actual endpoint results, before/after raster previews, an image-only redacted PDF, and
SHA256 hashes in `manifest.json`.

This record does not establish legal-grade redaction, perfect detection, universal offline
operation when external providers are enabled, or permission to distribute PyMuPDF in a binary.
The source repository's dependency-license audit keeps that distribution question open.

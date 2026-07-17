# Privacy Preflight macOS release audit

Audit date: 2026-07-18

Source state: metadata-stripped, runtime-matching public source snapshot distributed beside the
app ZIP. The source-archive SHA-256 is its authoritative identity. Internal coordination files,
caches, and build outputs are excluded; the included packaging script disables first-party Swift
debug paths, strips symbols, and removes editable-install provenance before signing.

Decision: **Publish only as an explicitly unnotarized Apple-silicon preview. It is not a Developer ID or notarized release.**

## Exact artifacts

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `Privacy-Preflight-0.1.0-macOS-arm64-unnotarized.zip` | 33,930,369 | `360083a7fab6b60600f597b28a32c533a9df932766c21b80cba80e6c56350911` |
| `Privacy-Preflight-0.1.0-source.zip` | 202,613 | `4138cd3b61a17b4f7b36a5e104389aa229f5e638c3d3a019ce6aa26171624295` |
| `CPython-LICENSE.txt` | 13,936 | `3b2f81fe21d181c499c59a256c8e1968455d6689d269aa85373bfb6af41da3bf` |
| `sbom.spdx.json` | 18,831 | `58c4a257ca1783891fa1de8eaa7a29c5a13f7d3139ad687082273ab6676da174` |

The app uses 94,476 KiB on disk before ZIP compression. No DMG was produced. The app ZIP,
companion source, privacy statement, third-party notices, dependency lock, exact CPython license,
SPDX runtime SBOM, and machine-readable release manifest are under
`public/case-studies/privacy-preflight/downloads/`.

The companion source preserves the app's runtime source while excluding internal coordination
material and transient build state. Two independent deterministic archive generations produced
the same source ZIP bytes. After the app was packaged, nine
deterministic test-only strings were changed from a provider-shaped fictional token to the
low-entropy value `fixture-key-0000000000000000` so an archive-expanded Gitleaks scan would be
zero-finding. No runtime source changed. The four directly affected detector suites passed all 37
tests after the substitution. The earlier 95-test result predated the general Chinese-mobile
regression; the final source snapshot now has an exact-artifact 96-test replay recorded in
`public/case-studies/privacy-preflight/worker-tests-goal-candidate.json`.

## Release gate

| Gate | Current evidence | Status |
| --- | --- | --- |
| Worker verification | Final source snapshot used the CPython 3.12.13 interpreter and application dependencies extracted from the exact app ZIP: `96 passed`; pytest 8.4.2 frontend was supplied separately as test harness. | Pass |
| Public-source hygiene | Source archive excludes internal coordination files, build outputs, caches, and local QA paths. Its packaging script uses `-Xswiftc -gnone`, strips symbols, removes the worker `direct_url.json` plus its `RECORD` row, and produced the exact app artifact above. | Pass for first-party source/build provenance; normal upstream toolchain metadata remains third-party provenance |
| PDF dependency license | Runtime uses pypdfium2/PDFium, pypdf, Pillow, and ReportLab. Bundle/source runtime scans found no PyMuPDF or `fitz` package/module. Notices, exact CPython license, exact versions, and a 26-package SPDX 2.3 runtime SBOM ship with the artifact. | Prior blocker resolved for this preview; not legal advice |
| Browser OCR fixture benchmark | Complete browser-equivalent multi-pass union: 19/19 expected-value hits, 21 detections, 2 false positives, and 90.5% precision across seven fixed synthetic fixtures. | Synthetic fixture evidence only; not general OCR accuracy |
| Destructive PDF behavior | Text and scanned fixtures were analyzed/exported; output remains an image-only rebuild with burned-in pixels and no retained text layer. | Pass for fixed synthetic tests |
| Standalone OCR | Vision bridge is compiled with `swiftc` at build time and bundled as a thin arm64 helper. With `PATH=/bin`, the extracted app detected the exact Chinese phone and local path without system Swift, Xcode/CLT, or Tesseract at runtime. | Pass |
| Scanned PDF smoke | Extracted app + embedded worker classified the synthetic PDF as `scanned`, one page, three OCR redaction regions. | Pass |
| CPU / OS | All 37 Mach-O files are thin arm64. Info.plist declares macOS 14.0 minimum. | Apple silicon only |
| Runtime packaging | CPython 3.12.13 and required dependencies are embedded; the extracted app worker process path resolved inside the app bundle. | Pass |
| Code signing | `codesign --verify --deep --strict` passed. Signature is ad-hoc (`flags=0x2`, no TeamIdentifier). | Pass only for the stated ad-hoc boundary |
| Notarization | No notarization was performed. `stapler validate` returned `kLSDataUnavailableErr`, not a positive ticket validation. | Not notarized; the command result is retained as an environment limitation |
| Gatekeeper | `spctl` returned a Code Signing subsystem internal error rather than an `accepted` or `rejected` assessment. Gatekeeper acceptance is therefore not established. | Manual first-open path may be required and must be rechecked on a clean Mac |
| Archive launch | Final ZIP was extracted, strict signature verification passed, app launched with “Bundled Python 3.12”, embedded worker returned `{"status":"ok"}`, and graceful app exit stopped the worker. | Pass on the build Mac |
| Clean-Mac / quarantine | No second clean Mac was available. The documented Control-click/Open and Privacy & Security/Open Anyway path remains required and should be rechecked on a clean Mac before broader release claims. | Open limitation |

## Opening the preview

English: move the app to Applications, Control-click it, choose **Open**, then confirm **Open**. On macOS Sequoia, if it is still blocked, open **System Settings > Privacy & Security**, scroll to **Security**, choose **Open Anyway**, and confirm. Do not disable Gatekeeper globally.

中文：将应用移到“应用程序”，按住 Control 键点按应用，选择“打开”，再确认“打开”。若在 macOS Sequoia 中仍被拦截，请进入“系统设置 > 隐私与安全性”，滚动到“安全性”，选择“仍要打开”并确认。请勿全局关闭 Gatekeeper。

## Boundaries

- This is an arm64-only preview, not an Intel/universal build.
- It is ad-hoc signed and unnotarized; no Developer ID, hardened-runtime, App Sandbox, clean-Mac, or Apple approval claim is made.
- OCR remains fallible and every selected region/output needs human review.
- PDF output is intentionally flattened and loses search, selection, links, forms, and accessibility structure.
- This is not legal-grade redaction.

## Public entry

- App ZIP: `/case-studies/privacy-preflight/downloads/Privacy-Preflight-0.1.0-macOS-arm64-unnotarized.zip`
- Source ZIP: `/case-studies/privacy-preflight/downloads/Privacy-Preflight-0.1.0-source.zip`
- Integrity manifest: `/case-studies/privacy-preflight/downloads/release-manifest.json`
- Notices: `/case-studies/privacy-preflight/downloads/THIRD_PARTY_NOTICES.md`
- Runtime SBOM: `/case-studies/privacy-preflight/downloads/sbom.spdx.json`
- CPython license: `/case-studies/privacy-preflight/downloads/CPython-LICENSE.txt`

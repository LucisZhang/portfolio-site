# Privacy Preflight macOS release audit

Audit date: 2026-07-13
Source: private local repository at `78f13d5`
Decision: **No public binary download. Build from source remains the only supported Mac path.**

## Release gate

| Gate | Current evidence | Status |
| --- | --- | --- |
| Source integrity | Source worktree was clean. Commit `78f13d5` is the recorded Portfolio source boundary. | Pass for audit |
| Worker verification | Existing evidence records 95 passing tests and a successful Swift build. This audit did not rerun them. | Recorded, not rerun |
| Dependency license | `services/worker/pyproject.toml` requires `pymupdf>=1.24,<2.0`. PyMuPDF documents an AGPL-or-commercial dual license. No project license, third-party notice bundle, AGPL release plan, or commercial-license record was found. | Blocked |
| Apple Silicon | The existing development executable is a thin `arm64` Mach-O. | Development build only |
| Intel | `lipo -info` reports no `x86_64` slice. | Blocked |
| Minimum macOS | Swift package and Info.plist both require macOS 14.0. | Declared, not clean-Mac tested |
| Runtime packaging | The app bundle includes worker source but no self-contained Python runtime or installed dependencies. | Blocked |
| Code signing | `codesign` reports an ad-hoc, linker-signed executable with no TeamIdentifier. The app resources are not sealed. | Blocked |
| Hardened runtime | The build script requests hardened runtime only when `SIGN_IDENTITY` is provided. No Developer ID build was found. | Blocked |
| Entitlements | A sandbox/network/user-selected-file template exists, but the source release notes say it has not been applied or verified in a signed sandboxed build. | Blocked |
| Notarization | No `notarytool` submission, accepted log, or stapled ticket was found. Apple requires a valid Developer ID signature and hardened runtime for notarization. | Blocked |
| Gatekeeper | `spctl` returned an internal code-signing error for the development bundle. | Blocked |
| Quarantine | The local build has provenance extended attributes, but no clean downloaded-package quarantine/Gatekeeper test is recorded. | Blocked |
| Release archive | `Privacy-Preflight-macOS-dev.zip` exists and is explicitly a development package. It is not a release candidate. | Do not publish |
| SHA-256 | The current dev zip hashes to `01e96ea3377f460450eb0b6e44e0ccac2a9e16717b271d01977169e7381cfc4d`; the thin executable hashes to `7612aedbd42ae378e90c1594ab8e8feb7a6f086a01bfe421855f8cae06e0b2b2`. These hashes identify local development artifacts only. | Recorded, not a release |
| Release notes | No versioned public release notes or third-party license notices were found. | Blocked |
| Privacy statement | The source README documents local processing, disabled raw-content history, redacted-only external review by default, and the explicit external raw-text opt-in. A release still needs a versioned end-user privacy statement. | Partial |

## License decision

PyMuPDF and MuPDF are available under GNU AGPL or a commercial license. Packaging the current worker into a publicly distributed binary therefore requires one of these before publication:

1. A documented AGPL-compatible distribution plan covering the complete corresponding source and notices.
2. A recorded commercial license from Artifex.
3. Replacement of PyMuPDF, followed by functional, security, and license revalidation of the destructive PDF path.

No option is currently documented as approved. This is a release blocker, not a claim that use or distribution is categorically prohibited.

## Required release sequence

1. Resolve the PDF dependency license and add repository plus third-party license files.
2. Choose the supported CPU matrix. If Intel is supported, build and test a universal `arm64` + `x86_64` app and every nested executable.
3. Bundle or install the Python runtime, worker dependencies, and OCR dependencies through a documented, reproducible path.
4. Apply the minimum required entitlements and test localhost worker launch under the chosen sandbox model.
5. Sign all executable code with Developer ID Application, hardened runtime, and a secure timestamp.
6. Submit the final ZIP/DMG with `notarytool`, staple the ticket, and verify `codesign`, `spctl`, and clean-Mac launch with quarantine present.
7. Generate release notes, privacy statement, SBOM/third-party notices, and SHA-256 for the exact notarized artifact.
8. Create an anonymously accessible GitHub Release only after all gates pass.

## Current public entry

- Build from source: `docs/privacy-preflight-build-from-source.md`
- Web app: the Portfolio Privacy Preflight browser workspace
- macOS UI status: `Signed macOS download pending`
- Formal download: none

## Authoritative references

- PyMuPDF licensing FAQ: <https://pymupdf.readthedocs.io/en/latest/faq/index.html>
- Apple notarization requirements: <https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution>
- Apple Developer ID: <https://developer.apple.com/developer-id/>
- Apple universal macOS binary guidance: <https://developer.apple.com/documentation/apple-silicon/building-a-universal-macos-binary>

# Accepted preview release — 2026-09-09

The owner accepted the latest preview and authorized publication after making the Guardian MCP connection action easier to discover. The bilingual action is now a high-contrast button with a plus icon, keyboard focus styling, and an explanation that it opens VS Code for confirmation. The existing MCP installation payload remains unchanged.

## Runtime and verification

- Public PR [#24](https://github.com/LucisZhang/portfolio-site/pull/24) merged candidate `9f7fcb7319871a682641ee3bbfb77799b97c0638` as `ce6e3c6a7ff4e77990db6f3380edf70b9acfafe9`. Their source trees are identical.
- Exact candidate Preview deployment `6343399027` succeeded; exact merged Production deployment `6343652090` succeeded. Both English and Chinese connection text were checked in the browser.
- The full browser matrix before the final button-height correction recorded 1,444 passes, 398 intentional skips, and six failures, all caused by the button rendering below its new 48-pixel minimum inside a scaled section. Raising its CSS minimum to 50 pixels resolved every failed case. The final focused run recorded 10 passes and four intentional skips across Guardian setup and lineation; the remaining Chinese route lineation run recorded 36 passes. No other full-matrix failures occurred.
- Final typecheck, lint (zero errors; three existing warnings), evidence verification, public-source reproduction, glyph coverage, heavy-asset checks, and performance budgets passed. Production dependency audit reported zero vulnerabilities. The artifact, assistant, and Chinese formatting suites recorded 6, 299, and 24 passes respectively.
- Final homepage Lighthouse: 97 Performance, 100 Accessibility, 100 Best Practices, and 100 SEO. Thirteen route performance budgets passed. These are local candidate measurements, not production measurements.
- The public corpus reproduces from 12 repositories, 221 source files, and 1,685 chunks with hash `7b9a92e3c13dfa354ac46a4fe0d71b2672962d897fb43a28d6db6f24ebe64c01`.

## Reproducible browser assets

The follow-up build fix provisions four Triage model/configuration files from the immutable public `LucisZhang/triage-router` revision `b2734bbcbd75aef1f83b872f31de0212a7926b7f`. Each file must match its pinned byte count and SHA-256 before it is written; valid local assets are reused without network access. A clean build with all four files absent, offline cache reuse, rejection of tampered input, and the complete heavy-asset ledger passed. This changes build provisioning, with no change to the accepted page implementation or model bytes.

Build provisioning PR [#25](https://github.com/LucisZhang/portfolio-site/pull/25) merged exact candidate `01fc3cc` as `43f1d7d36540d801769449613a235c49492d0577`. Candidate Preview `6343907092` and merged Production `6343939152` succeeded. Production success was recorded at 2026-09-09 14:29:49 Asia/Shanghai / 06:29:49 UTC. The fallback serves all four files with HTTP 200 and their complete pinned byte counts and SHA-256 hashes. The canonical runtime package already contains these identical model bytes.

## Canonical production acceptance

The canonical site at <https://xiangguozhang.com> serves exact runtime `ce6e3c6a7ff4e77990db6f3380edf70b9acfafe9`. The complete release inventory was verified against the locally verified manifest before activation (2,640 files; manifest SHA-256 `2a26cd678c3bbc5cfb6e8351c33ce237b9e4c666acfb5d7c0cb4bf3d8305591c`). Independent status readback confirmed the exact runtime, active application and web services, and zero automatic restarts.

- Four live Guardian browser checks passed: English/Chinese at 1440-pixel desktop and 390-pixel mobile widths. The action rendered at 49 pixels high with pointer affordance, the correct installation payload, and its associated explanation.
- Ten English/Chinese URLs across the homepage, Guardian, GroupConv, Privacy, and Ask returned HTTP 200. CSP, HSTS, nosniff, frame denial, and strict-origin referrer policy were present.
- Legacy project URLs preserve their query parameters and redirect to the current flat routes. The old AI index and www hostname also redirect correctly.
- Canonical homepage Lighthouse 13.4.1 measured **95 Performance / 100 Accessibility / 100 Best Practices / 100 SEO**, without warnings, at 2026-09-09 14:39:35 Asia/Shanghai / 06:39:35 UTC.
- No paid-model request was made during release acceptance.

Acceptance recorded: 2026-09-09 14:40:31 Asia/Shanghai / 06:40:31 UTC. Later publication-record commits do not change the accepted frontend runtime.

# Goal2 final local evidence

Recorded: 2026-07-19 Asia/Shanghai. The current local candidate is the v12 p1 public-GitHub
assistant bridge described below. The d8bc and eb08 browser/Lighthouse evidence and the v5/v6/v9
assistant records are retained unchanged as historical evidence; assistant runtime changes have
superseded them for current-candidate claims.

> **Overall status: `PARTIAL_EXTERNAL_GATE`.** All in-scope v12 local checks pass. No live v12
> model or OpenRouter request was made, and no Git commit/push, PR, Preview, deployment, or
> publication action occurred.

## Current v12 public-GitHub p1 bridge

- Policy revision: `public-github-p1-server-facts-v12`.
- Evidence mode: `public-github-pinned-server-rendered`.
- Fixed model: `moonshotai/kimi-k2.6`.
- Public source: `LucisZhang/p1-reliability-lab` at exact commit
  `7eab9c3fcdf73865b0ed6dd1266de1bfaccefcce`.
- Source pack: `p1-public-github-20260719-v1`, SHA-256
  `2cee646acfd39b335a94fc651097dee913eea05ff97eea2761fc9b5b13e08deb`.
- Server-rendered fact catalog SHA-256:
  `804ffa4dd7e06850351af20421799903d589f259181e0618e42d40a651f59b90`.
- All three exact-commit Git tree entries were verified as ordinary blobs with mode `100644`;
  remote byte counts and SHA-256 values matched. Runtime requests do not fetch GitHub.
- The model can select only one reviewed fact identifier from a finite set. The server writes the
  bilingual answer, pinned citations, and complete boundary statement.

Current checks:

- Assistant policy 37/37, focused installed-Chrome assistant coverage 18/18, and full-site
  installed-Chrome E2E 209 passed / 52 intentional skips / 0 failed across 261 cases in about 6.3
  minutes.
- TypeScript, ESLint, production build, evidence verification, performance budget,
  production-dependency audit (0 vulnerabilities), static client scan of the pack, fact-catalog,
  full-file, and excerpt hashes (0 matches), and `git diff --check`: pass.
- Current v12 Lighthouse passed against exact runtime tree `a49d5abb…`. Home, Margin, Privacy, and
  Release each scored Performance / Accessibility / Best Practices / SEO `100 / 100 / 100 / 100`.
  See [`lighthouse-summary-v12-local.json`](lighthouse-summary-v12-local.json), SHA-256
  `7a4b65a40acbad35360a1061c8968c65bc440a96c290c70c27f7a06d45f6a114`.
- Recruiter-safe record:
  [`assistant-public-github-v12-local-verification.json`](assistant-public-github-v12-local-verification.json),
  SHA-256 `869d8f20764574e0afe914295898a77d5545679bcaad2fb35c1d367904753669`.

This bridge establishes only a local, immutable-public-source path for one recorded single-node
Mac/Docker lab run. It does not establish production readiness, cloud scale, multi-node behavior,
general hardware compatibility, continuous operation, or one-command reproduction. Live v12 model
acceptance and every Git/publication action remain open gates.

## Superseded d8bc historical candidate binding

- Historical runtime tree: 221 files, SHA-256
  `d8bc84920a2c84c76109ebf6ab214cce969d5995b8c44ed76ec4b8a633bb38fd`.
- Exact Git tree: absent. No Goal2 candidate commit was created.
- Production build: Next.js 16.2.10 webpack, 15/15 statically generated pages.
- TypeScript, ESLint, evidence verification, performance budget, and `git diff --check`: pass;
  `npm audit --omit=dev` reports 0 vulnerabilities.
- Copy alignment after the bounded nine-string Chinese factual repair:
  [`copy-writeback-post-runtime-alignment.json`](copy-writeback-post-runtime-alignment.json),
  SHA-256 `5e1f8884dcf31f5a20ac6def494fa12af437df75dce725c8a9d981e6260e5557`.
  The repair changed exactly the authorized Chinese values; their English sources remained fixed.

Historical d8bc machine-readable evidence:

- [`playwright-summary.json`](playwright-summary.json), SHA-256
  `796bbbfa2d0b1a4bd8382da805a47851e06388611346c3f741deb4e76d820d35`.
- [`lighthouse-summary.json`](lighthouse-summary.json), SHA-256
  `5afdbd888c145c6532418f85dc5b11ccd7b8723e8e20183ffedf3a7f4fb62949`.
- [`chrome/manual-audit.json`](chrome/manual-audit.json), SHA-256
  `0ab4f1f8d821ba328e5ec7a889fc19b35cc9b320509f9c7db4564218a7b0f9df`.
- [`chrome/screenshot-manifest.json`](chrome/screenshot-manifest.json), SHA-256
  `3495920f2655e0d8f3ce18fbfc31578dd5e8ee7ed1ba19d9b8576c426b49dab4`.
- [`binary-manifest.json`](binary-manifest.json), SHA-256
  `d94e1b179ac7e6150a3564ca9c279ccf51f8f8f28481d4b95fdcce5c07f90320`.
- [`assistant-v9-live-gate.json`](assistant-v9-live-gate.json), SHA-256
  `275d163b7e5c7b8c699832b943a725556cc64c00597f5cddc29d3d4aa906b406`.
- [`copy-writeback-audit.json`](copy-writeback-audit.json), SHA-256
  `9aa0b41030e8bd182feda987fab36784d90e94a5c3f1b8cd7bee96621320e711`.

## Superseded d8bc installed-Chrome regression

The serialized Playwright suite ran against the exact d8bc production runtime with the installed
Google Chrome channel, one worker, and no retries:

- 203 passed, 52 intentional skips, 0 failed, 0 flaky.
- Duration: 479,720.844 ms (about 8.0 minutes).
- Projects: desktop, tablet, and mobile.
- Coverage: both locales; Release ordering and constrained geometry; Privacy text, image,
  text-layer PDF, scanned PDF, and genuine three-page PDF; Analytics real defaults, switching,
  materialization and cache behavior; RAG reset; localized errors; and assistant local guardrails.

The separate visible Chrome session checked all eight explicit routes in English and Chinese at
1920×958. It also exercised navigation, Release replay, Privacy review/export/download flows,
Analytics pressed states, and the assistant's exact off-topic refusal. Browser console errors were
empty. That session was finalized after review. These results are historical and do not establish
the current v12 assistant runtime.

Deterministic screenshots were then recaptured once with installed Chrome 150.0.7871.128 at DPR 1,
using 1440×900 desktop and 390×844 mobile viewports. Analytics captures show the loaded real-data
default state. The staging-first promotion reverified all 20 immutable eb08 historical hashes before
overwriting the exact 20 canonical paths.

Representative historical d8bc captures (all 20 identities are in the screenshot manifest):

| Surface | Dimensions | SHA-256 | File |
| --- | ---: | --- | --- |
| English home | 1440×900 | `f67ddac09bf709794b34b9e493164233547100b50b70b819689d90733a098e02` | [`en-desktop-home-1440.png`](chrome/en-desktop-home-1440.png) |
| Chinese home | 1440×900 | `cbc1b140e2fee10e63c30c4846a190d1af4ed475acb3d15912450cc2a00f5426` | [`zh-desktop-home-1440.png`](chrome/zh-desktop-home-1440.png) |
| English Release replay | 1440×900 | `8c22d4145a8c97fbf93269260da794b2b64874748222ffe833fecedd4c90e526` | [`en-desktop-release-replay-1440.png`](chrome/en-desktop-release-replay-1440.png) |
| Chinese Release replay | 1440×900 | `24cc71e3e44149fdb3bbcbcd9e2f7ace5b1050ea67aa41c35eff2b26aad0897f` | [`zh-desktop-release-replay-1440.png`](chrome/zh-desktop-release-replay-1440.png) |
| English Privacy full page | 1440×5560 | `6ae77b87976e7e5388cffe578060276093dcfb1bfb8c16116a6b71177be63ff3` | [`en-desktop-privacy-preflight-1440.png`](chrome/en-desktop-privacy-preflight-1440.png) |
| Chinese Privacy full page | 1440×5437 | `6d3a44217bb666a4d160ca0c0ba8ff2ce8a66854a2a66b6b58c6620e20a5c4fe` | [`zh-desktop-privacy-preflight-1440.png`](chrome/zh-desktop-privacy-preflight-1440.png) |
| Margin real-data default, desktop | 1440×6167 | `9a891bf9274c2402d94f8eac802bfbbe2af47ebc4014a32d4bbf00b7c6304332` | [`margin-desktop.png`](../local-analytics/margin-desktop.png) |
| Credit real-data default, mobile | 390×11914 | `4677b60110ae946f9c5b53b571ccbdbab3befff94e1e37cd335ef1e26633aab5` | [`credit-mobile.png`](../local-analytics/credit-mobile.png) |

## Superseded d8bc Lighthouse

Each route ran exactly once against the bound d8bc local production runtime with Lighthouse 13.4.0 and
installed Chrome 150.0.7871.128. All runs had no runtime error or warning, and HTTP-status and
console-error scores were 1. They remain immutable historical results, not current-v12 evidence.

| Route | Performance | Accessibility | Best Practices | SEO | FCP / LCP / TBT / CLS | Raw report SHA-256 |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| `/` | 98 | 100 | 100 | 100 | 1057 ms / 2497 ms / 40 ms / 0 | `72c21567b27ec77f2e2c358ae3f8e6e0bd76022544b5bf145964ca6cb87ff9e2` |
| `/analytics/margin-control-tower` | 97 | 100 | 100 | 100 | 1356 ms / 2559 ms / 72 ms / 0 | `99b245746653a1b6ee82a4aefac2aa0b0c2b337bbdcfb23d56a47449bc5b6afb` |
| `/ai/privacy-preflight-mac` | 91 | 100 | 100 | 100 | 1206 ms / 3538 ms / 8 ms / 0 | `628415319fc9ed05f946ad2880dd8584f0918cd6f956ee3e3654b6f803e726a1` |
| `/ai/release-guardian` | 92 | 100 | 100 | 100 | 1207 ms / 3269 ms / 10 ms / 0 | `360daa96ed9a77c7f7e6c0afce8637812fa70268614c02efba9814cdb05248d3` |

## Evidence boundaries retained

- Release: funded-live and deterministic-stub results remain separate; the strict live residual
  30/44 remains beside the aggregate gates; synthetic replay inherits no measured result.
- p1: May historical artifacts remain separate from the July local-Mac reproduction.
- RAG: C2 remains the evaluation floor; C3 has no metric and no invented comparison.
- Privacy: fictional fixtures only; browser source plus an ad-hoc-signed, unnotarized arm64 preview,
  not a notarized distributable.
- Analytics: hash-bound real offline artifacts fail closed; synthetic data remains an explicitly
  labeled fallback; no production, causal, or regulatory claim is added.
- Assistant: the current v12 bridge uses only the pinned public p1 pack, a finite question-template
  set, reviewed fact identifiers, and server-rendered bilingual answers/citations/boundaries;
  historical v5/v6/v9 acceptance states remain separate.

## Assistant acceptance boundary

The current v12 candidate has made zero live model requests and zero OpenRouter requests. Its local
verification establishes deterministic scope gating and server-rendered facts/citations/boundaries,
not a live model round trip.

Historical live acceptance passed under v5 for English and v6 for Chinese. See
[`assistant-live-acceptance.json`](assistant-live-acceptance.json), SHA-256
`d6de588b6d95fc9bac91d6d6d40a17e72c1454d04c0336bf99820e7cf9ac019f`. Historical v9 passed
32/32 local tests and its saved-reply replays with zero network/model calls. See
[`assistant-policy-v9-local-replay.json`](assistant-policy-v9-local-replay.json), SHA-256
`49c84d0e2b6654ba1082b330a60bb34602d97b8263e29582bca9c7d90b36d27d`.

The v9 live packet was authorized but denied by the platform execution safety gate before process
creation: zero calls and no payload reached OpenRouter. All v5/v6/v9 records are immutable but
superseded; they do not establish current v12 acceptance.

## Historical exact-run evidence

The immutable eb08 screenshot set and prior browser summaries remain available only as historical,
superseded evidence:

- [`chrome/screenshot-manifest-eb08-superseded.json`](chrome/screenshot-manifest-eb08-superseded.json),
  SHA-256 `1c45b9ae202d307cea9ed5133a86c65103f0951fec5ec14a42e4489d8838bd55`.
- [`chrome/manual-audit-eb08-superseded.json`](chrome/manual-audit-eb08-superseded.json), SHA-256
  `79f48e2fbf3a4642a5e3dce38c887d50bedfd38dcb7fcb67b8988aa6487a0b1c`.
- [`playwright-summary-eb08-superseded.json`](playwright-summary-eb08-superseded.json), SHA-256
  `03c9a0a305a70ab0937c87744b8a61cc89d3b157a13e00d36db7b45c2ccc5002`.
- [`lighthouse-summary-eb08-superseded.json`](lighthouse-summary-eb08-superseded.json), SHA-256
  `5e086a2216bd8704ec901b19e4645a002d514d948b346559ec9249b25456fe73`.
- [`binary-manifest-eb08-superseded.json`](binary-manifest-eb08-superseded.json), SHA-256
  `cba4934e32447f636e55567d550febb5273d49f3baadedb925b9f55378052b7f`.

## External gates still open

- Live v12 model acceptance has not been attempted and is not claimed.
- No Goal2 commit, push, PR creation/update, non-production Preview, deployed-browser check, merge,
  production deployment, alias change, tag, release, or public-share change was performed.

# Release Guardian v1 evidence-package release record

Status: **EXACT PACKAGE APPROVED AND PUBLISHED THROUGH THE SANITIZED PUBLIC SITE**

Prepared: 2026-07-12

## Scope and source anchors

- Package root: `public/case-studies/release-guardian/`
- Private source repository: `/Users/hsiangkuochang/release-guardian-portfolio`
- Exact private source commit: `ca2ef58dfc1a6dc188ccb9e87525c9537ab8e11d`
- Portfolio baseline commit before this work: `a856e64ad12bbbf054f829658f68af28df230135`
- Raw funded-live report:
  `/Users/hsiangkuochang/Documents/Codex/2026-07-09/computer-use-claude-artifacts-download-follow/release_guardian-company-handoff-20260711/release-guardian-portfolio-materials-ca2ef58/eval/reports/post-l-live-funded.json`
- Raw deterministic-stub report: same directory, `post-l-stub.json`
- Cost source: `/Users/hsiangkuochang/release-guardian-portfolio/eval/results/cost_report.json`
- Architecture reference: `/Users/hsiangkuochang/release-guardian-portfolio/ARCHITECTURE.md`
- Screenshot sources: `/Users/hsiangkuochang/release-guardian-portfolio/docs/screenshots/{change-view,trace-view,eval-view}.png`

The architecture and CSV files are newly written allowlisted derivatives. Raw reports, raw
screenshots, source code, prompts, scenarios, traces, and repository metadata are excluded.

## Sanitization and reconciliation

Source hashes were recorded with:

```sh
shasum -a 256 docs/screenshots/change-view.png docs/screenshots/trace-view.png docs/screenshots/eval-view.png ARCHITECTURE.md eval/results/cost_report.json
shasum -a 256 post-l-live-funded.json post-l-stub.json pre-l-stub.json pre-l-live.json
```

The recorded source hashes match the W2 claims matrix. Evaluation values and strict residuals
were recomputed with `jq` directly from the two raw report files. Results: funded live =
132 graph runs, aggregate gate PASS, 30/44 strict outcome failures, one trajectory failure;
deterministic stub = 132 graph runs, aggregate gate PASS, 15/44 strict outcome failures, zero
trajectory failures. Stub proxy cost and latency were intentionally omitted.

Screenshot transforms, applied to copies rather than originals:

```sh
sips --cropToHeightWidth 374 911 --cropOffset 422 480 change-view.png
sips --cropToHeightWidth 900 1160 --cropOffset 290 140 trace-view.png
sips --cropToHeightWidth 402 1280 --cropOffset 90 140 eval-view.png
```

After cropping, a Ruby PNG-chunk pass retained only `IHDR`, `PLTE`, `tRNS`, `sRGB`,
`IDAT`, and `IEND`, recalculating CRCs. This removed the `eXIf` chunks introduced by
`sips` without changing retained pixel data. Visual review confirmed:

- `risk-guardrail.png`: no scenario/run/evidence IDs, service names, paths, or injection text.
- `pipeline-trace-stub.png`: no run ID, status, headline cost, token, or latency cards.
  Remaining timing marks are stub design-trace context and cannot be used as a live benchmark.
- `evaluation-stub.png`: no per-scenario rows or resource names. It remains a candidate only
  and must be accompanied by the manifest's 15/44 strict-residual disclosure.

## Asset hashes

| Asset | SHA256 |
|---|---|
| `architecture.mmd` | `ca53cb3aab82d1d02ad14a11f6e394a710be81a0ff3f5c48feefac093d70ddba` |
| `data/cost-evidence.csv` | `3eb3ac2908f8e7b9aec9b725e8f757dcca1fb89010022ba6643f83ac3532201c` |
| `data/evaluation-live.csv` | `29eca7eddbc8885c0eb96705af46883c5986f61dda46f6a34c261e86aa49a892` |
| `data/evaluation-stub.csv` | `a312feb6599f7e63732ad36387c3bb390bc73f18a67695e9437182dcd01b1bfe` |
| `data/findings.csv` | `8f479171837a543ff8e8439ac983d37fc4b3bb1ccb3792486e037a828d7f9b95` |
| `screenshots/evaluation-stub.png` | `f534a133d5bc2a0cf6b0aed3425446127537b1a72e6ce14c8c3978486719eff9` |
| `screenshots/pipeline-trace-stub.png` | `22de4890f08b961dee8e7c234f843d702a7833a6f825a199d9cc708db645acff` |
| `screenshots/risk-guardrail.png` | `0df0b05fdd99188946c594462f9beb84dc8efd69dee5de147f408707acc582a9` |

Manifest SHA256 after final validation:
`f37967289db4816cfd5f23bdad7ca281b979f52420c4bf65b34b0383a6796eb8`.

## Package scan and validation results

Commands were run from the portfolio worktree against
`public/case-studies/release-guardian/`:

```sh
jq empty public/case-studies/release-guardian/manifest.json
ruby -rcsv -e 'ARGV.each { |p| rows = CSV.read(p, headers: true); raise p unless rows.headers && rows.all? { |r| r.to_h.keys == rows.headers }; puts "#{p}: #{rows.length} rows" }' public/case-studies/release-guardian/data/*.csv
ruby -rjson -rdigest -e 'm = JSON.parse(File.read(ARGV[0])); root = File.dirname(ARGV[0]); m["assets"].each { |a| raise a["path"] unless Digest::SHA256.file(File.join(root, a["path"])).hexdigest == a["sha256"] }' public/case-studies/release-guardian/manifest.json
rg -n -i --hidden '/Users/|/home/|[A-Z]:\\|hsiangkuochang|zhangxiangguo|BEGIN [A-Z ]*PRIVATE KEY|authorization:[[:space:]]*bearer|api[_-]?key[[:space:]]*[:=]|password[[:space:]]*[:=]|secret[[:space:]]*[:=]|token[[:space:]]*[:=]|https?://|[[:alnum:]._%+-]+@[[:alnum:].-]+\.[A-Za-z]{2,}' public/case-studies/release-guardian
strings public/case-studies/release-guardian/screenshots/*.png | rg -n -i '/Users/|/home/|hsiangkuochang|zhangxiangguo|BEGIN [A-Z ]*PRIVATE KEY|authorization:|api[_-]?key|password|secret|https?://|[[:alnum:]._%+-]+@[[:alnum:].-]+\.[A-Za-z]{2,}'
find public/case-studies/release-guardian -type l -o -type s -o -type p -o -type b -o -type c
find public/case-studies/release-guardian -type f -perm -111 -print
find public/case-studies/release-guardian -name '.*' -print
file public/case-studies/release-guardian/screenshots/*.png
git diff --check
```

Results:

- Manifest JSON: PASS.
- Manifest reconciliation: PASS, all eight listed asset hashes match.
- CSV parsing: PASS, 4 cost rows, 8 live rows, 8 stub rows, and 13 findings rows.
- Public-tree private path, identity, email, URL, private-key, bearer, and credential-assignment
  pattern scan: PASS, zero matches.
- PNG byte-stream targeted string scan: PASS, zero matches.
- PNG structure: PASS, RGB non-interlaced PNGs; only `IHDR`, `sRGB`, `IDAT`, and
  `IEND` chunk types remain.
- Filesystem safety: PASS, no hidden files, executables, symlinks, sockets, FIFOs, or devices.
- Allowlist count: PASS, exactly nine files (manifest, architecture source, four tables, three
  screenshot candidates).
- `git diff --check`: PASS.

After integration, Codex also ran the repository's local macOS Vision OCR helper against all
three exact screenshot hashes and reviewed the recognized text against the public-claim and
private-data boundaries. The OCR output contained no identity, email, private path, run/scenario
ID, credential, internal URL, or raw prompt text. The stub evaluation values and trace timing
marks matched their required adjacent disclosures. This local review is not a substitute for
the still-pending Gitleaks, TruffleHog, malware, and independent human reviews.

## Approval status and explicit gates

- Legal review and ownership authorization: **HUMAN-CONFIRMED COMPLETE, 2026-07-12**.
- Exact approval record: **human approved the best-practice publication path in this task on
  2026-07-12 after Codex presented the manifest and all three screenshot hashes**.
- Allowed asset scope: **exactly the nine-file package reconciled by manifest SHA256
  `f37967289db4816cfd5f23bdad7ca281b979f52420c4bf65b34b0383a6796eb8`**.
- License/notice treatment: **no open-source license is granted; portfolio content and sanitized
  derivatives remain all-rights-reserved under `NOTICE.md`**.
- Three screenshot files: **approved only at the exact hashes recorded above**.
- Exact manifest and asset-hash sign-off: **approved, 2026-07-12**.
- Codex parent-session visual, OCR, privacy, and claims review: **complete for the exact hashes
  listed above**.
- Final owner/human review: **complete through the exact-artifact approval in this task**.
- Dedicated secret scans: **complete immediately before first public push**. Gitleaks 8.30.1
  scanned all 68 commits at `9e25505` (about 1.22 MB) with zero leaks. TruffleHog 3.95.9 scanned
  591 chunks (about 1.25 MB) with zero verified or unverified secrets. The only directory-scan
  false positives were two fixed synthetic p1 business keys and ignored `.next` build output;
  `.gitleaks.toml` allowlists only those exact synthetic values, not either evidence file.
- Clean public repository scan: **Gitleaks scanned its single commit with zero leaks; TruffleHog
  scanned 105 chunks / 597,085 bytes with zero verified or unverified secrets; the targeted
  internal-path and identity scan returned zero matches**.
- OCR pass: **complete after integration using local macOS Vision on the exact screenshot hashes**.
- Approved publication targets: **public GitHub repository `LucisZhang/portfolio-site` and its
  Vercel production deployment**.
- Remote, push, public Git history, upload, deployment, and publication: **approved; first public
  push and deployment completed through the clean public repository and Vercel production**.
- Public source: **`https://github.com/LucisZhang/portfolio-site`, clean commit
  `e6c97f5eb9ae7607308ff2ede8b7aa20ab4346fd`**.
- Production page: **`https://portfolio-site-seven-murex.vercel.app/ai/release-guardian`**.
- Internal integration history: **private at `LucisZhang/portfolio-site-internal`; it is not the
  public source repository**.
- W5 PostgreSQL/pgvector reproduction: **declined and not performed**.

This approval does not extend to excluded private source code or raw evidence and does not permit
substituting any asset whose hash differs from the values above.

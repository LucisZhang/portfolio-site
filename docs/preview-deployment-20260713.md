# Operable portfolio Preview

Deployed: 2026-07-13 09:24:37 Asia/Shanghai
Deployment: `dpl_3pA2zqENc1qbcfJZJP8MoogBpr54`
Target: `preview`
Status: `READY`
URL: `https://portfolio-site-73jrsswie-luciszhangs-projects.vercel.app`
Inspector: `https://vercel.com/luciszhangs-projects/portfolio-site/3pA2zqENc1qbcfJZJP8MoogBpr54`

## Publication boundary

- The deployment used a clean, no-history, 91-file staging tree of approximately 2 MB.
- Vercel uploaded an 888.8 KB archive and extracted 90 deployment files.
- No `--prod`, Git push, production-alias change, internal STATE/agent/runbook document, or private
  source/evidence upload occurred.
- Vercel Authentication remains enabled on the base Preview URL. A deployment-scoped Vercel
  Shareable Link now permits anyone holding that link to inspect this Preview through a browser
  session until 2026-08-12 11:54:05 Asia/Shanghai (2026-08-12 03:54:05 UTC).
- The exact Shareable Link is intentionally excluded from Git and local documentation. It was
  delivered directly to the authorized owner. No project-wide protection setting was disabled.

## Remote verification

- Vercel build: Next.js 16.2.10, TypeScript pass, 14 static pages generated, status READY.
- All 11 current/index/legacy routes returned HTTP 200 through authenticated `vercel curl`.
- Release, p1, RAG, Privacy, Margin, and Credit evidence/contracts returned HTTP 200 and matched the
  local authoritative files byte-for-byte.
- Browser-local OCR and PDF worker assets returned HTTP 200 and matched local generated assets
  byte-for-byte.
- Homepage headers include the expected CSP, frame denial, MIME-sniffing protection, permissions
  policy, and referrer policy.
- Three protected homepage samples returned HTTP 200 with TTFB 0.604-0.918 seconds and total time
  0.628-0.940 seconds; each response was 51,324 bytes.
- Two independent, cookie-free anonymous sessions opened the Shareable Link, exchanged it for a
  deployment-scoped session cookie, and reached the 51,324-byte portfolio homepage without Vercel
  login. In an anonymous share session, all 11 current/index/legacy routes returned the expected
  site content with HTTP 200.

## Production isolation

Vercel inspection reports `target=preview` and does not list the production alias. The production
URL `https://portfolio-site-seven-murex.vercel.app` still returns HTTP 200 with the same pre/post
deployment ETag `b34f9f7eceba45aa1138c766998f440c`.

## Public GPT review copy

After the owner requested anonymous model access, a separate Vercel project was created so the
existing `portfolio-site` project's protection did not need to be weakened:

- Project: `portfolio-site-public-review-20260713`
- Deployment: `dpl_9YRycNS9bx7XQq4SWVWgYZb8NcCx`
- Target/status: `preview` / `READY`
- Fixed public alias: `https://portfolio-site-gpt-review.vercel.app`
- Protection: `ssoProtection=null` only on this isolated review project

The alias requires no login, cookie, query parameter, or redirect. Anonymous verification returned
HTTP 200 for all 11 current/index/legacy routes. Release, p1, RAG, Privacy, Margin, and Credit
evidence/contracts plus the OCR and PDF workers returned HTTP 200 and matched the authoritative
local files byte-for-byte. The project contains only this final Preview; failed intermediate review
deployments and the platform-created initialization deployment were deleted.

No `--prod` was used for the retained deployment, no original production alias changed, and no Git
push occurred. The isolated project's deployment-retention setting is 30 days.

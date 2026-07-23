# Portfolio publication checklist

Updated: 2026-07-23 (Asia/Shanghai)

This is the release procedure for the complete portfolio and the v13 bilingual hybrid-RAG
assistant. It is also the stop-condition list: any unexplained diff, failed check, moved remote,
missing secret, incorrect deployment SHA, private-data leak, or unsupported evidence claim blocks
publication.

## 1. Freeze a clean public candidate

1. Fetch and record the current SHA of `LucisZhang/portfolio-site:main` without changing the user's
   primary checkout.
2. Create a separate worktree and branch from that exact public `main` SHA. The candidate must be a
   normal descendant of public `main`; do not merge unrelated histories and do not force-push.
3. Apply the audited public tree delta from the verified integration candidate. Exclude untracked
   owner files, `.env*`, `.assistant-private/`, raw resumes, private dossiers, local paths, browser
   state, downloaded raw datasets, and coordination notes.
4. Review `git diff --name-status`, `git diff --stat`, new binaries, and the complete commit diff.
   Require `git diff --check` and a clean tracked worktree.
5. Confirm the public knowledge manifest contains only intended public GitHub repositories, exact
   40-character commits, and reviewed source paths. The generated corpus is permitted in the
   server bundle; the private packet is not tracked anywhere.

## 2. Verify evidence, build, browser, and dependencies

From the exact clean candidate run:

```sh
npm ci
npm run typecheck
npm run lint
npm run verify:evidence
npm run verify:assistant
npm run verify:assistant-public-sources
npm run build
npm run verify:performance
npm run test:e2e -- --workers=1
npm audit --omit=dev
git diff --check
```

Then require all of the following:

- Homepage Lighthouse Performance is at least 90; record Accessibility, Best Practices, and SEO as
  well. Exercise representative project routes rather than relying on the homepage alone.
- Gitleaks and TruffleHog report no verified secret in the candidate diff and public history.
- A static-client scan finds no private packet text/path, public corpus content, knowledge snapshot
  hash, OpenRouter key, Upstash token, or HMAC secret in browser JavaScript.
- Release Guardian still shows the funded-live/deterministic-stub distinction and 30/44 strict
  residual. RAG Quality Lab still states C2 is the floor and C3 produced no metric. Privacy and
  Analytics preserve their documented claim boundaries and provenance.
- Every public GitHub citation target resolves anonymously at the exact pinned commit.
- Fixed routes remain statically generated; only `/api/assistant` and the intended artifact route
  are dynamic.

## 3. Verify assistant v14 locally

Require policy `hybrid-portfolio-rag-v14`, evidence mode
`pinned-github-plus-private-candidate-rag`, and public snapshot SHA-256
`43628d6deaae5f0d24db05a35c40ae27e2321be0f3b9ea4878baa4dbd59eb660`.

Check that:

1. Public generation covers 9 repositories, 49 reviewed files, and 344 chunks. Runtime performs no
   GitHub fetch.
2. The owner-selected private builder removes contact/secret-shaped values and superseded RAG
   metrics, produces a bounded gzip/base64 packet below the Git-ignored `.assistant-private/`
   directory, and never records local paths in browser citations.
3. Retrieval returns at most 9 blocks with source diversity and works for personal-background,
   single-project, cross-project, and role-fit questions in both English and Chinese.
4. English resolves to `anthropic/claude-sonnet-4.6`; Chinese resolves to
   `moonshotai/kimi-k3`. Overrides, if any, must be explicit valid provider/model identifiers.
5. Every outbound model request enforces `data_collection: deny`, `zdr: true`, and
   `require_parameters: true`, contains only retrieved evidence plus at most 6 recent messages,
   stays inside the 58-second request deadline, and advances through the configured distinct-model
   fallback order only for retryable failures.
6. Output JSON is server-validated. Unknown/duplicate citation IDs, sensitive output, long copied
   evidence, malformed JSON, non-stop completion, returned-model mismatch, and oversized upstream
   bodies fail closed.
7. Request gates enforce JSON, same-origin browser use, 24 KB streamed bytes, a 3-second body-read
   deadline, 2,500 characters per newest user message, and local refusal of prompt injection,
   knowledge/system-prompt exfiltration, explicit secret/contact requests, and explicit off-topic
   work.
8. Upstash applies 10/minute and 50/day sliding windows to an `ip-hmac-v2` HMAC pseudonym. The raw
   IP, HMAC secret, and Upstash token never enter logs or Redis keys. Limiter failure returns 503
   before any model call.

Perform one real request per locale using the exact final private packet. When deployment secrets
are Vercel Sensitive and cannot be downloaded, this live pair must run against the exact-SHA
Preview before merge rather than weakening or extracting the secrets. Each must return HTTP 200,
the exact expected model, a complete persuasive answer, non-empty validated citations, public and
private knowledge hashes, retrieval count, outbound payload hash, and `upstash-redis` limiter mode.
Reject any result containing a superseded RAG corpus/latency/quality/regression figure, private
path, contact detail, secret, fabricated metric, or unsupported present-tense claim.

In a real browser, test desktop and mobile layouts, English and Chinese, multi-turn context, opening
a public exact-commit citation, the generic non-link private citation, Enter/Shift+Enter behavior,
loading/error states, and the OpenRouter/ZDR disclosure.

## 4. Configure Preview safely

Before a Preview build, verify variable name and target only—never print values:

- `OPENROUTER_API_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `ASSISTANT_RATE_LIMIT_HMAC_SECRET` (independent, at least 32 UTF-8 bytes)
- `ASSISTANT_PRIVATE_KNOWLEDGE_B64_GZIP`
- optional `ASSISTANT_MODEL_EN` and `ASSISTANT_MODEL_ZH`
- optional `ASSISTANT_FALLBACK_MODELS_EN` and `ASSISTANT_FALLBACK_MODELS_ZH`

Check the aggregate deployment-environment size before upload. Use the deployment provider's secret
input/API mechanism so values never appear in process arguments, shell history, Git, CI output, or
PR text. Preview and Production may use the same reviewed knowledge packet but should use correctly
scoped secrets; never prefix server values with `NEXT_PUBLIC_`.

## 5. Push and inspect Preview

1. Re-read remote `main`. If it moved, rebuild/retest the candidate against the new base.
2. Push the exact candidate branch normally. The Git-connected Vercel project is expected to create
   a non-production Preview; verify the deployment metadata SHA exactly matches the candidate.
3. Inspect build logs for secret output and errors. Test the signed-out public site, all routes,
   downloads, source links, bilingual copy, mobile layout, and both assistant locales.
4. Verify the Preview API headers and Upstash mode. Run injection/exfiltration and oversized-body
   refusals without consuming model calls. Run one bounded live prompt per locale and retain only
   hashes/statuses/model IDs/citation IDs in the release record—not prompt packets or private text.
5. Run Preview Lighthouse and confirm homepage Performance remains at least 90.

## 6. Fast-forward public main and verify Production

After Preview passes, re-read remote `main` and require it is still the candidate's parent. Update
`main` with a normal fast-forward push only. Do not force, rewrite history, change repository
visibility, create a tag/release, or mutate unrelated branches.

Confirm the Git-triggered Production deployment uses the exact main SHA. Re-run the anonymous route,
download, citation, bilingual assistant, injection refusal, Upstash header, client-bundle leak, and
homepage Lighthouse checks against the production alias. Record the production URL, deployment SHA,
Asia/Shanghai timestamp (and UTC equivalent), model IDs, knowledge hashes, and gate summary in a
public-safe final state update.

Only after those checks may `STATE.md` change from `V15_RELEASE_CANDIDATE` to a deployed status.

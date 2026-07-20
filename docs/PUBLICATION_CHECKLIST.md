# Portfolio publication checklist

Updated: 2026-07-20 (Asia/Shanghai)

This is the exact owner-gated path for publishing the current upgrade. It is a deliverable, not an
authorization record. No push, pull-request mutation, merge, production promotion, repository
visibility change, or GitHub Release was performed while preparing it.

## Verified remote state

- Public repository: [`LucisZhang/portfolio-site`](https://github.com/LucisZhang/portfolio-site),
  visibility **PUBLIC**, default branch `main`.
- Remote `main` at audit time: `e6c97f5eb9ae7607308ff2ede8b7aa20ab4346fd`.
- Public review branch at audit time: `codex/portfolio-phase2` at
  `234da138c3bc6b81569da8aa6fc9a1325a4d344f`.
- [PR #1](https://github.com/LucisZhang/portfolio-site/pull/1) is open, ready for review, and
  targets `main` from `codex/portfolio-phase2`.
- At the 2026-07-18 08:03 Asia/Shanghai pre-publication snapshot, the tested integration tree
  contained internal handoff/source-index material and was not a
  publication source. A publishable candidate must be a separate clean branch based exactly on
  `public/codex/portfolio-phase2`, with only the audited public delta applied. The current upgrade
  and its pipeline work were not yet on that public branch. After an authorized push, re-read the
  live branch instead of treating this dated snapshot as current state.
- The commands below use `public` as the local name of the public portfolio remote. Verify that
  remote resolves to `LucisZhang/portfolio-site` before any authorized push.
- The current Vercel `portfolio-site` project is Git-connected to this repository with production
  branch `main` and no Ignored Build Step. Its existing `codex/portfolio-phase2` push created a
  Preview automatically. Treat a new feature-branch push as expected to create another Preview;
  do not assume push and Preview can be executed independently under the current configuration.

## 1. Freeze and inspect the exact candidate

1. Stop concurrent edits and record both the internal integration commit SHA and the distinct clean
   public-candidate commit SHA.
2. Create the public candidate from `public/codex/portfolio-phase2` in a separate worktree. Apply
   only the audited public delta. Keep `AGENTS.md` and `STATE.md` public-safe and current; exclude
   internal handoffs/source indexes/dossiers, local coordination notes, and every absolute local
   path.
3. Confirm the clean candidate contains only approved portfolio source, derived artifacts,
   documentation, and test evidence. Never treat the integration branch as the push source.
4. Confirm `pipelines/` contains no downloaded raw Olist, Lending Club, or substitute datasets;
   only code, compact metadata, and approved derived outputs may be tracked.
5. Confirm every newly tracked binary is intentional and within the documented publication scope.
6. Review the full clean-candidate delta against the already-public branch:

   ```sh
   git diff --stat public/codex/portfolio-phase2...<clean-public-candidate-sha>
   git diff --name-status public/codex/portfolio-phase2...<clean-public-candidate-sha>
   git log --oneline public/codex/portfolio-phase2..<clean-public-candidate-sha>
   ```

7. Reconfirm the history relationship. A nonzero result is a stop condition, not permission to
   force-push:

   ```sh
   git merge-base --is-ancestor public/codex/portfolio-phase2 <clean-public-candidate-sha>
   ```

## 2. Re-run evidence and security gates

Run the repository gates from a clean install and retain their outputs with the candidate SHA:

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
```

Then complete the public-boundary audit:

1. Re-run the repository's dedicated Gitleaks and TruffleHog checks across the final history.
2. Search the diff for local absolute paths, private repository URLs, credentials, personal data,
   raw source rows, internal coordination notes, and unapproved generated files.
3. Verify each dataset `PROVENANCE.md` records source URL, retrieval date, license/terms, input
   hash, transformation scope, and the fact that raw source data is excluded.
4. Regenerate analytics derivatives with the documented pipeline commands and compare output
   hashes with the committed hash log. Any unexplained mismatch blocks publication.
5. Verify the Release Guardian nine-file allowlist and immutable hashes exactly; do not replace or
   regenerate its approved media.
6. Verify the macOS archive, source/licensing companion, SHA-256, arm64-only label, ad-hoc-signing
   label, un-notarized warning, and bilingual open instructions as one indivisible release set.
7. Verify assistant policy `public-github-p1-server-facts-v12` and evidence mode
   `public-github-pinned-server-rendered`. The bundled reviewed pack must remain pinned to public
   `LucisZhang/p1-reliability-lab` commit
   `7eab9c3fcdf73865b0ed6dd1266de1bfaccefcce`, contain exactly the three allowlisted excerpts, and
   hash to `2cee646acfd39b335a94fc651097dee913eea05ff97eea2761fc9b5b13e08deb`. Runtime code must not fetch
   GitHub or import private dossier grounding. Every allowed model request must contain all three
   excerpts and only the final question, with no conversation history and no retry.
8. Preserve the v5/v6 live-acceptance files and v9 replay/gated-execution files byte-for-byte as
   immutable historical evidence. They do not establish v12 live acceptance and must not be
   regenerated to look current.
9. The final v12 local gate completed: `verify:assistant` passed 37/37; the production build,
   typecheck, and lint passed; the assistant-focused installed-Chrome suite passed 18/18; and the
   full-site installed-Chrome E2E run completed 261 total cases in 6.3 minutes with 209 passed, 52
   intentional size skips, and 0 failed. `verify:evidence` and `verify:performance` passed;
   `npm audit --omit=dev` reported 0 vulnerabilities; and the remote exact-commit public-source
   verifier matched all 3/3 reviewed files. Client static chunks contained none of the source-pack,
   fact-catalog, full-file, or excerpt hashes. `git diff --check` passed. Live v12 model requests
   remained 0, and no deployment or Git write was performed. The exact-runtime current-v12
   four-route Lighthouse run also passed: home, Margin, Privacy, and Release each scored 100 for
   Performance, Accessibility, Best Practices, and SEO; retain
   `goal2-final/lighthouse-summary-v12-local.json` as the recruiter-safe record.
10. Verify that the model can return only strict JSON selecting exactly one approved fact ID, while
    the server—not the model—renders fixed English/Chinese facts, the complete six-part boundary,
    and commit-pinned citations. Verify the fact catalog SHA-256
    `804ffa4dd7e06850351af20421799903d589f259181e0618e42d40a651f59b90` covers every fact/source ID,
    summary, fixed English/Chinese sentence, and complete boundary; it must appear in the system
    payload and successful `X-Assistant-Fact-Catalog` header. Verify `application/json` and
    same-origin browser gates, the 24 KB streamed request cap, three-second total request-body read
    deadline, 64 KB streamed upstream cap, 18-second OpenRouter timeout, and zero automatic retries.
11. Run `npm run verify:assistant-public-sources -- --verify-remote` and confirm its 10-second remote
    timeouts and exact-tree checks: each allowlisted path must be a Git `blob` with mode `100644`,
    reviewed byte size, and reviewed full-file hash before its excerpt is accepted.
12. Verify the local scope gate uses a finite, enumerated allowlist of exact English and Chinese
    question templates. Matching may normalize only NFKC, straight/curly apostrophe form, case,
    surrounding/repeated whitespace, and trailing English/Chinese sentence punctuation. Every p1
    alias and all remaining wording must be fixed in the enumerated template set: there are no open
    natural-language slots, keyword-based intent matches, wildcard expansions, or free-form regex
    acceptance. The exact
    templates may route only to the four audited fixed facts: architecture/pipeline, failure
    reconciliation, evidence provenance/claim gating, and captured local-Mac reproduction. Any
    other p1 question, including a semantically similar non-allowlisted paraphrase, must return
    `fact_not_established` with zero rate-limit operations and zero model calls. Other-project slugs
    separated with spaces, hyphens, or underscores must all be refused locally. Verify model
    configuration and source-pack validation occur locally before any Upstash operation.

## 3. Obtain fresh, specific owner authorization

Present the owner with:

- candidate commit SHA and diff summary;
- full quality/evidence/security results;
- every public dataset and license/terms statement;
- exact list and hashes of new public binaries;
- the assistant policy revision, pinned public-source commit, exact three-path allowlist, source-pack
  SHA-256, fact-catalog SHA-256, and confirmation that request handling performs no runtime GitHub
  fetch;
- the machine-readable Goal2 binary manifest, including path, modified/new status, byte size, image
  dimensions, and SHA-256 for every changed binary;
- the destination `LucisZhang/portfolio-site:codex/portfolio-phase2`;
- confirmation that the Git-connected Vercel project is expected to create a non-production
  Preview automatically when this branch is pushed;
- confirmation that this approval does **not** merge PR #1, deploy production, or change aliases.

Proceed only after the owner explicitly authorizes both the exact candidate push/destination and
the expected automatic non-production Preview. These remain separate owner decisions even though
the current Git integration couples their execution. If only the push is authorized, stop: changing
Vercel configuration to suppress the automatic Preview would be a third external action requiring
its own review. Existing historical approval does not automatically cover the analytics source
datasets, pipeline outputs, macOS distributable, or new Preview.

Updating the public GitHub source pack is not covered by a portfolio candidate push approval.
After the planned `p1-reliability-lab` GitHub update is public, select an exact 40-character commit,
review the diff and evidence boundary, fetch only the allowlisted files anonymously, and update the
reviewed excerpts plus full-file/excerpt hashes and pack identity as one audited change. Run
`npm run verify:assistant-public-sources` and the explicit
`npm run verify:assistant-public-sources -- --verify-remote` check; require the 10-second timeout,
exact-tree `blob`/`100644`/size checks, full-file hashes, and excerpt hashes to pass. Then repeat the
assistant, build, Chrome, full E2E, and publication gates. Source refresh, repository publication,
and live model transmission each require their own authorization.

## 4. Publish the approved branch without rewriting history

After both push and Preview authorizations, fetch and recheck the remote, then use a normal
fast-forward push:

```sh
git fetch public codex/portfolio-phase2
git merge-base --is-ancestor public/codex/portfolio-phase2 <authorized-clean-candidate-sha>
git push public <authorized-clean-candidate-sha>:codex/portfolio-phase2
```

Do not substitute the integration branch or an unverified `HEAD` for the exact authorized clean
candidate SHA. Do not use `--force`, change repository visibility, create a release, or push to
`main` as part of this step. If the remote moved, stop and re-review the new delta.

Immediately inspect the deployment generated by the Git integration. It must be a non-production
Preview whose Git metadata records the exact authorized SHA. Stop if no new deployment appears, if
the SHA differs, or if Vercel reports a production target. Do not promote it or change any alias.

Before exercising the assistant in Preview, verify by variable **name and target only**—never by
printing values—that Preview has `OPENROUTER_API_KEY`, `UPSTASH_REDIS_REST_URL`, and
`UPSTASH_REDIS_REST_TOKEN`, plus an independent `ASSISTANT_RATE_LIMIT_HMAC_SECRET` containing at
least 32 UTF-8 bytes. The HMAC secret must not reuse the Upstash token and must never be printed or
sent to Upstash. `ASSISTANT_MODEL` may be absent and use the code-bound default; if it is present,
the owner must confirm it is exactly `moonshotai/kimi-k2.6`, because every other value fails
closed. Adding or changing any Vercel variable,
redeploying, or sending a live prompt remains a separate external action and requires its own
specific authorization. Preview, Production, `NODE_ENV=production`, or any environment with
`OPENROUTER_API_KEY` configured must fail closed if the URL, token, or valid dedicated HMAC secret
is missing; the in-memory fallback is acceptable only for local development without a model key
when all three rate-limit values are absent. Confirm the identifier sent to Upstash is the
`ip-hmac-v2` HMAC-SHA-256 pseudonym derived with the dedicated HMAC secret, never the raw IP, HMAC
secret, or Upstash token.

## 5. Verify anonymous public evidence

In a signed-out session, verify all of the following against the pushed commit SHA:

1. Repository root README, architecture diagram, screenshots, and this checklist render.
2. [`docs/EVIDENCE_INDEX.md`](EVIDENCE_INDEX.md) links resolve to the exact source, pipeline,
   provenance, command, and artifact entries it names.
3. Both analytics pipeline trees and their provenance are visible, while no raw input dataset is
   present anywhere in the public history.
4. All portfolio source links resolve without authentication. Confirm the Git-triggered Preview
   and destination feature branch expose the same reviewed commit. Do not call a source link
   anonymously available until the branch path exists and this check passes.
5. The Privacy Preflight download resolves anonymously, its published SHA-256 matches the file, and
   the documented right-click/Open and Privacy & Security/Open Anyway paths are accurate on an
   arm64 Mac.
6. PR #1 shows only the intended branch commits and remains mergeable.
7. After obtaining exact model-transmission authorization for the v12 packet, exercise exactly one
   bounded question in each locale against the committed policy and source pack:

   - `What does the Streaming Reliability Lab demonstrate, and what does it not prove?`
   - `流式可靠性实验室展示了什么？它不能证明什么？`

   Each success must contain one fixed server-rendered fact, the complete fixed boundary covering
   all six non-claims (production readiness, cloud scale, multi-node behavior, general hardware
   compatibility, continuous operation, and one-command reproducibility), and non-empty
   server-generated citations whose source IDs belong to the pack and whose GitHub URLs pin commit
   `7eab9c3fcdf73865b0ed6dd1266de1bfaccefcce`. Record the exact requested/returned model equality,
   `X-Assistant-Policy-Revision: public-github-p1-server-facts-v12`,
   `X-Assistant-Evidence-Mode: public-github-pinned-server-rendered`,
   `X-Assistant-Source-Pack: 2cee646acfd39b335a94fc651097dee913eea05ff97eea2761fc9b5b13e08deb`,
   `X-Assistant-Fact-Catalog: 804ffa4dd7e06850351af20421799903d589f259181e0618e42d40a651f59b90`,
   a valid `X-Assistant-Payload-SHA256`, and `X-Assistant-RateLimit-Mode: upstash-redis` without
   retaining the final question or excerpt text. Confirm that every outbound request contains the
   fixed selector instruction, all three pinned reviewed excerpts, and only that locale's final
   question; it must contain no prior conversation history. Confirm the model response is strict
   JSON selecting exactly one approved fact ID and contains no displayed prose. Do not retry either
   request automatically. Historical v5/v6 live acceptance and the v9 gated record do not establish
   v12 live acceptance.
8. Verify off-topic, NFKC/zero-width prompt-injection, mixed-scope, source-pack exfiltration,
   over-1,000-character, sensitive/personal, JD/role-fit, resume, other-project, multi-project, and
   project-unspecified requests are refused locally and do not reach OpenRouter. Verify the route
   accepts only `application/json` from same-origin browser requests, enforces the 24 KB streamed
   request cap and three-second total body-read deadline, enforces the 64 KB streamed upstream cap,
   and times out OpenRouter at 18 seconds. Verify
   malformed JSON, extra keys, zero/multiple/unknown fact IDs, prose, non-stop completions, tool
   calls, and a returned-model mismatch fail closed with no retry. Verify that an Upstash outage or
   missing Upstash/HMAC configuration in Preview/Production/model-key environments fails closed;
   do not weaken the route to an unreported memory limiter to make the smoke test pass. Confirm
   Upstash receives only the `ip-hmac-v2` pseudonym derived from the dedicated 32-byte-or-longer
   HMAC secret, not a raw IP, HMAC secret, or Upstash token.
9. Verify only the finite exact-question-template allowlist reaches rate limiting. After NFKC,
   straight/curly apostrophe, case, whitespace, and trailing-punctuation normalization, a
   non-allowlisted p1 question or paraphrase must return `fact_not_established` without consuming
   either Upstash or in-memory rate-limit state and without calling OpenRouter; no open
   natural-language slot may accept it.
   Repeat other-project slug rejection with space-, hyphen-, and underscore-separated forms. For
   an allowlisted p1 question, verify local model configuration and exact source-pack validation
   complete before the Upstash check.

Record the verification timestamp, commit SHA, anonymous URLs, and hash results in an owner-approved
durable execution record. That can be an external audit record or a separately authorized,
re-scanned post-push evidence-only commit. Do not amend or force-rewrite the frozen candidate merely
to make its pre-publication snapshot look current.

## 6. Keep merge, production, and alias actions separately gated

Merging PR #1, changing the production branch, deploying to Vercel production, changing aliases,
or publishing a GitHub Release each requires its own explicit owner authorization plus the current
`STATE.md` gate. Under the current Git connection, a feature-branch push is expected to create a
Preview, so do not push until both those decisions are authorized. Neither authorizes merge,
production deployment, promotion, alias changes, a release, or paid actions.

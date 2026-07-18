# Portfolio publication checklist

Updated: 2026-07-18 (Asia/Shanghai)

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
- The tested integration tree contains internal handoff/source-index material and is not a
  publication source. A publishable candidate must be a separate clean branch based exactly on
  `public/codex/portfolio-phase2`, with only the audited public delta applied. The current upgrade
  and its pipeline work are **not public** until a later authorized push succeeds.
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

## 3. Obtain fresh, specific owner authorization

Present the owner with:

- candidate commit SHA and diff summary;
- full quality/evidence/security results;
- every public dataset and license/terms statement;
- exact list and hashes of new public binaries;
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

Record the verification timestamp, commit SHA, anonymous URLs, and hash results in the publication
manifest.

## 6. Keep merge, production, and alias actions separately gated

Merging PR #1, changing the production branch, deploying to Vercel production, changing aliases,
or publishing a GitHub Release each requires its own explicit owner authorization plus the current
`STATE.md` gate. Under the current Git connection, a feature-branch push is expected to create a
Preview, so do not push until both those decisions are authorized. Neither authorizes merge,
production deployment, promotion, alias changes, a release, or paid actions.

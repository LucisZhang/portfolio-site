# Deployment guide for coding agents

This is the authoritative deployment topology for the portfolio. It replaces any earlier
Vercel-centric version of this guide: Vercel is now a fallback surface, not the deployment target.
The safety register below is not optional context — it is the same register any agent working in
this repository must already follow, restated for release work specifically.

## Safety register (read first)

- Never push, deploy, restart a remote service, change DNS, touch firewall/proxy configuration, or
  spend money without the matching human (owner) authorization gate already recorded in `STATE.md`.
- Local build/test success is not a deployment. Do not describe a change as "deployed," "live," or
  "in Production" unless a release was actually shipped through the process below and the served
  runtime commit was confirmed and recorded.
- Secrets (SSH keys, `/etc/portfolio-preview.env` contents, API keys, tokens) must never be pasted
  into chat, committed, printed to logs, or included in a receipt. Reference them by name only.
- Reference the production and audit hosts only by their local SSH config aliases (for example
  `portfolio-aliyun-deploy` for releases, and separate `audit`/`admin` aliases for other duties).
  Never record raw IP addresses or credentials in the repository, STATE.md, PUBLICATION.md, or any
  commit message.
- Every change destined for the public repository goes through a candidate branch and a normal
  pull request — no direct pushes to `main` or to the public remote's default branch.
- After any real release (Preview or Production), record the served runtime commit and the
  technical result in `STATE.md`, and update `PUBLICATION.md` if the change affects what a public
  reviewer would see. Do not claim owner acceptance in these files unless the owner actually
  reviewed the release; technical verification and owner acceptance are separate statuses.

## Topology

| Surface | URL | Host | Role |
| --- | --- | --- | --- |
| Production | `https://xiangguozhang.com` (apex + `www`) | Dedicated Singapore ECS, behind Nginx | Canonical, DNS-published |
| Preview | `https://preview.xiangguozhang.com` | Same dedicated Singapore ECS, separate service | Pre-Production review surface |
| Vercel fallback | `https://portfolio-site-seven-murex.vercel.app` | Vercel | Overseas fallback, auto-deploys from `public`/`main` pushes |

DNS for the apex and `www` is published through AliDNS. The dedicated ECS also runs an unrelated
legacy proxy service (`xray`/`x-ui`) on public `443`; portfolio releases must never touch that
listener, its firewall rules, or its credentials.

### Production (dedicated Singapore ECS)

- Runtime user: `portfolio` (no interactive login).
- Node application: loopback `127.0.0.1:3100`. Nginx in front: loopback `127.0.0.1:18080`.
- Secrets live only in root-owned `/etc/portfolio-preview.env` (mode `0640`, group `portfolio`).
- Pinned Node.js runtime: the official Linux x64 archive `node-v24.18.0-linux-x64.tar.xz`
  (SHA-256 `55aa7153f9d88f28d765fcdad5ae6945b5c0f98a36881703817e4c450fa76742`). Provisioning refuses
  any other bytes.
- Releases live at `/srv/portfolio/releases/<commit>` and are activated through an atomic
  `/srv/portfolio/current` symlink. No release is deleted automatically, so rollback targets remain
  available.
- `/api/assistant` responses are never cached; hashed `/_next/static/` assets receive immutable
  caching.

### Preview

Same dedicated ECS, a separate service and Nginx vhost bound to `preview.xiangguozhang.com`. New
releases are deployed to Preview first; the owner reviews Preview before the same release (or a
follow-up commit) is promoted to the apex.

### Vercel fallback

`portfolio-site-seven-murex.vercel.app` auto-deploys from pushes to the public repository's `main`
branch (and generates its own Preview deployments from pull requests against it). It requires no
manual release process and is not part of the VPS pipeline below. Treat it as the overseas
fallback and rollback source if the dedicated ECS is unavailable — see the appendix.

## Release pipeline (VPS Production and Preview)

All builds happen locally (or in CI); never build the application on the 1 GiB VPS itself.

1. **Start from a clean, immutable commit.** The release process refuses to build from a dirty
   worktree (`scripts/vps-release-lib.mjs` enforces this). Commit or stash all changes first.
2. **Build the release archive:**

   ```sh
   npm run build:vps -- --output-dir <local-output-dir>
   ```

   This runs `PORTFOLIO_STANDALONE=1 next build` (via `next.config.ts`'s `output: "standalone"`
   and `images.unoptimized` conditional), then packages the standalone server, `.next/static`,
   `public`, a commit/build-ID receipt, and a per-file SHA-256 manifest into
   `portfolio-<commit>.tar.gz`, plus a matching `.sha256` checksum file. Build output includes the
   archive path, byte size, SHA-256, file count, and total unpacked bytes as JSON.

3. **Verify the archive before it leaves the workstation:**

   ```sh
   npm run verify:vps-release -- <archive.tar.gz> <40-char-commit>
   ```

   This independently reads every archive entry, recomputes its hash, and confirms the manifest,
   commit, and file count agree. It must print `"verified": true` before the archive is trusted.

4. **Deploy to the target host (Preview first, then Production), after owner authorization for
   that specific release:**

   ```sh
   ops/vps/deploy-loopback.sh <ssh-host-alias> <archive.tar.gz> <commit>
   ```

   `<ssh-host-alias>` is the local SSH config alias for the release host (for example
   `portfolio-aliyun-deploy`), never a raw address. This uploads the one verified archive. The
   remote helper (`/usr/local/sbin/portfolio-release`) re-checks the archive's SHA-256 and path
   safety, refuses to overwrite an existing immutable release, atomically switches the
   `/srv/portfolio/current` symlink, restarts only the portfolio service (never the proxy or any
   unrelated service), and health-checks the result. A failed health check automatically restores
   the previous target.

5. **Rollback**, if a released commit needs to be reverted, is a single remote command against the
   already-installed previous release:

   ```sh
   sudo /usr/local/sbin/portfolio-rollback
   ```

   It swaps `current`/`previous`, restarts only the portfolio service, health-checks the result,
   and restores the original target automatically if the rollback target is unhealthy.

6. **Record the outcome.** After any real deploy or rollback, note the served runtime commit, the
   archive SHA-256, and the technical verification result in `STATE.md`. Do not claim a release is
   "live" without this record, and do not conflate technical verification with owner acceptance.

### Local verification before shipping tooling changes

Any change to `ops/vps/`, `scripts/build-vps-release.mjs`, `scripts/verify-vps-release.mjs`, or
`scripts/vps-release-lib.mjs` must pass:

```sh
npm run verify:vps-ops
```

This runs `node --test tests/vps/*.test.mjs`, which exercises the dedicated-host Nginx renderer,
the dedicated-preview audit preflight, and the quick-tunnel isolation contract against mocked/
static fixtures — no network access or real host required.

## Local gate list for a normal site change

A site change (application code, not release tooling) is not complete until all applicable checks
pass locally:

```sh
npm run typecheck
npm run lint
npm run verify:evidence
npm run test:e2e
npm audit --omit=dev
```

The homepage Lighthouse performance score must remain at least 90 (see
`docs/lighthouse-homepage-20260712.json` for the recorded baseline). Passing these gates locally
is a precondition for opening a pull request — it is not itself a deployment, and it does not
license a push, a release build, or a claim that the change is live anywhere.

## Public repository discipline

- All work destined for the public repository happens on a dedicated candidate branch, never
  directly on `main` or on the public remote's default branch.
- Candidate branches go through a normal pull request for review before merge.
- The live site (Production and Preview) tracks the `public` remote, not `origin`. Confirm which
  remote a branch is pointed at before assuming a push affects any deployed surface.
- Repository renames and other structural changes to public project repositories require the same
  owner authorization as any other external action.

## Secret handling

- Never read `.npmrc` or other npm config files directly; use `npm config get <key>` if a value is
  genuinely needed.
- Required secret names for the VPS environment file are documented separately (see
  `docs/assistant-operations.md` if present); values must be transferred through a secure
  local-to-server path and must never be pasted into chat, committed, printed, or logged.
- SSH host aliases exist locally for different duties — `portfolio-aliyun-deploy` for releases,
  separate `audit`/`admin` aliases for other operations. Use the alias that matches the action;
  never widen access by reusing a release alias for unrelated administrative work.

## Receipt discipline (STATE.md / PUBLICATION.md)

- `STATE.md` is the recruiter-safe technical state record: it must record the served runtime
  commit after each real release, the archive verification result, and whether the change reached
  Preview, Production, or both. It must contain no credentials, raw host addresses, or
  private/local-only material.
- `PUBLICATION.md` and `docs/PUBLICATION_CHECKLIST.md` track what has actually been made visible
  to a public reviewer; update them only when a change genuinely changes that visible surface.
- Keep "owner accepted" language distinct from "technically verified" language in both files —
  they are different states with different authorization requirements, matching the pattern
  already established for prior VPS Preview/Production launches.

## Appendix: Vercel fallback

`portfolio-site-seven-murex.vercel.app` is the overseas fallback and a rollback source if the
dedicated Singapore ECS becomes unavailable. It is not the primary deployment target:

- It auto-deploys from pushes to the public repository's `main` branch; no manual release step is
  required or supported for it.
- Vercel Preview deployments are generated automatically from pull requests against the public
  repository and are separate from the dedicated `preview.xiangguozhang.com` surface described
  above.
- Do not use Vercel deployment status as evidence that the dedicated Singapore Production or
  Preview surfaces are healthy, or vice versa — they are independent and must be checked
  separately.

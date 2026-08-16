# VPS Preview operations

This directory defines the Stage 2A loopback-only mirror for the portfolio. It does not publish a
new public endpoint, alter Vercel Production, or share ports with the existing `xray`/`x-ui`
service.

## Fixed boundary

- Source: a clean, immutable 40-character Git commit descended from the audited public `main`.
- Build: local or CI with `PORTFOLIO_STANDALONE=1`; never build the application on the 1 GB VPS.
- Runtime user: `portfolio`, with no interactive login.
- Node: `127.0.0.1:3100`; Nginx: `127.0.0.1:18080`.
- Existing proxy ports, including public `443`, are untouched.
- `/api/assistant` is never cached. Hashed `/_next/static/` assets receive immutable caching.
- Secrets live only in root-owned `/etc/portfolio-preview.env` (`0640`, group `portfolio`).
- Releases live at `/srv/portfolio/releases/<commit>` and are activated through an atomic
  `/srv/portfolio/current` symlink. No release is deleted automatically.

## Pinned Node.js runtime

The server uses the official Linux x64 archive `node-v24.18.0-linux-x64.tar.xz`, SHA-256
`55aa7153f9d88f28d765fcdad5ae6945b5c0f98a36881703817e4c450fa76742`. Provisioning refuses any
other bytes.

## Local release

From a clean commit:

```sh
npm run build:vps -- --output-dir /private/tmp/portfolio-vps-artifacts
npm run verify:vps-release -- \
  /private/tmp/portfolio-vps-artifacts/portfolio-<commit>.tar.gz <commit>
```

The archive contains the complete Next.js standalone server, `.next/static`, `public`, a commit
and build-ID receipt, and a per-file SHA-256 manifest.

## Provisioning contract

`provision-loopback.sh` is run as root only after the official Node archive and this directory are
uploaded. It installs Nginx without allowing the package default server to start, removes only the
new package's default-site symlink, installs the loopback configuration, creates the isolated user,
and starts only the loopback Nginx listener. It deliberately leaves the portfolio service failed
closed until the environment file and first release exist.

Required secret names are documented in `docs/assistant-operations.md`. Values must be transferred
through a secure local-to-server path and must never be pasted into chat, committed, printed, or
included in deployment logs.

## Deploy, inspect, and rollback

`deploy-loopback.sh <ssh-host> <archive> <commit>` uploads one verified archive. The remote helper
checks the archive SHA-256 and path safety, refuses to overwrite an existing immutable release,
switches the current symlink atomically, restarts only `portfolio-preview.service`, and verifies
the Nginx loopback health path. A failed health check restores the former target automatically.

The explicit rollback command is:

```sh
sudo /usr/local/sbin/portfolio-rollback
```

It swaps `current` and `previous`, restarts only the portfolio service, health-checks the result,
and restores the original target if the rollback target is unhealthy.

For Stage 2A review, access the mirror only through an SSH tunnel:

```sh
ssh -N -L 18080:127.0.0.1:18080 <ssh-host>
```

Then test `http://127.0.0.1:18080`. Public exposure, HTTPS, firewall changes, domain/DNS work,
sharing `443`, and three-carrier validation remain separate human gates.

## Stage 2B public Preview gate

The 2026-07-25 read-only edge audit found one global IPv4 address, no global IPv6 address, and an
existing non-HTTP proxy listener on public `443`. Port `80` was free, but plaintext HTTP is not an
acceptable full-site Preview because assistant questions and responses must not cross the network
unencrypted. Do not bind Nginx to public `80` or `443`, replace the proxy listener, or assume that
an ordinary TLS browser request will reach the loopback site.

The least invasive no-domain experiment is a temporary outbound-only HTTPS tunnel from a separate
service to `http://127.0.0.1:18080`. A Cloudflare Quick Tunnel is one candidate because it assigns a
random `trycloudflare.com` test hostname and requires no inbound listener or DNS purchase. It is a
development service with no SLA, a 200 in-flight-request limit, and no Server-Sent Events support;
the portfolio does not use SSE, but the URL must still be treated as temporary. Cloudflare's China
Network is a separate Enterprise/ICP product, so a Quick Tunnel must earn its Mainland suitability
through actual China Telecom, China Unicom, and China Mobile tests rather than an architectural
claim. See the official [Quick Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/)
and [China Network](https://developers.cloudflare.com/china-network/) documentation.

Starting that experiment is a separate owner gate because it installs a third-party binary,
accepts the provider's license/terms, creates outbound connections, and makes the Preview publicly
reachable. If authorized, pin and checksum the binary, run it under its own non-login user and
systemd unit with a memory limit, retain only the generated public URL in the test receipt, and
verify that it cannot read `/etc/portfolio-preview.env`. Rollback is to stop/disable only the tunnel
unit and remove its binary/config; the loopback Nginx, Node service, proxy service, firewall, Vercel,
and release symlinks remain unchanged.

The prepared Stage 2B runtime pins the official Linux AMD64 `cloudflared` 2026.7.2 binary to
SHA-256 `ec905ea7b7e327ff8abdde8cb64697a2152de74dbcdbf6aec9db8364eb3886cd`, as published in the
official [2026.7.2 release](https://github.com/cloudflare/cloudflared/releases/tag/2026.7.2). It adds
a second loopback-only Nginx ingress on `127.0.0.1:18081` so Cloudflare's authenticated edge header
can feed the assistant's existing server-side HMAC limiter without changing the SSH-only `18080`
path. `provision-quick-tunnel.sh` installs the checksum-verified binary, unit, ingress, and start/
stop helpers but deliberately leaves the tunnel disabled and stopped. The separately gated start
command is `/usr/local/sbin/portfolio-preview-tunnel-start`; immediate rollback is
`/usr/local/sbin/portfolio-preview-tunnel-stop`.

Before any server-side gate, verify the scripts' fail-closed control flow with:

```sh
npm run verify:vps-ops
```

The command uses mocked system tools and never connects to or mutates the VPS. It covers checksum
rejection before installation, disabled provisioning, explicit start, public-health failure
cleanup, explicit stop, loopback health preservation, proxy-process invariants, and static
listener/resource/secret-isolation constraints. It does not replace real Nginx/systemd validation
or the public Preview acceptance run.

The temporary tunnel is not the final hosting decision. After the owner obtains a domain, the
safest zero-proxy-impact Production path is a separate VPS or a separate public IP with normal
HTTPS. Sharing the current single-IP `443` would require an explicitly approved proxy-fronting or
REALITY-target/fallback migration, client compatibility tests, a configuration backup, a
maintenance window, and an independent proxy rollback. The current Stage 2A evidence does not
authorize or validate that invasive path.

## Dedicated Asia Preview trial

The next-host purchase, isolation, A/B, physical-device, carrier, acceptance, and exit contract is
recorded in
[`docs/vps-asia-preview-trial-plan-20260725.md`](../../docs/vps-asia-preview-trial-plan-20260725.md).
It deliberately reuses the exact Stage 2D archive before any further application change so hosting
and network effects can be measured independently. This link does not authorize a purchase, DNS
record, public listener, certificate request, or mutation of the existing US VPS.

After a dedicated instance exists and before installing anything, upload and run
`audit-dedicated-preview.sh`. It is read-only and reports only the minimum OS/resources, public
listener counts, failed-unit count, and outbound DNS/HTTPS readiness; it deliberately never prints
the host's address, hostname, listener owner, or command line. Any blocker stops provisioning.

After the domain, DNS Preview record, certificate request, and public-listener changes receive
their later gates, render—not install—the dedicated Nginx inputs locally:

```sh
node ops/vps/render-dedicated-nginx.mjs \
  preview.xiangguozhang.com /private/tmp/portfolio-dedicated-nginx
```

The renderer accepts only a lowercase ASCII FQDN, writes private `0600` files, and marks its JSON
receipt `installationAuthorized: false`. The public block terminates TLS and overwrites spoofable
visitor-address headers before a new `127.0.0.1:18082` ingress applies the existing static-cache
and assistant-`no-store` boundaries. Neither rendered file is installed by this command. The
existing US-VPS provisioners do not reference the dedicated public configuration.

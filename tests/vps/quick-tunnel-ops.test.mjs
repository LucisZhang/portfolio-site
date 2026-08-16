import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const opsRoot = join(repositoryRoot, "ops/vps");
const shell = existsSync("/bin/dash") ? "/bin/dash" : "/bin/sh";

function createHarness(scenario = "success") {
  const root = mkdtempSync(join(tmpdir(), "portfolio-tunnel-ops-"));
  const bin = join(root, "bin");
  const state = join(root, "state");
  const log = join(root, "calls.log");
  mkdirSync(bin);
  mkdirSync(state);
  const dispatcher = join(bin, "mock-command");
  writeFileSync(dispatcher, `#!/bin/sh
set -eu
command_name=$(basename "$0")
printf '%s' "$command_name" >>"$MOCK_LOG"
for argument in "$@"; do printf ' <%s>' "$argument" >>"$MOCK_LOG"; done
printf '\n' >>"$MOCK_LOG"
case "$command_name" in
  id)
    if [ "\${1:-}" = "-u" ]; then printf '0\\n'; exit 0; fi
    if [ "\${1:-}" = "portfolio-tunnel" ]; then exit 1; fi
    exit 0
    ;;
  sha256sum)
    cat >/dev/null
    [ "$MOCK_SCENARIO" = "checksum-fail" ] && exit 1
    exit 0
    ;;
  systemctl)
    action=\${1:-}
    case "$action" in
      show)
        case " $* " in
          *" MainPID "*) printf '364670\\n' ;;
          *" ExecMainStartTimestamp "*) printf 'Thu 2026-07-23 15:30:15 UTC\\n' ;;
        esac
        exit 0
        ;;
      is-active)
        unit=\${3:-\${2:-}}
        if [ "$unit" = "portfolio-preview-tunnel.service" ]; then
          [ -f "$MOCK_STATE/tunnel-active" ] || exit 3
        fi
        exit 0
        ;;
      is-enabled)
        exit 1
        ;;
      start)
        : >"$MOCK_STATE/tunnel-active"
        exit 0
        ;;
      stop)
        rm -f "$MOCK_STATE/tunnel-active"
        exit 0
        ;;
      *) exit 0 ;;
    esac
    ;;
  journalctl)
    [ "$MOCK_SCENARIO" = "no-url" ] && exit 0
    [ -f "$MOCK_STATE/tunnel-active" ] && printf 'INF +https://bounded-preview.trycloudflare.com\\n'
    exit 0
    ;;
  curl)
    for argument in "$@"; do
      case "$argument" in
        https://*.trycloudflare.com/*)
          [ "$MOCK_SCENARIO" = "public-health-fail" ] && exit 22
          ;;
      esac
    done
    exit 0
    ;;
  runuser) exit 1 ;;
  pidof) printf '364716\\n'; exit 0 ;;
  date) printf '1784957000\\n'; exit 0 ;;
  ss|nginx|useradd|install|getent|sleep) exit 0 ;;
  *) printf 'unexpected mock command: %s\\n' "$command_name" >&2; exit 99 ;;
esac
`, { mode: 0o755 });
  chmodSync(dispatcher, 0o755);
  for (const command of [
    "curl", "date", "getent", "id", "install", "journalctl", "nginx", "pidof", "runuser",
    "sha256sum", "sleep", "ss", "systemctl", "useradd",
  ]) symlinkSync("mock-command", join(bin, command));
  return {
    root,
    state,
    log,
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      MOCK_LOG: log,
      MOCK_SCENARIO: scenario,
      MOCK_STATE: state,
    },
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

function runScript(script, args, harness) {
  return spawnSync(shell, [join(opsRoot, script), ...args], {
    cwd: repositoryRoot,
    env: harness.env,
    encoding: "utf8",
  });
}

test("provisioning installs only the disabled isolated tunnel surface", () => {
  const harness = createHarness();
  try {
    const binary = join(harness.root, "cloudflared-linux-amd64");
    writeFileSync(binary, "mock pinned binary");
    const result = runScript("provision-quick-tunnel.sh", [binary], harness);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /disabled Quick Tunnel runtime/u);
    const calls = readFileSync(harness.log, "utf8");
    assert.match(calls, /useradd <--system> <--user-group>/u);
    assert.match(calls, /install .*<\/opt\/cloudflared-2026\.7\.2\/cloudflared>/u);
    assert.match(calls, /systemctl <reload> <nginx>/u);
    assert.doesNotMatch(calls, /systemctl <(?:start|restart|stop)> <(?:x-ui|xray)/u);
    assert.doesNotMatch(calls, /systemctl <start> <portfolio-preview-tunnel\.service>/u);
  } finally {
    harness.cleanup();
  }
});

test("provisioning rejects a checksum mismatch before any installation", () => {
  const harness = createHarness("checksum-fail");
  try {
    const binary = join(harness.root, "cloudflared-linux-amd64");
    writeFileSync(binary, "wrong binary");
    const result = runScript("provision-quick-tunnel.sh", [binary], harness);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /checksum mismatch/u);
    const calls = readFileSync(harness.log, "utf8");
    assert.doesNotMatch(calls, /^(?:install|useradd|nginx|systemctl) /mu);
  } finally {
    harness.cleanup();
  }
});

test("explicit start returns the temporary URL without touching the proxy", () => {
  const harness = createHarness();
  try {
    const result = runScript("portfolio-preview-tunnel-start", [], harness);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /public_preview_url=https:\/\/bounded-preview\.trycloudflare\.com/u);
    assert.match(result.stdout, /proxy_unchanged=yes/u);
    assert.equal(existsSync(join(harness.state, "tunnel-active")), true);
    const calls = readFileSync(harness.log, "utf8");
    assert.match(calls, /systemctl <start> <portfolio-preview-tunnel\.service>/u);
    assert.match(calls, /curl <--doh-url> <https:\/\/cloudflare-dns\.com\/dns-query>/u);
    assert.doesNotMatch(calls, /systemctl <(?:restart|stop)> <(?:x-ui|xray)/u);
  } finally {
    harness.cleanup();
  }
});

test("a failed public health check automatically stops the tunnel", () => {
  const harness = createHarness("public-health-fail");
  try {
    const result = runScript("portfolio-preview-tunnel-start", [], harness);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /public tunnel health check failed/u);
    assert.equal(existsSync(join(harness.state, "tunnel-active")), false);
    const calls = readFileSync(harness.log, "utf8");
    assert.match(calls, /systemctl <stop> <portfolio-preview-tunnel\.service>/u);
  } finally {
    harness.cleanup();
  }
});

test("explicit stop removes public exposure while preserving loopback health", () => {
  const harness = createHarness();
  try {
    writeFileSync(join(harness.state, "tunnel-active"), "active");
    const result = runScript("portfolio-preview-tunnel-stop", [], harness);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(existsSync(join(harness.state, "tunnel-active")), false);
    const calls = readFileSync(harness.log, "utf8");
    assert.match(calls, /curl .*<http:\/\/127\.0\.0\.1:18080\/_vps\/health>/u);
    assert.doesNotMatch(calls, /systemctl <(?:restart|stop)> <(?:x-ui|xray)/u);
  } finally {
    harness.cleanup();
  }
});

test("static tunnel configuration stays loopback-only and bounded", () => {
  const nginx = readFileSync(join(opsRoot, "nginx-portfolio-preview-tunnel.conf"), "utf8");
  const unit = readFileSync(join(opsRoot, "portfolio-preview-tunnel.service"), "utf8");
  const provision = readFileSync(join(opsRoot, "provision-quick-tunnel.sh"), "utf8");
  const loopbackProvision = readFileSync(join(opsRoot, "provision-loopback.sh"), "utf8");
  const release = readFileSync(join(opsRoot, "portfolio-release"), "utf8");
  assert.deepEqual(
    [...nginx.matchAll(/^\s*listen\s+([^;]+);/gmu)].map((match) => match[1]),
    ["127.0.0.1:18081"],
  );
  assert.match(nginx, /location \/api\/assistant[\s\S]*?proxy_cache off;[\s\S]*?no-store/u);
  for (const assetPrefix of ["duckdb", "generated/privacy-ocr", "generated/privacy-pdf", "case-studies"]) {
    assert.match(nginx, new RegExp(`location \\^~ \\/${assetPrefix.replaceAll("/", "\\/")}\\/`, "u"));
  }
  assert.match(nginx, /root \/srv\/portfolio\/current\/public;/u);
  assert.match(nginx, /gzip_static on;/u);
  assert.match(nginx, /application\/javascript js mjs;/u);
  assert.match(nginx, /application\/wasm wasm;/u);
  assert.match(nginx, /max-age=86400, stale-while-revalidate=604800/u);
  assert.match(nginx, /X-Real-IP \$http_cf_connecting_ip/u);
  assert.match(nginx, /CF-Connecting-IP ""/u);
  assert.match(unit, /^User=portfolio-tunnel$/mu);
  assert.match(unit, /^MemoryMax=128M$/mu);
  assert.match(unit, /--protocol http2 --url http:\/\/127\.0\.0\.1:18081/u);
  assert.doesNotMatch(provision, /systemctl enable/u);
  assert.doesNotMatch(provision, /\b(?:ufw|iptables|nft)\b/u);
  assert.match(provision, /test -r \/etc\/portfolio-preview\.env/u);
  assert.match(loopbackProvision, /chmod 0751 "\$BASE" "\$BASE\/releases"/u);
  assert.match(release, /chmod -R u=rwX,g=rX,o= "\$incoming\/release"/u);
  assert.match(release, /chmod -R o=rX "\$incoming\/release\/public"/u);
});

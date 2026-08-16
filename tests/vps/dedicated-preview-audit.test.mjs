import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
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
const script = join(repositoryRoot, "ops/vps/audit-dedicated-preview.sh");
const shell = "/bin/sh";

function createHarness(scenario = "pass") {
  const root = mkdtempSync(join(tmpdir(), "portfolio-dedicated-audit-"));
  const bin = join(root, "bin");
  const proc = join(root, "proc");
  const etc = join(root, "etc");
  const disk = join(root, "disk");
  mkdirSync(bin);
  mkdirSync(proc);
  mkdirSync(etc);
  mkdirSync(disk);
  writeFileSync(join(proc, "meminfo"), "MemTotal:       2048000 kB\n");
  writeFileSync(join(etc, "os-release"), 'ID=ubuntu\nVERSION_ID="24.04"\n');

  const dispatcher = join(bin, "mock-command");
  writeFileSync(dispatcher, `#!/bin/sh
set -eu
name=$(basename "$0")
case "$name" in
  uname) printf 'x86_64\\n' ;;
  getconf) printf '2\\n' ;;
  df) printf 'Filesystem 1024-blocks Used Available Capacity Mounted on\\nmock 41943040 1024 41942016 1%% /\\n' ;;
  ss)
    case " $* " in
      *" :443 "*) [ "$MOCK_SCENARIO" = "busy-443" ] && printf 'LISTEN mock\\n' ;;
    esac
    ;;
  systemctl) [ "$MOCK_SCENARIO" = "failed-unit" ] && printf 'mock.service failed\\n' ;;
  getent|curl) [ "$MOCK_SCENARIO" != "network-fail" ] ;;
  *) printf 'unexpected mock command: %s\\n' "$name" >&2; exit 99 ;;
esac
`, { mode: 0o755 });
  chmodSync(dispatcher, 0o755);
  for (const command of ["curl", "df", "getconf", "getent", "ss", "systemctl", "uname"]) {
    symlinkSync("mock-command", join(bin, command));
  }

  return {
    root,
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      MOCK_SCENARIO: scenario,
      PORTFOLIO_AUDIT_PROC_ROOT: proc,
      PORTFOLIO_AUDIT_ETC_ROOT: etc,
      PORTFOLIO_AUDIT_ROOT_MOUNT: disk,
    },
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

function runAudit(harness) {
  return spawnSync(shell, [script], {
    cwd: repositoryRoot,
    env: harness.env,
    encoding: "utf8",
  });
}

test("dedicated-host preflight passes a clean minimum host without printing an address", () => {
  const harness = createHarness();
  try {
    const result = runAudit(harness);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /architecture=x86_64/u);
    assert.match(result.stdout, /cpu_count=2/u);
    assert.match(result.stdout, /memory_kib=2048000/u);
    assert.match(result.stdout, /listeners_80=0/u);
    assert.match(result.stdout, /listeners_443=0/u);
    assert.match(result.stdout, /outbound_dns=yes/u);
    assert.match(result.stdout, /outbound_https=yes/u);
    assert.match(result.stdout, /audit_status=pass/u);
    assert.doesNotMatch(result.stdout, /(?:[0-9]{1,3}\.){3}[0-9]{1,3}/u);
  } finally {
    harness.cleanup();
  }
});

test("dedicated-host preflight blocks an occupied public 443", () => {
  const harness = createHarness("busy-443");
  try {
    const result = runAudit(harness);
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /listeners_443=1/u);
    assert.match(result.stdout, /blocker=port_443_in_use/u);
    assert.match(result.stdout, /audit_status=blocked/u);
  } finally {
    harness.cleanup();
  }
});

test("dedicated-host preflight is statically read-only and redacts network identity", () => {
  const source = readFileSync(script, "utf8");
  assert.doesNotMatch(
    source,
    /\b(?:apt|apt-get|dnf|yum|apk|brew|useradd|groupadd|install|rm|mv|cp|chmod|chown|tee)\b/u,
  );
  assert.doesNotMatch(source, /systemctl\s+(?:start|stop|restart|reload|enable|disable)/u);
  assert.doesNotMatch(source, /\b(?:ufw|iptables|ip6tables|nft)\b/u);
  assert.doesNotMatch(source, /(?:ifconfig|ip\s+(?:address|addr)|hostname\s+-I|icanhazip|ipify)/u);
  assert.match(source, /ss -ltnH "sport = :\$port"/u);
  assert.match(source, /audit_status=blocked/u);
});

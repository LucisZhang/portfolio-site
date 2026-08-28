import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const opsRoot = join(repositoryRoot, "ops/vps");
const renderer = join(opsRoot, "render-dedicated-nginx.mjs");

test("dedicated HTTPS renderer accepts only a safe FQDN and creates private local output", () => {
  const root = mkdtempSync(join(tmpdir(), "portfolio-dedicated-nginx-"));
  const output = join(root, "rendered");
  try {
    const result = spawnSync(process.execPath, [renderer, "preview.xiangguozhang.com", output], {
      cwd: repositoryRoot,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    const receipt = JSON.parse(result.stdout);
    assert.equal(receipt.hostname, "preview.xiangguozhang.com");
    assert.equal(receipt.installationAuthorized, false);

    const publicConfig = readFileSync(join(output, "portfolio-preview-public.conf"), "utf8");
    const ingressConfig = readFileSync(join(output, "portfolio-preview-dedicated-ingress.conf"), "utf8");
    assert.doesNotMatch(publicConfig, /__PREVIEW_HOST__/u);
    assert.match(publicConfig, /server_name preview\.xiangguozhang\.com;/u);
    assert.match(publicConfig, /listen 443 ssl http2;/u);
    assert.doesNotMatch(publicConfig, /listen \[::\]/u);
    assert.match(publicConfig, /Strict-Transport-Security "max-age=300"/u);
    assert.match(publicConfig, /proxy_set_header X-Portfolio-Client-IP \$remote_addr;/u);
    assert.match(publicConfig, /proxy_set_header X-Forwarded-For "";/u);
    assert.match(publicConfig, /location = \/_vps\/health[\s\S]*?return 404;/u);
    assert.match(publicConfig, /proxy_pass http:\/\/127\.0\.0\.1:18082;/u);
    assert.match(ingressConfig, /listen 127\.0\.0\.1:18082;/u);
    assert.match(ingressConfig, /location \/api\/assistant[\s\S]*?proxy_cache off;[\s\S]*?no-store/u);
    assert.match(ingressConfig, /proxy_set_header X-Real-IP \$http_x_portfolio_client_ip;/u);
    assert.match(ingressConfig, /proxy_set_header X-Portfolio-Client-IP "";/u);
    assert.equal(statSync(output).mode & 0o777, 0o700);
    assert.equal(statSync(join(output, "portfolio-preview-public.conf")).mode & 0o777, 0o600);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("dedicated HTTPS renderer rejects unsafe names before creating output", () => {
  for (const hostname of [
    "HTTPS://preview.xiangguozhang.com",
    "Preview.xiangguozhang.com",
    "127.0.0.1",
    "preview_xiangguozhang.com",
    "preview.xiangguozhang.com;include",
    "localhost",
  ]) {
    const root = mkdtempSync(join(tmpdir(), "portfolio-invalid-nginx-"));
    try {
      const result = spawnSync(process.execPath, [renderer, hostname, join(root, "output")], {
        cwd: repositoryRoot,
        encoding: "utf8",
      });
      assert.notEqual(result.status, 0, hostname);
      assert.match(result.stderr, /lowercase ASCII FQDN/u);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
});

test("dedicated public listener is isolated from current-US-VPS provisioning", () => {
  const publicTemplate = readFileSync(
    join(opsRoot, "nginx-portfolio-preview-dedicated-public.conf.template"),
    "utf8",
  );
  const existingProvision = readFileSync(join(opsRoot, "provision-loopback.sh"), "utf8");
  const existingTunnelProvision = readFileSync(join(opsRoot, "provision-quick-tunnel.sh"), "utf8");
  assert.match(publicTemplate, /__PREVIEW_HOST__/u);
  assert.doesNotMatch(existingProvision, /dedicated-public/u);
  assert.doesNotMatch(existingTunnelProvision, /dedicated-public/u);
});

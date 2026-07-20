import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

function option(name, fallback = null) {
  const prefix = `--${name}=`;
  const match = args.find((argument) => argument.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

const outputValue = option("output");
if (!outputValue) throw new Error("--output=<path> is required.");
const outputPath = resolve(repoRoot, outputValue);
const lighthouseVersion = option("lighthouse-version", "13.4.0");
const chromeVersion = option("chrome-version");
if (!chromeVersion) throw new Error("--chrome-version=<exact installed version> is required.");

const runtimeTreeDigest = JSON.parse(
  execFileSync(process.execPath, ["scripts/runtime-tree-fingerprint.mjs"], {
    cwd: repoRoot,
    encoding: "utf8",
  }),
);
const binding = {
  schemaVersion: 1,
  preparedAtUtc: new Date().toISOString(),
  runtimeTreeDigest,
  baseUrl: "http://127.0.0.1:4173",
  lighthouseVersion,
  chromeVersion,
  routes: {
    home: "/",
    margin: "/analytics/margin-control-tower",
    privacy: "/ai/privacy-preflight-mac",
    release: "/ai/release-guardian",
  },
  purpose: "Bind the first single-pass four-route Lighthouse sequence to the exact pre-run runtime and installed Chrome version.",
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(binding, null, 2)}\n`, "utf8");
process.stdout.write(`LIGHTHOUSE_RUN_BINDING_WRITE_PASS digest=${runtimeTreeDigest.sha256}\n`);

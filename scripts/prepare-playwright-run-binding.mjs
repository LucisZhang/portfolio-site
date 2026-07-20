import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
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
const channel = option("channel", process.env.PLAYWRIGHT_CHANNEL || "chrome");
const rawReportBasename = option("raw-basename", "playwright-raw.json");
if (rawReportBasename.includes("/") || rawReportBasename.includes("\\")) {
  throw new Error("--raw-basename must be a basename, not a path.");
}

const runtimeTreeDigest = JSON.parse(
  execFileSync(process.execPath, ["scripts/runtime-tree-fingerprint.mjs"], {
    cwd: repoRoot,
    encoding: "utf8",
  }),
);

function collectTestInventory(suites) {
  const entries = [];
  function visit(suite) {
    for (const spec of suite?.specs || []) {
      for (const test of spec?.tests || []) {
        if (typeof spec?.id !== "string" || typeof test?.projectName !== "string") {
          throw new Error("Playwright --list output contains a test without a stable id or project name.");
        }
        entries.push(JSON.stringify([spec.id, test.projectName]));
      }
    }
    for (const child of suite?.suites || []) visit(child);
  }
  for (const suite of suites || []) visit(suite);
  entries.sort();
  if (entries.length === 0 || new Set(entries).size !== entries.length) {
    throw new Error("Playwright --list must produce a non-empty, unique full-suite inventory.");
  }
  const serialized = `${entries.join("\n")}\n`;
  return {
    count: entries.length,
    sha256: createHash("sha256").update(serialized).digest("hex"),
  };
}

const playwrightList = JSON.parse(
  execFileSync(
    resolve(repoRoot, "node_modules/.bin/playwright"),
    ["test", "--list", "--reporter=json"],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, PLAYWRIGHT_CHANNEL: channel },
      maxBuffer: 64 * 1024 * 1024,
    },
  ),
);
const fullTestInventory = collectTestInventory(playwrightList.suites);

const binding = {
  schemaVersion: 1,
  preparedAtUtc: new Date().toISOString(),
  runtimeTreeDigest,
  browserChannel: channel,
  baseUrl: "http://127.0.0.1:4173",
  rawReportBasename,
  fullTestInventory,
  purpose: "Bind one serialized Playwright run to the exact pre-run runtime tree and configured installed-browser channel.",
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(binding, null, 2)}\n`, "utf8");
process.stdout.write(`PLAYWRIGHT_RUN_BINDING_WRITE_PASS digest=${runtimeTreeDigest.sha256} tests=${fullTestInventory.count}\n`);

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Task 1.2 (homepage seven-exhibit rebuild): exhibit 06 ("HOW THIS SITE IS
// BUILT AND CHECKED") needs receipt values — release.json / EOD manifest /
// privacy manifest SHA-256, an explicitly reviewed content date, and a
// gate-status line — values the task 1.1 adapter
// (generate-home-data.mjs -> home-stats.json) does not carry. This is a
// second, independently-attributed generator producing its own committed
// output, following the exact same discipline: every number a component
// shows comes from a generated file, never a literal in the component.
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(repositoryRoot, "src/data/generated/home-receipts.json");

const sources = {
  releaseJson: "public/case-studies/frontier-forge/release.json",
  eodManifest: "public/case-studies/exactly-once-drills/results/manifest.json",
  privacyManifest: "public/case-studies/privacy-preflight/manifest.json",
};

async function sha256(repositoryRelativePath) {
  const contents = await readFile(path.join(repositoryRoot, repositoryRelativePath));
  return createHash("sha256").update(contents).digest("hex");
}

function currentGateStatus() {
  try {
    const output = execFileSync("node", ["scripts/verify-r2-sources.mjs"], {
      cwd: repositoryRoot,
      encoding: "utf8",
    });
    const line = output.trim().split(/\r?\n/).pop();
    return line ?? "verify:r2-sources produced no output";
  } catch (error) {
    const message = error instanceof Error ? error.message.split("\n")[0] : String(error);
    return `verify:r2-sources failed: ${message}`;
  }
}

function requestedContentDate() {
  const flag = "--content-updated-at";
  const index = process.argv.indexOf(flag);
  const value = index >= 0 ? process.argv[index + 1] : "";
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    throw new Error(`${flag} requires an explicit YYYY-MM-DD review date`);
  }
  const normalized = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(`${value}T00:00:00+08:00`));
  if (normalized !== value) throw new Error(`${flag} is not a valid Asia/Shanghai calendar date`);
  return value;
}

async function main() {
  const contentUpdatedAt = requestedContentDate();
  const [releaseSha, eodManifestSha, privacyManifestSha] = await Promise.all([
    sha256(sources.releaseJson),
    sha256(sources.eodManifest),
    sha256(sources.privacyManifest),
  ]);

  const output = {
    releaseJson: { sha256: releaseSha, source: sources.releaseJson },
    eodManifest: { sha256: eodManifestSha, source: sources.eodManifest },
    privacyManifest: { sha256: privacyManifestSha, source: sources.privacyManifest },
    contentUpdatedAt,
    gateStatus: currentGateStatus(),
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Generated ${path.relative(repositoryRoot, outputPath)}`);
}

await main();

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = resolve(process.env.EXACTLY_ONCE_SOURCE_ROOT || join(root, "..", "exactly-once-drills"));
const sourceResults = join(sourceRoot, "dashboard", "public", "results");
const outputResults = join(root, "public", "case-studies", "exactly-once-drills", "results");

function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

const indexBytes = await readFile(join(sourceResults, "index.json"));
const index = JSON.parse(indexBytes);
if (!Array.isArray(index.artifacts) || index.artifacts.length === 0) throw new Error("Exactly-Once dashboard index contains no artifacts.");

await mkdir(outputResults, { recursive: true });
const assets = [];
for (const filename of ["index.json", ...index.artifacts.map((artifact) => artifact.filename)]) {
  if (filename.includes("/") || filename.includes("..")) throw new Error(`Unsafe dashboard result filename: ${filename}`);
  const bytes = filename === "index.json" ? indexBytes : await readFile(join(sourceResults, filename));
  await writeFile(join(outputResults, filename), bytes);
  assets.push({
    path: filename,
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
    kind: filename === "index.json" ? "dashboard_result_index" : "recorded_result",
  });
}

let sourceRevision = "unknown";
try {
  sourceRevision = execFileSync("git", ["rev-parse", "HEAD"], { cwd: sourceRoot, encoding: "utf8" }).trim();
} catch {
  // The copied artifact hashes remain the publication identity without Git metadata.
}

const manifest = {
  schema_version: 1,
  package: "exactly-once-drills-dashboard-results",
  source: {
    repository: "LucisZhang/exactly-once-drills",
    revision: sourceRevision,
    path: "dashboard/public/results/index.json",
  },
  assets,
  coverage: {
    path_a_failure_classes: 5,
    path_b_failure_classes: index.artifacts.filter((artifact) => artifact.phase === "B3").length,
    path_b_slo_runs: index.artifacts.filter((artifact) => artifact.phase === "B4").length,
  },
  ui_boundary: "P1FailureReplay remains pinned to the five-class U6 Path A reconciliation schema; Path B artifacts are synchronized but not normalized into that replay UI.",
};
await writeFile(join(outputResults, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

const totalBytes = assets.reduce((sum, asset) => sum + asset.bytes, 0);
process.stdout.write(`Exactly-Once dashboard results synchronized: ${assets.length} indexed files, ${totalBytes} bytes.\n`);

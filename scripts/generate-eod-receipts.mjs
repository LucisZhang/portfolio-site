import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Task 2.3 (Exactly-Once Drills fault-chessboard rebuild): every number the
// page's receipts exhibit and hero counter line show is read from this
// generated file, never typed into a .tsx literal. Follows the exact
// precedent of scripts/generate-forge-receipts.mjs — hash the committed
// public/ bytes directly rather than trust manifest.json's copy, and derive
// the one aggregate figure (sustained throughput) from the same source file
// the chessboard's SLO row links to.
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(repositoryRoot, "src/data/generated/eod-receipts.json");

const resultsDir = "public/case-studies/exactly-once-drills/results";
const sources = {
  summary: `${resultsDir}/../index.summary.json`,
  brokerSlo: `${resultsDir}/broker_slo.json`,
  manifest: `${resultsDir}/manifest.json`,
};

async function sha256(repositoryRelativePath) {
  const contents = await readFile(path.join(repositoryRoot, repositoryRelativePath));
  return { sha256: createHash("sha256").update(contents).digest("hex"), bytes: contents.byteLength };
}

async function main() {
  const [summary, brokerSlo, manifest] = await Promise.all([
    sha256(sources.summary),
    sha256(sources.brokerSlo),
    sha256(sources.manifest),
  ]);

  const brokerSloJson = JSON.parse(await readFile(path.join(repositoryRoot, sources.brokerSlo), "utf8"));
  const summaryJson = JSON.parse(await readFile(path.join(repositoryRoot, sources.summary), "utf8"));

  const sustainedThroughputEventsPerSecond = brokerSloJson.summary.sustained_throughput_events_per_second;
  // Task F9 (Duty Logbook honesty line): the real measured end-to-end
  // duration this same throughput figure was measured over — "from the
  // first MySQL write to zero Iceberg backlog" — read from the same file
  // rather than typed into the component.
  const endToEndSeconds = brokerSloJson.benchmark.throughput.end_to_end_seconds;
  const allDiffsZero = summaryJson.every((row) => row.diff === 0);
  const drillCount = summaryJson.length;

  // Per-file byte/hash receipts for every one of the 10 chessboard cells'
  // linked drill files, so the SOURCE/RECEIPTS exhibit and digits-eod.md can
  // both cite an independently-computed (not manifest-trusted) SHA-256.
  const drillFileHashes = {};
  for (const row of summaryJson) {
    const relativePath = row.file.replace(/^\/case-studies\//, "public/case-studies/");
    drillFileHashes[row.id] = await sha256(relativePath);
  }

  const output = {
    summary,
    brokerSlo,
    manifest,
    drillFileHashes,
    sustainedThroughputEventsPerSecond,
    endToEndSeconds,
    allDiffsZero,
    drillCount,
    generatedAt: new Date().toISOString().slice(0, 10),
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Generated ${path.relative(repositoryRoot, outputPath)}`);
}

await main();

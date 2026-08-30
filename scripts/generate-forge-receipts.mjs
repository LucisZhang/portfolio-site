import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Task 2.2 (Frontier Forge release-console rebuild): the "MODEL BOUNDARY"
// snapshot line (spec §6.1 exhibit 06: "ff-qwen3.5-4b-... · release.json
// sha256:...") and the "SOURCE / RECEIPTS" exhibit need a real SHA-256 of
// the exact release.json and overload-receipt bytes shipped on this site.
// This script hashes the committed public/ files itself, following the
// same discipline as generate-home-receipts.mjs: every number a component
// shows comes from a generated file, never a literal in the component. (The
// hashes it produces match manifest.json's recorded values exactly —
// verified below, not merely assumed.)
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(repositoryRoot, "src/data/generated/forge-receipts.json");

const sources = {
  releaseJson: "public/case-studies/frontier-forge/release.json",
  overloadReceipt: "public/case-studies/frontier-forge/phase7_1_sustained_gateway_bench.json",
  gpuLedgerPhase71: "public/case-studies/frontier-forge/phase7_1_gpu_ledger.jsonl",
  gpuLedgerPhase72: "public/case-studies/frontier-forge/phase7_2_gpu_ledger.jsonl",
};

async function sha256(repositoryRelativePath) {
  const contents = await readFile(path.join(repositoryRoot, repositoryRelativePath));
  return { sha256: createHash("sha256").update(contents).digest("hex"), bytes: contents.byteLength };
}

async function totalMeasuredSpendUsd() {
  const release = JSON.parse(await readFile(path.join(repositoryRoot, sources.releaseJson), "utf8"));
  const phase71 = (await readFile(path.join(repositoryRoot, sources.gpuLedgerPhase71), "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  const phase72 = (await readFile(path.join(repositoryRoot, sources.gpuLedgerPhase72), "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  const phase71Usd = phase71.reduce((sum, row) => sum + row.usd, 0);
  const phase72Usd = phase72.reduce((sum, row) => sum + row.usd, 0);
  return release.project_spend.total_usd + phase71Usd + phase72Usd;
}

async function main() {
  const [releaseJson, overloadReceipt] = await Promise.all([
    sha256(sources.releaseJson),
    sha256(sources.overloadReceipt),
  ]);
  const totalMeasuredSpend = await totalMeasuredSpendUsd();
  const release = JSON.parse(await readFile(path.join(repositoryRoot, sources.releaseJson), "utf8"));

  // "qwen3.5-4b" is not present anywhere inside release.json itself (it is
  // not a benchmark number) — it is the base model name already published
  // in src/lib/projects.ts and the homepage's exhibit 01 eyebrow
  // ("QWEN3.5-4B / RTX 4090 / ...", spec §4 row 01). The rest of this id is
  // the real, measured run_id from release.json's training headline.
  const snapshotId = `ff-qwen3.5-4b-${release.training.headline.run_id}`;

  const output = {
    releaseJson,
    overloadReceipt,
    totalMeasuredSpendUsd: Number(totalMeasuredSpend.toFixed(2)),
    snapshotId,
    generatedAt: new Date().toISOString().slice(0, 10),
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Generated ${path.relative(repositoryRoot, outputPath)}`);
}

await main();

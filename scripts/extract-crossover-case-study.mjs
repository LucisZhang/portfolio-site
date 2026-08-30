import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = resolve(process.env.CROSSOVER_STUDY_ROOT || join(root, "..", "crossover-study"));
const outputRoot = join(root, "public", "case-studies", "crossover-study");

const sourcePaths = {
  crossover: "demo/data/crossover.json",
  contrast: "demo/data/contrast.json",
  phase8: "demo/data/phase8.json",
  runs: "results/runs.jsonl",
};

function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

async function readSource(path) {
  return readFile(join(sourceRoot, path));
}

function metricPoint(segment, record) {
  const metric = record["ndcg@10"];
  return {
    segment,
    n_users: record.n_users,
    value: metric.value,
    ci_lo: metric.ci_lo,
    ci_hi: metric.ci_hi,
  };
}

function amazonSeries(source, key) {
  const record = source.models[key];
  return {
    key,
    label: record.label,
    run_id: record.run_id,
    model_name: record.model_name,
    points: source.segments.map((segment) => metricPoint(segment, record.segments[segment])),
  };
}

function ml32mSeries(record, key, label) {
  return {
    key,
    label,
    run_id: record.run_id,
    model_name: record.model.name,
    points: ["0", "1-4", "5-9", "10-19", "20+"].map((segment) => metricPoint(segment, record.metrics.per_segment[segment])),
  };
}

function receipt(record) {
  return {
    run_id: record.run_id,
    kind: record.kind,
    run_ts: record.run_ts,
    git_sha: record.git_sha,
    config_path: record.config_path,
    config_hash: record.config_hash,
    dataset_manifest_hash: record.dataset_manifest_hash,
    splits: record.splits,
    iceberg_snapshots: record.iceberg_snapshots,
    seeds: record.seeds,
    model: record.model ? { name: record.model.name, params: record.model.params } : null,
    wall_clock_s: record.wall_clock_s,
    hardware: record.hardware,
  };
}

const [crossoverBytes, contrastBytes, phase8Bytes, runsBytes] = await Promise.all([
  readSource(sourcePaths.crossover),
  readSource(sourcePaths.contrast),
  readSource(sourcePaths.phase8),
  readSource(sourcePaths.runs),
]);
const crossover = JSON.parse(crossoverBytes);
const contrast = JSON.parse(contrastBytes);
const phase8 = JSON.parse(phase8Bytes);
const runIds = [
  "20260805T172047Z-035042b",
  "20260806T082441Z-2f2f26d",
  "20260817T095926Z-633d454",
  "20260820T134403Z-e2263d2",
  "20260820T221055Z-20d8ff9",
  "20260820T221701Z-20d8ff9",
];
const runIdSet = new Set(runIds);
const runsById = new Map(runsBytes.toString("utf8").trim().split("\n")
  .map((line) => JSON.parse(line))
  .filter((record) => runIdSet.has(record.run_id))
  .map((record) => [record.run_id, record]));
for (const runId of runIds) {
  if (!runsById.has(runId)) throw new Error(`Required source run is missing: ${runId}`);
}

const support = phase8.regime_map.headline.gt_interactions_by_support;
const popMl32m = runsById.get("20260820T221055Z-20d8ff9");
const itemKnnMl32m = runsById.get("20260820T221701Z-20d8ff9");
const exhibits = {
  schema_version: 1,
  generated_by: "scripts/extract-crossover-case-study.mjs",
  amazon_null: {
    metric: "ndcg@10",
    segments: crossover.segments,
    verdict: "null",
    n_star: null,
    series: [amazonSeries(crossover, "pop_t12m"), amazonSeries(crossover, "als")],
  },
  ml32m_crossover: {
    metric: "ndcg@10",
    segments: ["0", "1-4", "5-9", "10-19", "20+"],
    verdict: contrast.verdict.verdict,
    n_star: contrast.verdict.n_star,
    crossover_bucket: contrast.verdict.crossover_bucket,
    series: [
      ml32mSeries(popMl32m, "pop_t12m", "pop-t12m"),
      ml32mSeries(itemKnnMl32m, "itemknn_t12m", "item-kNN t12m"),
    ],
    confirmatory: {
      fdr_alpha: 0.05,
      recall_guard_metric_robust: contrast.recall_guard.metric_robust,
      d4_depth0: {
        segment: contrast.d4_depth0.label,
        n_users: contrast.d4_depth0.n_users,
        delta: contrast.d4_depth0.delta,
        ci_lo: contrast.d4_depth0.ci_lo,
        ci_hi: contrast.d4_depth0.ci_hi,
        q_value: contrast.d4_depth0.q_value,
      },
      winning_deep_buckets: contrast.winning_deep_buckets.map((point) => ({
        segment: point.label,
        n_users: point.n_users,
        delta: point.delta,
        ci_lo: point.ci_lo,
        ci_hi: point.ci_hi,
        q_value: point.q_value,
      })),
    },
  },
  catalog_churn: {
    metric: contrast.churn_contrast.statistic,
    amazon: {
      run_id: contrast.churn_contrast.amazon_electronics.run_id,
      churn_share: contrast.churn_contrast.amazon_electronics.value,
      zero_support_share: support.zero.share,
      low_support_share: support.low.share,
      high_support_share: support.high.share,
      attainable_recall_ceiling_support_ge_1: 1 - support.zero.share,
    },
    ml32m: {
      run_id: contrast.churn_contrast.ml32m.run_id,
      churn_share: contrast.churn_contrast.ml32m.value,
    },
  },
  receipts: runIds.map((runId) => receipt(runsById.get(runId))),
  boundaries: [
    "The Amazon null is scoped to this catalog, temporal split, five-core population, and observed history depths.",
    "The ML-32M n*=20 result is a regime contrast, not causal proof that catalog churn alone creates the crossover.",
    "Recall@20 did not confirm the three ML-32M deep-bucket wins; the page labels that robustness failure.",
    "No MiniLM weights, semantic-search index, raw reviews, user identifiers, or per-user arrays are included.",
  ],
};

await mkdir(outputRoot, { recursive: true });
const exhibitBytes = Buffer.from(`${JSON.stringify(exhibits, null, 2)}\n`);
await writeFile(join(outputRoot, "exhibits.json"), exhibitBytes);

let sourceRevision = "unknown";
try {
  sourceRevision = execFileSync("git", ["rev-parse", "HEAD"], { cwd: sourceRoot, encoding: "utf8" }).trim();
} catch {
  // The file hashes below remain sufficient when the source checkout has no Git metadata.
}
const manifest = {
  schema_version: 1,
  package: "crossover-study-site-exhibits",
  source: {
    repository: "LucisZhang/crossover-study",
    revision: sourceRevision,
    inputs: [
      [sourcePaths.crossover, crossoverBytes],
      [sourcePaths.contrast, contrastBytes],
      [sourcePaths.phase8, phase8Bytes],
      [sourcePaths.runs, runsBytes],
    ].map(([path, bytes]) => ({ path, bytes: bytes.byteLength, sha256: sha256(bytes) })),
  },
  assets: [
    {
      path: "exhibits.json",
      bytes: exhibitBytes.byteLength,
      sha256: sha256(exhibitBytes),
      kind: "minimal_recorded_exhibit_projection",
    },
  ],
  boundaries: exhibits.boundaries,
};
await writeFile(join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

process.stdout.write(`Crossover case-study projection written: ${exhibitBytes.byteLength} data bytes, 2 files including manifest.\n`);

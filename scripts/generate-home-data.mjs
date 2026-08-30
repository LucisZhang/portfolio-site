import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { artifactViewerHref } from "../src/lib/artifacts.ts";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(repositoryRoot, "src/data/generated/home-stats.json");

const sources = {
  frontierRelease: "public/case-studies/frontier-forge/release.json",
  frontierManifest: "public/case-studies/frontier-forge/manifest.json",
  phase71Ledger: "public/case-studies/frontier-forge/phase7_1_gpu_ledger.jsonl",
  phase72Ledger: "public/case-studies/frontier-forge/phase7_2_gpu_ledger.jsonl",
  frontierClaimCommands: "public/case-studies/frontier-forge/claim-commands.json",
  eodManifest: "public/case-studies/exactly-once-drills/results/manifest.json",
  eodReconciliation: "public/case-studies/exactly-once-drills/results/eo_reconciliation.json",
  crossoverExhibits: "public/case-studies/crossover-study/exhibits.json",
  releaseGuardianLive: "public/case-studies/release-guardian/data/evaluation-live.csv",
};

async function readJson(repositoryRelativePath) {
  return JSON.parse(await readFile(path.join(repositoryRoot, repositoryRelativePath), "utf8"));
}

async function readJsonLines(repositoryRelativePath) {
  const contents = await readFile(path.join(repositoryRoot, repositoryRelativePath), "utf8");
  return contents
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += character;
    }
  }
  cells.push(cell);
  return cells;
}

async function readFirstCsvRecord(repositoryRelativePath) {
  const contents = await readFile(path.join(repositoryRoot, repositoryRelativePath), "utf8");
  const [headerLine, recordLine] = contents.trim().split(/\r?\n/);
  const headers = parseCsvLine(headerLine);
  const values = parseCsvLine(recordLine);
  return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
}

function percent(value, digits = 2) {
  return `${(value * 100).toFixed(digits)}%`;
}

function signedPercentagePoints(value, digits = 1) {
  const points = value * 100;
  return `${points < 0 ? "−" : "+"}${Math.abs(points).toFixed(digits)} pp`;
}

function dollars(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function middleBy(items, selector) {
  return [...items].sort((left, right) => selector(left) - selector(right))[Math.floor(items.length / 2)];
}

function findAssetSha(manifest, assetPath) {
  const asset = manifest.assets.find(({ path: candidate }) => candidate === assetPath);
  if (!asset) throw new Error(`Manifest asset is missing: ${assetPath}`);
  return asset.sha256;
}

async function main() {
  const [
    frontier,
    frontierManifest,
    phase71Ledger,
    phase72Ledger,
    frontierClaimCommands,
    eodManifest,
    eodReconciliation,
    crossover,
    releaseGuardian,
  ] = await Promise.all([
    readJson(sources.frontierRelease),
    readJson(sources.frontierManifest),
    readJsonLines(sources.phase71Ledger),
    readJsonLines(sources.phase72Ledger),
    readJson(sources.frontierClaimCommands),
    readJson(sources.eodManifest),
    readJson(sources.eodReconciliation),
    readJson(sources.crossoverExhibits),
    readFirstCsvRecord(sources.releaseGuardianLive),
  ]);

  const headline = frontier.training.headline;
  const releaseSha = findAssetSha(frontierManifest, "release.json");
  const indexedOverloadCells = frontier.phase7_1.gate.sustained_overload_cells.map((cell, index) => ({ cell, index }));
  const { cell: overloadCell, index: overloadIndex } = middleBy(indexedOverloadCells, ({ cell }) => cell.multiplier);
  const overloadDenominator = overloadCell.gateway_requests - overloadCell.http_429_count;
  const allFailureClasses = eodManifest.coverage.path_a_failure_classes + eodManifest.coverage.path_b_failure_classes;
  const measuredSpend = [
    frontier.project_spend.total_usd,
    ...phase71Ledger.map(({ usd }) => usd),
    ...phase72Ledger.map(({ usd }) => usd),
  ].reduce((total, value) => total + value, 0);

  const ruleSft = frontier.training.ladder.find(({ run_id }) => run_id === headline.paired_delta_vs_r1.from + "_sft_rule_s0");
  const distilledSft = frontier.training.ladder.find(({ status }) => status === "complete-negative");
  if (!ruleSft || !distilledSft) throw new Error("Training ladder is missing the rule or distilled SFT rung");
  const distillationDelta = distilledSft.task_success - ruleSft.task_success;

  const grpoCompletedSeeds = frontier.training.r4_seed_deltas.filter(({ status }) => status === "complete");
  const grpoAbortedSeed = frontier.training.r4_seed_deltas.find(({ paired_rows }) => paired_rows === 0);
  const grpoSeedDelta = grpoCompletedSeeds[0].mean_task_success_delta;
  const grpoSeedDeltasMatch = grpoCompletedSeeds.every(({ mean_task_success_delta }) => mean_task_success_delta === grpoSeedDelta);
  const grpoCiContainsZero = grpoCompletedSeeds.every(({ ci95 }) => ci95[0] <= 0 && ci95[1] >= 0);
  if (!grpoSeedDeltasMatch) throw new Error("Completed GRPO seed deltas differ; the homepage finding cannot use one shared value");

  const amazonPopulation = crossover.amazon_null.series[0].points.reduce((total, { n_users }) => total + n_users, 0);
  const structuredRuns = frontier.serving.structured_output;
  const structuredRequests = structuredRuns.reduce((total, { requests }) => total + requests, 0);
  const onePassSuccess = structuredRuns.reduce((total, { simultaneous_task_success, requests }) => total + simultaneous_task_success * requests, 0) / structuredRequests;
  const twoPassSuccess = structuredRuns.reduce((total, { two_pass_task_success, requests }) => total + two_pass_task_success * requests, 0) / structuredRequests;
  const gptqServing = frontier.serving.serving_at_4_qps.find(({ precision }) => precision === "gptq_int4");
  if (!gptqServing) throw new Error("Serving registry is missing the GPTQ-int4 row");

  const output = {
    heroTiles: [
      {
        value: percent(headline.task_success),
        label: "task success",
        source: sources.frontierRelease,
        jsonPath: "$.training.headline.task_success",
      },
      {
        value: dollars(measuredSpend),
        label: "measured spend",
        source: `${sources.frontierRelease} + ${sources.phase71Ledger} + ${sources.phase72Ledger}`,
        jsonPath: "$.project_spend.total_usd + $[*].usd + $[*].usd",
      },
      {
        value: String(overloadCell.gateway_upstream_5xx_rate),
        label: `upstream 5xx @ ${overloadCell.multiplier}×`,
        source: sources.frontierRelease,
        jsonPath: `$.phase7_1.gate.sustained_overload_cells[${overloadIndex}].gateway_upstream_5xx_rate`,
      },
      {
        value: String(allFailureClasses),
        label: "failure classes drilled",
        source: sources.eodManifest,
        jsonPath: "$.coverage.path_a_failure_classes + $.coverage.path_b_failure_classes",
      },
    ],
    flagshipClaims: [
      {
        assert: `${percent(headline.task_success)} task success`,
        value: percent(headline.task_success),
        n: headline.paired_delta_vs_r1.paired_rows,
        ci: `[${percent(headline.ci95[0])}, ${percent(headline.ci95[1])}]`,
        command: frontierClaimCommands["task-success"] ?? "MISSING",
        sha256: releaseSha,
      },
      {
        assert: `${overloadCell.gateway_upstream_5xx_rate} upstream 5xx @ ${overloadCell.multiplier}×`,
        value: String(overloadCell.gateway_upstream_5xx_rate),
        n: overloadDenominator,
        ci: "MISSING",
        command: frontierClaimCommands["sustained-overload"] ?? "MISSING",
        sha256: releaseSha,
      },
      {
        assert: `distilled SFT ${signedPercentagePoints(distillationDelta)} vs rule SFT`,
        value: signedPercentagePoints(distillationDelta),
        n: "MISSING",
        ci: "MISSING",
        command: frontierClaimCommands["distilled-sft-delta"] ?? "MISSING",
        sha256: releaseSha,
      },
    ],
    negativeRuns: [
      {
        conclusion: `Distilled SFT ${signedPercentagePoints(distillationDelta)} vs rule SFT`,
        n: "MISSING",
        disposition: distilledSft.status,
        receiptHref: artifactViewerHref("/case-studies/frontier-forge/release.json", "/"),
      },
      {
        conclusion: `GRPO ${signedPercentagePoints(grpoSeedDelta, 2)} in both completed seeds; both CIs ${grpoCiContainsZero ? "contain zero" : "exclude zero"}`,
        n: `${grpoCompletedSeeds.length} × ${grpoCompletedSeeds[0].paired_rows}; aborted seed n=${grpoAbortedSeed.paired_rows}`,
        disposition: frontier.training.r4_v2.reason,
        receiptHref: artifactViewerHref("/case-studies/frontier-forge/release.json", "/"),
      },
      {
        conclusion: `${releaseGuardian.strict_flagged_scenarios} of ${releaseGuardian.strict_total_scenarios} strict all-trials residuals`,
        n: Number(releaseGuardian.strict_total_scenarios),
        disposition: releaseGuardian.boundary,
        receiptHref: artifactViewerHref("/case-studies/release-guardian/data/evaluation-live.csv", "/"),
      },
      {
        conclusion: `Amazon arm: ${crossover.amazon_null.verdict}`,
        n: amazonPopulation,
        disposition: crossover.boundaries[0],
        receiptHref: artifactViewerHref("/case-studies/crossover-study/exhibits.json", "/"),
      },
      {
        conclusion: `One-pass structured output: ${percent(onePassSuccess, 0)} task success`,
        n: structuredRequests,
        disposition: `${structuredRuns[0].task_success_denominator}; two-pass task success ${percent(twoPassSuccess, 0)}`,
        receiptHref: artifactViewerHref("/case-studies/frontier-forge/release.json", "/"),
      },
    ],
    stackDepth: [
      {
        layer: "Gateway",
        projects: ["Frontier Forge"],
        metric: `${overloadCell.gateway_upstream_5xx_rate} upstream 5xx @ ${overloadCell.multiplier}× · n=${overloadDenominator}`,
      },
      {
        layer: "Serving",
        projects: ["Frontier Forge"],
        metric: `GPTQ-int4 p95 ${gptqServing.e2e_p95_s.toFixed(3)} s @ ${gptqServing.arrival_rate_qps} QPS`,
      },
      {
        layer: "Stream",
        projects: ["Exactly-Once Drills"],
        metric: `${allFailureClasses} failure classes drilled`,
      },
      {
        layer: "Storage",
        projects: ["Exactly-Once Drills", "Crossover Study"],
        metric: `${eodReconciliation.results.reduce((total, { snapshot_diff_count }) => total + snapshot_diff_count, 0)} snapshot diffs across ${eodReconciliation.results.length} recovery drills`,
      },
      {
        layer: "Orchestration",
        projects: ["Release Guardian"],
        metric: `${releaseGuardian.graph_runs} funded live graph runs`,
      },
    ],
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Generated ${path.relative(repositoryRoot, outputPath)}`);
}

await main();

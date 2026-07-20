import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

function option(name, fallback = null) {
  const prefix = `--${name}=`;
  const match = args.find((argument) => argument.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function flag(name) {
  return args.includes(`--${name}`);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portableLocation(filePath) {
  const repoRelative = relative(repoRoot, filePath);
  if (!repoRelative.startsWith("..") && !isAbsolute(repoRelative)) {
    const portable = repoRelative.split("\\").join("/");
    try {
      execFileSync("git", ["ls-files", "--error-unmatch", "--", portable], {
        cwd: repoRoot,
        stdio: "ignore",
      });
      return { path: portable, localOnlyBasename: null, retention: "tracked" };
    } catch {
      return { path: null, localOnlyBasename: basename(filePath), retention: "local-only-untracked-or-ignored" };
    }
  }
  return { path: null, localOnlyBasename: basename(filePath), retention: "local-only-outside-repository" };
}

const outputPath = resolve(repoRoot, option("output", "docs/phase2-public-review-artifacts/goal2-final/lighthouse-summary.json"));
const bindingValue = option("binding");
if (!bindingValue) throw new Error("--binding=<path> is required.");
const bindingPath = resolve(repoRoot, bindingValue);
if (!existsSync(bindingPath)) throw new Error("Lighthouse run binding is missing.");
const write = flag("write");
const check = flag("check");
if (write === check) throw new Error("Choose exactly one of --write or --check.");

const reportPaths = Object.fromEntries(["home", "margin", "privacy", "release"].map((key) => {
  const value = option(key);
  if (!value) throw new Error(`--${key}=<raw report path> is required.`);
  return [key, resolve(repoRoot, value)];
}));

const runtimeTreeDigest = JSON.parse(
  execFileSync(process.execPath, ["scripts/runtime-tree-fingerprint.mjs"], {
    cwd: repoRoot,
    encoding: "utf8",
  }),
);
const bindingBytes = readFileSync(bindingPath);
const binding = JSON.parse(bindingBytes.toString("utf8"));
if (binding?.schemaVersion !== 1) throw new Error("Lighthouse run binding has an unsupported schema.");
if (binding.runtimeTreeDigest?.sha256 !== runtimeTreeDigest.sha256
  || binding.runtimeTreeDigest?.files !== runtimeTreeDigest.files) {
  throw new Error("Runtime tree changed after the Lighthouse run binding was prepared.");
}
const preparedAtMs = Date.parse(binding.preparedAtUtc);
if (!Number.isFinite(preparedAtMs)) throw new Error("Lighthouse binding has an invalid preparedAtUtc.");

const reports = {};
for (const [key, reportPath] of Object.entries(reportPaths)) {
  if (!existsSync(reportPath)) throw new Error(`Missing Lighthouse raw report for ${key}.`);
  const bytes = readFileSync(reportPath);
  const raw = JSON.parse(bytes.toString("utf8"));
  const expectedPath = binding.routes?.[key];
  if (typeof expectedPath !== "string") throw new Error(`Binding is missing route ${key}.`);
  const requested = new URL(raw.requestedUrl);
  const final = new URL(raw.finalUrl);
  if (requested.origin !== binding.baseUrl || final.origin !== binding.baseUrl
    || requested.pathname !== expectedPath || final.pathname !== expectedPath
    || requested.search || final.search) {
    throw new Error(`Lighthouse URL mismatch for ${key}.`);
  }
  const fetchTimeMs = Date.parse(raw.fetchTime);
  if (!Number.isFinite(fetchTimeMs) || fetchTimeMs < preparedAtMs || statSync(reportPath).mtimeMs < preparedAtMs) {
    throw new Error(`Lighthouse report ${key} predates its run binding.`);
  }
  if (raw.lighthouseVersion !== binding.lighthouseVersion) {
    throw new Error(`Lighthouse version mismatch for ${key}.`);
  }
  if (raw.runtimeError != null) throw new Error(`Lighthouse runtime error for ${key}.`);
  if (!Array.isArray(raw.runWarnings) || raw.runWarnings.length !== 0) {
    throw new Error(`Lighthouse warnings present for ${key}.`);
  }
  const categories = Object.fromEntries(
    ["performance", "accessibility", "best-practices", "seo"].map((category) => {
      const score = raw.categories?.[category]?.score;
      if (typeof score !== "number") throw new Error(`Missing ${category} score for ${key}.`);
      return [category, Math.round(score * 100)];
    }),
  );
  if (categories.performance < 90
    || categories.accessibility !== 100
    || categories["best-practices"] !== 100
    || categories.seo !== 100) {
    throw new Error(`Lighthouse category gate failed for ${key}: ${JSON.stringify(categories)}`);
  }
  if (raw.audits?.["http-status-code"]?.score !== 1 || raw.audits?.["errors-in-console"]?.score !== 1) {
    throw new Error(`Lighthouse HTTP/console gate failed for ${key}.`);
  }
  const metric = (id) => {
    const value = raw.audits?.[id]?.numericValue;
    if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Missing metric ${id} for ${key}.`);
    return value;
  };
  reports[key] = {
    path: expectedPath,
    fetch_time: raw.fetchTime,
    lighthouse_version: raw.lighthouseVersion,
    user_agent: raw.userAgent,
    raw_report: { ...portableLocation(reportPath), sha256: sha256(bytes) },
    runtime_error: null,
    run_warnings: [],
    categories,
    metrics: {
      first_contentful_paint_ms: Math.round(metric("first-contentful-paint")),
      largest_contentful_paint_ms: Math.round(metric("largest-contentful-paint")),
      total_blocking_time_ms: Math.round(metric("total-blocking-time")),
      cumulative_layout_shift: metric("cumulative-layout-shift"),
      speed_index_ms: Math.round(metric("speed-index")),
    },
    http_status_code_score: 1,
    errors_in_console_score: 1,
  };
}

const summary = {
  schema_version: 3,
  status: "PASS",
  scope: "Goal2 exact local production runtime on 127.0.0.1; one ordered four-route run, with raw reports retained only in the local QA bundle.",
  candidate: { current_runtime_tree_digest: runtimeTreeDigest },
  run_binding: {
    ...portableLocation(bindingPath),
    sha256: sha256(bindingBytes),
    prepared_at_utc: binding.preparedAtUtc,
    installed_chrome_version: binding.chromeVersion,
  },
  reports,
};
const serialized = `${JSON.stringify(summary, null, 2)}\n`;
if (write) {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serialized, "utf8");
  process.stdout.write("LIGHTHOUSE_SUMMARY_WRITE_PASS status=PASS\n");
} else {
  if (readFileSync(outputPath, "utf8") !== serialized) throw new Error("Lighthouse summary is stale.");
  process.stdout.write("LIGHTHOUSE_SUMMARY_CHECK_PASS status=PASS\n");
}

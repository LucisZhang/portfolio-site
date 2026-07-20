import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_RAW_REPORT =
  "docs/phase2-public-review-artifacts/goal2-final/playwright-raw.json";
const DEFAULT_OUTPUT =
  "docs/phase2-public-review-artifacts/goal2-final/playwright-summary.json";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

function readOption(name, fallback) {
  const prefix = `--${name}=`;
  const match = args.find((argument) => argument.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function hasFlag(name) {
  return args.includes(`--${name}`);
}

const write = hasFlag("write");
const check = hasFlag("check");
const allowMissing = hasFlag("allow-missing");
if (write && check) {
  throw new Error("Choose at most one of --write and --check.");
}

const rawReportPath = resolve(repoRoot, readOption("raw", DEFAULT_RAW_REPORT));
const outputPath = resolve(repoRoot, readOption("output", DEFAULT_OUTPUT));
const bindingValue = readOption("binding", null);
const bindingPath = bindingValue ? resolve(repoRoot, bindingValue) : null;
const channel = readOption("channel", process.env.PLAYWRIGHT_CHANNEL || "chrome");
const candidateTreeHash = readOption("candidate-tree", null);
if (candidateTreeHash && !/^[a-f0-9]{40,64}$/i.test(candidateTreeHash)) {
  throw new Error("--candidate-tree must be a 40- to 64-character hexadecimal hash.");
}

const runtimeTreeDigest = JSON.parse(
  execFileSync(process.execPath, ["scripts/runtime-tree-fingerprint.mjs"], {
    cwd: repoRoot,
    encoding: "utf8",
  }),
);

function portableReportPath(path) {
  const repoRelative = relative(repoRoot, path);
  if (!repoRelative.startsWith("..") && !isAbsolute(repoRelative)) {
    return repoRelative.split("\\").join("/");
  }
  return basename(path);
}

function sourceReportLocation(path) {
  const repoRelative = relative(repoRoot, path);
  if (!repoRelative.startsWith("..") && !isAbsolute(repoRelative)) {
    const portable = repoRelative.split("\\").join("/");
    try {
      execFileSync("git", ["ls-files", "--error-unmatch", "--", portable], {
        cwd: repoRoot,
        stdio: "ignore",
      });
      return { path: portable, localOnlyBasename: null, retention: "tracked" };
    } catch {
      return {
        path: null,
        localOnlyBasename: basename(path),
        retention: "local-only-untracked-or-ignored",
      };
    }
  }
  return {
    path: null,
    localOnlyBasename: basename(path),
    retention: "local-only-outside-repository",
  };
}

function browserName(browserChannel) {
  if (browserChannel === "chrome" || browserChannel.startsWith("chrome-")) {
    return "Google Chrome";
  }
  if (browserChannel === "msedge" || browserChannel.startsWith("msedge-")) {
    return "Microsoft Edge";
  }
  return "Chromium";
}

function finiteCount(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Playwright report has invalid ${label}.`);
  }
  return value;
}

function collectReportTests(suites) {
  const tests = [];
  function visit(suite) {
    for (const spec of suite?.specs || []) {
      for (const test of spec?.tests || []) tests.push(test);
    }
    for (const child of suite?.suites || []) visit(child);
  }
  for (const suite of suites || []) visit(suite);
  return tests;
}

function testInventory(suites) {
  const entries = [];
  function visit(suite) {
    for (const spec of suite?.specs || []) {
      for (const test of spec?.tests || []) {
        if (typeof spec?.id !== "string" || typeof test?.projectName !== "string") {
          throw new Error("Playwright report contains a test without a stable id or project name.");
        }
        entries.push(JSON.stringify([spec.id, test.projectName]));
      }
    }
    for (const child of suite?.suites || []) visit(child);
  }
  for (const suite of suites || []) visit(suite);
  entries.sort();
  if (entries.length === 0 || new Set(entries).size !== entries.length) {
    throw new Error("Playwright report must contain a non-empty, unique test inventory.");
  }
  return {
    count: entries.length,
    sha256: createHash("sha256").update(`${entries.join("\n")}\n`).digest("hex"),
  };
}

let sourceReport;
let results;
let projects;
let state;
let runBinding = null;

if (!existsSync(rawReportPath)) {
  if (!allowMissing) {
    throw new Error(
      `Playwright JSON report is missing: ${portableReportPath(rawReportPath)}`,
    );
  }

  state = "pending-final-report";
  sourceReport = {
    ...sourceReportLocation(rawReportPath),
    sha256: null,
  };
  results = {
    passed: null,
    skipped: null,
    failed: null,
    flaky: null,
    durationMs: null,
  };
  projects = [];
} else {
  if (!bindingPath || !existsSync(bindingPath)) {
    throw new Error("A current --binding=<path> from prepare-playwright-run-binding.mjs is required for a populated report.");
  }
  const bindingBytes = readFileSync(bindingPath);
  const binding = JSON.parse(bindingBytes.toString("utf8"));
  if (binding?.schemaVersion !== 1) throw new Error("Playwright run binding has an unsupported schema.");
  if (binding.browserChannel !== channel) throw new Error("Playwright run binding channel does not match --channel.");
  if (binding.rawReportBasename !== basename(rawReportPath)) throw new Error("Playwright run binding raw-report basename mismatch.");
  if (!Number.isInteger(binding.fullTestInventory?.count)
    || binding.fullTestInventory.count <= 0
    || !/^[a-f0-9]{64}$/.test(binding.fullTestInventory?.sha256 || "")) {
    throw new Error("Playwright run binding is missing its full-suite test inventory.");
  }
  if (binding.runtimeTreeDigest?.sha256 !== runtimeTreeDigest.sha256
    || binding.runtimeTreeDigest?.files !== runtimeTreeDigest.files) {
    throw new Error("Runtime tree changed after the Playwright run binding was prepared.");
  }
  const preparedAtMs = Date.parse(binding.preparedAtUtc);
  if (!Number.isFinite(preparedAtMs)) throw new Error("Playwright run binding has an invalid preparedAtUtc.");

  const rawBytes = readFileSync(rawReportPath);
  const report = JSON.parse(rawBytes.toString("utf8"));
  const reportTestInventory = testInventory(report.suites);
  if (reportTestInventory.count !== binding.fullTestInventory.count
    || reportTestInventory.sha256 !== binding.fullTestInventory.sha256) {
    throw new Error("Playwright report does not match the full-suite test inventory captured by its run binding.");
  }
  const stats = report.stats;
  if (!stats || typeof stats !== "object") {
    throw new Error("Playwright JSON report is missing its stats object.");
  }

  const expected = finiteCount(stats.expected, "stats.expected");
  const skipped = finiteCount(stats.skipped, "stats.skipped");
  const unexpected = finiteCount(stats.unexpected, "stats.unexpected");
  const flaky = finiteCount(stats.flaky, "stats.flaky");
  if (typeof stats.duration !== "number" || !Number.isFinite(stats.duration) || stats.duration < 0) {
    throw new Error("Playwright report has invalid stats.duration.");
  }
  const reportStartedAtMs = Date.parse(stats.startTime);
  if (!Number.isFinite(reportStartedAtMs) || reportStartedAtMs < preparedAtMs) {
    throw new Error("Playwright report predates its run binding; refusing to bind stale raw output.");
  }
  if (statSync(rawReportPath).mtimeMs < preparedAtMs) {
    throw new Error("Playwright report file predates its run binding.");
  }

  const requiredProjects = ["desktop", "tablet", "mobile"];
  const configuredProjects = Array.isArray(report.config?.projects)
    ? report.config.projects
        .map((project) => project?.name)
        .filter((name) => typeof name === "string")
    : [];
  if (JSON.stringify(configuredProjects) !== JSON.stringify(requiredProjects)) {
    throw new Error("Playwright report must contain exactly the desktop, tablet, and mobile projects in that order.");
  }
  if (report.config?.workers !== 1) {
    throw new Error("Playwright report must come from the serialized one-worker run.");
  }
  for (const project of report.config.projects) {
    if (project?.retries !== 0 || project?.repeatEach !== 1) {
      throw new Error(`Playwright project ${project?.name || "<unnamed>"} must use zero retries and one repetition.`);
    }
  }

  const reportTests = collectReportTests(report.suites);
  if (reportTests.length === 0) {
    throw new Error("Playwright report contains no tests; refusing to treat an aborted empty run as complete.");
  }
  const observed = { expected: 0, skipped: 0, unexpected: 0, flaky: 0 };
  const projectTestCounts = new Map(requiredProjects.map((name) => [name, 0]));
  for (const test of reportTests) {
    if (!projectTestCounts.has(test?.projectName)) {
      throw new Error(`Playwright test references an unexpected project: ${test?.projectName || "<missing>"}.`);
    }
    projectTestCounts.set(test.projectName, projectTestCounts.get(test.projectName) + 1);
    if (!Array.isArray(test?.results) || test.results.length === 0) {
      throw new Error("Playwright report contains a test with no completed result; the run was incomplete or interrupted.");
    }
    const finalResult = test.results.at(-1);
    if (finalResult?.status === "interrupted") {
      throw new Error("Playwright report contains an interrupted test result; refusing to bind a partial run.");
    }
    if (!Object.hasOwn(observed, test?.status)) {
      throw new Error(`Playwright report contains an unsupported test status: ${test?.status || "<missing>"}.`);
    }
    observed[test.status] += 1;
    if (test.status === "expected"
      && (test.expectedStatus !== "passed" || finalResult?.status !== "passed")) {
      throw new Error("Playwright expected tests must finish with a passed result.");
    }
    if (test.status === "skipped"
      && (test.expectedStatus !== "skipped" || finalResult?.status !== "skipped")) {
      throw new Error("Playwright skipped tests must be explicitly expected skips with a completed skipped result.");
    }
  }
  for (const [project, count] of projectTestCounts) {
    if (count === 0) throw new Error(`Playwright report contains no tests for the ${project} project.`);
  }
  for (const [status, count] of Object.entries(observed)) {
    if (count !== { expected, skipped, unexpected, flaky }[status]) {
      throw new Error(`Playwright report stats.${status} does not match completed test results.`);
    }
  }

  state = unexpected === 0 && flaky === 0 ? "complete-pass" : "complete-fail";
  sourceReport = {
    ...sourceReportLocation(rawReportPath),
    sha256: createHash("sha256").update(rawBytes).digest("hex"),
  };
  results = {
    passed: expected,
    skipped,
    failed: unexpected,
    flaky,
    durationMs: stats.duration,
  };
  projects = configuredProjects;
  runBinding = {
    ...sourceReportLocation(bindingPath),
    sha256: createHash("sha256").update(bindingBytes).digest("hex"),
    preparedAtUtc: binding.preparedAtUtc,
  };
}

const summary = {
  schemaVersion: 1,
  state,
  candidate: {
    exactGitTreeHash: candidateTreeHash,
    currentRuntimeTreeDigest: runtimeTreeDigest,
  },
  browser: {
    name: browserName(channel),
    channel,
    identityEvidence: "Successful Playwright launch with the configured channel; exact installed-browser version is cross-bound in chrome/manual-audit.json.",
  },
  sourceReport,
  runBinding,
  projects,
  results,
};

const serialized = `${JSON.stringify(summary, null, 2)}\n`;
if (check) {
  if (readFileSync(outputPath, "utf8") !== serialized) {
    throw new Error(`${DEFAULT_OUTPUT} is stale. Regenerate it with --write.`);
  }
  process.stdout.write(`PLAYWRIGHT_SUMMARY_CHECK_PASS state=${state}\n`);
} else if (write) {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serialized);
  process.stdout.write(`PLAYWRIGHT_SUMMARY_WRITE_PASS state=${state}\n`);
} else {
  process.stdout.write(serialized);
}

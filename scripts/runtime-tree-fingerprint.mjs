import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const roots = [
  "src",
  "public",
  "tests",
  "pipelines",
  "scripts",
  "package.json",
  "package-lock.json",
  "next.config.ts",
  "playwright.config.ts",
  "tsconfig.json",
  "eslint.config.mjs",
  "postcss.config.mjs",
];

const selfExcludedReports = new Set([
  "public/case-studies/privacy-preflight/goal-candidate-e2e.json",
]);

const files = execFileSync("git", ["ls-files", "-co", "--exclude-standard", "--", ...roots], {
  encoding: "utf8",
}).split("\n").filter(Boolean).filter((path) => !selfExcludedReports.has(path)).sort();

const aggregate = createHash("sha256");
for (const path of files) {
  const fileHash = createHash("sha256").update(readFileSync(path)).digest("hex");
  aggregate.update(`${fileHash}  ${path}\n`);
}

process.stdout.write(`${JSON.stringify({
  schemaVersion: 1,
  algorithm: "SHA-256 of sorted lines: SHA-256(file bytes), two spaces, POSIX path, newline",
  excludedSelfReferentialReports: [...selfExcludedReports],
  files: files.length,
  sha256: aggregate.digest("hex"),
}, null, 2)}\n`);

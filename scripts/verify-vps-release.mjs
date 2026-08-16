import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { basename, resolve } from "node:path";
import { tmpdir } from "node:os";
import { listFiles, relativePosix, RELEASE_SCHEMA, sha256FilePortable } from "./vps-release-lib.mjs";

const archive = process.argv[2] ? resolve(process.argv[2]) : null;
const expectedCommit = process.argv[3] ?? null;
if (!archive || !expectedCommit) {
  throw new Error("Usage: npm run verify:vps-release -- <archive.tar.gz> <40-char-commit>");
}
if (!/^[a-f0-9]{40}$/.test(expectedCommit)) throw new Error("Expected commit must be a full Git SHA.");
if (!statSync(archive).isFile()) throw new Error(`Release archive is missing: ${archive}`);

const entries = execFileSync("tar", ["-tzf", archive], {
  encoding: "utf8",
  env: { ...process.env, COPYFILE_DISABLE: "1" },
})
  .split("\n")
  .filter(Boolean);
if (entries.some((entry) => entry.startsWith("/") || entry.split("/").includes(".."))) {
  throw new Error("Release archive contains an unsafe path.");
}
if (entries.some((entry) => entry !== "release" && !entry.startsWith("release/"))) {
  throw new Error("Release archive contains an entry outside release/.");
}

const temporary = mkdtempSync(resolve(tmpdir(), "portfolio-vps-verify-"));
try {
  execFileSync("tar", ["-C", temporary, "-xzf", archive], {
    env: { ...process.env, COPYFILE_DISABLE: "1" },
  });
  const releaseRoot = resolve(temporary, "release");
  const metadata = JSON.parse(readFileSync(resolve(releaseRoot, "release-metadata.json"), "utf8"));
  const manifest = JSON.parse(readFileSync(resolve(releaseRoot, "release-manifest.json"), "utf8"));
  if (metadata.schema !== RELEASE_SCHEMA || manifest.schema !== RELEASE_SCHEMA) {
    throw new Error("Release schema mismatch.");
  }
  if (metadata.sourceCommit !== expectedCommit || manifest.sourceCommit !== expectedCommit) {
    throw new Error("Release commit mismatch.");
  }

  const actualFiles = listFiles(releaseRoot)
    .map((path) => relativePosix(releaseRoot, path))
    .filter((path) => path !== "release-manifest.json");
  const expectedFiles = manifest.files.map((entry) => entry.path);
  if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) {
    throw new Error("Release file inventory mismatch.");
  }
  for (const entry of manifest.files) {
    const path = resolve(releaseRoot, entry.path);
    if (!path.startsWith(`${releaseRoot}/`)) throw new Error(`Unsafe manifest path: ${entry.path}`);
    if (statSync(path).size !== entry.bytes) throw new Error(`Size mismatch: ${entry.path}`);
    if (await sha256FilePortable(path) !== entry.sha256) throw new Error(`SHA-256 mismatch: ${entry.path}`);
  }

  process.stdout.write(`${JSON.stringify({
    schema: RELEASE_SCHEMA,
    archive: basename(archive),
    sourceCommit: expectedCommit,
    buildId: metadata.buildId,
    fileCount: manifest.fileCount,
    totalBytes: manifest.totalBytes,
    verified: true,
  }, null, 2)}\n`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

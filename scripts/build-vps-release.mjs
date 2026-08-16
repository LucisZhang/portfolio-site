import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { gzipSync } from "node:zlib";
import { basename, resolve } from "node:path";
import { tmpdir } from "node:os";
import {
  assertCleanRepository,
  git,
  listFiles,
  NODE_RUNTIME,
  relativePosix,
  RELEASE_SCHEMA,
  sha256FilePortable,
} from "./vps-release-lib.mjs";

function parseOutputDirectory(argv) {
  const index = argv.indexOf("--output-dir");
  if (index === -1) return resolve(".artifacts", "vps");
  if (!argv[index + 1] || argv[index + 1].startsWith("--")) {
    throw new Error("--output-dir requires a path.");
  }
  return resolve(argv[index + 1]);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.status !== 0) throw new Error(`${command} exited with status ${result.status ?? "unknown"}.`);
}

const outputDirectory = parseOutputDirectory(process.argv.slice(2));
assertCleanRepository();

const sourceCommit = git("rev-parse", "HEAD");
if (!/^[a-f0-9]{40}$/.test(sourceCommit)) throw new Error("The source commit is not a full Git SHA.");

run("npm", ["run", "build"], {
  env: { ...process.env, PORTFOLIO_STANDALONE: "1", NEXT_TELEMETRY_DISABLED: "1" },
});

const standalone = resolve(".next", "standalone");
const staticDirectory = resolve(".next", "static");
const publicDirectory = resolve("public");
for (const required of [standalone, staticDirectory, publicDirectory]) {
  if (!existsSync(required)) throw new Error(`Missing VPS build input: ${required}`);
}

const stagingRoot = mkdtempSync(resolve(tmpdir(), "portfolio-vps-release-"));
const releaseRoot = resolve(stagingRoot, "release");
mkdirSync(releaseRoot, { recursive: true });

try {
  cpSync(standalone, releaseRoot, { recursive: true, dereference: false });
  mkdirSync(resolve(releaseRoot, ".next"), { recursive: true });
  cpSync(staticDirectory, resolve(releaseRoot, ".next", "static"), { recursive: true, dereference: false });
  cpSync(publicDirectory, resolve(releaseRoot, "public"), { recursive: true, dereference: false });

  // Nginx can serve these release-local precompressed browser runtimes directly. This removes a
  // multi-second on-demand gzip step for the 39 MB DuckDB WASM and keeps compression work off the
  // 1 GB VPS. The originals remain present for clients that do not advertise gzip.
  const precompressRoots = [
    resolve(releaseRoot, "public", "duckdb"),
    resolve(releaseRoot, "public", "generated", "privacy-ocr"),
    resolve(releaseRoot, "public", "generated", "privacy-pdf"),
  ];
  for (const path of precompressRoots.flatMap((directory) => listFiles(directory))) {
    if (!/\.(?:js|mjs|wasm)$/u.test(path) || statSync(path).size < 64 * 1024) continue;
    writeFileSync(`${path}.gz`, gzipSync(readFileSync(path), { level: 9 }), { mode: 0o644 });
  }

  const buildIdPath = resolve(".next", "BUILD_ID");
  const buildId = readFileSync(buildIdPath, "utf8").trim();
  const metadataPath = resolve(releaseRoot, "release-metadata.json");
  const metadata = {
    schema: RELEASE_SCHEMA,
    sourceCommit,
    buildId,
    nodeRuntime: NODE_RUNTIME,
    bindContract: {
      nodeHost: "127.0.0.1",
      nodePort: 3100,
      nginxHost: "127.0.0.1",
      nginxPort: 18080,
    },
  };
  writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, { mode: 0o644 });

  const files = listFiles(releaseRoot);
  const manifest = {
    schema: RELEASE_SCHEMA,
    sourceCommit,
    fileCount: files.length,
    totalBytes: files.reduce((total, path) => total + statSync(path).size, 0),
    files: [],
  };
  for (const path of files) {
    manifest.files.push({
      path: relativePosix(releaseRoot, path),
      bytes: statSync(path).size,
      sha256: await sha256FilePortable(path),
    });
  }
  writeFileSync(resolve(releaseRoot, "release-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o644 });

  mkdirSync(outputDirectory, { recursive: true });
  const archive = resolve(outputDirectory, `portfolio-${sourceCommit}.tar.gz`);
  const checksum = `${archive}.sha256`;
  // macOS bsdtar otherwise serializes Finder/xattr metadata as AppleDouble `._*` entries. GNU
  // tar on Debian exposes those entries, so suppress them at creation and keep the archive
  // portable across the local-build/Linux-runtime boundary.
  run("tar", ["--no-xattrs", "-C", stagingRoot, "-czf", archive, "release"], {
    env: { ...process.env, COPYFILE_DISABLE: "1" },
  });
  const archiveSha256 = await sha256FilePortable(archive);
  writeFileSync(checksum, `${archiveSha256}  ${basename(archive)}\n`, { mode: 0o644 });

  process.stdout.write(`${JSON.stringify({
    schema: RELEASE_SCHEMA,
    sourceCommit,
    buildId,
    archive,
    archiveBytes: statSync(archive).size,
    archiveSha256,
    checksum,
    fileCount: manifest.fileCount,
    unpackedBytes: manifest.totalBytes,
  }, null, 2)}\n`);
} finally {
  rmSync(stagingRoot, { recursive: true, force: true });
}

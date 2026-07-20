import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  lstatSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_BASE = "98496739b860ae423deabbb1d5a443e123d7e6d9";
const DEFAULT_OUTPUT =
  "docs/phase2-public-review-artifacts/goal2-final/binary-manifest.json";

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
if (write && check) {
  throw new Error("Choose at most one of --write and --check.");
}

const requestedBase = readOption("base", DEFAULT_BASE);
const outputPath = resolve(repoRoot, readOption("output", DEFAULT_OUTPUT));
const baseCommit = execFileSync(
  "git",
  ["rev-parse", `${requestedBase}^{commit}`],
  { cwd: repoRoot, encoding: "utf8" },
).trim();

const binaryExtensions = new Set([
  ".7z",
  ".avif",
  ".bin",
  ".br",
  ".db",
  ".dylib",
  ".eot",
  ".exe",
  ".gif",
  ".gz",
  ".ico",
  ".jpeg",
  ".jpg",
  ".mov",
  ".mp3",
  ".mp4",
  ".otf",
  ".parquet",
  ".pdf",
  ".png",
  ".so",
  ".sqlite",
  ".tar",
  ".ttf",
  ".wasm",
  ".wav",
  ".webm",
  ".webp",
  ".woff",
  ".woff2",
  ".zip",
]);

function gitObjectExists(revision, path) {
  try {
    execFileSync("git", ["cat-file", "-e", `${revision}:${path}`], {
      cwd: repoRoot,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function isBinary(path, bytes) {
  if (binaryExtensions.has(extname(path).toLowerCase())) {
    return true;
  }

  return bytes.subarray(0, 8_000).includes(0);
}

function pngDimensions(bytes) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(signature)) {
    throw new Error("Invalid PNG signature or truncated IHDR.");
  }

  return {
    format: "png",
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

function jpegDimensions(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error("Invalid JPEG start-of-image marker.");
  }

  const startOfFrameMarkers = new Set([
    0xc0,
    0xc1,
    0xc2,
    0xc3,
    0xc5,
    0xc6,
    0xc7,
    0xc9,
    0xca,
    0xcb,
    0xcd,
    0xce,
    0xcf,
  ]);

  let offset = 2;
  while (offset < bytes.length) {
    while (offset < bytes.length && bytes[offset] !== 0xff) {
      offset += 1;
    }
    while (offset < bytes.length && bytes[offset] === 0xff) {
      offset += 1;
    }
    if (offset >= bytes.length) {
      break;
    }

    const marker = bytes[offset];
    offset += 1;
    if (marker === 0xd9 || marker === 0xda) {
      break;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      continue;
    }
    if (offset + 1 >= bytes.length) {
      break;
    }

    const segmentLength = bytes.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.length) {
      throw new Error("Invalid or truncated JPEG segment.");
    }
    if (startOfFrameMarkers.has(marker)) {
      if (segmentLength < 7) {
        throw new Error("Truncated JPEG start-of-frame segment.");
      }
      return {
        format: "jpeg",
        width: bytes.readUInt16BE(offset + 5),
        height: bytes.readUInt16BE(offset + 3),
      };
    }

    offset += segmentLength;
  }

  throw new Error("JPEG dimensions were not found.");
}

function imageDimensions(path, bytes) {
  const extension = extname(path).toLowerCase();
  if (extension === ".png") {
    return pngDimensions(bytes);
  }
  if (extension === ".jpg" || extension === ".jpeg") {
    return jpegDimensions(bytes);
  }
  return null;
}

const candidatePaths = execFileSync(
  "git",
  ["ls-files", "-co", "--exclude-standard", "-z"],
  { cwd: repoRoot },
)
  .toString("utf8")
  .split("\0")
  .filter(Boolean)
  .sort((left, right) => left.localeCompare(right, "en"));

const files = [];
for (const path of candidatePaths) {
  const absolutePath = resolve(repoRoot, path);
  let stats;
  try {
    stats = lstatSync(absolutePath);
  } catch {
    continue;
  }
  if (!stats.isFile()) {
    continue;
  }

  const bytes = readFileSync(absolutePath);
  const existedAtBase = gitObjectExists(baseCommit, path);
  if (existedAtBase) {
    const baseBytes = execFileSync(
      "git",
      ["show", `${baseCommit}:${path}`],
      { cwd: repoRoot, maxBuffer: 1024 * 1024 * 512 },
    );
    if (bytes.equals(baseBytes)) {
      continue;
    }
  }

  if (!isBinary(path, bytes)) {
    continue;
  }

  const dimensions = imageDimensions(path, bytes);
  files.push({
    path,
    status: existedAtBase ? "modified" : "new",
    bytes: bytes.length,
    ...(dimensions ? { image: dimensions } : {}),
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
}

const manifest = {
  schemaVersion: 1,
  baseCommit,
  scope:
    "New or modified binary files in the non-ignored Git working copy relative to baseCommit; deleted files are excluded.",
  binaryDetection:
    "Known binary extension or a NUL byte in the first 8000 bytes; PNG and JPEG dimensions are parsed from file bytes.",
  totals: {
    files: files.length,
    new: files.filter((file) => file.status === "new").length,
    modified: files.filter((file) => file.status === "modified").length,
    bytes: files.reduce((total, file) => total + file.bytes, 0),
  },
  files,
};

const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
if (check) {
  if (readFileSync(outputPath, "utf8") !== serialized) {
    throw new Error(`${DEFAULT_OUTPUT} is stale. Regenerate it with --write.`);
  }
  process.stdout.write(`BINARY_MANIFEST_CHECK_PASS files=${files.length}\n`);
} else if (write) {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serialized);
  process.stdout.write(`BINARY_MANIFEST_WRITE_PASS files=${files.length}\n`);
} else {
  process.stdout.write(serialized);
}

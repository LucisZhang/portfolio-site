import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "assistant-knowledge", "manifest.json");
const outputPath = path.join(root, "src", "data", "assistant-knowledge.generated.json");
const verifyOnly = process.argv.includes("--verify");
const MAX_FILE_BYTES = 180_000;
const MAX_TOTAL_BYTES = 1_800_000;
const TARGET_CHUNK_CHARACTERS = 1_650;
const CHUNK_OVERLAP_LINES = 4;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function encodedPath(value) {
  return value.split("/").map(encodeURIComponent).join("/");
}

function assertManifest(manifest) {
  if (manifest?.version !== 1 || !/^public-github-portfolio-[a-z0-9-]+$/u.test(manifest.snapshotId)) {
    throw new Error("assistant knowledge manifest identity is invalid");
  }
  if (!Array.isArray(manifest.repositories) || manifest.repositories.length < 1) {
    throw new Error("assistant knowledge manifest has no repositories");
  }
  const seen = new Set();
  for (const repository of manifest.repositories) {
    const key = `${repository.owner}/${repository.repo}`;
    if (seen.has(key)) throw new Error(`duplicate repository: ${key}`);
    seen.add(key);
    if (repository.owner !== "LucisZhang" || !/^[A-Za-z0-9._-]+$/u.test(repository.repo)
      || !/^[a-f0-9]{40}$/u.test(repository.commit)) {
      throw new Error(`invalid pinned repository: ${key}`);
    }
    if (!repository.label?.en || !repository.label?.zh || !Array.isArray(repository.aliases)
      || !Array.isArray(repository.files) || repository.files.length < 1) {
      throw new Error(`incomplete repository metadata: ${key}`);
    }
    for (const file of repository.files) {
      if (typeof file !== "string" || file.startsWith("/") || file.includes("..") || !/^[A-Za-z0-9._/\[\]-]+$/u.test(file)) {
        throw new Error(`unsafe source path: ${key}/${file}`);
      }
    }
  }
}

function chunkFile(repository, file, text, fileSha256) {
  const lines = text.replace(/\r\n?/gu, "\n").split("\n");
  const chunks = [];
  let start = 0;
  while (start < lines.length) {
    let end = start;
    let characters = 0;
    while (end < lines.length && (characters < TARGET_CHUNK_CHARACTERS || end === start)) {
      characters += lines[end].length + 1;
      end += 1;
    }
    const content = lines.slice(start, end).join("\n").trim();
    if (content) {
      const lineStart = start + 1;
      const lineEnd = end;
      const sourceUrl = `https://github.com/${repository.owner}/${repository.repo}/blob/${repository.commit}/${encodedPath(file)}#L${lineStart}-L${lineEnd}`;
      chunks.push({
        id: `${repository.repo}:${file}:L${lineStart}-L${lineEnd}`,
        repository: `${repository.owner}/${repository.repo}`,
        project: repository.label,
        aliases: repository.aliases,
        commit: repository.commit,
        path: file,
        lineStart,
        lineEnd,
        sourceUrl,
        fileSha256,
        content,
      });
    }
    if (end >= lines.length) break;
    start = Math.max(start + 1, end - CHUNK_OVERLAP_LINES);
  }
  return chunks;
}

async function fetchText(url, label) {
  const response = await fetch(url, {
    headers: { Accept: "text/plain", "User-Agent": "XGZ-portfolio-knowledge-builder/1" },
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}`);
  const declared = Number(response.headers.get("content-length") ?? "0");
  if (declared > MAX_FILE_BYTES) throw new Error(`${label} exceeds the file byte cap`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > MAX_FILE_BYTES) throw new Error(`${label} exceeds the file byte cap`);
  if (bytes.includes(0)) throw new Error(`${label} is not plain text`);
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

async function buildSnapshot(manifest) {
  const chunks = [];
  const files = [];
  let totalBytes = 0;
  for (const repository of manifest.repositories) {
    for (const file of repository.files) {
      const label = `${repository.owner}/${repository.repo}@${repository.commit}:${file}`;
      const rawUrl = `https://raw.githubusercontent.com/${repository.owner}/${repository.repo}/${repository.commit}/${encodedPath(file)}`;
      const text = await fetchText(rawUrl, label);
      const bytes = Buffer.byteLength(text, "utf8");
      totalBytes += bytes;
      if (totalBytes > MAX_TOTAL_BYTES) throw new Error("assistant knowledge snapshot exceeds the total byte cap");
      const fileSha256 = sha256(text);
      const fileChunks = chunkFile(repository, file, text, fileSha256);
      if (fileChunks.length === 0) throw new Error(`${label} produced no knowledge chunks`);
      chunks.push(...fileChunks);
      files.push({
        repository: `${repository.owner}/${repository.repo}`,
        commit: repository.commit,
        path: file,
        bytes,
        sha256: fileSha256,
        chunks: fileChunks.length,
      });
    }
  }
  const stablePayload = {
    version: 1,
    snapshotId: manifest.snapshotId,
    manifestSha256: sha256(canonicalJson(manifest)),
    repositoryCount: manifest.repositories.length,
    fileCount: files.length,
    chunkCount: chunks.length,
    totalSourceBytes: totalBytes,
    files,
    chunks,
  };
  return {
    ...stablePayload,
    generatedAt: new Date().toISOString(),
    snapshotSha256: sha256(canonicalJson(stablePayload)),
  };
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
assertManifest(manifest);
const built = await buildSnapshot(manifest);

if (verifyOnly) {
  const existing = JSON.parse(await readFile(outputPath, "utf8"));
  const stableExisting = { ...existing };
  const stableBuilt = { ...built };
  delete stableExisting.generatedAt;
  delete stableBuilt.generatedAt;
  if (canonicalJson(stableExisting) !== canonicalJson(stableBuilt)) {
    throw new Error("committed assistant knowledge snapshot does not match pinned GitHub sources");
  }
  console.log(`assistant knowledge verified: ${built.repositoryCount} repos, ${built.fileCount} files, ${built.chunkCount} chunks, ${built.snapshotSha256}`);
} else {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(built, null, 2)}\n`, "utf8");
  console.log(`assistant knowledge built: ${built.repositoryCount} repos, ${built.fileCount} files, ${built.chunkCount} chunks, ${built.snapshotSha256}`);
}

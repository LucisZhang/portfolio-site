import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "assistant-knowledge", "manifest.json");
const outputPath = path.join(root, "src", "data", "assistant-knowledge.generated.json");
const verifyOnly = process.argv.includes("--verify");
const cacheSelfTestOnly = process.argv.includes("--self-test-cache");
const MAX_FILE_BYTES = 180_000;
const MAX_TOTAL_BYTES = 3_000_000;
const MAX_COMMITTED_SNAPSHOT_BYTES = 12_000_000;
const TARGET_CHUNK_CHARACTERS = 1_650;
const CHUNK_OVERLAP_LINES = 4;
const execFileAsync = promisify(execFile);

// Keep the assistant corpus aligned with the glyph corpus's documented OCR
// exception. The benchmark's fixture rows contain raw, garbled OCR-engine
// `recognizedText` plus detector-level values that are not rendered as page
// copy. The assistant still needs the reviewed aggregate claim, so retain the
// exact top-level `summary` object for citation while excluding every fixture
// row from retrieval. If the UI ever starts surfacing those rows as evidence,
// remove this slice and review both knowledge and font coverage together.
const SUMMARY_ONLY_SITE_JSON_SOURCES = new Set([
  "public/case-studies/privacy-preflight/ocr-fixture-benchmark.json",
]);

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

function sanitizeKnowledgeText(text) {
  // Keep source URLs, line numbers, and file hashes tied to the original public
  // file while removing machine-specific workspace prefixes from retrieval text.
  return text
    .replace(/\/Users\/[A-Za-z0-9._-]+\//gu, "<local-workspace>/")
    .replace(/\/private\/tmp\//gu, "<temporary-workspace>/");
}

function encodedPath(value) {
  return value.split("/").map(encodeURIComponent).join("/");
}

function assertSafeSourcePath(file, label) {
  if (typeof file !== "string" || file.startsWith("/") || file.includes("..") || !/^[A-Za-z0-9._/\[\]-]+$/u.test(file)) {
    throw new Error(`unsafe source path: ${label}/${file}`);
  }
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
      assertSafeSourcePath(file, key);
    }
  }
  const site = manifest.siteRepository;
  if (site?.owner !== "LucisZhang" || site.repo !== "portfolio-site" || !/^[a-f0-9]{40}$/u.test(site.commit)) {
    throw new Error("assistant knowledge site repository is not commit-pinned");
  }
  if (!Array.isArray(manifest.siteSources) || manifest.siteSources.length < 1) {
    throw new Error("assistant knowledge manifest has no R2 site sources");
  }
  const routes = new Set();
  for (const source of manifest.siteSources) {
    if (typeof source.route !== "string" || !source.route.startsWith("/") || routes.has(source.route)
      || !source.label?.en || !source.label?.zh || !Array.isArray(source.aliases)
      || !source.aliases.includes(source.route) || !Array.isArray(source.files) || source.files.length < 1) {
      throw new Error(`invalid R2 site source: ${source.route ?? "unknown"}`);
    }
    routes.add(source.route);
    for (const sourceFile of source.files) {
      const file = typeof sourceFile === "string" ? sourceFile : sourceFile?.path;
      assertSafeSourcePath(file, source.route);
      if (typeof sourceFile === "object") {
        const keys = Object.keys(sourceFile).sort().join(",");
        const projectSelector = keys === "path,projectSlug"
          && /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(sourceFile.projectSlug);
        const lineSelector = keys === "lineEnd,lineStart,path"
          && Number.isInteger(sourceFile.lineStart) && Number.isInteger(sourceFile.lineEnd)
          && sourceFile.lineStart >= 1 && sourceFile.lineEnd >= sourceFile.lineStart;
        if (!projectSelector && !lineSelector) throw new Error(`invalid R2 site source selector: ${source.route}/${file}`);
      }
    }
  }
}

function chunkFile(repository, file, text, fileSha256, lineOffset = 0, idNamespace = repository.repo) {
  const lines = sanitizeKnowledgeText(text).replace(/\r\n?/gu, "\n").split("\n");
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
      const lineStart = lineOffset + start + 1;
      const lineEnd = lineOffset + end;
      const sourceUrl = `https://github.com/${repository.owner}/${repository.repo}/blob/${repository.commit}/${encodedPath(file)}#L${lineStart}-L${lineEnd}`;
      chunks.push({
        id: `${idNamespace}:${file}:L${lineStart}-L${lineEnd}`,
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

function selectProjectEntry(text, slug, file) {
  const marker = `  {\n    slug: "${slug}",`;
  const start = text.indexOf(marker);
  if (start < 0) throw new Error(`${file} has no project entry for ${slug}`);
  const next = text.indexOf("\n  {\n    slug: ", start + marker.length);
  const catalogEnd = text.indexOf("\n];", start + marker.length);
  const end = next >= 0 ? next : catalogEnd;
  if (end < 0) throw new Error(`${file} has no closing boundary for ${slug}`);
  const lineOffset = text.slice(0, start).split("\n").length - 1;
  return { text: text.slice(start, end).trimEnd(), lineOffset };
}

function selectLineRange(text, lineStart, lineEnd, file) {
  const lines = text.replace(/\r\n?/gu, "\n").split("\n");
  if (lineEnd > lines.length) throw new Error(`${file} line selector exceeds ${lines.length} lines`);
  return { text: lines.slice(lineStart - 1, lineEnd).join("\n"), lineOffset: lineStart - 1 };
}

function selectTopLevelJsonSummary(text, file) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`${file} is not valid JSON for summary-only selection`);
  }
  if (!parsed?.summary || typeof parsed.summary !== "object" || Array.isArray(parsed.summary)) {
    throw new Error(`${file} has no top-level summary object`);
  }

  const normalized = text.replace(/\r\n?/gu, "\n");
  const matches = Array.from(normalized.matchAll(/^[ \t]*"summary"\s*:\s*\{/gmu));
  if (matches.length !== 1) throw new Error(`${file} must contain exactly one top-level summary object`);
  const start = matches[0].index;
  const openingBrace = normalized.indexOf("{", start);
  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = -1;
  for (let index = openingBrace; index < normalized.length; index += 1) {
    const char = normalized[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}" && --depth === 0) {
      end = index + 1;
      break;
    }
  }
  if (end < 0) throw new Error(`${file} has an unterminated top-level summary object`);
  const lineOffset = normalized.slice(0, start).split("\n").length - 1;
  return { text: normalized.slice(start, end), lineOffset };
}

async function readPinnedSiteFile(site, file) {
  const label = `${site.owner}/${site.repo}@${site.commit}:${file}`;
  const { stdout } = await execFileAsync("git", ["show", `${site.commit}:${file}`], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: MAX_FILE_BYTES * 2,
  });
  if (Buffer.byteLength(stdout, "utf8") > MAX_FILE_BYTES || stdout.includes("\0")) {
    throw new Error(`${label} is not bounded plain text`);
  }
  return stdout;
}

async function readCommittedKnowledgeSnapshot() {
  const relativeOutputPath = path.relative(root, outputPath);
  const { stdout } = await execFileAsync("git", ["show", `HEAD:${relativeOutputPath}`], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: MAX_COMMITTED_SNAPSHOT_BYTES,
  });
  if (Buffer.byteLength(stdout, "utf8") > MAX_COMMITTED_SNAPSHOT_BYTES || stdout.includes("\0")) {
    throw new Error("committed assistant knowledge cache is not bounded plain text");
  }
  return JSON.parse(stdout);
}

async function readPinnedCommitTimestamp(commit) {
  const { stdout } = await execFileAsync("git", ["show", "-s", "--format=%cI", commit], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 1024,
  });
  const timestamp = new Date(stdout.trim());
  if (Number.isNaN(timestamp.getTime())) throw new Error(`invalid timestamp for pinned site commit ${commit}`);
  return timestamp.toISOString();
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

function remoteFileKey(repository, commit, file) {
  return `${repository}@${commit}:${file}`;
}

function assertCachedSnapshotHash(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || !Array.isArray(snapshot.files) || !Array.isArray(snapshot.chunks)
    || typeof snapshot.snapshotSha256 !== "string") {
    throw new Error("committed assistant knowledge cache has an invalid shape");
  }
  if (cachedSnapshotSha256(snapshot) !== snapshot.snapshotSha256) {
    throw new Error("committed assistant knowledge cache hash does not match");
  }
}

function cachedSnapshotSha256(snapshot) {
  const stablePayload = { ...snapshot };
  delete stablePayload.generatedAt;
  delete stablePayload.snapshotSha256;
  return sha256(canonicalJson(stablePayload));
}

function cachedRemoteSources(manifest, snapshot) {
  assertCachedSnapshotHash(snapshot);
  const expected = new Map();
  const remoteRepositories = new Set();
  for (const repository of manifest.repositories) {
    const repositoryName = `${repository.owner}/${repository.repo}`;
    remoteRepositories.add(repositoryName);
    for (const file of repository.files) {
      expected.set(remoteFileKey(repositoryName, repository.commit, file), { repository, file });
    }
  }
  const cachedFiles = snapshot.files.filter((file) => remoteRepositories.has(file.repository));
  const cachedChunks = snapshot.chunks.filter((chunk) => remoteRepositories.has(chunk.repository));
  if (cachedFiles.length !== expected.size) throw new Error("committed remote cache file count does not match the manifest");

  const filesByKey = new Map();
  for (const file of cachedFiles) {
    const key = remoteFileKey(file.repository, file.commit, file.path);
    if (!expected.has(key) || filesByKey.has(key) || !/^[a-f0-9]{64}$/u.test(file.sha256)
      || !Number.isInteger(file.bytes) || file.bytes < 1 || file.bytes > MAX_FILE_BYTES
      || !Number.isInteger(file.chunks) || file.chunks < 1) {
      throw new Error(`committed remote cache has an invalid file: ${key}`);
    }
    filesByKey.set(key, file);
  }

  const chunksByKey = new Map();
  for (const chunk of cachedChunks) {
    const key = remoteFileKey(chunk.repository, chunk.commit, chunk.path);
    const descriptor = expected.get(key);
    const file = filesByKey.get(key);
    const expectedId = descriptor
      ? `${descriptor.repository.repo}:${descriptor.file}:L${chunk.lineStart}-L${chunk.lineEnd}`
      : "";
    if (!descriptor || !file || chunk.fileSha256 !== file.sha256 || typeof chunk.content !== "string" || !chunk.content
      || !Number.isInteger(chunk.lineStart) || !Number.isInteger(chunk.lineEnd) || chunk.lineStart < 1 || chunk.lineEnd < chunk.lineStart
      || chunk.id !== expectedId
      || canonicalJson(chunk.project) !== canonicalJson(descriptor.repository.label)
      || canonicalJson(chunk.aliases) !== canonicalJson(descriptor.repository.aliases)
      || chunk.sourceUrl !== `https://github.com/${descriptor.repository.owner}/${descriptor.repository.repo}/blob/${descriptor.repository.commit}/${encodedPath(descriptor.file)}#L${chunk.lineStart}-L${chunk.lineEnd}`) {
      throw new Error(`committed remote cache has an invalid chunk: ${chunk.id ?? key}`);
    }
    const group = chunksByKey.get(key) ?? [];
    group.push(chunk);
    chunksByKey.set(key, group);
  }

  const files = [];
  const chunks = [];
  let totalBytes = 0;
  for (const [key] of expected) {
    const file = filesByKey.get(key);
    const fileChunks = chunksByKey.get(key) ?? [];
    if (!file || fileChunks.length !== file.chunks) throw new Error(`committed remote cache is incomplete: ${key}`);
    files.push(file);
    chunks.push(...fileChunks);
    totalBytes += file.bytes;
  }
  return { files, chunks, totalBytes };
}

function expectCacheRejection(label, operation) {
  try {
    operation();
  } catch {
    return;
  }
  throw new Error(`cache self-test did not reject ${label}`);
}

function resignCachedSnapshot(snapshot) {
  snapshot.snapshotSha256 = cachedSnapshotSha256(snapshot);
  return snapshot;
}

async function runCacheSelfTest(manifest) {
  const committed = await readCommittedKnowledgeSnapshot();
  const baseline = cachedRemoteSources(manifest, committed);

  const badHash = structuredClone(committed);
  badHash.snapshotSha256 = "0".repeat(64);
  expectCacheRejection("a mismatched snapshot hash", () => cachedRemoteSources(manifest, badHash));

  const badAlias = structuredClone(committed);
  badAlias.chunks[0].aliases = [...badAlias.chunks[0].aliases, "tampered-alias"];
  resignCachedSnapshot(badAlias);
  expectCacheRejection("tampered aliases with a recomputed envelope hash", () => cachedRemoteSources(manifest, badAlias));

  const badUrl = structuredClone(committed);
  badUrl.chunks[0].sourceUrl = `${badUrl.chunks[0].sourceUrl}-tampered`;
  resignCachedSnapshot(badUrl);
  expectCacheRejection("a tampered citation URL with a recomputed envelope hash", () => cachedRemoteSources(manifest, badUrl));

  const badId = structuredClone(committed);
  badId.chunks[0].id = `${badId.chunks[0].id}-tampered`;
  resignCachedSnapshot(badId);
  expectCacheRejection("a tampered chunk ID with a recomputed envelope hash", () => cachedRemoteSources(manifest, badId));

  const driftedManifest = structuredClone(manifest);
  driftedManifest.repositories[0].files[0] = `${driftedManifest.repositories[0].files[0]}.drift`;
  expectCacheRejection("manifest path drift", () => cachedRemoteSources(driftedManifest, committed));

  if (!isNetworkUnavailable({ cause: { code: "ENOTFOUND" } })) throw new Error("cache self-test did not recognize DNS unavailability");
  if (isNetworkUnavailable({ cause: { code: "HTTP_404" } })) throw new Error("cache self-test would fall back on HTTP 404");
  console.log(`assistant knowledge cache self-test passed: ${baseline.files.length} files, ${baseline.chunks.length} chunks`);
}

async function fetchRemoteSources(manifest) {
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
  return { chunks, files, totalBytes };
}

function isNetworkUnavailable(error) {
  return error?.name === "TimeoutError"
    || ["EAI_AGAIN", "ECONNREFUSED", "ENETUNREACH", "ENOTFOUND", "ETIMEDOUT"].includes(error?.cause?.code);
}

async function buildSnapshot(manifest) {
  let remote;
  try {
    remote = await fetchRemoteSources(manifest);
  } catch (error) {
    if (!isNetworkUnavailable(error)) throw error;
    const existing = await readCommittedKnowledgeSnapshot();
    remote = cachedRemoteSources(manifest, existing);
    console.log(`assistant knowledge remote cache verified: ${remote.files.length} files, ${remote.chunks.length} chunks`);
  }
  const chunks = [...remote.chunks];
  const files = [...remote.files];
  let totalBytes = remote.totalBytes;
  const siteRepository = {
    ...manifest.siteRepository,
    label: { en: "Portfolio site", zh: "作品集网站" },
    aliases: [],
  };
  for (const source of manifest.siteSources) {
    const repository = { ...siteRepository, label: source.label, aliases: source.aliases };
    for (const sourceFile of source.files) {
      const file = typeof sourceFile === "string" ? sourceFile : sourceFile.path;
      const fullText = await readPinnedSiteFile(siteRepository, file);
      const summaryOnly = SUMMARY_ONLY_SITE_JSON_SOURCES.has(file);
      const selected = summaryOnly
        ? selectTopLevelJsonSummary(fullText, file)
        : typeof sourceFile === "string"
        ? { text: fullText, lineOffset: 0 }
        : "projectSlug" in sourceFile
          ? selectProjectEntry(fullText, sourceFile.projectSlug, file)
          : selectLineRange(fullText, sourceFile.lineStart, sourceFile.lineEnd, file);
      const fullFileBytes = Buffer.byteLength(fullText, "utf8");
      const selectionBytes = Buffer.byteLength(selected.text, "utf8");
      totalBytes += selectionBytes;
      if (totalBytes > MAX_TOTAL_BYTES) throw new Error("assistant knowledge snapshot exceeds the total byte cap");
      const fileSha256 = sha256(fullText);
      const selectionSha256 = sha256(selected.text);
      const routeNamespace = source.route === "/" ? "home" : source.route.slice(1).replaceAll("/", "-");
      const fileChunks = chunkFile(
        repository,
        file,
        selected.text,
        fileSha256,
        selected.lineOffset,
        `${repository.repo}:${routeNamespace}`,
      );
      if (fileChunks.length === 0) throw new Error(`${source.route}:${file} produced no knowledge chunks`);
      chunks.push(...fileChunks);
      files.push({
        repository: `${repository.owner}/${repository.repo}`,
        commit: repository.commit,
        path: file,
        bytes: fullFileBytes,
        sha256: fileSha256,
        chunks: fileChunks.length,
        ...(typeof sourceFile === "string" && !summaryOnly ? {} : { selectionBytes, selectionSha256 }),
      });
    }
  }
  const stablePayload = {
    version: 1,
    snapshotId: manifest.snapshotId,
    manifestSha256: sha256(canonicalJson(manifest)),
    repositoryCount: manifest.repositories.length + 1,
    fileCount: files.length,
    chunkCount: chunks.length,
    totalSourceBytes: totalBytes,
    files,
    chunks,
  };
  return {
    ...stablePayload,
    generatedAt: await readPinnedCommitTimestamp(siteRepository.commit),
    snapshotSha256: sha256(canonicalJson(stablePayload)),
  };
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
assertManifest(manifest);
if (cacheSelfTestOnly) {
  await runCacheSelfTest(manifest);
} else {
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
}

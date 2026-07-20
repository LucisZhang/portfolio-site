import { createHash } from "node:crypto";
import { register } from "node:module";

register("../tests/assistant/ts-loader.mjs", import.meta.url);

const {
  ASSISTANT_PUBLIC_SOURCE_FILE_BYTE_CAP,
  ASSISTANT_PUBLIC_SOURCE_PACK,
  ASSISTANT_PUBLIC_SOURCE_PACK_SHA256,
  validateAssistantPublicSourcePack,
} = await import("../src/lib/assistant-public-sources.ts");
const { ASSISTANT_PUBLIC_FACT_CATALOG_SHA256 } = await import("../src/lib/assistant-public-facts.ts");

const args = process.argv.slice(2);
if (args.length > 1 || (args.length === 1 && args[0] !== "--verify-remote")) {
  throw new Error("Usage: node scripts/check-assistant-public-sources.mjs [--verify-remote]");
}

const verifyRemote = args[0] === "--verify-remote";
const REMOTE_TIMEOUT_MS = 10_000;
const TREE_RESPONSE_BYTE_CAP = 2_000_000;
validateAssistantPublicSourcePack();

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function rawCommitUrl(source) {
  const { owner, repo, commit } = ASSISTANT_PUBLIC_SOURCE_PACK.project;
  const path = source.path.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${owner}/${repo}/${commit}/${path}`;
}

async function boundedResponseBytes(response, expectedLength) {
  const declaredLength = response.headers.get("content-length");
  const contentEncoding = response.headers.get("content-encoding")?.toLowerCase() ?? "identity";
  if (declaredLength !== null) {
    const parsed = Number(declaredLength);
    if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > ASSISTANT_PUBLIC_SOURCE_FILE_BYTE_CAP) {
      throw new Error(`remote Content-Length is invalid or exceeds the cap: ${declaredLength}`);
    }
    if ((contentEncoding === "identity" || contentEncoding === "") && parsed !== expectedLength) {
      throw new Error(`remote Content-Length ${parsed} does not match reviewed ${expectedLength}`);
    }
  }
  if (!response.body) throw new Error("remote response has no body");
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > ASSISTANT_PUBLIC_SOURCE_FILE_BYTE_CAP || total > expectedLength) {
      await reader.cancel("public source exceeds reviewed byte length");
      throw new Error("remote public source exceeds its reviewed byte length or safety cap");
    }
    chunks.push(value);
  }
  const bytes = Buffer.allocUnsafe(total);
  let offset = 0;
  for (const chunk of chunks) {
    Buffer.from(chunk).copy(bytes, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

async function boundedJsonResponse(response, maxBytes) {
  const declaredLength = response.headers.get("content-length");
  if (declaredLength !== null) {
    const parsed = Number(declaredLength);
    if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > maxBytes) {
      throw new Error(`remote JSON Content-Length is invalid or exceeds ${maxBytes}`);
    }
  }
  if (!response.body) throw new Error("remote JSON response has no body");
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel("remote JSON response exceeds byte cap");
      throw new Error("remote JSON response exceeds byte cap");
    }
    chunks.push(value);
  }
  const bytes = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), total);
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  return JSON.parse(text);
}

function selectedExcerpt(fullText, source) {
  if (fullText.includes("\r")) throw new Error(`${source.id} remote file is not LF-normalized`);
  const lines = fullText.split("\n");
  if (lines.length - 1 < source.lineEnd) throw new Error(`${source.id} remote line range is missing`);
  return `${lines.slice(source.lineStart - 1, source.lineEnd).join("\n")}\n`;
}

function assertRemoteContentShape(text, source) {
  if (text.startsWith("version https://git-lfs.github.com/spec/v1\n")) {
    throw new Error(`${source.id} resolved to a Git LFS pointer`);
  }
  if (/<\/?[a-z][^>]*>/iu.test(text)) throw new Error(`${source.id} contains raw HTML`);
  const unsafeShapes = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
    /\b(?:ghp|gho|ghu|ghs|github_pat)_[A-Za-z0-9_]{20,}\b/u,
    /\bsk-[A-Za-z0-9_-]{20,}\b/u,
    /\bAKIA[0-9A-Z]{16}\b/u,
    /(?:ignore|disregard|override|bypass)[\s\S]{0,80}(?:previous|system|developer|hidden|internal)[\s\S]{0,50}(?:instructions?|prompts?|rules?)/iu,
    /(?:jailbreak|developer\s+mode|\bDAN\b)/iu,
  ];
  if (unsafeShapes.some((pattern) => pattern.test(text))) {
    throw new Error(`${source.id} contains a secret or instruction-like shape`);
  }
}

async function verifyOneRemoteSource(source) {
  const url = rawCommitUrl(source);
  const response = await fetch(url, {
    method: "GET",
    redirect: "manual",
    headers: {
      Accept: "text/plain, application/octet-stream;q=0.9",
      "User-Agent": "portfolio-public-source-verifier/1",
    },
    signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS),
  });
  if (response.status >= 300 && response.status < 400) {
    throw new Error(`${source.id} remote verification refused redirect status ${response.status}`);
  }
  if (!response.ok || response.status !== 200) {
    throw new Error(`${source.id} remote verification returned HTTP ${response.status}`);
  }
  if (response.url !== url) throw new Error(`${source.id} remote URL changed unexpectedly`);
  if (response.headers.has("location") || response.headers.has("content-range")) {
    throw new Error(`${source.id} remote response has redirect or partial-content headers`);
  }
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!/^(?:text\/plain|application\/octet-stream)(?:;|$)/u.test(contentType)) {
    throw new Error(`${source.id} remote Content-Type is not plain text: ${contentType || "missing"}`);
  }
  const bytes = await boundedResponseBytes(response, source.byteLength);
  if (bytes.byteLength !== source.byteLength) {
    throw new Error(`${source.id} remote bytes ${bytes.byteLength} do not match ${source.byteLength}`);
  }
  if (sha256(bytes) !== source.fileSha256) {
    throw new Error(`${source.id} remote full-file SHA-256 does not match the pinned manifest`);
  }
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  assertRemoteContentShape(text, source);
  const excerpt = selectedExcerpt(text, source);
  if (excerpt !== source.excerpt || sha256(Buffer.from(excerpt, "utf8")) !== source.excerptSha256) {
    throw new Error(`${source.id} remote reviewed excerpt does not match the bundled pack`);
  }
  return { id: source.id, byteLength: bytes.byteLength, fileSha256: source.fileSha256 };
}

async function verifyRemoteTreeEntries() {
  const { owner, repo, commit } = ASSISTANT_PUBLIC_SOURCE_PACK.project;
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${commit}?recursive=1`;
  const response = await fetch(url, {
    method: "GET",
    redirect: "manual",
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "portfolio-public-source-verifier/1",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS),
  });
  if (response.status >= 300 && response.status < 400) {
    throw new Error(`remote tree verification refused redirect status ${response.status}`);
  }
  if (!response.ok || response.status !== 200 || response.url !== url) {
    throw new Error(`remote tree verification returned an unexpected response`);
  }
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!/^application\/json(?:;|$)/u.test(contentType)) {
    throw new Error(`remote tree Content-Type is not JSON: ${contentType || "missing"}`);
  }
  const payload = await boundedJsonResponse(response, TREE_RESPONSE_BYTE_CAP);
  if (!payload || typeof payload !== "object" || payload.truncated !== false || !Array.isArray(payload.tree)) {
    throw new Error("remote tree response is missing or truncated");
  }
  for (const source of ASSISTANT_PUBLIC_SOURCE_PACK.sources) {
    const entry = payload.tree.find((candidate) => candidate?.path === source.path);
    if (!entry || entry.type !== "blob" || entry.mode !== "100644" || entry.size !== source.byteLength) {
      throw new Error(`${source.id} is not the reviewed ordinary Git blob`);
    }
  }
}

let remote = null;
if (verifyRemote) {
  await verifyRemoteTreeEntries();
  remote = [];
  for (const source of ASSISTANT_PUBLIC_SOURCE_PACK.sources) {
    remote.push(await verifyOneRemoteSource(source));
  }
}

console.log(JSON.stringify({
  ok: true,
  mode: verifyRemote ? "verify-remote" : "offline",
  packId: ASSISTANT_PUBLIC_SOURCE_PACK.packId,
  packSha256: ASSISTANT_PUBLIC_SOURCE_PACK_SHA256,
  factCatalogSha256: ASSISTANT_PUBLIC_FACT_CATALOG_SHA256,
  projectId: ASSISTANT_PUBLIC_SOURCE_PACK.project.id,
  commit: ASSISTANT_PUBLIC_SOURCE_PACK.project.commit,
  sourceCount: ASSISTANT_PUBLIC_SOURCE_PACK.sources.length,
  remote,
}, null, 2));

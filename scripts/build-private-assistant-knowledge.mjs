import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { gzipSync } from "node:zlib";

const args = process.argv.slice(2);
const sources = [];
let output = ".assistant-private/knowledge.json";
for (let index = 0; index < args.length; index += 1) {
  if (args[index] === "--source" && args[index + 1]) sources.push(args[++index]);
  else if (args[index] === "--output" && args[index + 1]) output = args[++index];
  else throw new Error(`unknown or incomplete argument: ${args[index]}`);
}
if (sources.length < 1) throw new Error("at least one --source file is required");

const MAX_TOTAL_BYTES = 700_000;
const TARGET_CHUNK_CHARACTERS = 1_500;
const OVERLAP_LINES = 3;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function redactPrivateIdentifiers(value) {
  const sanitized = value
    .replace(/<script[\s\S]*?<\/script>/giu, " ")
    .replace(/<style[\s\S]*?<\/style>/giu, " ")
    .replace(/<[^>]+>/gu, " ")
    .replace(/&nbsp;|&#160;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu, "[private contact omitted]")
    .replace(/(?<!\d)(?:\+?86[- ]?)?1[3-9]\d{9}(?!\d)/gu, "[private contact omitted]")
    .replace(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/giu, "[private secret omitted]")
    .replace(/\b(?:sk|ghp|github_pat|glpat|xox[baprs])[-_][A-Za-z0-9_-]{12,}\b/giu, "[private secret omitted]")
    .replace(/^\s*(?:phone|mobile|telephone|email|e-mail|wechat|weixin|address|地址|电话|手机|邮箱|微信)\s*[:：].*$/gimu, "[private contact omitted]")
    .replace(/[ \t]+/gu, " ")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
  const staleClaimPatterns = [
    /\b498\s*K\b|498[,.]?725|0\.809|0\.944|\b28\s*ms\b|\b50\s*K\b/iu,
    /12\s*(?:个|knowledge bases?).{0,40}4\s*(?:个|degrad|退化)/iu,
    /legacy.{0,50}(?:rag|retrieval)|旧版.{0,50}(?:RAG|检索)/iu,
  ];
  return sanitized.split("\n").map((line) => (
    staleClaimPatterns.some((pattern) => pattern.test(line))
      ? "[stale project claim omitted; use the current public portfolio evidence]"
      : line
  )).join("\n");
}

function chunkText(sourceId, label, content) {
  const lines = content.split(/\r?\n/u);
  const chunks = [];
  let start = 0;
  while (start < lines.length) {
    let end = start;
    let characters = 0;
    while (end < lines.length && (characters < TARGET_CHUNK_CHARACTERS || end === start)) {
      characters += lines[end].length + 1;
      end += 1;
    }
    const text = lines.slice(start, end).join("\n").trim();
    if (text) chunks.push({
      id: `${sourceId}:L${start + 1}-L${end}`,
      sourceId,
      label,
      lineStart: start + 1,
      lineEnd: end,
      content: text,
    });
    if (end >= lines.length) break;
    start = Math.max(start + 1, end - OVERLAP_LINES);
  }
  return chunks;
}

let totalSourceBytes = 0;
const chunks = [];
const sourceRecords = [];
for (const [index, sourcePath] of sources.entries()) {
  const raw = await readFile(sourcePath, "utf8");
  totalSourceBytes += Buffer.byteLength(raw, "utf8");
  if (totalSourceBytes > MAX_TOTAL_BYTES) throw new Error("private knowledge sources exceed the byte cap");
  const content = redactPrivateIdentifiers(raw);
  const sourceId = `private-${index + 1}`;
  const label = path.basename(sourcePath).replace(/\.(?:html?|md|ya?ml)$/iu, "");
  const sourceChunks = chunkText(sourceId, label, content);
  chunks.push(...sourceChunks);
  sourceRecords.push({ sourceId, label, contentSha256: sha256(content), chunks: sourceChunks.length });
}

const payloadWithoutHash = {
  version: 1,
  sourceCount: sourceRecords.length,
  chunkCount: chunks.length,
  sources: sourceRecords,
  chunks,
};
const payload = { ...payloadWithoutHash, snapshotSha256: sha256(JSON.stringify(payloadWithoutHash)) };
const serialized = JSON.stringify(payload);
const encoded = gzipSync(Buffer.from(serialized, "utf8"), { level: 9 }).toString("base64");
const outputPath = path.resolve(output);
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
await writeFile(`${outputPath}.env`, `ASSISTANT_PRIVATE_KNOWLEDGE_B64_GZIP=${encoded}\n`, { mode: 0o600 });
console.log(JSON.stringify({
  status: "ok",
  sourceFiles: sourceRecords.length,
  sourceBytes: totalSourceBytes,
  chunks: chunks.length,
  snapshotSha256: payload.snapshotSha256,
  compressedBase64Bytes: Buffer.byteLength(encoded, "utf8"),
}, null, 2));

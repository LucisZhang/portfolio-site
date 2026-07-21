import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import publicKnowledge from "../data/assistant-knowledge.generated.json" with { type: "json" };

export type AssistantLocale = "en" | "zh";

export interface AssistantCitation {
  sourceId: string;
  kind: "public-github" | "private-profile";
  label: Record<AssistantLocale, string>;
  url?: string;
}

export interface AssistantKnowledgeChunk {
  id: string;
  kind: "public-github" | "private-profile";
  repository?: string;
  project?: Record<AssistantLocale, string>;
  aliases: string[];
  content: string;
  citation: AssistantCitation;
}

export interface AssistantRetrievalResult {
  chunks: AssistantKnowledgeChunk[];
  grounding: string;
  publicSnapshotSha256: string;
  privateSnapshotSha256?: string;
  combinedSnapshotSha256: string;
}

interface PrivateKnowledgePayload {
  version: 1;
  sourceCount: number;
  chunkCount: number;
  sources: Array<{ sourceId: string; label: string; contentSha256: string; chunks: number }>;
  chunks: Array<{
    id: string;
    sourceId: string;
    label: string;
    lineStart: number;
    lineEnd: number;
    content: string;
  }>;
  snapshotSha256: string;
}

const MAX_PRIVATE_ENCODED_BYTES = 60_000;
const MAX_PRIVATE_DECOMPRESSED_BYTES = 500_000;
const MAX_PRIVATE_CHUNKS = 300;
const MAX_RETRIEVED_CHUNKS = 9;
const MAX_CHUNKS_PER_SOURCE = 3;
const ENGLISH_STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "can", "did", "do", "does", "for", "from",
  "he", "his", "how", "i", "in", "is", "it", "me", "of", "on", "or", "that", "the", "this", "to",
  "was", "what", "when", "where", "which", "who", "why", "with", "you", "your",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalize(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/\s+/gu, " ").trim();
}

function tokens(value: string) {
  const normalized = normalize(value);
  const result: string[] = [];
  for (const word of normalized.match(/[a-z0-9][a-z0-9._+#/-]*/gu) ?? []) {
    if (word.length > 1 && !ENGLISH_STOPWORDS.has(word)) result.push(word);
  }
  for (const run of normalized.match(/[\p{Script=Han}]{2,}/gu) ?? []) {
    if (run.length <= 4) result.push(run);
    for (let index = 0; index < run.length - 1; index += 1) result.push(run.slice(index, index + 2));
  }
  return result;
}

function expandedQuery(value: string) {
  const normalized = normalize(value);
  const expansions: string[] = [];
  const rules: Array<[RegExp, string]> = [
    [/(?:hire|hiring|candidate|recruiter|strength|why him|role fit|job fit|position)/u, "candidate profile skills experience strengths role fit applied AI data engineering analytics Release Guardian RAG Quality Lab Streaming Reliability Lab Privacy Preflight Margin Control Tower Credit Policy Lab"],
    [/(?:候选人|招聘|录用|优势|亮点|岗位|职位|匹配|胜任)/u, "候选人 个人背景 技能 经历 优势 岗位匹配 AI应用 数据工程 数据分析 发布守门人 RAG质量实验室 流式可靠性实验室 隐私预检 毛利控制塔 信贷策略实验室"],
    [/(?:background|education|school|university|major|graduate)/u, "candidate education Beijing Institute of Technology data science graduation"],
    [/(?:背景|教育|学校|大学|专业|毕业)/u, "候选人 教育 北京理工大学 数据科学与大数据技术 2027届"],
    [/(?:working style|work style|collaborat|communicat|leadership)/u, "working style ownership evidence automation communication collaboration"],
    [/(?:工作方式|工作风格|协作|沟通|领导力|执行力)/u, "工作方式 主动性 证据 自动化 沟通 协作"],
    [/(?:project|portfolio|built|architecture|technical)/u, "projects portfolio architecture implementation evidence boundaries"],
    [/(?:项目|作品集|技术|架构|实现)/u, "项目 作品集 架构 实现 证据 边界"],
  ];
  for (const [pattern, expansion] of rules) if (pattern.test(normalized)) expansions.push(expansion);
  return `${value} ${expansions.join(" ")}`;
}

function assertPrivatePayload(value: unknown): PrivateKnowledgePayload {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.sources) || !Array.isArray(value.chunks)
    || value.chunks.length > MAX_PRIVATE_CHUNKS || value.chunkCount !== value.chunks.length
    || typeof value.snapshotSha256 !== "string" || !/^[a-f0-9]{64}$/u.test(value.snapshotSha256)) {
    throw new Error("private assistant knowledge has an invalid shape");
  }
  const { snapshotSha256, ...withoutHash } = value;
  if (sha256(JSON.stringify(withoutHash)) !== snapshotSha256) {
    throw new Error("private assistant knowledge hash does not match");
  }
  for (const chunk of value.chunks) {
    if (!isRecord(chunk) || typeof chunk.id !== "string" || typeof chunk.sourceId !== "string"
      || typeof chunk.label !== "string" || typeof chunk.content !== "string"
      || chunk.content.length < 1 || chunk.content.length > 4_000) {
      throw new Error("private assistant knowledge contains an invalid chunk");
    }
  }
  return value as unknown as PrivateKnowledgePayload;
}

export function loadPrivateAssistantKnowledge(encoded: string | undefined): PrivateKnowledgePayload | null {
  const value = encoded?.trim();
  if (!value) return null;
  if (Buffer.byteLength(value, "utf8") > MAX_PRIVATE_ENCODED_BYTES || !/^[A-Za-z0-9+/]+=*$/u.test(value)) {
    throw new Error("private assistant knowledge exceeds its encoded boundary");
  }
  const compressed = Buffer.from(value, "base64");
  const decompressed = gunzipSync(compressed, { maxOutputLength: MAX_PRIVATE_DECOMPRESSED_BYTES });
  return assertPrivatePayload(JSON.parse(decompressed.toString("utf8")));
}

function publicChunks(): AssistantKnowledgeChunk[] {
  return publicKnowledge.chunks.map((chunk) => ({
    id: chunk.id,
    kind: "public-github" as const,
    repository: chunk.repository,
    project: chunk.project,
    aliases: chunk.aliases,
    content: chunk.content,
    citation: {
      sourceId: chunk.id,
      kind: "public-github" as const,
      label: {
        en: `${chunk.project.en} · ${chunk.path} · lines ${chunk.lineStart}-${chunk.lineEnd}`,
        zh: `${chunk.project.zh} · ${chunk.path} · 第 ${chunk.lineStart}-${chunk.lineEnd} 行`,
      },
      url: chunk.sourceUrl,
    },
  }));
}

function privateChunks(payload: PrivateKnowledgePayload | null): AssistantKnowledgeChunk[] {
  if (!payload) return [];
  return payload.chunks.map((chunk) => ({
    id: chunk.id,
    kind: "private-profile" as const,
    aliases: ["Xiangguo Zhang", "章向国", "candidate", "候选人", "profile", "个人背景", chunk.label],
    content: chunk.content,
    citation: {
      sourceId: chunk.id,
      kind: "private-profile" as const,
      label: {
        en: "Verified private candidate materials",
        zh: "已核验的候选人私有材料",
      },
    },
  }));
}

function sourceBucket(chunk: AssistantKnowledgeChunk) {
  return chunk.kind === "public-github" ? `${chunk.repository}:${chunk.citation.label.en.split(" · ")[1]}` : chunk.id.split(":")[0];
}

function rankChunks(question: string, chunks: AssistantKnowledgeChunk[]) {
  const queryText = expandedQuery(question);
  const queryTokens = [...new Set(tokens(queryText))];
  const tokenized = chunks.map((chunk) => {
    const text = `${chunk.aliases.join(" ")} ${chunk.project?.en ?? ""} ${chunk.project?.zh ?? ""} ${chunk.content}`;
    const documentTokens = tokens(text);
    return { chunk, documentTokens, normalizedText: normalize(text) };
  });
  const documentFrequency = new Map<string, number>();
  for (const { documentTokens } of tokenized) {
    for (const token of new Set(documentTokens)) documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
  }
  const averageLength = tokenized.reduce((sum, item) => sum + item.documentTokens.length, 0) / Math.max(1, tokenized.length);
  const normalizedQuestion = normalize(question);
  const candidateQuestion = /(?:candidate|hire|hiring|recruiter|strength|role|job|background|education|school|university|major|候选人|录用|招聘|优势|岗位|职位|背景|教育|学校|大学|专业)/u.test(normalizedQuestion);
  return tokenized.map(({ chunk, documentTokens, normalizedText }) => {
    const frequencies = new Map<string, number>();
    for (const token of documentTokens) frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
    let score = 0;
    for (const token of queryTokens) {
      const frequency = frequencies.get(token) ?? 0;
      if (!frequency) continue;
      const df = documentFrequency.get(token) ?? 0;
      const idf = Math.log(1 + (chunks.length - df + 0.5) / (df + 0.5));
      const denominator = frequency + 1.2 * (0.25 + 0.75 * documentTokens.length / Math.max(1, averageLength));
      score += idf * frequency * 2.2 / denominator;
    }
    for (const alias of chunk.aliases) {
      const normalizedAlias = normalize(alias);
      if (normalizedAlias.length > 2 && normalizedQuestion.includes(normalizedAlias)) score += 10;
    }
    if (candidateQuestion && chunk.kind === "private-profile") score += 2.5;
    if (candidateQuestion && chunk.kind === "public-github" && chunk.citation.label.en.includes("src/lib/projects.ts")) score += 5;
    if (candidateQuestion && chunk.kind === "public-github" && /README(?:\.zh-CN)?\.md/u.test(chunk.citation.label.en)) score += 2;
    if (normalizedText.includes(normalizedQuestion) && normalizedQuestion.length > 5) score += 8;
    return { chunk, score };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id));
}

export function retrieveAssistantKnowledge(
  question: string,
  privateEncoded?: string,
  limit = MAX_RETRIEVED_CHUNKS,
): AssistantRetrievalResult | null {
  const privatePayload = loadPrivateAssistantKnowledge(privateEncoded);
  const ranked = rankChunks(question, [...publicChunks(), ...privateChunks(privatePayload)]);
  if (ranked.length === 0 || ranked[0].score < 0.35) return null;
  const selected: AssistantKnowledgeChunk[] = [];
  const buckets = new Map<string, number>();
  const normalizedQuestion = normalize(question);
  const candidateQuestion = /(?:candidate|hire|hiring|recruiter|strength|role|job|background|education|school|university|major|候选人|录用|招聘|优势|岗位|职位|背景|教育|学校|大学|专业)/u.test(normalizedQuestion);
  const target = Math.min(MAX_RETRIEVED_CHUNKS, Math.max(1, limit));
  const ordered = candidateQuestion && privatePayload
    ? [
        ...ranked.filter(({ chunk }) => chunk.kind === "private-profile").slice(0, 4),
        ...ranked.filter(({ chunk }) => chunk.kind === "public-github").slice(0, 6),
        ...ranked,
      ]
    : ranked;
  const seenChunks = new Set<string>();
  for (const { chunk } of ordered) {
    if (seenChunks.has(chunk.id)) continue;
    seenChunks.add(chunk.id);
    const bucket = sourceBucket(chunk);
    if ((buckets.get(bucket) ?? 0) >= MAX_CHUNKS_PER_SOURCE) continue;
    selected.push(chunk);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
    if (selected.length >= target) break;
  }
  const publicSnapshotSha256 = publicKnowledge.snapshotSha256;
  const privateSnapshotSha256 = privatePayload?.snapshotSha256;
  const combinedSnapshotSha256 = sha256(`${publicSnapshotSha256}:${privateSnapshotSha256 ?? "none"}`);
  const grounding = JSON.stringify({
    public_snapshot_sha256: publicSnapshotSha256,
    private_snapshot_sha256: privateSnapshotSha256 ?? null,
    chunks: selected.map((chunk) => ({
      id: chunk.id,
      source_type: chunk.kind,
      project: chunk.project ?? null,
      repository: chunk.repository ?? null,
      content: chunk.content,
    })),
  });
  return { chunks: selected, grounding, publicSnapshotSha256, privateSnapshotSha256, combinedSnapshotSha256 };
}

export function citationsForChunkIds(
  chunks: readonly AssistantKnowledgeChunk[],
  chunkIds: readonly string[],
): AssistantCitation[] {
  const byId = new Map(chunks.map((chunk) => [chunk.id, chunk]));
  const seen = new Set<string>();
  const seenDisplays = new Set<string>();
  const citations: AssistantCitation[] = [];
  for (const id of chunkIds) {
    const chunk = byId.get(id);
    if (!chunk || seen.has(id)) continue;
    seen.add(id);
    const displayKey = chunk.citation.url ?? chunk.citation.kind;
    if (seenDisplays.has(displayKey)) continue;
    seenDisplays.add(displayKey);
    citations.push(chunk.citation);
  }
  return citations;
}

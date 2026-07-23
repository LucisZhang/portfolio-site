export const ASSISTANT_PROJECT_IDS = [
  "release-guardian",
  "streaming-reliability-lab",
  "rag-quality-lab",
  "privacy-preflight-web",
  "margin-control-tower",
  "credit-policy-lab",
  "ex-solver",
  "Voice-in-Security",
  "Risk-Control-Portfolio",
] as const;

export type AssistantProjectId = (typeof ASSISTANT_PROJECT_IDS)[number];
export type AssistantAnswerBlockType = "paragraph" | "heading" | "bullet";
export type AssistantAnswerSegment =
  | { type: "text"; text: string; strong?: boolean }
  | { type: "project"; projectId: AssistantProjectId; strong?: boolean };
export interface AssistantAnswerBlock {
  type: AssistantAnswerBlockType;
  segments: AssistantAnswerSegment[];
}
export interface AssistantProjectReference {
  id: AssistantProjectId;
  label: string;
  href: string;
  kind: "portfolio" | "github";
}

const catalog: Record<AssistantProjectId, {
  label: { en: string; zh: string };
  href: string;
  kind: "portfolio" | "github";
}> = {
  "release-guardian": { label: { en: "Release Guardian", zh: "发布守门人" }, href: "/ai/release-guardian", kind: "portfolio" },
  "streaming-reliability-lab": { label: { en: "Streaming Reliability Lab", zh: "流式可靠性实验室" }, href: "/engineering/p1-reliability-lab", kind: "portfolio" },
  "rag-quality-lab": { label: { en: "RAG Quality Lab", zh: "RAG 质量实验室" }, href: "/ai/rag-quality-lab", kind: "portfolio" },
  "privacy-preflight-web": { label: { en: "Privacy Preflight Web", zh: "隐私预检网页版" }, href: "/ai/privacy-preflight-mac", kind: "portfolio" },
  "margin-control-tower": { label: { en: "Margin Control Tower", zh: "毛利控制塔" }, href: "/analytics/margin-control-tower", kind: "portfolio" },
  "credit-policy-lab": { label: { en: "Credit Policy Lab", zh: "信贷策略实验室" }, href: "/analytics/credit-policy-lab", kind: "portfolio" },
  "ex-solver": { label: { en: "ex-solver", zh: "ex-solver" }, href: "https://github.com/LucisZhang/ex-solver", kind: "github" },
  "Voice-in-Security": { label: { en: "Voice-in-Security", zh: "Voice-in-Security" }, href: "https://github.com/LucisZhang/Voice-in-Security", kind: "github" },
  "Risk-Control-Portfolio": { label: { en: "Risk-Control-Portfolio", zh: "Risk-Control-Portfolio" }, href: "https://github.com/LucisZhang/Risk-Control-Portfolio", kind: "github" },
};

const projectIds = new Set<string>(ASSISTANT_PROJECT_IDS);
const projectAliases = Object.entries(catalog).flatMap(([id, entry]) => [...new Set([
  id,
  entry.label.en,
  entry.label.zh,
])].map((alias) => ({ alias, id: id as AssistantProjectId })));
const projectIdByAlias = new Map(projectAliases.map(({ alias, id }) => [alias.toLocaleLowerCase("en-US"), id]));
const projectMentionPattern = new RegExp(projectAliases
  .sort((left, right) => right.alias.length - left.alias.length)
  .map(({ alias }) => {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
    return /^[\x00-\x7f]+$/u.test(alias)
      ? `(?<![A-Za-z0-9])${escaped}(?![A-Za-z0-9])`
      : escaped;
  })
  .join("|"), "giu");

export function projectReference(id: string, locale: "en" | "zh"): AssistantProjectReference | null {
  if (!projectIds.has(id)) return null;
  const projectId = id as AssistantProjectId;
  const entry = catalog[projectId];
  return {
    id: projectId,
    label: entry.label[locale],
    href: entry.kind === "portfolio" && locale === "zh" ? `${entry.href}?lang=zh` : entry.href,
    kind: entry.kind,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, required: string[], optional: string[] = []) {
  const allowed = new Set([...required, ...optional]);
  return required.every((key) => key in value) && Object.keys(value).every((key) => allowed.has(key));
}

export function validateAssistantAnswerBlocks(value: unknown, locale: "en" | "zh"): AssistantAnswerBlock[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) return null;
  const blocks: AssistantAnswerBlock[] = [];
  let flattenedLength = 0;
  for (const candidate of value) {
    if (!isRecord(candidate) || !exactKeys(candidate, ["type", "segments"])
      || !["paragraph", "heading", "bullet"].includes(String(candidate.type))
      || !Array.isArray(candidate.segments) || candidate.segments.length < 1 || candidate.segments.length > 24) return null;
    const segments: AssistantAnswerSegment[] = [];
    for (const segment of candidate.segments) {
      if (!isRecord(segment) || typeof segment.type !== "string" || ("strong" in segment && typeof segment.strong !== "boolean")) return null;
      if (segment.type === "text") {
        if (!exactKeys(segment, ["type", "text"], ["strong"]) || typeof segment.text !== "string") return null;
        const text = segment.text;
        if (!text.trim() || text.length > 1_500 || /(?:https?:\/\/|www\.)/iu.test(text)
          || [...text].some((character) => /\p{C}/u.test(character) && !/\s/u.test(character))) return null;
        flattenedLength += text.length;
        segments.push({ type: "text", text, ...(segment.strong === true ? { strong: true } : {}) });
      } else if (segment.type === "project") {
        if (!exactKeys(segment, ["type", "projectId"], ["strong"]) || typeof segment.projectId !== "string") return null;
        const reference = projectReference(segment.projectId, locale);
        if (!reference) return null;
        flattenedLength += reference.label.length;
        segments.push({ type: "project", projectId: reference.id, ...(segment.strong === true ? { strong: true } : {}) });
      } else {
        return null;
      }
    }
    blocks.push({ type: candidate.type as AssistantAnswerBlockType, segments });
  }
  return flattenedLength > 0 && flattenedLength <= 6_000 ? blocks : null;
}

function canonicalizeTextSegment(segment: Extract<AssistantAnswerSegment, { type: "text" }>) {
  const segments: AssistantAnswerSegment[] = [];
  let cursor = 0;
  for (const match of segment.text.matchAll(projectMentionPattern)) {
    const index = match.index ?? 0;
    if (index > cursor) segments.push({
      type: "text",
      text: segment.text.slice(cursor, index),
      ...(segment.strong === true ? { strong: true } : {}),
    });
    const projectId = projectIdByAlias.get(match[0].toLocaleLowerCase("en-US"));
    if (projectId) segments.push({
      type: "project",
      projectId,
      ...(segment.strong === true ? { strong: true } : {}),
    });
    else segments.push({ type: "text", text: match[0], ...(segment.strong === true ? { strong: true } : {}) });
    cursor = index + match[0].length;
  }
  if (cursor < segment.text.length) segments.push({
    type: "text",
    text: segment.text.slice(cursor),
    ...(segment.strong === true ? { strong: true } : {}),
  });
  return segments.length ? segments : [segment];
}

export function canonicalizeAssistantProjectMentions(blocks: readonly AssistantAnswerBlock[]) {
  return blocks.map((block) => {
    const segments = block.segments.flatMap((segment) => segment.type === "text"
      ? canonicalizeTextSegment(segment)
      : [segment]);
    return { ...block, segments: segments.length <= 24 ? segments : block.segments };
  });
}

export function flattenAssistantAnswerBlocks(blocks: readonly AssistantAnswerBlock[], locale: "en" | "zh") {
  return blocks.map((block) => block.segments.map((segment) => segment.type === "text"
    ? segment.text
    : projectReference(segment.projectId, locale)?.label ?? "").join("")).join("\n");
}

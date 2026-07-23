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
  if (!Array.isArray(value) || value.length < 1 || value.length > 8) return null;
  const blocks: AssistantAnswerBlock[] = [];
  let flattenedLength = 0;
  for (const candidate of value) {
    if (!isRecord(candidate) || !exactKeys(candidate, ["type", "segments"])
      || !["paragraph", "heading", "bullet"].includes(String(candidate.type))
      || !Array.isArray(candidate.segments) || candidate.segments.length < 1 || candidate.segments.length > 12) return null;
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

export function flattenAssistantAnswerBlocks(blocks: readonly AssistantAnswerBlock[], locale: "en" | "zh") {
  return blocks.map((block) => block.segments.map((segment) => segment.type === "text"
    ? segment.text
    : projectReference(segment.projectId, locale)?.label ?? "").join("")).join("\n");
}

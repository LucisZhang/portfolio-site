import {
  PROJECT_IDENTITY_IDS,
  findProjectMentions,
  mentionedProjectIds,
  projectIdentityHref,
  resolveProjectIdentity,
  type ProjectIdentityId,
} from "./project-identities";

export const ASSISTANT_PROJECT_IDS = PROJECT_IDENTITY_IDS;
export type AssistantProjectId = ProjectIdentityId;
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

export function projectReference(id: string, locale: "en" | "zh"): AssistantProjectReference | null {
  const entry = resolveProjectIdentity(id);
  if (!entry) return null;
  return {
    id: entry.id,
    label: entry.label[locale],
    href: projectIdentityHref(entry.id, locale),
    kind: entry.kind,
  };
}

export function assistantProjectActions(question: string, locale: "en" | "zh"): AssistantProjectReference[] {
  const named = mentionedProjectIds(question);
  const ids = named.length ? named : ["frontier-forge", "crossover-study", "credit-policy-desk"];
  return ids.flatMap((id) => {
    const reference = projectReference(id, locale);
    return reference ? [reference] : [];
  });
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
  for (const match of findProjectMentions(segment.text)) {
    const index = match.index;
    if (index > cursor) segments.push({
      type: "text",
      text: segment.text.slice(cursor, index),
      ...(segment.strong === true ? { strong: true } : {}),
    });
    const projectId = match.id;
    if (projectId) segments.push({
      type: "project",
      projectId,
      ...(segment.strong === true ? { strong: true } : {}),
    });
    else segments.push({ type: "text", text: match.text, ...(segment.strong === true ? { strong: true } : {}) });
    cursor = index + match.text.length;
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

export type RedactionAction = "mask" | "replace" | "remove";
export type ScanMode = "balanced" | "strict";

export interface SensitiveEntity {
  id: string;
  type: string;
  start: number;
  end: number;
  text: string;
  reason: string;
  replacement: string;
  action: RedactionAction;
  accepted: boolean;
  source: "deterministic" | "dictionary" | "manual";
}

export interface RedactionValidation {
  safe: boolean;
  appliedCount: number;
  remainingTypes: string[];
  residualOriginalValues: string[];
}

interface DetectionRule {
  type: string;
  regex: RegExp;
  reason: string;
  confidenceGate?: (value: string, textBefore: string, mode: ScanMode) => boolean;
}

const rules: DetectionRule[] = [
  {
    type: "EMAIL",
    regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
    reason: "Matched a standard email address pattern.",
  },
  {
    type: "PHONE",
    regex: /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}(?:\s*(?:x|ext\.?)\s*\d{1,6})?/gi,
    reason: "Matched a phone-like pattern containing 10 to 15 digits.",
    confidenceGate: (value) => {
      const digits = value.replace(/\D/g, "").length;
      return digits >= 10 && digits <= 15;
    },
  },
  {
    type: "URL",
    regex: /\b(?:https?:\/\/|www\.)[^\s<>'"]+/gi,
    reason: "Matched a web URL pattern.",
  },
  {
    type: "IP_ADDRESS",
    regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    reason: "Matched an IPv4 address pattern.",
    confidenceGate: (value) => value.split(".").every((part) => Number(part) <= 255),
  },
  {
    type: "LOCAL_PATH",
    regex: /(?:\/Users\/[^\s/<>:"|?*。；，、]+(?:\/[^\s/<>:"|?*。；，、]+)*|\/(?:Volumes|private|var|tmp|Applications)\/[^\s/<>:"|?*。；，、]+(?:\/[^\s/<>:"|?*。；，、]+)*|~\/[^\s/<>:"|?*。；，、]+(?:\/[^\s/<>:"|?*。；，、]+)*)/g,
    reason: "Matched a local filesystem path.",
  },
  {
    type: "API_KEY",
    regex: /(?:sk-(?:proj-)?[A-Za-z0-9_-]{20,}|github_pat_[A-Za-z0-9_]{30,}|gh[pousr]_[A-Za-z0-9]{30,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|xox[baprs]-[A-Za-z0-9-]{20,}|(?:sk|pk)_(?:live|test)_[A-Za-z0-9]{16,})/g,
    reason: "Matched a known credential prefix and structure.",
  },
  {
    type: "ID",
    regex: /\b(?=[A-Za-z0-9_-]{20,}\b)(?=[A-Za-z0-9_-]*[A-Za-z])(?=[A-Za-z0-9_-]*\d)[A-Za-z0-9][A-Za-z0-9_-]{19,}\b/g,
    reason: "Matched a long mixed alphanumeric identifier.",
    confidenceGate: (value, before, mode) =>
      mode === "strict" || value.length >= 32 || /(?:id|identifier|session|trace|request|correlation|token|key)\s*[:=#-]?\s*$/i.test(before),
  },
];

const dictionary = [
  { value: "北京理工大学", type: "SCHOOL" },
  { value: "Beijing Institute of Technology", type: "SCHOOL" },
  { value: "澳门大学", type: "SCHOOL" },
  { value: "University of Macau", type: "SCHOOL" },
] as const;

const trailingPunctuation = /[.,;:!?\])}'"]+$/;

function entityId(type: string, start: number, end: number) {
  return `${type.toLowerCase()}-${start}-${end}`;
}

function replacementFor(type: string) {
  return `[${type}]`;
}

function overlaps(left: Pick<SensitiveEntity, "start" | "end">, right: Pick<SensitiveEntity, "start" | "end">) {
  return left.start < right.end && right.start < left.end;
}

function makeEntity(
  text: string,
  type: string,
  start: number,
  end: number,
  reason: string,
  source: SensitiveEntity["source"],
): SensitiveEntity {
  return {
    id: entityId(type, start, end),
    type,
    start,
    end,
    text: text.slice(start, end),
    reason,
    replacement: replacementFor(type),
    action: "replace",
    accepted: true,
    source,
  };
}

export function scanSensitiveText(text: string, mode: ScanMode = "balanced") {
  const candidates: SensitiveEntity[] = [];

  for (const rule of rules) {
    const regex = new RegExp(rule.regex.source, rule.regex.flags);
    for (const match of text.matchAll(regex)) {
      if (match.index === undefined) continue;
      const rawValue = match[0];
      const value = rawValue.replace(trailingPunctuation, "");
      const start = match.index;
      const end = start + value.length;
      if (!value) continue;
      if (rule.confidenceGate && !rule.confidenceGate(value, text.slice(Math.max(0, start - 40), start), mode)) continue;
      candidates.push(makeEntity(text, rule.type, start, end, rule.reason, "deterministic"));
    }
  }

  for (const entry of dictionary) {
    const haystack = /[A-Za-z]/.test(entry.value) ? text.toLocaleLowerCase() : text;
    const needle = /[A-Za-z]/.test(entry.value) ? entry.value.toLocaleLowerCase() : entry.value;
    let cursor = 0;
    while (cursor < haystack.length) {
      const start = haystack.indexOf(needle, cursor);
      if (start < 0) break;
      const end = start + entry.value.length;
      candidates.push(makeEntity(text, entry.type, start, end, `Matched the local public dictionary for ${entry.type}.`, "dictionary"));
      cursor = end;
    }
  }

  const accepted: SensitiveEntity[] = [];
  for (const candidate of candidates.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start) || a.type.localeCompare(b.type))) {
    if (!accepted.some((item) => overlaps(item, candidate))) accepted.push(candidate);
  }
  return accepted.map((item, index) => ({ ...item, id: `${item.id}-${index}` }));
}

export function normalizeEntity(entity: SensitiveEntity, text: string): SensitiveEntity {
  const start = Math.max(0, Math.min(text.length, Math.floor(entity.start)));
  const end = Math.max(start, Math.min(text.length, Math.floor(entity.end)));
  return { ...entity, start, end, text: text.slice(start, end) };
}

export function applyRedactions(text: string, entities: SensitiveEntity[]) {
  const applicable = entities
    .filter((entity) => entity.accepted && entity.end > entity.start)
    .map((entity) => normalizeEntity(entity, text))
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const nonOverlapping: SensitiveEntity[] = [];
  for (const entity of applicable) {
    if (!nonOverlapping.some((item) => overlaps(item, entity))) nonOverlapping.push(entity);
  }

  let output = "";
  let cursor = 0;
  for (const entity of nonOverlapping) {
    output += text.slice(cursor, entity.start);
    if (entity.action === "mask") output += "*".repeat(Math.max(4, entity.end - entity.start));
    if (entity.action === "replace") output += entity.replacement || replacementFor(entity.type);
    cursor = entity.end;
  }
  return output + text.slice(cursor);
}

export function validateRedaction(text: string, output: string, entities: SensitiveEntity[]): RedactionValidation {
  const applied = entities.filter((entity) => entity.accepted && entity.end > entity.start);
  const residualOriginalValues = [...new Set(applied.map((entity) => text.slice(entity.start, entity.end)).filter((value) => value && output.includes(value)))];
  const remainingTypes = [...new Set(scanSensitiveText(output, "strict").map((entity) => entity.type))];
  return {
    safe: applied.length > 0 && residualOriginalValues.length === 0 && remainingTypes.length === 0,
    appliedCount: applied.length,
    remainingTypes,
    residualOriginalValues,
  };
}

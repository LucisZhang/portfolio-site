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

export interface OcrWordBox {
  text: string;
  confidence?: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

export interface OcrLineBox {
  text: string;
  confidence?: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  words?: OcrWordBox[];
}

export interface SensitiveOcrMatch {
  entity: SensitiveEntity;
  bbox: OcrWordBox["bbox"];
  confidence: number;
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
    regex: /(?<!\d)(?:(?:\+?86[\s.-]?)?1[3-9]\d(?:[\s.-]?\d){8}|(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}(?:\s*(?:x|ext\.?)\s*\d{1,6})?)(?!\d)/gi,
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

/**
 * Maps rule matches in an OCR line back to the actual word boxes. Interpolating
 * across a whole line is inaccurate for CJK labels and proportional fonts, and
 * scanning one OCR word at a time misses phone numbers split around separators.
 */
export function mapSensitiveOcrLine(line: OcrLineBox, mode: ScanMode = "strict"): SensitiveOcrMatch[] {
  const lineText = line.text.trimEnd();
  const directEntities = scanSensitiveText(lineText, mode);
  const compactCharacters: string[] = [];
  const compactToOriginal: number[] = [];
  for (let index = 0; index < lineText.length; index += 1) {
    if (/\s/.test(lineText[index])) continue;
    compactCharacters.push(lineText[index]);
    compactToOriginal.push(index);
  }
  const compactText = compactCharacters.join("");
  const compactPathEntities = scanSensitiveText(compactText, mode)
    .filter((entity) => entity.type === "LOCAL_PATH" && entity.end > entity.start)
    .map((entity) => ({
      ...entity,
      start: compactToOriginal[entity.start],
      end: compactToOriginal[entity.end - 1] + 1,
      text: compactText.slice(entity.start, entity.end),
    }));
  const entities: SensitiveEntity[] = [];
  for (const candidate of [...directEntities, ...compactPathEntities].sort((a, b) => a.start - b.start || b.end - a.end)) {
    if (!entities.some((entity) => overlaps(entity, candidate))) entities.push(candidate);
  }
  if (!entities.length) return [];

  const wordRanges: { word: OcrWordBox; start: number; end: number }[] = [];
  let cursor = 0;
  for (const word of line.words ?? []) {
    const wordText = word.text.trim();
    if (!wordText) continue;
    let start = lineText.indexOf(wordText, cursor);
    if (start < 0) start = lineText.toLocaleLowerCase().indexOf(wordText.toLocaleLowerCase(), cursor);
    if (start < 0) {
      while (cursor < lineText.length && /\s/.test(lineText[cursor])) cursor += 1;
      start = cursor;
    }
    const end = Math.min(lineText.length, start + wordText.length);
    wordRanges.push({ word, start, end });
    cursor = end;
  }

  return entities.map((entity) => {
    const overlapping = wordRanges.filter(({ start, end }) => start < entity.end && entity.start < end);
    if (!overlapping.length) {
      const ratioStart = entity.start / Math.max(lineText.length, 1);
      const ratioEnd = entity.end / Math.max(lineText.length, 1);
      const lineWidth = line.bbox.x1 - line.bbox.x0;
      return {
        entity,
        bbox: {
          x0: line.bbox.x0 + lineWidth * ratioStart,
          y0: line.bbox.y0,
          x1: line.bbox.x0 + lineWidth * ratioEnd,
          y1: line.bbox.y1,
        },
        confidence: line.confidence ?? 0,
      };
    }

    const boxes = overlapping.map(({ word, start, end }) => {
      const wordLength = Math.max(1, end - start);
      const clippedStart = Math.max(entity.start, start);
      const clippedEnd = Math.min(entity.end, end);
      const width = word.bbox.x1 - word.bbox.x0;
      return {
        x0: word.bbox.x0 + width * ((clippedStart - start) / wordLength),
        y0: word.bbox.y0,
        x1: word.bbox.x0 + width * ((clippedEnd - start) / wordLength),
        y1: word.bbox.y1,
        confidence: word.confidence ?? line.confidence ?? 0,
      };
    });
    return {
      entity,
      bbox: {
        x0: Math.min(...boxes.map((box) => box.x0)),
        y0: Math.min(...boxes.map((box) => box.y0)),
        x1: Math.max(...boxes.map((box) => box.x1)),
        y1: Math.max(...boxes.map((box) => box.y1)),
      },
      confidence: Math.min(...boxes.map((box) => box.confidence)),
    };
  });
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

import type { AssistantCitation } from "@/lib/assistant-policy";
import { getRouteQuestionBankEntries } from "@/lib/ask-question-bank";

// Task R14 [CLAUDE]: lookup layer for the AUTHORED preset answers generated
// by scripts/generate-ask-question-bank.mjs. A bank preset click resolves
// here to a committed answer written by the author from the projects'
// evidence — grounded (every number machine-checked against its named
// source file at generation time), cited through the B5-c navigation
// index, rendered with no /api/assistant call and no model. The UI labels
// these truthfully as preset answers (预置回答), never as retrieval output
// or model generation. Typed free-form questions never pass through this
// module.
//
// Payload discipline: the answers artifact (~80KB of bilingual prose) is
// CONTENT, not app code — it ships as its own lazily-imported chunk so no
// route pays for it in its initial JS budget (/projects/ask-portfolio holds a
// hard 200KB initial ratchet). Whether a prompt IS a preset is decided
// synchronously from the small routed question bank; the answer chunk is
// fetched from the site's own static assets on first use (prefetchable on
// hover/focus), so a click still renders locally and immediately — zero
// /api/assistant requests, asserted by tests/e2e/ask-r2.spec.ts.

export interface PresetAnswerSegment {
  text: string;
  /** 1-based index into `citations` (the rendered superscript number). */
  ref: number;
}

export interface PresetAnswer {
  segments: PresetAnswerSegment[];
  citations: AssistantCitation[];
}

interface PresetAnswersFile {
  answers: Record<string, {
    route: string;
    /** Locale-shared: citation labels carry both languages. */
    citations: AssistantCitation[];
    en: { segments: PresetAnswerSegment[] };
    zh: { segments: PresetAnswerSegment[] };
  }>;
}

let loaded: PresetAnswersFile | null = null;
let pending: Promise<PresetAnswersFile> | null = null;

function loadPresetAnswersFile(): Promise<PresetAnswersFile> {
  if (loaded) return Promise.resolve(loaded);
  pending ??= import("@/data/generated/ask-preset-answers.json").then((module) => {
    loaded = (module.default ?? module) as unknown as PresetAnswersFile;
    return loaded;
  }).catch((error: unknown) => {
    pending = null;
    throw error;
  });
  return pending;
}

/** Fire-and-forget warm-up so a later click resolves from memory. */
export function prefetchPresetAnswers(): void {
  void loadPresetAnswersFile().catch(() => {
    // A failed prefetch is not an error state; the click path retries.
    pending = null;
  });
}

function bankEntryFor(pathname: string, prompt: string, locale: "en" | "zh") {
  return getRouteQuestionBankEntries(pathname)
    .find((question) => (locale === "en" ? question.q_en : question.q_zh) === prompt) ?? null;
}

/** Synchronous: is this prompt one of the route's bank presets? */
export function isPresetPrompt(pathname: string, prompt: string, locale: "en" | "zh"): boolean {
  return bankEntryFor(pathname, prompt, locale) !== null;
}

export async function getPresetAnswer(
  pathname: string,
  prompt: string,
  locale: "en" | "zh",
): Promise<PresetAnswer | null> {
  const entry = bankEntryFor(pathname, prompt, locale);
  if (!entry) return null;
  const file = await loadPresetAnswersFile();
  const record = file.answers[entry.id];
  if (!record) return null;
  const segments = record[locale]?.segments;
  if (!segments || segments.length === 0) return null;
  return { segments, citations: record.citations };
}

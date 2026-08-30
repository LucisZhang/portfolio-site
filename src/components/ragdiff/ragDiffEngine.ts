// Task L3 [CLAUDE]: the deterministic comparison engine behind exhibit 01's
// diff instrument. Every export here is a pure function of the two text
// strings it is given -- no randomness, no clock, no network -- so the same
// edit always recomputes the same line diff, the same 12 checks, and the
// same verdict (the binding requirement: "the verdict is computed, never
// scripted"). Nothing in this file reads or writes public/case-studies/
// rag-quality-lab/claim-registry.json; that file is verified claims, this
// file is a live, runtime-deterministic comparison over whatever text a
// visitor types into the working-copy textarea, always labeled
// demo·deterministic by the component that renders it (RagDiffLab.tsx).
import { RAG_DIFF_PROBE_TERMS, RAG_DIFF_SIBLING_TEXT } from "./ragDiffFixture";

export type DiffLineKind = "ctx" | "dim" | "del" | "add";
export type DiffRow = { no: number; kind: DiffLineKind; text: string };

type DiffOp = { kind: "ctx" | "del" | "add"; text: string };

// Classic LCS-based line diff (Wagner-Fischer table walked back to an edit
// script). Generic over any two line arrays -- it has no knowledge of the
// RAG fixture's specific content, so it produces a real diff for whatever a
// visitor types, not a lookup keyed on the one illustrative edit the mock
// shows.
function diffOps(a: string[], b: string[]): DiffOp[] {
  const n = a.length;
  const m = b.length;
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ kind: "ctx", text: a[i] });
      i += 1;
      j += 1;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      ops.push({ kind: "del", text: a[i] });
      i += 1;
    } else {
      ops.push({ kind: "add", text: b[j] });
      j += 1;
    }
  }
  while (i < n) {
    ops.push({ kind: "del", text: a[i] });
    i += 1;
  }
  while (j < m) {
    ops.push({ kind: "add", text: b[j] });
    j += 1;
  }
  return ops;
}

// Context lines immediately adjacent (within 1 diff-op) to a changed line
// stay full-weight ("ctx"); further-away unchanged lines de-emphasize to
// "dim" -- the mock's own treatment of its lines 18-19. This is computed
// from the op index distance, not a hardcoded line number, so it holds for
// any edit shape.
function buildPanes(ops: DiffOp[], startLine: number): { baseline: DiffRow[]; working: DiffRow[] } {
  const changedIndexes = ops.flatMap((op, index) => (op.kind === "ctx" ? [] : [index]));
  const isNearChange = (index: number) => changedIndexes.some((changed) => Math.abs(changed - index) <= 1);
  const baseline: DiffRow[] = [];
  const working: DiffRow[] = [];
  let baselineLine = startLine;
  let workingLine = startLine;
  ops.forEach((op, index) => {
    if (op.kind === "ctx") {
      const kind: DiffLineKind = isNearChange(index) ? "ctx" : "dim";
      baseline.push({ no: baselineLine, kind, text: op.text });
      workingLine += 0; // no-op, keeps the two counters visually parallel below
      working.push({ no: workingLine, kind, text: op.text });
      baselineLine += 1;
      workingLine += 1;
    } else if (op.kind === "del") {
      baseline.push({ no: baselineLine, kind: "del", text: op.text });
      baselineLine += 1;
    } else {
      working.push({ no: workingLine, kind: "add", text: op.text });
      workingLine += 1;
    }
  });
  return { baseline, working };
}

export function computeLineDiff(baselineText: string, workingText: string, startLine: number) {
  const ops = diffOps(baselineText.split("\n"), workingText.split("\n"));
  return buildPanes(ops, startLine);
}

function words(text: string, minLength = 1): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((word) => word.length >= minLength);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const value of a) if (b.has(value)) intersection += 1;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

// A tiny synchronous string checksum (not cryptographic -- SHA-256 needs
// Web Crypto's async API, and this only has to be a stable, deterministic
// fingerprint for the "manifest_hash lineage" row, not a security
// property). djb2-style rolling hash.
function checksum(text: string): string {
  let hash = 5381;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) + hash + text.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export type RagCheckStatus = "good" | "bad" | "tie";
export type RagCheckGroup = "featured" | "further";
export type RagCheck = {
  id: string;
  group: RagCheckGroup;
  status: RagCheckStatus;
  deltaLabel: string;
  note: { en: string; zh: string };
};

const CHUNK_BUDGET_CHARS = 220;
const DEDUP_SIMILARITY_THRESHOLD = 0.4;
const ANCHOR_MIN_LENGTH = 6;

// The 12 checks named in the design mock. 5 render as their own row
// ("featured"); the remaining 7 bucket into a single "N further checks"
// row (heading_integrity plus 6 more generic structural checks) -- exactly
// the mock's 5-rows-plus-"7 further checks" layout. Every value below is
// computed from the two text arguments; nothing is looked up by matching
// the specific illustrative edit the mock shows, so a visitor's own edit
// produces its own real result.
export function computeChecks(baselineText: string, workingText: string): RagCheck[] {
  const baselineLines = baselineText.split("\n").filter((line) => line.trim().length > 0);
  const workingLines = workingText.split("\n").filter((line) => line.trim().length > 0);
  const ops = diffOps(baselineText.split("\n"), workingText.split("\n"));
  const addedText = ops.filter((op) => op.kind === "add").map((op) => op.text).join(" ");

  // 1. chunk_count -- fewer chunks in the working copy than the baseline
  // means the edit merged or dropped a chunk boundary.
  const chunkDelta = workingLines.length - baselineLines.length;
  const chunkCount: RagCheck = {
    id: "chunk_count",
    group: "featured",
    status: chunkDelta < 0 ? "bad" : "tie",
    deltaLabel: chunkDelta === 0 ? "±0" : (chunkDelta > 0 ? `+${chunkDelta}` : String(chunkDelta)),
    note: chunkDelta < 0
      ? { en: "chunk boundary lost at the edit", zh: "编辑处丢失了一个分块边界" }
      : { en: "chunk boundaries unchanged", zh: "分块边界未变化" },
  };

  // 2. anchor_targets -- distinctive words (6+ letters) present in the
  // baseline but no longer present anywhere in the working copy. A missing
  // anchor word models a cross-reference or retrieval anchor going dark.
  const baselineAnchors = new Set(words(baselineText, ANCHOR_MIN_LENGTH));
  const workingAnchors = new Set(words(workingText, ANCHOR_MIN_LENGTH));
  const missingAnchors = [...baselineAnchors].filter((word) => !workingAnchors.has(word)).sort();
  const anchorTargets: RagCheck = {
    id: "anchor_targets",
    group: "featured",
    status: missingAnchors.length > 0 ? "bad" : "tie",
    deltaLabel: missingAnchors.length > 0 ? `-${missingAnchors.length}` : "±0",
    note: missingAnchors.length > 0
      ? { en: `dropped: ${missingAnchors.slice(0, 3).join(", ")}`, zh: `已消失：${missingAnchors.slice(0, 3).join("、")}` }
      : { en: "every baseline anchor term survives", zh: "基线锚点词全部保留" },
  };

  // 3. dedup_signature -- token-Jaccard similarity between whatever text
  // the edit added and a fixed sibling chunk standing in for a labeled
  // neighboring document. Above threshold reads as a collision.
  const siblingTokens = new Set(words(RAG_DIFF_SIBLING_TEXT, 3));
  const addedTokens = new Set(words(addedText || workingText, 3));
  const similarity = jaccard(siblingTokens, addedTokens);
  const collides = similarity >= DEDUP_SIMILARITY_THRESHOLD;
  const dedupSignature: RagCheck = {
    id: "dedup_signature",
    group: "featured",
    status: collides ? "bad" : "tie",
    deltaLabel: collides ? "collision" : "unique",
    note: collides
      ? { en: "overlaps a labeled sibling chunk", zh: "与一个已标记的相邻分块重叠" }
      : { en: "no overlap above threshold", zh: "未超过重叠阈值" },
  };

  // 4. retrievability_probe -- a fixed, small set of distinctive words
  // pulled from the baseline's changed line (see ragDiffFixture.ts). If any
  // of them stop appearing anywhere in the working copy, the demo question
  // that probe stands in for would no longer match this chunk.
  const workingWordSet = new Set(words(workingText, 1));
  const missingProbeTerms = RAG_DIFF_PROBE_TERMS.filter((term) => !workingWordSet.has(term));
  const retrievabilityProbe: RagCheck = {
    id: "retrievability_probe",
    group: "featured",
    status: missingProbeTerms.length > 0 ? "bad" : "tie",
    deltaLabel: missingProbeTerms.length > 0 ? `-${missingProbeTerms.length}` : "±0",
    note: missingProbeTerms.length > 0
      ? { en: `probe term dropped: ${missingProbeTerms.join(", ")}`, zh: `探测词已消失：${missingProbeTerms.join("、")}` }
      : { en: "probe terms still present", zh: "探测词仍然存在" },
  };

  // 5. token_budget -- a fixed chars-per-chunk estimate; a shorter working
  // copy needs fewer chunks (good), a longer one needs more (bad).
  const baselineBudget = Math.ceil(baselineText.length / CHUNK_BUDGET_CHARS);
  const workingBudget = Math.ceil(workingText.length / CHUNK_BUDGET_CHARS);
  const budgetSaved = baselineBudget - workingBudget;
  const tokenBudget: RagCheck = {
    id: "token_budget",
    group: "featured",
    status: budgetSaved > 0 ? "good" : (budgetSaved < 0 ? "bad" : "tie"),
    deltaLabel: budgetSaved === 0 ? "±0" : (budgetSaved > 0 ? `+${budgetSaved}` : String(budgetSaved)),
    note: budgetSaved > 0
      ? { en: "fits one fewer estimated chunk", zh: "预估分块数量减少一个" }
      : (budgetSaved < 0
        ? { en: "needs one more estimated chunk", zh: "预估分块数量增加一个" }
        : { en: "estimated chunk budget unchanged", zh: "预估分块数量未变化" }),
  };

  // The remaining 7 checks bucket into a single row (mock: "7 further
  // checks ±0 · heading_integrity, manifest_hash lineage, …"). Each is
  // still independently computed and counts toward the verdict below.
  const headingPattern = /^[A-Z][A-Za-z0-9 ]{2,40}:$/;
  const headingDelta = workingLines.filter((line) => headingPattern.test(line.trim())).length
    - baselineLines.filter((line) => headingPattern.test(line.trim())).length;
  const headingIntegrity: RagCheck = {
    id: "heading_integrity",
    group: "further",
    status: headingDelta < 0 ? "bad" : "tie",
    deltaLabel: headingDelta === 0 ? "±0" : String(headingDelta),
    note: { en: "heading lines preserved", zh: "标题行保持不变" },
  };

  const manifestHashLineage: RagCheck = {
    id: "manifest_hash_lineage",
    group: "further",
    status: "tie",
    deltaLabel: `${checksum(baselineText)}→${checksum(workingText)}`,
    note: { en: "hash recomputed, lineage recorded", zh: "哈希已重算，谱系已记录" },
  };

  const wordDelta = words(workingText).length - words(baselineText).length;
  const wordCountParity: RagCheck = {
    id: "word_count_parity",
    group: "further",
    status: Math.abs(wordDelta) <= 2 ? "tie" : (wordDelta < 0 ? "bad" : "good"),
    deltaLabel: wordDelta === 0 ? "±0" : (wordDelta > 0 ? `+${wordDelta}` : String(wordDelta)),
    note: { en: "word count within tolerance", zh: "词数在容差范围内" },
  };

  const sentenceCount = (text: string) => (text.match(/[.!?]+/g) ?? []).length;
  const sentenceDelta = sentenceCount(workingText) - sentenceCount(baselineText);
  const sentenceCountParity: RagCheck = {
    id: "sentence_count_parity",
    group: "further",
    status: sentenceDelta === 0 ? "tie" : (sentenceDelta < 0 ? "bad" : "good"),
    deltaLabel: sentenceDelta === 0 ? "±0" : (sentenceDelta > 0 ? `+${sentenceDelta}` : String(sentenceDelta)),
    note: { en: "sentence count unchanged", zh: "句子数量未变化" },
  };

  const punctCount = (text: string) => (text.match(/[,:;]/g) ?? []).length;
  const punctDelta = punctCount(workingText) - punctCount(baselineText);
  const punctuationIntegrity: RagCheck = {
    id: "punctuation_integrity",
    group: "further",
    status: punctDelta === 0 ? "tie" : "bad",
    deltaLabel: punctDelta === 0 ? "±0" : String(punctDelta),
    note: { en: "clause punctuation unchanged", zh: "分句标点未变化" },
  };

  // Scans by character code rather than a regex literal (avoids embedding
  // literal control-character bytes in this source file). Printable
  // ASCII, tab, and newline are allowed; anything below 0x20 other than
  // those two is treated as an encoding problem introduced by the edit.
  const hasControlChars = Array.from(workingText).some((character) => {
    const code = character.charCodeAt(0);
    return code < 0x20 && code !== 0x09 && code !== 0x0a;
  });
  const encodingValidity: RagCheck = {
    id: "encoding_validity",
    group: "further",
    status: hasControlChars ? "bad" : "tie",
    deltaLabel: hasControlChars ? "invalid" : "valid",
    note: { en: "no control characters introduced", zh: "未引入控制字符" },
  };

  const hasTrailingWhitespace = workingLines.some((line) => /[ \t]+$/.test(line));
  const lineEndingConsistency: RagCheck = {
    id: "line_ending_consistency",
    group: "further",
    status: hasTrailingWhitespace ? "bad" : "tie",
    deltaLabel: hasTrailingWhitespace ? "trailing ws" : "clean",
    note: { en: "no trailing whitespace", zh: "没有行尾空白" },
  };

  return [
    chunkCount, anchorTargets, dedupSignature, retrievabilityProbe, tokenBudget,
    headingIntegrity, manifestHashLineage, wordCountParity, sentenceCountParity,
    punctuationIntegrity, encodingValidity, lineEndingConsistency,
  ];
}

export type RagVerdictWord = "IMPROVEMENT" | "REGRESSION" | "TRADEOFF" | "TIE";
export type RagVerdict = { word: RagVerdictWord; degraded: number; improved: number; total: number };

// Four-word vocabulary, computed purely from the check statuses -- never a
// per-scenario lookup. Same edit -> same checks -> same verdict, always.
export function summarizeVerdict(checks: RagCheck[]): RagVerdict {
  const degraded = checks.filter((check) => check.status === "bad").length;
  const improved = checks.filter((check) => check.status === "good").length;
  const word: RagVerdictWord = degraded > 0 && improved > 0
    ? "TRADEOFF"
    : degraded > 0
      ? "REGRESSION"
      : improved > 0
        ? "IMPROVEMENT"
        : "TIE";
  return { word, degraded, improved, total: checks.length };
}

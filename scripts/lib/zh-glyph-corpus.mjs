// Shared corpus + codepoint extraction for task F4 (self-hosted zh serif
// subset). Both scripts/subset-zh-serif.mjs (build the woff2) and
// scripts/verify-zh-glyphs.mjs (assert the shipped subset covers every
// glyph the site actually renders) must scan the exact same corpus, or the
// verify step would not be checking what the subset step produced -- so
// the file list and the codepoint ranges live here once.
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// Scan roots (task F4 brief): every .ts/.tsx source file (JSX text nodes,
// string literals, and comments alike -- comment characters over-include
// by a handful of glyphs at most, which is a acceptable tradeoff against
// missing a real one), every generated/static data JSON under src/data
// (home-stats.json, home-receipts.json, forge-receipts.json,
// eod-receipts.json, assistant-knowledge.generated.json, the search
// vocabulary/alias files), and every locale-bearing JSON payload under
// public/case-studies that a project page fetches at runtime (strategy-cards
// copyZh, methods-evidence, detection-report, release.json, the OCR
// benchmark fixture, ...). Markdown/SVG assets under public/case-studies
// are excluded: they are offered as direct downloads (Download icon links
// in ArtifactViewer), not rendered through the site's own font stack.
const SCAN_ROOTS = [
  { dir: "src", extensions: [".ts", ".tsx"] },
  { dir: "src/data", extensions: [".json"] },
  { dir: "public/case-studies", extensions: [".json"] },
];

// Verified-unrendered exception inside an otherwise-scanned root (task
// review, investigating finding 1's "extra" codepoints): this file's
// `recognizedText`/`falsePositives` fields hold raw, garbled OCR-engine
// output used only to score the fixture benchmark -- e.g. random Latin/
// symbol noise like "¢ § © ® ° · » × ó σ" and a stray emoji, none of it
// real zh copy. src/components/privacy/PrivacyOcrBenchmark.tsx's
// `Benchmark` interface and JSX only ever read `scope`, `summary.*`,
// and, per fixture, `id`/`recall`/`precision`/`misses` (joined only when
// non-empty -- every fixture in this file currently has an empty `misses`
// array) -- `recognizedText` and `falsePositives` are fetched but never
// rendered. Confirmed via `grep -rn recognizedText src` (zero component
// references) before excluding. If this component is ever changed to
// surface `recognizedText` or `falsePositives`, drop this exclusion --
// `npm run verify:zh-glyphs` will catch any resulting gap on the next run.
const EXCLUDED_FILES = new Set(["public/case-studies/privacy-preflight/ocr-fixture-benchmark.json"]);

async function walk(dir, extensions, out) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, extensions, out);
    } else if (extensions.includes(path.extname(entry.name))) {
      out.push(full);
    }
  }
}

/** Every file path (repo-relative) in the F4 glyph-scan corpus. */
export async function collectCorpusFiles() {
  const files = [];
  for (const root of SCAN_ROOTS) {
    const absoluteDir = path.join(repositoryRoot, root.dir);
    const found = [];
    await walk(absoluteDir, root.extensions, found);
    for (const file of found) files.push(path.relative(repositoryRoot, file));
  }
  const filtered = files.filter((file) => !EXCLUDED_FILES.has(file));
  filtered.sort();
  return filtered;
}

/** Concatenated text content of the entire corpus, plus the per-file list. */
export async function readCorpusText() {
  const files = await collectCorpusFiles();
  const chunks = await Promise.all(
    files.map((relativePath) => readFile(path.join(repositoryRoot, relativePath), "utf8")),
  );
  return { files, text: chunks.join("\n") };
}

// Task F4 brief's three ranges: CJK Unified Ideographs (the hanzi
// themselves), CJK Symbols and Punctuation (、。「」！？ etc.), and the
// Halfwidth/Fullwidth Forms block (full-width Latin/digits/punctuation
// that occasionally appear in zh copy, e.g. full-width parens or ％). All
// three ranges sit entirely inside the Basic Multilingual Plane, so a
// plain UTF-16 code-unit scan (no surrogate-pair handling) is sufficient.
export const CJK_RANGES = [
  [0x4e00, 0x9fff],
  [0x3000, 0x303f],
  [0xff00, 0xffef],
];

export function isCjkCodepoint(codepoint) {
  return CJK_RANGES.some(([start, end]) => codepoint >= start && codepoint <= end);
}

/** Set of CJK codepoints (numbers) actually present in `text`. */
export function extractCjkCodepoints(text) {
  const codepoints = new Set();
  for (const char of text) {
    const codepoint = char.codePointAt(0);
    if (isCjkCodepoint(codepoint)) codepoints.add(codepoint);
  }
  return codepoints;
}

// Fix (task review finding 1, critical): Hero.tsx's live zh copy uses "——"
// (U+2014 em dash, doubled) as a clause separator, which sits in the
// General Punctuation block -- outside all three CJK_RANGES -- so the
// original CJK-only scan never subsetted it, and the browser silently
// fell back to a system font mid-sentence for that one character on the
// exact hero line task F4 was created to fix. Zh copy throughout this
// corpus also uses curly quotes and an ellipsis glyph alongside hanzi in
// the same running text, so a fixed six-codepoint patch would have the
// same failure mode the next time a new zh string picks a different
// adjacent punctuation mark.
//
// Fixed instead: every non-ASCII character inside a *string/JSX-text
// segment* that also contains at least one CJK-range character is
// "zh-adjacent" and required in the subset, whether or not it falls
// inside CJK_RANGES itself -- no per-punctuation-mark allowlist to keep in
// sync by hand. Segment (not line, not file) granularity matters because
// several files in this corpus (public/case-studies/**/*.json) are
// minified to one line or hold unrelated data -- box-drawing characters,
// math symbols, emoji -- alongside zh copy elsewhere in the same file;
// scoping to the actual string literal or JSX text run that carries the
// CJK avoids sweeping all of that in. ASCII (<= U+007F) is excluded --
// Latin display type is covered by the separate self-hosted latin serif /
// system sans stacks already.
// Double-quote and backtick only, deliberately excluding single-quote: a
// single unescaped apostrophe inside an English prose comment ("it's",
// "user's") would otherwise be misread as opening a string literal and
// the regex would greedily consume everything up to the next apostrophe
// as "content", corrupting segment boundaries across the rest of the
// file. Every zh string literal in this codebase is double-quoted (no
// single-quoted zh literal exists -- checked empirically), so this loses
// no real coverage.
const STRING_LITERAL_RE = /(["`])(?:\\.|(?!\1)[^\\])*\1/g;
// Crude JSX-text-node matcher: text directly between tags with no nested
// tag or expression boundary inside it. Good enough for this corpus (no
// zh copy is written as raw inline JSX text broken across nested tags);
// a false negative here just means falling through to the string-literal
// pass, which already covers every zh string in this codebase (all zh
// copy is authored as `zh: "..."` literals, not inline JSX text).
const JSX_TEXT_RE = />([^<>{}]+)</g;

function extractZhBearingSegments(text) {
  const segments = [];
  STRING_LITERAL_RE.lastIndex = 0;
  let match;
  while ((match = STRING_LITERAL_RE.exec(text))) segments.push(match[0]);
  JSX_TEXT_RE.lastIndex = 0;
  while ((match = JSX_TEXT_RE.exec(text))) segments.push(match[1]);
  return segments;
}

export function extractRequiredCodepoints(text) {
  const required = new Set();
  for (const segment of extractZhBearingSegments(text)) {
    let hasCjk = false;
    for (const char of segment) {
      if (isCjkCodepoint(char.codePointAt(0))) {
        hasCjk = true;
        break;
      }
    }
    if (!hasCjk) continue;
    for (const char of segment) {
      const codepoint = char.codePointAt(0);
      if (codepoint > 0x7f) required.add(codepoint);
    }
  }
  return required;
}

// Codepoints deliberately permitted to appear alongside zh copy without
// being required in the shipped subset -- e.g. a symbol that is fine to
// let fall back to the next font in the --display-serif-zh stack. Add an
// entry here (with a comment explaining why it's safe to exclude) only if
// scripts/verify-zh-glyphs.mjs flags a codepoint that should NOT be added
// to the physical subset; anything else found in a zh-bearing segment
// that is neither in the subset nor listed here fails the build.
export const ZH_ADJACENT_ALLOWLIST = new Set([
  // U+2200 FOR ALL, U+2208 ELEMENT OF, and U+2261 IDENTICAL TO are the
  // visible verification proposition in EodPage.tsx, which eod.css renders
  // with var(--mono), not --display-serif-zh. U+2713 CHECK MARK and U+2717
  // BALLOT X survive only in a source comment and a digits-audit description.
  // F13a's generated assistant snapshot packs each cited chunk into one JSON
  // string; when those otherwise-non-zh symbols share a chunk with unrelated
  // Chinese evidence, the segment scanner conservatively sees them as
  // zh-adjacent. They are not display-serif glyphs, so keep the subset focused
  // on the three genuinely new Han codepoints surfaced by that snapshot.
  0x2200,
  0x2208,
  0x2261,
  0x2713,
  0x2717,
  // U+1F52C MICROSCOPE, from the "# 🔬 RAG Quality Lab" markdown heading in
  // src/data/assistant-knowledge.generated.json (the AI assistant's RAG
  // knowledge base). No text serif -- including Noto Serif SC -- carries
  // emoji glyphs; pyftsubset silently drops unavailable codepoints from
  // --text-file rather than erroring, which is what let this ship missing
  // on the first rebuild attempt (caught by this exact guard). This
  // content is also never rendered through --display-serif-zh in the
  // first place (AssistantWidget's chat surface uses its own CSS-module
  // styles, not the .home-hero-zh/.exhibit-title/.exhibit-rail-copy-zh/
  // zh-narrative-body selectors globals.css wires to that font). Falls
  // back to the system emoji font, which is correct regardless.
  0x1f52c,
  // U+B1 PLUS-MINUS SIGN, from ragDiffEngine.ts's computed check deltas
  // ("±0") in the RAG Quality Lab diff instrument (RagDiffLab.tsx). Always
  // rendered inside `.rag-drow-d` / the further-checks bucket, which
  // rag.css sets to var(--mono) -- the exact same "math/logic symbol
  // rendered in mono, never --display-serif-zh" situation as the EOD
  // verification-proposition symbols above.
  0xb1,
  // U+25CE BULLSEYE (◎), the confirm-action prefix on the PrivacyLab export
  // buttons ("◎ CONFIRM REVIEW AND SHOW RESULT" in PrivacyPdfLab.tsx /
  // PrivacyImageLab.tsx, per the approved r3 mock b4-privacy-galley.html).
  // The zh button label ("确认复核并显示结果") makes the scanner see it as
  // zh-adjacent, but .privacy-export-button is uppercase mono/system action
  // fabric -- globals.css wires --display-serif-zh only to :lang(zh) h1 and
  // the specific body-copy :is(...) list, never to this button -- so the
  // glyph renders from the system stack (which carries U+25CE) and does not
  // belong in the display serif subset.
  0x25ce,
  // U+3B1 GREEK SMALL LETTER ALPHA and U+3C4 GREEK SMALL LETTER TAU (task
  // B6 glyph-gate fix): inline math notation inside retrieved-chunk prose
  // in src/data/assistant-knowledge.generated.json -- e.g. "叠了一层
  // α=0.3 的 MiniLM 内容重排" (margin-detection chunk) and "其提交的 CAL
  // grid 选出 τ=0.8484" (triage-router chunk). Confirmed via grep this is
  // the ONLY place either codepoint appears in the corpus -- not in
  // ask-preset-answers.json, ask-question-bank.json, evidence-links.json,
  // or any citation-label string built by assistant-citation-index.ts
  // (AssistantSourcesIndex's .ask-go-dest titles are assembled from a
  // small fixed vocabulary -- project labels, fileDescriptor() phrases,
  // zhCitationLabel() wrapping -- never the raw knowledge-chunk text).
  // Same "never rendered through --display-serif-zh" situation as the
  // U+1F52C microscope entry above: AskPage.tsx cites this file only via
  // EvidenceFileLink (a link to the file, not its content inline);
  // AssistantWidget's live chat bubbles use their own CSS-module classes
  // (font-geist-mono only); globals.css wires --display-serif-zh solely
  // to :lang(zh) h1 and one specific body-copy selector list, none of
  // which this RAG-corpus text ever reaches. Greek letters are also
  // outside a "Chinese serif" subset's actual remit (task F4 brief: CJK
  // codepoints only) -- these fall back to the system stack correctly
  // either way.
  0x3b1,
  0x3c4,
]);

export function codepointsToText(codepoints) {
  return Array.from(codepoints, (cp) => String.fromCodePoint(cp)).join("");
}

export function formatUnicodeRange(codepoints) {
  const sorted = Array.from(codepoints).sort((a, b) => a - b);
  const ranges = [];
  for (const cp of sorted) {
    const last = ranges[ranges.length - 1];
    if (last && cp === last[1] + 1) {
      last[1] = cp;
    } else {
      ranges.push([cp, cp]);
    }
  }
  return ranges
    .map(([start, end]) => (start === end ? `U+${start.toString(16).toUpperCase()}` : `U+${start.toString(16).toUpperCase()}-${end.toString(16).toUpperCase()}`))
    .join(", ");
}

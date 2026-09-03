// Task R8 (checklist A2, owner-approved): phrase-aware line breaking for
// Chinese display type. Default CJK wrapping may break between ANY two han
// characters, so a two-char word like bian1jie4 ("boundary") can split
// across lines. This module segments a zh string into phrase chunks via
// Intl.Segmenter('zh', word granularity) so the React layer (zh-wrap.tsx)
// can render each chunk as an unbreakable inline-block span — line breaks
// then only happen BETWEEN phrases.
//
// NOTE: all han/CJK-punctuation characters in this file are written as \u
// escapes on purpose — scripts/lib/zh-glyph-corpus.mjs scans src/**/*.ts(x)
// bytes to decide which glyphs the display-serif-zh subset font must carry,
// and these are program data / examples, never rendered copy.
//
// Chunking rules (beyond raw segmenter output):
// - Closing punctuation / unit marks (full stop, comma, percent, dashes...)
//   merge LEFT into the preceding phrase — they must never start a line
//   (kinsoku / bi4tou2dian3).
// - Opening punctuation (corner/angle brackets, parens, curly quotes)
//   attaches RIGHT to the following phrase — it must never end a line.
// - Latin/digit runs with no interior whitespace stay ONE chunk ("verify:"
//   must not gain a new break opportunity before "r2-sources"; "1,450" and
//   "66.35%" stay whole). Whitespace remains a plain-text separator so
//   normal inter-word wrapping is preserved.
// - Overflow guard: any chunk longer than MAX_WRAP_CHARS code points is
//   emitted as plain text (wrap: false) — browser-default breaking applies,
//   so long latin tokens/URLs can still wrap instead of overflowing at 390w.

export type ZhPhraseToken = { text: string; wrap: boolean };

// Han ideographs — presence gates all processing so pure-latin strings pass
// through untouched (en locale must render byte-identically).
const HAS_CJK = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/;

export function hasCjk(text: string): boolean {
  return HAS_CJK.test(text);
}

// Opening brackets/quotes that attach to the phrase AFTER them: fullwidth
// paren, corner brackets, double/single angle brackets, lenticular and
// tortoise-shell brackets, fullwidth square/curly brackets, ASCII ( [ {,
// and left curly double/single quotes.
const OPENERS = new Set([..."\uFF08\u300C\u300E\u300A\u3008\u3010\u3014\uFF3B\uFF5B([{\u201C\u2018"]);

const WHITESPACE = /^\s+$/;

// Segments longer than this pass through unwrapped (avoids an unbreakable
// block overflowing narrow viewports).
const MAX_WRAP_CHARS = 8;

let cachedSegmenter: Intl.Segmenter | null | undefined;

function getSegmenter(): Intl.Segmenter | null {
  if (cachedSegmenter === undefined) {
    try {
      cachedSegmenter =
        typeof Intl !== "undefined" && typeof Intl.Segmenter === "function"
          ? new Intl.Segmenter("zh-Hans", { granularity: "word" })
          : null;
    } catch {
      cachedSegmenter = null;
    }
  }
  return cachedSegmenter;
}

// Splits `text` into phrase tokens. Returns null when no processing should
// happen (no han characters, or no Intl.Segmenter in this runtime) — the
// caller then renders the original string unchanged.
export function zhPhraseTokens(text: string): ZhPhraseToken[] | null {
  if (!text || !HAS_CJK.test(text)) return null;
  const segmenter = getSegmenter();
  if (!segmenter) return null;

  const tokens: ZhPhraseToken[] = [];
  let pending = "";
  // Whether `pending` already contains a word (vs only opener punctuation).
  let pendingHasWord = false;
  // Kind of the word(s) in `pending`: han phrases flush per segmenter word;
  // latin/digit runs accumulate until whitespace or a han word.
  let pendingKind: "han" | "latin" | null = null;

  const flush = () => {
    if (!pending) return;
    tokens.push({ text: pending, wrap: [...pending].length <= MAX_WRAP_CHARS });
    pending = "";
    pendingHasWord = false;
    pendingKind = null;
  };

  for (const part of segmenter.segment(text)) {
    const seg = part.segment;
    if (WHITESPACE.test(seg)) {
      flush();
      tokens.push({ text: seg, wrap: false });
      continue;
    }
    if (part.isWordLike) {
      const kind = HAS_CJK.test(seg) ? "han" : "latin";
      // A new han word always starts a new chunk; a latin word only breaks
      // off when the pending chunk is a han phrase (glues "1,"+"450",
      // "verify:"+"r2", etc. — no whitespace was seen between them).
      if (pendingHasWord && (kind === "han" || pendingKind === "han")) flush();
      pending += seg;
      pendingHasWord = true;
      pendingKind = kind;
      continue;
    }
    // Punctuation / symbols.
    if (OPENERS.has(seg[0] ?? "")) {
      if (pendingHasWord) flush();
      pending += seg;
      continue;
    }
    // Closing punctuation, %, units, dashes… merge left onto the pending
    // chunk so they can never start a line.
    pending += seg;
  }
  flush();
  return mergeSingles(tokens);
}

// Post-pass: ICU segments many zh function words as bare single characters
// (demonstratives, classifiers, single-char verbs: zhe4/tiao2/chu1/zai4...),
// which leaves breaks like "zhe4 | tiao2 lian4lu4" — visually still the
// "word split across lines" the owner flagged. A chunk that is exactly ONE
// han character (no punctuation attached — attached punctuation already
// marks a natural break) merges into the immediately following chunk when
// the pair stays within MAX_WRAP_CHARS (zhe4+tiao2, lian4+lu4, chu1+wen4ti2
// each become one unit). The merged chunk is never re-used as a source, so
// runs of singles pair up instead of snowballing into over-long units.
// Merging only ever REMOVES break opportunities relative to the raw
// segmenter output — it can never introduce a new one.
function mergeSingles(tokens: ZhPhraseToken[]): ZhPhraseToken[] {
  const out: ZhPhraseToken[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const current = tokens[i];
    const next = tokens[i + 1];
    if (
      current.wrap &&
      next?.wrap &&
      [...current.text].length === 1 &&
      HAS_CJK.test(current.text) &&
      [...current.text + next.text].length <= MAX_WRAP_CHARS
    ) {
      out.push({ text: current.text + next.text, wrap: true });
      i += 1;
      continue;
    }
    out.push(current);
  }
  return out;
}

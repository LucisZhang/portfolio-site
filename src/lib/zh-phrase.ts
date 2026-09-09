// Task R8 (checklist A2) + Task D05: deterministic Chinese phrase segmentation
// for line breaking. Default CJK wrapping may break between ANY two han
// characters, so a two-character word can split across lines. This module
// turns a zh string into unbreakable units (word tier) and clause groups
// (display tier); the React layer (zh-wrap.tsx) renders them as unregistered
// custom elements so line breaks fall only BETWEEN words, and, for display
// copy, preferably between complete semantic phrases.
//
// NOTE: han / CJK-punctuation characters in this file are written as \u
// escapes on purpose -- scripts/lib/zh-glyph-corpus.mjs scans src/**/*.ts(x)
// bytes to decide which glyphs the display-serif-zh subset font must carry,
// and these are program data, never rendered copy. (zh-lexicon.ts is the
// deliberate exception: every word there is harvested from rendered copy.)
//
// Pipeline (word tier, zhPhraseTokens):
//   1. Intl.Segmenter('zh-Hans', word) atoms.
//   2. Lexicon merge (MERGE-ONLY): adjacent han atoms whose concatenation is a
//      listed compound become one atom. ICU emits yu4|zhi2 (threshold) / ha1|xi1 (hash) / wen2|dang4 (document) as
//      singles; it never needs splitting, so the lexicon cannot create a wrong
//      break -- it only removes them.
//   3. Punctuation: closers (fullwidth comma / stop / enumeration comma / semicolon /
//      colon / bang / question, closing brackets and quotes, ellipsis, %,
//      dashes) attach LEFT, never
//      start a line; openers (opening brackets and quotes) attach RIGHT, never end a line.
//   4. Latin/digit runs without interior whitespace stay one unit
//      ("verify:r2-sources", "1,450", "66.35%"); whitespace keeps normal
//      inter-word breaks. A classifier / unit character directly after a
//      digit run (with at most one space) glues to it: "6 ci4" (6 times), "30/44 tiao2" (30/44 items).
//   5. Remaining single han characters attach by grammatical class instead of
//      the R8 blind right-merge: enclitics (de/le/zhe/guo/men/deng/zhe particles, xing/hua/lv/du/shi/fa suffixes,
//      classifiers ge/tiao/ci/fen/xiang..., locatives shang/xia/zhong/nei/li/qian/hou/shi, pronouns after a
//      han unit) merge LEFT; proclitics (demonstratives, numerals, negation,
//      adverbs, prepositions, single-character verbs) merge RIGHT. This is
//      what stops ming4zhong4|lv4|cong2 ("hit rate, from ...") from producing
//      the cross-word unit lv4cong2.
//   6. Latin/symbol-only units wider than MAX_WRAP_EM (estimated em width) are
//      emitted unwrapped so a URL can still wrap instead of overflowing a
//      narrow viewport. For an over-cap unit that contains han, peripheral
//      punctuation is emitted as ordinary text while each han word core stays
//      atomic; CSS `line-break: strict` keeps those adjacent punctuation marks
//      on their legal side of a break. A word is never reopened internally.
//
// Display tier (zhClauseGroups): the same units, grouped after every clause
// mark (fullwidth comma, enumeration comma, semicolon, colon, stop, bang,
// question, and dashes) so a heading or gloss can be laid out as a
// sequence of atomic phrases (see .zh-phrase in globals.css).
import { ZH_LEXICON } from "./zh-lexicon";

export type ZhPhraseToken = { text: string; wrap: boolean };

// Han ideographs -- presence gates all processing so pure-latin strings pass
// through untouched (en locale must render byte-identically).
const HAS_CJK = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/;
const ONLY_CJK = /^[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]+$/;

export function hasCjk(text: string): boolean {
  return HAS_CJK.test(text);
}

// Opening brackets/quotes that attach to the phrase AFTER them.
const OPENERS = new Set([..."\uFF08\u300C\u300E\u300A\u3008\u3010\u3014\uFF3B\uFF5B([{\u201C\u2018"]);

// Clause-final marks: a display-tier group ends after a unit ending in one of
// these (fullwidth comma / enumeration comma / semicolon / colon / stop /
// exclamation / question, em dash, horizontal ellipsis, closing quotes and
// brackets when they close a clause).
const CLAUSE_END = /[\uFF0C\u3001\uFF1B\uFF1A\u3002\uFF01\uFF1F\u2014\u2026\u201D\u2019\uFF09\u300D\u300F\u300B\u3009\u3011]$/;

const WHITESPACE = /^\s+$/;
const LATIN_TAIL = /[0-9A-Za-z%\u2030\u0394\u03B1-\u03C9)]$/;
const NUMERIC_UNIT_HEAD = /^[\uFF08\u300C\u300E\u300A\u3008\u3010\u3014\uFF3B\uFF5B([{\u201C\u2018]*[+-]?\d[\d,./:%-]*$/;

// Units wider than this (estimated in em: a han / fullwidth character is 1,
// anything else about 0.55) pass through unwrapped, so an unbreakable run can
// never overflow a narrow viewport or a narrow table cell / chip (units are
// white-space: nowrap). Merges stop at this width.
const MAX_WRAP_EM = 6;
const FULLWIDTH = /[\u3000-\u9FFF\uF900-\uFAFF\uFF00-\uFF60\u2014\u2026\u201C\u201D\u2018\u2019]/;
const emWidth = (text: string) => [...text].reduce((sum, ch) => sum + (FULLWIDTH.test(ch) ? 1 : 0.55), 0);

// --- single-character classes -------------------------------------------
// Enclitics: merge LEFT onto the preceding han unit.
//   particles (de di de le zhe guo men deng zhe zhi), suffixes (xing hua lv
//   du shi fa xing lei ban tai), classifiers (ge tiao ci fen xiang zhang dao
//   zhong wei tai tao jia ming ju hang ye li chang lun pi chu bian bu bi zu
//   duan jie kuai tong lie bei dian), time/measure (miao tian zhou yue nian
//   yuan), locatives (shang xia zhong nei li wai qian hou shi ce bian jian).
const ENCLITIC = new Set([
  ..."\u7684\u5730\u5F97\u4E86\u7740\u8FC7\u4EEC\u7B49\u8005\u4E4B",
  ..."\u6027\u5316\u7387\u5EA6\u5F0F\u6CD5\u578B\u7C7B\u7248\u6001",
  ..."\u4E2A\u6761\u6B21\u4EFD\u9879\u5F20\u9053\u79CD\u4F4D\u53F0\u5957\u5BB6\u540D\u53E5\u884C\u9875\u4F8B\u573A\u8F6E\u6279\u5904\u904D\u6B65\u7B14\u7EC4\u6BB5\u8282\u5757\u6876\u5217\u500D\u70B9",
  ..."\u79D2\u5929\u5468\u6708\u5E74\u5143",
  ..."\u4E0A\u4E0B\u4E2D\u5185\u91CC\u5916\u524D\u540E\u65F6\u4FA7\u8FB9\u95F4",
]);
// Noun tails that ICU leaves dangling after an unknown head (zhi qi ji biao
// ku xian ceng duan yuan qi shu e ma lian qun wang ban ka pan lan kuang hao
// tu liang cha ti shi li guo cheng chuang bang ge); they belong to the word before them.
const NOUN_TAIL = new Set([
  ..."\u503C\u5668\u96C6\u8868\u5E93\u7EBF\u5C42\u7AEF\u6E90\u671F\u6570\u989D\u7801\u94FE\u7FA4\u7F51\u677F\u5361\u76D8\u680F\u6846\u53F7\u56FE\u91CF\u5DEE\u9898\u5E08\u529B\u56FD\u7A0B\u7A97\u699C\u683C",
]);
// Function words that only ever look forward (prepositions, adverbs,
// negation, conjunctions): an enclitic never merges LEFT onto one of these
// when it stands alone (cong2|ye4 must not become "cong2ye4").
const PROCLITIC_ONLY = new Set([
  ..."\u628A\u88AB\u8BA9\u7ED9\u7528\u5728\u4ECE\u5411\u5BF9\u4E3A\u4EE5\u548C\u4E0E\u6216\u53CA\u800C\u4F46\u82E5\u5982\u5219\u4E14\u5E76\u6309\u7531\u81EA\u5F80\u81F3\u4E8E\u6BD4\u8DDF",
  ..."\u90FD\u4E5F\u518D\u5C31\u624D\u66F4\u6700\u5F88\u592A\u53EA\u53C8\u8FD8\u4ECD\u5DF2\u5C06\u66FE\u5373\u7686\u5747\u5148\u603B\u5171\u5374\u4FBF",
  ..."\u4E0D\u6CA1\u672A\u975E\u65E0\u522B",
]);
// Pronouns: enclitic after a han unit (ba3 ta1 / rang4 ni3), otherwise proclitic.
const PRONOUN = new Set([..."\u6211\u4F60\u4ED6\u5979\u5B83\u8C01"]);
// Characters that glue to a preceding latin/digit run across one space:
// classifiers ("6 ci4"), enclitics ("seed de"), noun tails ("z zhi2").
const GLUE_AFTER_LATIN = new Set([...ENCLITIC, ...NOUN_TAIL]);

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

let lexiconIndex: Map<string, string[]> | null = null;
let lexiconMaxLength = 0;

function getLexicon(): Map<string, string[]> {
  if (!lexiconIndex) {
    lexiconIndex = new Map();
    for (const word of ZH_LEXICON) {
      const chars = [...word];
      if (chars.length < 2) continue;
      lexiconMaxLength = Math.max(lexiconMaxLength, chars.length);
      const list = lexiconIndex.get(chars[0]) ?? [];
      list.push(word);
      lexiconIndex.set(chars[0], list);
    }
  }
  return lexiconIndex;
}

type AtomKind = "ws" | "han" | "latin" | "open" | "close";
type Atom = { text: string; kind: AtomKind };

function classify(seg: Intl.SegmentData): AtomKind {
  const text = seg.segment;
  if (WHITESPACE.test(text)) return "ws";
  if (HAS_CJK.test(text)) return "han";
  if (seg.isWordLike) return "latin";
  if (OPENERS.has(text[0] ?? "")) return "open";
  return "close";
}

const length = (text: string) => [...text].length;
const fits = (text: string) => emWidth(text) <= MAX_WRAP_EM;

// Step 2: merge-only lexicon pass over han atoms.
function mergeLexicon(atoms: Atom[]): Atom[] {
  const lexicon = getLexicon();
  const out: Atom[] = [];
  for (let i = 0; i < atoms.length; ) {
    const atom = atoms[i];
    if (atom.kind !== "han") {
      out.push(atom);
      i += 1;
      continue;
    }
    const candidates = lexicon.get([...atom.text][0]);
    let best = 0;
    if (candidates) {
      let text = atom.text;
      for (let k = i + 1; k < atoms.length && atoms[k].kind === "han" && length(text) < lexiconMaxLength; k++) {
        text += atoms[k].text;
        if (candidates.includes(text)) best = k - i;
      }
    }
    if (best > 0) {
      out.push({ text: atoms.slice(i, i + best + 1).map((a) => a.text).join(""), kind: "han" });
      i += best + 1;
    } else {
      out.push(atom);
      i += 1;
    }
  }
  return out;
}

// Steps 3-4: build units (punctuation attachment, latin runs, digit + unit).
function buildUnits(atoms: Atom[]): ZhPhraseToken[] {
  const units: ZhPhraseToken[] = [];
  let pending = "";
  let pendingKind: "han" | "latin" | null = null;

  const flush = () => {
    if (!pending) return;
    units.push({ text: pending, wrap: true });
    pending = "";
    pendingKind = null;
  };

  for (const atom of atoms) {
    if (atom.kind === "ws") {
      flush();
      units.push({ text: atom.text, wrap: false });
      continue;
    }
    if (atom.kind === "han" || atom.kind === "latin") {
      // A new han word always starts a new unit; a latin word only breaks off
      // when the pending unit is a han phrase (glues "1,"+"450",
      // "verify:"+"r2" -- no whitespace was seen between them).
      if (pendingKind && (atom.kind === "han" || pendingKind === "han")) flush();
      pending += atom.text;
      pendingKind = atom.kind;
      continue;
    }
    if (atom.kind === "open") {
      if (pendingKind) flush();
      pending += atom.text;
      continue;
    }
    // Closing punctuation / symbols merge left so they never start a line.
    pending += atom.text;
  }
  flush();
  return units;
}

const isHanUnit = (unit: ZhPhraseToken | undefined): unit is ZhPhraseToken =>
  Boolean(unit && unit.wrap && HAS_CJK.test(unit.text));
const isSingleHan = (unit: ZhPhraseToken | undefined): unit is ZhPhraseToken =>
  Boolean(unit && unit.wrap && ONLY_CJK.test(unit.text) && length(unit.text) === 1);
const endsWithHan = (unit: ZhPhraseToken) => ONLY_CJK.test([...unit.text].at(-1) ?? "");

function mergeUnits(a: ZhPhraseToken, b: ZhPhraseToken): ZhPhraseToken {
  return { text: a.text + b.text, wrap: true };
}

// A lone han character that already carries closing punctuation ("shang4." at
// the end of a clause) still merges LEFT as an enclitic; it never merges right.
const TRAILING_NON_HAN = /[^\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]+$/;
const hanCore = (unit: ZhPhraseToken) => unit.text.replace(TRAILING_NON_HAN, "");
const isSingleHanWithTail = (unit: ZhPhraseToken | undefined): unit is ZhPhraseToken =>
  Boolean(unit && unit.wrap && ONLY_CJK.test(hanCore(unit)) && length(hanCore(unit)) === 1);

// Step 4b: "6 ci4" / "30/44 tiao2" / "z zhi2" -- a classifier or noun tail
// right after a latin/digit run, with at most one space between, joins that
// run so number and unit (or symbol and its noun) never part.
function glueLatinUnits(units: ZhPhraseToken[]): ZhPhraseToken[] {
  const out: ZhPhraseToken[] = [];
  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    const next = units[i + 1];
    const after = units[i + 2];
    if (unit.wrap && LATIN_TAIL.test(unit.text)) {
      const gap = next && next.text === " " ? next : null;
      const target = gap ? after : next;
      const merged = unit.text + (gap?.text ?? "") + (target?.text ?? "");
      // Numeric runs and their measure word are a semantic unit even when
      // trailing full-width punctuation nudges the estimated width just over
      // the ordinary soft cap (for example `1,228,582 个；`). capUnits peels
      // only that peripheral punctuation while keeping the number + unit
      // marker intact. Long URLs followed by a Chinese noun still fall back
      // to normal browser wrapping.
      const protectedNumericUnit = NUMERIC_UNIT_HEAD.test(unit.text);
      if (isSingleHanWithTail(target) && GLUE_AFTER_LATIN.has(hanCore(target)) && (fits(merged) || protectedNumericUnit)) {
        out.push({ text: unit.text + (gap?.text ?? "") + target.text, wrap: true });
        i += gap ? 2 : 1;
        continue;
      }
    }
    out.push(unit);
  }
  return out;
}

// Step 5a: enclitics merge LEFT.
function mergeEnclitics(units: ZhPhraseToken[]): ZhPhraseToken[] {
  const out: ZhPhraseToken[] = [];
  for (const unit of units) {
    const prev = out.at(-1);
    if (isSingleHanWithTail(unit) && prev && prev.wrap && endsWithHan(prev) && fits(prev.text + unit.text)) {
      const ch = hanCore(unit);
      const blocked = isSingleHan(prev) && PROCLITIC_ONLY.has(prev.text);
      if (!blocked && (ENCLITIC.has(ch) || NOUN_TAIL.has(ch) || PRONOUN.has(ch))) {
        out[out.length - 1] = mergeUnits(prev, unit);
        continue;
      }
    }
    out.push(unit);
  }
  return out;
}

// Step 5b: every other lone han character merges RIGHT (demonstratives,
// numerals, negation, adverbs, prepositions, single-character verbs). Runs of
// proclitics pair up left-to-right (zhe4|shi4|yi1|ge4 -> zhe4shi4 yi1ge4), never snowball.
function mergeProclitics(units: ZhPhraseToken[]): ZhPhraseToken[] {
  const out: ZhPhraseToken[] = [];
  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    const next = units[i + 1];
    if (isSingleHan(unit) && isHanUnit(next) && fits(unit.text + next.text)) {
      out.push(mergeUnits(unit, next));
      i += 1;
      continue;
    }
    out.push(unit);
  }
  return out;
}

const HAN_RUN = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]+/g;
const NUMBER_UNIT_CORE = /[+-]?\d[\d,./:%-]*\s?[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/;

function capUnits(units: ZhPhraseToken[]): ZhPhraseToken[] {
  return units.flatMap((unit) => {
    if (!unit.wrap || fits(unit.text)) return [unit];
    if (!HAS_CJK.test(unit.text)) return [{ text: unit.text, wrap: false }];

    // A long count such as `1,228,582 个；` exceeds the generic soft cap,
    // but reopening the number/unit boundary would recreate the exact bad
    // lineation this module exists to prevent. Keep the count + classifier
    // together and expose only its surrounding punctuation to kinsoku.
    const numberUnit = unit.text.match(NUMBER_UNIT_CORE);
    if (numberUnit && numberUnit.index != null) {
      const start = numberUnit.index;
      const end = start + numberUnit[0].length;
      return [
        ...(start > 0 ? [{ text: unit.text.slice(0, start), wrap: false }] : []),
        { text: numberUnit[0], wrap: true },
        ...(end < unit.text.length ? [{ text: unit.text.slice(end), wrap: false }] : []),
      ];
    }

    // Punctuation can make a short word exceed the cap -- for example
    // `\uFF08\u6709\u5F97\u6709\u5931\uFF09/`. Falling the whole unit back to
    // plain CJK text would reopen a break inside the four-character word.
    // Preserve every contiguous han core as an atomic marker and expose only
    // its surrounding punctuation to the browser's strict kinsoku algorithm.
    const parts: ZhPhraseToken[] = [];
    let cursor = 0;
    for (const match of unit.text.matchAll(HAN_RUN)) {
      const start = match.index ?? cursor;
      if (start > cursor) parts.push({ text: unit.text.slice(cursor, start), wrap: false });
      parts.push({ text: match[0], wrap: true });
      cursor = start + match[0].length;
    }
    if (cursor < unit.text.length) parts.push({ text: unit.text.slice(cursor), wrap: false });
    return parts;
  });
}

// Splits `text` into word-tier units. Returns null when no processing should
// happen (no han characters, or no Intl.Segmenter in this runtime) -- the
// caller then renders the original string unchanged.
export function zhPhraseTokens(text: string): ZhPhraseToken[] | null {
  if (!text || !HAS_CJK.test(text)) return null;
  const segmenter = getSegmenter();
  if (!segmenter) return null;
  const atoms: Atom[] = [];
  for (const seg of segmenter.segment(text)) atoms.push({ text: seg.segment, kind: classify(seg) });
  const units = mergeProclitics(mergeEnclitics(glueLatinUnits(buildUnits(mergeLexicon(atoms)))));
  return capUnits(units);
}

// Display tier: word-tier units grouped into clauses. Each group is meant to
// be laid out as one atomic phrase (wrapping inside it only when the line
// cannot hold it). Whitespace between latin words stays inside its group so a
// gloss like "RAG <term> : <clause>" keeps two groups.
export function zhClauseGroups(text: string): ZhPhraseToken[][] | null {
  const tokens = zhPhraseTokens(text);
  if (!tokens) return null;
  const groups: ZhPhraseToken[][] = [];
  let current: ZhPhraseToken[] = [];
  for (const token of tokens) {
    current.push(token);
    if (CLAUSE_END.test(token.text)) {
      groups.push(current);
      current = [];
    }
  }
  if (current.length) groups.push(current);
  return groups;
}

// Task D05 gate: cross-runtime segmentation parity.
//
// The zh word tier runs in Node (SSR) and in the visitor's browser (hydration
// and client renders). Intl.Segmenter is backed by ICU, whose dictionary can
// differ between runtimes, so "pure function" alone does not prove a stable
// tree. This script extracts every zh string in the source corpus, runs the
// exact same tokenizer in Node, Chromium and WebKit, and fails on any token
// sequence that differs. It also checks that every string recomposes exactly
// from its units (no character added or dropped). `npm run build` is not
// required; it needs only the Playwright browsers.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { chromium, webkit } from "@playwright/test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HAN = /[㐀-䶿一-鿿豈-﫿]/;

async function walk(dir, out) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else if (/\.(tsx?|json)$/u.test(entry.name)) out.push(full);
  }
}

// Corpus = every han-bearing string the source can render, extracted from the
// TypeScript AST (string literals, no-substitution templates, template
// literal spans, JSX text) plus a recursive walk of every JSON value.
// Whitespace is preserved exactly; nothing is trimmed or length-capped, so
// the measured scope is "every authored string", not a regex approximation.
// Strings assembled at render time from several children/interpolations are
// covered by the rendered-DOM gates (tests/e2e/zh-lineation.spec.ts), not here.
function collectFromTs(file, source, out) {
  const kind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind);
  const visit = (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (HAN.test(node.text)) out.add(node.text);
    } else if (ts.isTemplateExpression(node)) {
      if (HAN.test(node.head.text)) out.add(node.head.text);
      for (const span of node.templateSpans) if (HAN.test(span.literal.text)) out.add(span.literal.text);
    } else if (ts.isJsxText(node)) {
      if (HAN.test(node.text)) out.add(node.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}
function collectFromJson(value, out) {
  if (typeof value === "string") {
    if (HAN.test(value)) out.add(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectFromJson(item, out);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectFromJson(item, out);
  }
}
async function corpus() {
  const files = [];
  for (const dir of ["src", "public/case-studies"]) await walk(path.join(root, dir), files);
  const strings = new Set();
  for (const file of files) {
    const source = await readFile(file, "utf8");
    if (file.endsWith(".json")) {
      try { collectFromJson(JSON.parse(source), strings); } catch { /* not JSON */ }
    } else {
      collectFromTs(file, source, strings);
    }
  }
  return { strings: [...strings].sort(), files: files.length };
}

// Bundle zh-lexicon.ts + zh-phrase.ts into one browser script exposing
// window.__zhTokens(text). transpileModule keeps the code identical to what
// Next compiles apart from module syntax.
async function browserBundle() {
  const lexicon = await readFile(path.join(root, "src/lib/zh-lexicon.ts"), "utf8");
  const phrase = await readFile(path.join(root, "src/lib/zh-phrase.ts"), "utf8");
  const strip = (code) => code.replace(/^export\s+/gmu, "").replace(/^import[^\n]*\n/gmu, "");
  const js = (source) => ts.transpileModule(strip(source), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return `${js(lexicon)}\n${js(phrase)}\nwindow.__zhTokens = (text) => zhPhraseTokens(text);`;
}

async function nodeTokens(strings) {
  const { zhPhraseTokens } = await import(new URL("../src/lib/zh-phrase.ts", import.meta.url));
  return strings.map((text) => zhPhraseTokens(text));
}

async function browserTokens(engine, bundle, strings) {
  const browser = await engine.launch();
  const page = await browser.newPage();
  await page.setContent("<!doctype html><title>parity</title>");
  await page.addScriptTag({ content: bundle });
  const result = await page.evaluate((list) => list.map((text) => window.__zhTokens(text)), strings);
  const version = await page.evaluate(() => navigator.userAgent);
  await browser.close();
  return { result, version };
}

const { strings, files } = await corpus();
const bundle = await browserBundle();
const node = await nodeTokens(strings);
const recomposeFailures = strings.filter((text, index) => node[index] && node[index].map((token) => token.text).join("") !== text);
if (recomposeFailures.length) {
  console.error(`FAIL: ${recomposeFailures.length} strings do not recompose from their units`, recomposeFailures.slice(0, 5));
  process.exit(1);
}
console.log(`recomposition: every string rebuilds exactly from its units (${strings.filter((_, index) => node[index]).length} segmented, rest han-free after trimming or without segmenter)`);
const engines = [
  ["chromium", chromium],
  ["webkit", webkit],
];
let failures = 0;
console.log(`zh strings in corpus: ${strings.length} (TypeScript AST + JSON values over ${files} files); node ${process.version} ICU ${process.versions.icu}`);
for (const [name, engine] of engines) {
  const { result, version } = await browserTokens(engine, bundle, strings);
  let diffs = 0;
  result.forEach((tokens, index) => {
    const a = JSON.stringify(node[index]);
    const b = JSON.stringify(tokens);
    if (a !== b) {
      diffs += 1;
      if (diffs <= 10) console.log(`  DIFF [${name}] ${JSON.stringify(strings[index]).slice(0, 80)}\n    node:    ${a.slice(0, 200)}\n    browser: ${b.slice(0, 200)}`);
    }
  });
  console.log(`${name}: ${diffs} differing strings out of ${strings.length} (${version.slice(0, 80)})`);
  failures += diffs;
}
if (failures) {
  console.error(`FAIL: ${failures} token sequences differ between Node and a browser engine.`);
  process.exit(1);
}
console.log("PASS: identical word units in Node, Chromium and WebKit for every zh string in the corpus.");

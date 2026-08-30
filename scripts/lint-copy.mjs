import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import ts from "typescript";

const DEFAULT_FILES = [
  "src/lib/projects.ts",
  "src/lib/site-config.ts",
  "src/lib/i18n.ts",
];
const DEFAULT_DIRECTORIES = ["src/components"];

const chineseBlacklist = [
  "赋能",
  "闭环",
  "抓手",
  "深耕",
  "致力于",
  "打造",
  "旨在",
  "助力",
  "值得注意的是",
  "综上所述",
  "让我们",
  "未来将继续探索",
];
const englishBlacklist = [
  "delve",
  "seamless",
  "robust",
  "leverage",
  "showcase",
  "comprehensive",
  "meticulous",
  "pivotal",
  "empower",
  "cutting-edge",
  "spearheaded",
  "boasts",
  "testament",
  "Say goodbye to",
];

// G5 keeps approved technical names inside Chinese narrative while rejecting
// pasted bilingual microcopy such as "CLAIM REGISTRY 声明注册表". This list is
// intentionally phrase-based: removing a whole approved term cannot hide a
// different adjacent run of ordinary English prose.
const mixedScriptAllowlist = [
  "AI Agent",
  "Analytics Tandem",
  "Amazon Bedrock",
  "Apple Silicon",
  "Brazilian E-Commerce Public Dataset by Olist",
  "CC BY",
  "CC BY-NC-SA",
  "Claude Sonnet",
  "Credit Policy Desk",
  "EnterpriseRAG-Bench S1",
  "Exactly-Once Drills",
  "Frontier Forge",
  "GitHub repository",
  "Hugging Face",
  "LangGraph interrupt",
  "Lending Club",
  "LLM Agent",
  "Margin Control Tower",
  "Margin Synthetic",
  "McNemar p",
  "MCP server",
  "MySQL CDC",
  "native MTP",
  "npm run",
  "Olist Parquet",
  "Parquet SHA-256",
  "PDF worker",
  "Privacy Preflight",
  "production block",
  "QPS p95",
  "RAG Quality Lab",
  "Release Guardian",
  "ROC AUC",
  "stub RG_RERANK_MODE",
  "Tier A",
  "Tier B1",
  "Tier C",
  "TF-IDF LogReg",
  "Triage Router",
  "Web Crypto",
  "Web Worker",
  "bootstrap seed",
  "flink run",
  "git SHA",
  "int8 DistilBERT",
  "int8 ONNX",
  "macOS worker",
  "'NoneType' object has no attribute 'strip'",
  // Final fix wave: these two were failing this lint at HEAD already (found
  // while getting `npm run check:localization` green for an unrelated gate-
  // matrix task). Both are deliberate, tested design decisions, not
  // untranslated copy:
  // - "DUTY LOG" is EodLog.tsx's bilingual topstrip/loghead chrome
  //   ("值班日志 · DUTY LOG · ..."), explicitly called out as intentional by
  //   tests/e2e/eod-r2.spec.ts's own comment ("the zh-locale bilingual mono
  //   chrome ... is a deliberate design pairing ... not a violation") and
  //   asserted directly (`toContainText("DUTY LOG")` alongside "值班日志").
  // - "CHECKPOINT DURATION" is EodPage.tsx exhibit 04's eyebrow
  //   ("CHECKPOINT DURATION · ICEBERG 提交延迟"), explicitly ruled to stay
  //   English by task F11 (audit3 zh de-anglicization) per that same spec
  //   file's comment ("ICEBERG/RECONCILIATION/CHECKPOINT DURATION stay as
  //   embedded English terms per audit3") and asserted directly.
  // Translating either would fight a standing, tested ruling instead of
  // fixing a real leak -- confirmed by running the corresponding spec file
  // (tests/e2e/eod-r2.spec.ts) before allowlisting, not just by reading the
  // comments.
  "DUTY LOG", "CHECKPOINT DURATION",
];

// These are the literal mistranslations captured in the five G5 failure
// screenshots. They are interface vocabulary and product names, not Chinese
// narrative words, so encountering them in a source text node is always a
// regression.
const forcedEnglishUiFabric = new Map([
  ["概述", "OUTLINES"],
  ["伪造", "FORGE"],
  ["索赔", "CLAIM"],
]);

const findings = [];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function lineAllows(lines, lineIndex, term) {
  const candidates = [lines[lineIndex], lineIndex > 0 ? lines[lineIndex - 1] : ""];
  return candidates.some((line) => {
    const match = line.match(/copy-lint:\s*allow\s+([^\s]+)(?:\s+--\s+.+)?$/u);
    return match?.[1].toLocaleLowerCase("en-US") === term.toLocaleLowerCase("en-US");
  });
}

function addFinding(file, sourceFile, node, category, term, excerpt) {
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  const lines = sourceFile.getFullText().split(/\r?\n/u);
  if (lineAllows(lines, position.line, term)) return;
  findings.push({
    file,
    line: position.line + 1,
    column: position.character + 1,
    category,
    term,
    excerpt: excerpt.replace(/\s+/gu, " ").trim().slice(0, 160),
  });
}

function inspectCopy(file, sourceFile, node, value) {
  const inspectable = value.replace(/`[^`]*`/gu, "");

  for (const term of chineseBlacklist) {
    if (inspectable.includes(term)) addFinding(file, sourceFile, node, "blacklist", term, value);
  }
  if (/不仅是.{0,120}更是/u.test(inspectable)) {
    addFinding(file, sourceFile, node, "blacklist", "不仅是…更是…", value);
  }
  for (const term of englishBlacklist) {
    const pattern = new RegExp(`(?:^|[^A-Za-z])${escapeRegExp(term)}(?:$|[^A-Za-z])`, "iu");
    if (pattern.test(inspectable)) addFinding(file, sourceFile, node, "blacklist", term, value);
  }
  if (/\bit['’]s not just\b.{0,120}\bit['’]s\b/iu.test(inspectable)) {
    addFinding(file, sourceFile, node, "blacklist", "It's not just X, it's Y", value);
  }

  const spacingPattern = /[一-鿿][A-Za-z0-9]|[A-Za-z0-9][一-鿿]/gu;
  for (const match of inspectable.matchAll(spacingPattern)) {
    addFinding(file, sourceFile, node, "spacing", match[0], value);
  }

  const hardTitlePattern = /（[^）]{2,8}(?:演练|守门人|控制塔)）/gu;
  for (const match of inspectable.matchAll(hardTitlePattern)) {
    addFinding(file, sourceFile, node, "parenthesized-title", match[0].slice(1, -1), value);
  }

  if (/[\u3400-\u9fff]/u.test(inspectable)) {
    const withoutAllowedTerms = mixedScriptAllowlist.reduce(
      (text, term) => text.replaceAll(term, " "),
      inspectable,
    );
    const consecutiveLatinWords = /\b[A-Za-z][A-Za-z0-9+@._/-]*\s+[A-Za-z][A-Za-z0-9+@._/-]*\b/u.exec(withoutAllowedTerms);
    if (consecutiveLatinWords) {
      addFinding(file, sourceFile, node, "mixed-script-node", consecutiveLatinWords[0], value);
    }
  }

  for (const [translated, canonical] of forcedEnglishUiFabric) {
    if (inspectable.includes(translated)) {
      addFinding(file, sourceFile, node, "ui-fabric", `${canonical}→${translated}`, value);
    }
  }
}

function propertyName(node) {
  if (!ts.isPropertyAssignment(node.parent)) return "";
  const { name } = node.parent;
  return ts.isIdentifier(name) || ts.isStringLiteralLike(name) ? name.text : "";
}

function inspectGlossZh(file, sourceFile, node, value) {
  if (propertyName(node) !== "glossZh") return;
  const characterCount = [...value.trim()].length;
  if (characterCount > 20 || /\r|\n/u.test(value) || value !== value.trim()) {
    addFinding(file, sourceFile, node, "gloss-zh", `${characterCount} chars`, value);
  }
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectFiles(absolute);
    return /\.[cm]?[jt]sx?$/u.test(entry.name) ? [absolute] : [];
  }));
  return nested.flat();
}

async function lintFile(file) {
  const source = await readFile(file, "utf8");
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  function visit(node) {
    if (ts.isStringLiteralLike(node) || ts.isJsxText(node)) {
      inspectCopy(file, sourceFile, node, node.text);
      inspectGlossZh(file, sourceFile, node, node.text);
    }
    if (ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) inspectCopy(file, sourceFile, node, node.text);
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
}

const requestedFiles = process.argv.slice(2);
const files = requestedFiles.length > 0
  ? requestedFiles
  : [...DEFAULT_FILES, ...(await Promise.all(DEFAULT_DIRECTORIES.map(collectFiles))).flat()];

for (const file of files.sort()) await lintFile(file);

for (const finding of findings) {
  process.stdout.write(`${finding.file}:${finding.line}:${finding.column} [${finding.category}] ${finding.term} — ${finding.excerpt}\n`);
}

if (findings.length > 0) {
  process.stdout.write(`COPY_LINT_FAIL findings=${findings.length} files=${files.length}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`COPY_LINT_PASS files=${files.length}\n`);
}

// Task F4 [CLAUDE]: build public/fonts/display-serif-zh.woff2, a
// glyph-subset of Noto Serif SC Regular covering only the CJK codepoints
// the site actually renders (task F4 brief -- full CJK fonts run
// 5-20MB; subsetting is required to ship one at all).
//
// This script is a manual/dev-time build step (mirrors generate-credit-
// backtest-preview.mjs, generate-privacy-examples.mjs, etc.) -- it is not
// wired into `npm run build`, the same way the existing latin display
// serif's instancer+pyftsubset pipeline (see public/fonts/README.md) was
// run once and its .woff2 output committed. Re-run it whenever the corpus
// (src/**/*.{ts,tsx}, src/data/**/*.json, public/case-studies/**/*.json)
// gains zh copy with a codepoint not already covered -- `npm run
// verify:zh-glyphs` catches that condition.
//
// Requires `fonttools` + `brotli` on PATH (`pip install fonttools
// brotli`, or activate a venv that has them). Requires the source variable
// font locally -- it is deliberately not committed to this repo (25MB) and
// not auto-downloaded by this script, matching the existing latin-serif
// precedent ("Neither source TTF ... is committed to this repository").
//
//   curl -sL -o /tmp/NotoSerifSC-variable.ttf \
//     "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf"
//
// Usage:
//   node scripts/subset-zh-serif.mjs --source /tmp/NotoSerifSC-variable.ttf
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  CJK_RANGES,
  codepointsToText,
  extractRequiredCodepoints,
  formatUnicodeRange,
  isCjkCodepoint,
  readCorpusText,
  repositoryRoot,
  ZH_ADJACENT_ALLOWLIST,
} from "./lib/zh-glyph-corpus.mjs";

const OUTPUT_PATH = path.join(repositoryRoot, "public/fonts/display-serif-zh.woff2");
const FONT_WEIGHT = "400"; // Regular; matches the single-weight latin display serif precedent.

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8", ...options });
  if (result.error) {
    if (result.error.code === "ENOENT") {
      throw new Error(
        `${command} not found on PATH. Install fonttools + brotli (pip install fonttools brotli) ` +
          "or activate a venv/shell that has them before running this script.",
      );
    }
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited ${result.status}\n${result.stderr}`);
  }
  return result;
}

function parseArgs(argv) {
  const args = { source: process.env.ZH_SERIF_SOURCE_TTF };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--source") args.source = argv[i + 1];
  }
  return args;
}

async function main() {
  const { source } = parseArgs(process.argv.slice(2));
  if (!source) {
    throw new Error(
      "Missing --source <path-to-NotoSerifSC[wght].ttf> (or set ZH_SERIF_SOURCE_TTF). " +
        "See this script's header comment for the download command.",
    );
  }
  await stat(source); // throws ENOENT with a clear message if missing.

  console.log("[1/4] Scanning corpus for required codepoints...");
  const { files, text } = await readCorpusText();
  // Fix (task review finding 1): required codepoints are every non-ASCII
  // character sharing a string-literal/JSX-text segment with a CJK-range
  // character -- not just the CJK-range characters themselves. Hero.tsx's
  // "训练、上线、跑挂了再修——这条链路..." uses "——" (U+2014 doubled) as a
  // clause separator; a CJK-only scan silently dropped it, and the browser
  // fell back to a system font mid-sentence on the exact line task F4 was
  // created to fix. See extractRequiredCodepoints in zh-glyph-corpus.mjs
  // for the full reasoning (including why it's segment-scoped, not
  // line/file-scoped).
  const codepoints = new Set(Array.from(extractRequiredCodepoints(text)).filter((cp) => !ZH_ADJACENT_ALLOWLIST.has(cp)));
  if (codepoints.size === 0) throw new Error("No required codepoints found in the corpus -- refusing to build an empty subset.");
  const cjkCount = Array.from(codepoints).filter(isCjkCodepoint).length;
  console.log(`  scanned ${files.length} files, found ${codepoints.size} unique required codepoints (${cjkCount} CJK-range, ${codepoints.size - cjkCount} zh-adjacent punctuation/symbols)`);

  const workDir = await mkdtemp(path.join(tmpdir(), "zh-serif-subset-"));
  try {
    const glyphTextFile = path.join(workDir, "glyphs.txt");
    // Standard punctuation/ASCII the CJK text is always interleaved with
    // (spaces, halfwidth punctuation used inline, digits) so the subset
    // never drops a glyph pyftsubset would otherwise need for kerning/
    // composition context. This mirrors --unicodes rather than
    // --text-file's usual behaviour of trusting only literal characters
    // seen; both are supplied for defence in depth.
    await writeFile(glyphTextFile, codepointsToText(codepoints), "utf8");

    const staticInstance = path.join(workDir, "NotoSerifSC-Regular-static.ttf");
    console.log(`[2/4] Instancing wght=${FONT_WEIGHT} static instance...`);
    // Fix (task review finding 2): without --update-name-table, instancer
    // pins the wght axis but leaves the name table's nameID 1/2/4/6
    // (family/subfamily/full/postscript name) pointing at the variable
    // font's *default* named instance -- ExtraLight for NotoSerifSC[wght]
    // -- even though the OS/2 weight class and outlines are genuinely
    // Regular/400. --update-name-table makes fonttools regenerate those
    // name records from the actual pinned axis values.
    run("fonttools", ["varLib.instancer", "--update-name-table", "-o", staticInstance, source, `wght=${FONT_WEIGHT}`]);

    console.log("[3/4] Subsetting to the scanned glyph set...");
    // The physical subset only needs the exact codepoints in use (tight
    // --unicodes matching --text-file keeps the file small); the
    // @font-face `unicode-range` declared in globals.css is deliberately
    // broader -- the three whole CJK blocks below -- so the browser knows
    // to request this font for any CJK text, per the F4 brief. That gap
    // between "declared range" and "physically present glyphs" is exactly
    // what scripts/verify-zh-glyphs.mjs exists to keep safe: it fails the
    // build if any codepoint actually rendered on the site falls in the
    // declared range but outside this subset (which would show as tofu).
    const scannedRange = formatUnicodeRange(codepoints);
    run("pyftsubset", [
      staticInstance,
      `--output-file=${OUTPUT_PATH}`,
      "--flavor=woff2",
      "--layout-features=kern,liga,locl",
      `--text-file=${glyphTextFile}`,
      `--unicodes=${scannedRange}`,
    ]);

    const { size } = await stat(OUTPUT_PATH);
    // Fix (task review finding 1): the declared @font-face unicode-range
    // is the three whole CJK blocks (task F4 spec) PLUS every individual
    // zh-adjacent codepoint the scan found outside those blocks (em/en
    // dash, curly quotes, ellipsis, the comparison/arrow symbols zh copy
    // uses, ...). A block-only declaration is exactly what missed U+2014
    // the first time; listing the actual scanned extras, regenerated by
    // this script on every run, is what keeps that from recurring for the
    // next punctuation mark a future zh string picks.
    const cjkBlockRange = CJK_RANGES.map(([start, end]) => `U+${start.toString(16).toUpperCase()}-${end.toString(16).toUpperCase()}`).join(", ");
    const extraCodepoints = new Set(Array.from(codepoints).filter((cp) => !isCjkCodepoint(cp)));
    const declaredRange = extraCodepoints.size > 0 ? `${cjkBlockRange}, ${formatUnicodeRange(extraCodepoints)}` : cjkBlockRange;
    console.log(`[4/4] Wrote ${path.relative(repositoryRoot, OUTPUT_PATH)}: ${codepoints.size} glyphs, ${size} bytes (${(size / 1024).toFixed(1)}KB)`);
    console.log(`  physically subsetted codepoints: ${scannedRange}`);
    console.log(`  @font-face unicode-range (copy into globals.css): ${declaredRange}`);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

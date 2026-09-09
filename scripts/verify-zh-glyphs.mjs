// Task F4 [CLAUDE] coverage guard: re-scans the same corpus
// scripts/subset-zh-serif.mjs used to build public/fonts/display-serif-zh.woff2
// and asserts every *required* codepoint the site actually renders is
// present in the shipped subset's cmap -- not just CJK-range characters,
// but every non-ASCII character sharing a string/JSX-text segment with one
// (task review finding 1: a CJK-only check passed while the hero's "——"
// em dash silently fell back to a system font). The @font-face
// `unicode-range` declared in globals.css covers the three whole CJK
// blocks plus the same scanned extras (broader than the physical subset
// by design -- see subset-zh-serif.mjs), so this is the check that keeps
// that gap safe: if a new zh string lands with a codepoint outside the
// subset, the browser would ask this font for it and render .notdef tofu
// instead of falling back.
//
// Requires `fonttools` on PATH (pip install fonttools).
import { spawnSync } from "node:child_process";
import { stat } from "node:fs/promises";
import path from "node:path";
import { extractRequiredCodepoints, readCorpusText, repositoryRoot, ZH_ADJACENT_ALLOWLIST } from "./lib/zh-glyph-corpus.mjs";
import { HOME_ZH_FONT_BYTE_CEILING, HOME_ZH_FONT_PATH, readHomeHeroRequiredCodepoints } from "./lib/zh-home-font.mjs";

const FONT_PATH = path.join(repositoryRoot, "public/fonts/display-serif-zh.woff2");

function readCmapCodepoints(fontPath) {
  const result = spawnSync(
    "python3",
    [
      "-c",
      `
import sys
from fontTools.ttLib import TTFont
font = TTFont(sys.argv[1])
cmap = font.getBestCmap()
print(",".join(str(cp) for cp in cmap.keys()))
`,
      fontPath,
    ],
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
  if (result.error) {
    if (result.error.code === "ENOENT") throw new Error("python3 not found on PATH.");
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`Failed to read cmap from ${fontPath} (is fonttools installed? pip install fonttools):\n${result.stderr}`);
  }
  const stdout = result.stdout.trim();
  return new Set(stdout ? stdout.split(",").map(Number) : []);
}

async function main() {
  console.log("Scanning corpus for required codepoints (CJK + zh-adjacent punctuation/symbols)...");
  const { files, text } = await readCorpusText();
  const required = extractRequiredCodepoints(text);
  const used = new Set(Array.from(required).filter((cp) => !ZH_ADJACENT_ALLOWLIST.has(cp)));
  console.log(`  scanned ${files.length} files, ${used.size} unique required codepoints in use`);

  console.log(`Reading shipped subset cmap: ${path.relative(repositoryRoot, FONT_PATH)}`);
  const shipped = readCmapCodepoints(FONT_PATH);
  console.log(`  subset carries ${shipped.size} glyphs`);

  const missing = Array.from(used).filter((cp) => !shipped.has(cp)).sort((a, b) => a - b);
  if (missing.length > 0) {
    const sample = missing
      .slice(0, 40)
      .map((cp) => `U+${cp.toString(16).toUpperCase()} (${String.fromCodePoint(cp)})`)
      .join(", ");
    console.error(
      `FAIL: ${missing.length} codepoint(s) used on the site are missing from display-serif-zh.woff2:\n  ${sample}${missing.length > 40 ? ", ..." : ""}\n` +
        "Either re-run node scripts/subset-zh-serif.mjs --source <path-to-NotoSerifSC[wght].ttf>, " +
        "or, if a codepoint should intentionally fall back to a system font, add it to ZH_ADJACENT_ALLOWLIST in scripts/lib/zh-glyph-corpus.mjs with a comment explaining why.",
    );
    process.exit(1);
  }

  console.log("PASS: every required codepoint in use is present in the shipped subset.");

  const homeRequired = await readHomeHeroRequiredCodepoints();
  const homeShipped = readCmapCodepoints(HOME_ZH_FONT_PATH);
  const homeMissing = Array.from(homeRequired).filter((cp) => !homeShipped.has(cp)).sort((a, b) => a - b);
  if (homeMissing.length > 0) {
    const sample = homeMissing.map((cp) => `U+${cp.toString(16).toUpperCase()} (${String.fromCodePoint(cp)})`).join(", ");
    throw new Error(
      `Homepage Chinese narrative font is missing ${homeMissing.length} required codepoint(s): ${sample}. `
      + "Run npm run generate:zh-home-serif-subset.",
    );
  }
  const { size: homeSize } = await stat(HOME_ZH_FONT_PATH);
  if (homeSize > HOME_ZH_FONT_BYTE_CEILING) {
    throw new Error(`Homepage Chinese narrative font is ${homeSize} bytes; ceiling is ${HOME_ZH_FONT_BYTE_CEILING}.`);
  }
  console.log(
    `PASS: homepage zh critical subset carries ${homeRequired.size} required codepoints in ${homeSize} bytes (ceiling ${HOME_ZH_FONT_BYTE_CEILING}).`,
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

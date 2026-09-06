import { spawnSync } from "node:child_process";
import { copyFile, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { codepointsToText, formatUnicodeRange, repositoryRoot } from "./lib/zh-glyph-corpus.mjs";
import {
  HOME_ZH_FONT_BYTE_CEILING,
  HOME_ZH_FONT_PATH,
  HOME_ZH_FONT_SOURCE,
  readHomeHeroRequiredCodepoints,
} from "./lib/zh-home-font.mjs";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} exited ${result.status}\n${result.stderr}`);
}

async function main() {
  await stat(HOME_ZH_FONT_SOURCE);
  const required = await readHomeHeroRequiredCodepoints();
  const workDir = await mkdtemp(path.join(tmpdir(), "home-zh-serif-subset-"));
  try {
    const glyphTextFile = path.join(workDir, "glyphs.txt");
    const output = path.join(workDir, "display-serif-zh-home.woff2");
    await writeFile(glyphTextFile, codepointsToText(required), "utf8");
    run("pyftsubset", [
      HOME_ZH_FONT_SOURCE,
      `--output-file=${output}`,
      "--flavor=woff2",
      "--layout-features=kern,liga,locl",
      `--text-file=${glyphTextFile}`,
      `--unicodes=${formatUnicodeRange(required)}`,
    ]);
    const { size } = await stat(output);
    if (size > HOME_ZH_FONT_BYTE_CEILING) {
      throw new Error(`Homepage zh font is ${size} bytes; ceiling is ${HOME_ZH_FONT_BYTE_CEILING}.`);
    }
    await copyFile(output, HOME_ZH_FONT_PATH);
    console.log(
      `Wrote ${path.relative(repositoryRoot, HOME_ZH_FONT_PATH)}: ${required.size} codepoints, ${size} bytes; unicode-range ${formatUnicodeRange(required)}`,
    );
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

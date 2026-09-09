import { readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { extractRequiredCodepoints, repositoryRoot } from "./zh-glyph-corpus.mjs";

export const HOME_ZH_FONT_SOURCE = path.join(repositoryRoot, "public/fonts/display-serif-zh.woff2");
export const HOME_ZH_FONT_PATH = path.join(repositoryRoot, "public/fonts/display-serif-zh-home.woff2");
export const HOME_ZH_FONT_BYTE_CEILING = 12_000;

const HERO_SOURCE_PATH = path.join(repositoryRoot, "src/components/home/Hero.tsx");
const HERO_COPY_VARIABLE = "HERO_ZH_LINES";

export async function readHomeHeroRequiredCodepoints() {
  const source = await readFile(HERO_SOURCE_PATH, "utf8");
  const file = ts.createSourceFile(HERO_SOURCE_PATH, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let initializer = null;

  function visit(node) {
    if (
      ts.isVariableDeclaration(node)
      && ts.isIdentifier(node.name)
      && node.name.text === HERO_COPY_VARIABLE
      && node.initializer
    ) {
      initializer = node.initializer.getText(file);
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(file);
  if (!initializer) throw new Error(`Could not find ${HERO_COPY_VARIABLE} in ${path.relative(repositoryRoot, HERO_SOURCE_PATH)}.`);
  const required = extractRequiredCodepoints(initializer);
  if (required.size === 0) throw new Error(`${HERO_COPY_VARIABLE} contains no Chinese display glyphs.`);
  return required;
}

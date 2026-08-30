import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const lintScript = path.resolve("scripts/lint-copy.mjs");
const bannedEmpower = ["赋", "能"].join("");
const bannedHardTitle = ["精确一次", "演练"].join("");

const g5FailureFixtures = [
  {
    name: "translated product name",
    source: 'export const copy = "OUTLINES 概述";',
    category: "ui-fabric",
  },
  {
    name: "translated brand name",
    source: 'export const copy = "FORGE 伪造";',
    category: "ui-fabric",
  },
  {
    name: "translated claim label",
    source: 'export const copy = "CLAIM 索赔";',
    category: "ui-fabric",
  },
  {
    name: "inline bilingual micro-label",
    source: 'export const copy = "CLAIM REGISTRY 声明注册表";',
    category: "mixed-script-node",
  },
  {
    name: "overlong Chinese gloss",
    source: 'export const project = { glossZh: "这是一个超过二十个字符并且不再适合作为独立短行的中文项目说明" };',
    category: "gloss-zh",
  },
];

async function withFixture(source, run) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "portfolio-copy-lint-"));
  const fixture = path.join(directory, "fixture.tsx");
  await writeFile(fixture, source, "utf8");
  try {
    await run(fixture);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function lint(file) {
  return spawnSync(process.execPath, [lintScript, file], { cwd: path.resolve("."), encoding: "utf8" });
}

test("copy lint reports blacklist, spacing, and parenthesized hard-title violations", async () => {
  await withFixture(`
    export const copy = {
      zh: "${bannedEmpower} AI应用（${bannedHardTitle}）",
      en: "A robust workflow",
    };
  `, async (fixture) => {
    const result = lint(fixture);
    assert.equal(result.status, 1);
    assert.match(result.stdout, new RegExp(`blacklist.*${bannedEmpower}`, "u"));
    assert.match(result.stdout, /blacklist.*robust/iu);
    assert.match(result.stdout, /spacing.*AI应/u);
    assert.match(result.stdout, new RegExp(`parenthesized-title.*${bannedHardTitle}`, "u"));
  });
});

test("copy lint accepts compliant spacing and an explicit same-line exception", async () => {
  await withFixture(`
    export const copy = {
      zh: "AI 应用",
      en: "STL + robust z-score", // copy-lint: allow robust -- statistical method name
    };
  `, async (fixture) => {
    const result = lint(fixture);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /COPY_LINT_PASS/u);
  });
});

test("G5 flags all five failure-screenshot copy shapes", async () => {
  for (const fixture of g5FailureFixtures) {
    await withFixture(fixture.source, async (file) => {
      const result = lint(file);
      assert.equal(result.status, 1, `${fixture.name} was not flagged\n${result.stdout}\n${result.stderr}`);
      assert.match(result.stdout, new RegExp(`\\[${fixture.category}\\]`, "u"), fixture.name);
    });
  }
});

test("G5 accepts allowlisted technical terms and a short standalone gloss", async () => {
  await withFixture(`
    export const copy = {
      zh: "用 MySQL CDC 接入后进入 Flink。",
      glossZh: "浏览器本地脱敏工作台",
      fabric: "SOURCE / RECEIPTS · VERIFIED",
    };
  `, async (fixture) => {
    const result = lint(fixture);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /COPY_LINT_PASS/u);
  });
});

import { expect, test } from "@playwright/test";
import { collectZhLineBoxes, kinsokuFaults, wordSplits } from "./zhLineBoxes";

// Pure layout fixtures: no app server or product copy is involved.
test("opaque inline geometry distinguishes adjacent punctuation from a real line start", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.setContent(`<style>
    p { width: 240px; font: 16px/24px sans-serif; }
    code { font: 16px/24px monospace; }
  </style>
  <p class="adjacent">中文前文<br><code>localhost:3000</code>。运行包</p>
  <p class="real">中文前文<code>localhost:3000</code><br>。运行包</p>
  <p class="hidden">中文前文<br><code style="display:none">hidden</code>。运行包</p>
  <p class="positioned">中文前文<br><code style="position:absolute">overlay</code>。运行包</p>
  <p class="word">数<code>ignored</code><br>据</p>`);
  const report = await page.evaluate(collectZhLineBoxes);
  const box = (cls: string) => {
    const found = report.boxes.find((entry) => entry.cls === cls);
    expect(found, cls).toBeTruthy();
    return found!;
  };
  expect(kinsokuFaults(box("adjacent"))).toEqual([]);
  expect(box("adjacent").lines[1].text).toContain("\uFFFC。");
  for (const cls of ["real", "hidden", "positioned"]) {
    expect(kinsokuFaults(box(cls)), cls).toEqual(["closer starts line: 。运行包"]);
  }
  expect(wordSplits(box("word"), ["数据"])).toEqual([]);
});

test("wrapped opaque inline retains its final fragment before punctuation", async ({ page }) => {
  await page.setContent(`<style>
    p { width: 110px; font: 16px/24px monospace; }
    code { font: inherit; word-break: break-all; }
  </style><p class="wrapped">中文<br><code>abcdefghijklmn</code>。正文</p>`);
  const geometry = await page.locator("code").evaluate((node) => Array.from(node.getClientRects()).map((r) => ({ top: r.top, left: r.left })));
  expect(new Set(geometry.map((rect) => rect.top)).size).toBeGreaterThan(1);
  const report = await page.evaluate(collectZhLineBoxes);
  const box = report.boxes.find((entry) => entry.cls === "wrapped")!;
  expect(box).toBeTruthy();
  expect(kinsokuFaults(box)).toEqual([]);
  expect(box.lines.some((line) => line.text.includes("\uFFFC。"))).toBe(true);
});

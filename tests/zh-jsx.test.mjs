import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Fragment } from "react";
import { jsx, jsxs } from "../src/lib/zh-jsx/jsx-runtime.ts";
import { jsxDEV } from "../src/lib/zh-jsx/jsx-dev-runtime.ts";
import { stripZhUnits, zhGroup, zhWrapDisplay, zhWrapNode } from "../src/lib/zh-wrap.tsx";

// Task D05: the site-wide JSX runtime, rendered through React's server
// renderer exactly as Next's SSR does. (tests/ is outside the zh glyph corpus.)

const html = (node) => renderToStaticMarkup(node);

// A passing suite must be console-clean: React key/hydration warnings fail it.
const consoleErrors = [];
const originalError = console.error;
const NODE_NOISE = /NO_COLOR|trace-warnings|MODULE_TYPELESS_PACKAGE_JSON|"type": "module"/u;
console.error = (...args) => {
  const message = args.map(String).join(" ");
  if (!NODE_NOISE.test(message)) consoleErrors.push(message);
  originalError(...args);
};
test("React emits no warnings while rendering the fixtures", () => {
  // registered first, evaluated after the others complete (node:test runs in order)
  process.on("exit", () => { if (consoleErrors.length) { originalError("console.error during suite:", consoleErrors); process.exitCode = 1; } });
});
const text = (markup) => markup.replace(/<[^>]+>/g, "");
const units = (markup) => [...markup.matchAll(/<zh-seg class="zh-seg">([^<]*)<\/zh-seg>/g)].map((m) => m[1]);

test("host elements get one <zh-run> with <zh-seg> word units; en strings are byte-identical", () => {
  const zh = html(jsx("p", { children: "贵的模型，本就不该是默认选项。" }));
  assert.ok(zh.startsWith('<p><zh-run class="zh-run"><zh-seg class="zh-seg">'), zh);
  assert.equal((zh.match(/<zh-run class="zh-run">/g) || []).length, 1, zh);
  assert.equal(text(zh), "贵的模型，本就不该是默认选项。");
  assert.ok(!zh.includes("<span"), zh);
  assert.equal(html(jsx("p", { children: "Every number opens the same file." })), "<p>Every number opens the same file.</p>");
  assert.equal(html(jsxs("p", { children: ["Total ", 6, " runs"] })), "<p>Total 6 runs</p>");
});

test("adjacent string and number children are joined so number and unit stay one unit", () => {
  const markup = html(jsxs("p", { children: ["共 ", 6, " 次告警，其后 ", 3, " 项通过。"] }));
  assert.equal(text(markup), "共 6 次告警，其后 3 项通过。");
  const list = units(markup);
  assert.ok(list.includes("6 次") && list.includes("3 项"), list.join("|"));
});

test("nested child arrays are walked as sub-lists with exact characters and order", () => {
  const nested = html(jsx("p", { children: [["公开仓库先于本地检查点存在"]] }));
  assert.ok(units(nested).length >= 3, nested);
  assert.equal(text(nested), "公开仓库先于本地检查点存在");
  const mixed = html(jsxs("p", { children: ["共 ", [6, " 次。"]] }));
  assert.equal(text(mixed), "共 6 次。");
  assert.ok(units(mixed).includes("6 次。"), mixed);
  const keyed = html(jsx("ul", { children: [["甲", "乙"].map((label, index) => jsx("li", { children: label }, index))] }));
  assert.equal(text(keyed), "甲乙");
});

test("components and the Fragment factory pass through; Fragment children of a host are walked", () => {
  const Comp = ({ children }) => children;
  assert.equal(html(jsx(Comp, { children: "中文" })), "中文");
  assert.equal(html(jsx(Fragment, { children: "中文" })), "中文");
  const markup = html(jsx("li", { children: jsx(Fragment, { children: "公开仓库先于本地检查点存在" }) }));
  assert.ok(units(markup).length >= 3, markup);
  assert.equal(text(markup), "公开仓库先于本地检查点存在");
});

test("pre / code / data-zh-raw hosts carry zero word units, including already-built children and Fragments", () => {
  const preWithSpan = html(jsx("pre", { children: jsx("span", { children: "中文  原文" }) }));
  assert.equal(preWithSpan, "<pre><span>中文  原文</span></pre>");
  const preWithFragment = html(jsx("pre", { children: jsx(Fragment, { children: ["中文  ", "原文\n第二行"] }) }));
  assert.equal(preWithFragment, "<pre>中文  原文\n第二行</pre>");
  const raw = html(jsxs("p", { "data-zh-raw": "", children: [jsx("em", { children: "不叫脱敏。" }), "文字"] }));
  assert.ok(!raw.includes("zh-run") && !raw.includes("zh-seg"), raw);
  assert.equal(text(raw), "不叫脱敏。文字");
  const rawInline = jsx("span", { "data-zh-raw": "", children: ["（", jsx("code", { children: "llm_mode: stub" }, "literal-code"), "，零 API 调用）"] });
  const rawAfterExplicitWalk = html(jsx("p", { children: zhWrapNode(rawInline) }));
  assert.ok(!rawAfterExplicitWalk.includes("zh-run") && !rawAfterExplicitWalk.includes("zh-seg") && !rawAfterExplicitWalk.includes("zh-phrase"), rawAfterExplicitWalk);
  assert.equal(text(rawAfterExplicitWalk), "（llm_mode: stub，零 API 调用）");
  const code = html(jsx("code", { children: "verify:zh-glyphs 通过" }));
  assert.equal(code, "<code>verify:zh-glyphs 通过</code>");
  // stripZhUnits keeps element structure and characters exactly
  const stripped = html(stripZhUnits(jsx("span", { children: jsx("em", { children: "已复制" }) })));
  assert.equal(stripped, "<span><em>已复制</em></span>");
  // a raw host that starts from display-tier output (phrases + units) ends with zero markers
  const display = zhWrapDisplay(jsxs(Fragment, { children: ["贵的模型，", jsx("em", { children: zhGroup("本就不该是", "默认选项。") })] }));
  const rawDisplay = html(jsx("pre", { children: display }));
  assert.ok(!rawDisplay.includes("zh-run") && !rawDisplay.includes("zh-seg") && !rawDisplay.includes("zh-phrase"), rawDisplay);
  assert.equal(text(rawDisplay), "贵的模型，本就不该是默认选项。");
  assert.ok(rawDisplay.includes("<em>"), rawDisplay);
});

test("display tier absorbs runtime word units on inline branches and promotes them to phrases", () => {
  // The runtime creates <em> (with word units) before Exhibit's zhWrapDisplay sees the title.
  const em = jsx("em", { children: "不叫脱敏。" });
  assert.ok(html(em).includes("zh-seg"));
  const title = zhWrapDisplay(jsxs(Fragment, { children: ["文字上盖个黑块，", jsx("br", {}), em] }));
  const markup = html(jsx("h1", { children: title }));
  const emPart = markup.slice(markup.indexOf("<em>"));
  assert.ok(emPart.includes('<zh-phrase class="zh-phrase">'), markup);
  assert.equal(text(markup), "文字上盖个黑块，不叫脱敏。");
  // authored groups survive both the runtime and a second display pass
  const grouped = zhWrapDisplay(jsx("em", { children: zhGroup("本就不该是", "默认选项。") }));
  const groupedMarkup = html(jsx("h1", { children: grouped }));
  assert.equal((groupedMarkup.match(/<zh-phrase class="zh-phrase">/g) || []).length, 3, groupedMarkup);
  assert.equal(text(groupedMarkup), "本就不该是默认选项。");
});

test("a component-returned Fragment is covered at its text exit with zhWrapNode", () => {
  const LocaleText = ({ zh }) => jsx(Fragment, { children: zhWrapNode(zh) });
  const markup = html(jsx("p", { children: jsx(LocaleText, { zh: "接入与分类先行，四个证据工具并行执行。" }) }));
  assert.ok(units(markup).length >= 5, markup);
  assert.equal(text(markup), "接入与分类先行，四个证据工具并行执行。");
});

test("jsxDEV applies the same transform and word tier is idempotent", () => {
  const dev = html(jsxDEV("p", { children: "贵的模型，本就不该是默认选项。" }, undefined, false, undefined, undefined));
  assert.equal(dev, html(jsx("p", { children: "贵的模型，本就不该是默认选项。" })));
  const once = html(jsx("p", { children: zhWrapNode("贵的模型，本就不该是默认选项。") }));
  const twice = html(jsx("p", { children: zhWrapNode(zhWrapNode("贵的模型，本就不该是默认选项。")) }));
  assert.equal(once, twice);
});

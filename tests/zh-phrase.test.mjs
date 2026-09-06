import assert from "node:assert/strict";
import test from "node:test";
import { zhClauseGroups, zhPhraseTokens } from "../src/lib/zh-phrase.ts";

// Task D05: deterministic phrase segmentation for zh line breaking.
// (tests/ is outside the zh glyph corpus scan, so han literals are fine here.)

const units = (text) => zhPhraseTokens(text).map((token) => token.text);
const wrapped = (text) => zhPhraseTokens(text).filter((token) => token.wrap).map((token) => token.text);
const hasBreakInside = (text, word) => {
  const list = units(text);
  return !list.some((unit) => unit.includes(word));
};

test("non-CJK text passes through untouched (en byte identity)", () => {
  assert.equal(zhPhraseTokens("Every number opens the same file."), null);
  assert.equal(zhPhraseTokens(""), null);
  assert.equal(zhClauseGroups("verify:r2-sources"), null);
});

test("reassembly is exact for every input", () => {
  for (const text of [
    "我把整条链路做通，也把它会在哪里失效讲清楚。",
    "命中率从 66.35% 提到 99.05%（SFT，n=2000，配对 95% CI）。",
    "RAG 回归评测基线：知识库一动就重测",
    "压到 3 倍过载，网关用 429 把多余请求挡在门外，上游零 5xx；裸 vLLM 顶到 5 倍直接崩。",
  ]) {
    assert.equal(zhPhraseTokens(text).map((token) => token.text).join(""), text);
  }
});

test("suffix characters attach LEFT and prepositions never glue backwards: 命中率|从", () => {
  const spaced = units("命中率从 66.35% 提到 99.05%。");
  assert.ok(spaced.includes("命中率"), spaced.join("|"));
  assert.ok(!spaced.some((unit) => unit.startsWith("率") || unit.includes("率从")), spaced.join("|"));
  const dense = units("命中率从六成提到九成。");
  assert.ok(dense.includes("命中率"), dense.join("|"));
  assert.ok(dense.some((unit) => unit.startsWith("从")), dense.join("|"));

  const receipts = units("这个站上的每个说法，都能这样点开看它的来处。");
  assert.ok(!receipts.some((unit) => unit === "的每"), receipts.join("|"));
  assert.ok(receipts.some((unit) => unit.includes("每个")), receipts.join("|"));
});

test("lexicon compounds ICU splits into singles stay whole", () => {
  for (const [text, word] of [
    ["一道阈值，决定谁能拿到贷款。", "阈值"],
    ["文字上盖个黑块，不叫脱敏。", "脱敏"],
    ["浏览器本地的敏感信息脱敏工作台", "工作台"],
    ["每个数字，都能点开同一份文件。", "点开"],
    ["页面上的数字都能点开——点开就是生成它的命令。", "页面"],
    ["用哈希锁定回测记录", "哈希"],
    ["用哈希锁定回测记录", "回测"],
  ]) {
    assert.equal(hasBreakInside(text, word), false, `${word} split in ${units(text).join("|")}`);
  }
});

test("demonstratives, classifiers and single-character verbs never stand alone", () => {
  const list = units("这条链路出问题再修");
  for (const unit of list) assert.ok([...unit].length >= 2, list.join("|"));
  assert.ok(list.some((unit) => unit.startsWith("这条")), list.join("|"));
});

test("personal names stay whole", () => {
  for (const text of ["章向国的作品集", "由章向国搭建并实测", "章向国"]) {
    assert.ok(units(text).some((unit) => unit.includes("章向国")), `${text} -> ${units(text).join("|")}`);
  }
});

test("number and unit runs stay together", () => {
  // trailing punctuation on the unit character must not defeat the glue
  assert.ok(units("共 6 次。").includes("6 次。"), units("共 6 次。").join("|"));
  assert.ok(units("30/44 条。").includes("30/44 条。"), units("30/44 条。").join("|"));
  assert.ok(units("z 值，").includes("z 值，"), units("z 值，").join("|"));
  // the glue never drops or duplicates the tokens that follow it
  const tail = units("共 6 次告警，其后 3 项通过。");
  assert.equal(tail.join(""), "共 6 次告警，其后 3 项通过。");
  assert.ok(tail.includes("6 次") && tail.includes("告警，") && tail.includes("3 项") && tail.includes("通过。"), tail.join("|"));
  assert.ok(wrapped("六次注入的泄漏，六次告警。").includes("六次告警。") || wrapped("六次注入的泄漏，六次告警。").some((unit) => unit.startsWith("六次")));
  assert.ok(units("共 6 次告警").includes("6 次"), units("共 6 次告警").join("|"));
  assert.ok(units("从 1,450 条加到 20,000 条").includes("1,450 条"));
  assert.ok(units("z 值超过阈值").includes("z 值"), units("z 值超过阈值").join("|"));
  assert.ok(wrapped("66.35% 的任务成功率").some((unit) => unit.startsWith("66.35%")));
  // latin runs keep no interior break opportunity
  assert.ok(units("运行 verify:r2-sources 即可").includes("verify:r2-sources"));
});

test("long comma-formatted counts keep their classifier while punctuation stays peripheral", () => {
  for (const text of ["1,228,582 个；", "14,313 行）。"]) {
    const tokens = zhPhraseTokens(text);
    assert.equal(tokens.map((token) => token.text).join(""), text);
    const core = text.match(/[0-9][0-9,./:%-]*\s?[\p{Script=Han}]/u)?.[0];
    assert.ok(core);
    assert.ok(tokens.some((token) => token.wrap && token.text === core), tokens.map((token) => `${token.wrap}:${token.text}`).join("|"));
  }
});

test("the site replay verb stays intact in its contextual complement", () => {
  const tokens = zhPhraseTokens("毛利泄漏被重放进 106 周序列");
  assert.equal(tokens.map((token) => token.text).join(""), "毛利泄漏被重放进 106 周序列");
  assert.ok(tokens.some((token) => token.wrap && token.text.includes("重放")), tokens.map((token) => token.text).join("|"));
});

test("closing punctuation attaches left, opening punctuation attaches right", () => {
  const list = units("贵的模型，本就不该是默认选项。");
  assert.ok(list.some((unit) => unit.endsWith("模型，")), list.join("|"));
  assert.ok(list.at(-1).endsWith("。"));
  assert.ok(!list.some((unit) => /^[，。、；：！？）」』]/.test(unit)), list.join("|"));
  const brackets = units("配对（95% CI）与「留出集」");
  assert.ok(brackets.some((unit) => unit.startsWith("（")), brackets.join("|"));
  assert.ok(brackets.some((unit) => unit.includes("「留出集」")), brackets.join("|"));
  assert.ok(!brackets.some((unit) => unit.endsWith("（") || unit.endsWith("「")), brackets.join("|"));
});

test("latin units respect the wrap cap while han word cores never reopen", () => {
  for (const token of zhPhraseTokens("我把整条链路做通，也把它会在哪里失效讲清楚。")) {
    if (token.wrap) assert.ok([...token.text].length <= 6, token.text);
  }
  const long = zhPhraseTokens("见 https://example.com/a/very/long/path/to/evidence 页面");
  const url = long.find((token) => token.text.startsWith("https://"));
  assert.equal(url.wrap, false);

  // The surrounding parens + slash make the original unit wider than 6em,
  // but the actual four-character word must remain an atomic marker.
  const tradeoffText = "tradeoff（有得有失）/ tie（打平）";
  const tradeoff = zhPhraseTokens(tradeoffText);
  assert.equal(tradeoff.map((token) => token.text).join(""), tradeoffText);
  assert.ok(tradeoff.some((token) => token.wrap && token.text === "有得有失"), tradeoff.map((token) => `${token.wrap}:${token.text}`).join("|"));
  assert.ok(!tradeoff.some((token) => !token.wrap && token.text.includes("有得有失")), tradeoff.map((token) => `${token.wrap}:${token.text}`).join("|"));

  for (const punctuated of ["「有得有失」。", "——有得有失……"]) {
    const tokens = zhPhraseTokens(punctuated);
    assert.equal(tokens.map((token) => token.text).join(""), punctuated);
    assert.ok(tokens.some((token) => token.wrap && token.text === "有得有失"), tokens.map((token) => `${token.wrap}:${token.text}`).join("|"));
    // A punctuation run stays one plain-text slice; cap handling never peels
    // a double dash or ellipsis into isolated characters.
    assert.ok(!tokens.some((token) => !token.wrap && token.text === "—"), tokens.map((token) => token.text).join("|"));
    assert.ok(!tokens.some((token) => !token.wrap && token.text === "…"), tokens.map((token) => token.text).join("|"));
  }
});

test("clause groups split after clause marks only", () => {
  const groups = zhClauseGroups("我把整条链路做通，也把它会在哪里失效讲清楚。").map((group) => group.map((token) => token.text).join(""));
  assert.deepEqual(groups, ["我把整条链路做通，", "也把它会在哪里失效讲清楚。"]);
  const gloss = zhClauseGroups("RAG 回归评测基线：知识库一动就重测").map((group) => group.map((token) => token.text).join(""));
  assert.deepEqual(gloss, ["RAG 回归评测基线：", "知识库一动就重测"]);
  const dash = zhClauseGroups("页面上的数字都能点开——点开就是生成它的命令。").map((group) => group.map((token) => token.text).join(""));
  assert.deepEqual(dash, ["页面上的数字都能点开——", "点开就是生成它的命令。"]);
});

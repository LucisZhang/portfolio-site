import assert from "node:assert/strict";
import test from "node:test";
import { routableProjects } from "../src/lib/projects.ts";
import {
  circuitEntryForPath,
  circuitGroupIndexLabel,
  circuitGroups,
  circuitIndexAnchor,
  circuitOrder,
  circuitPosition,
  circuitStops,
} from "../src/lib/site-circuit.ts";

// The circuit's chain lock. src/lib/site-circuit.ts derives the crumb's
// family label, its in-family position, the prev/next chain and the index's
// global numbers from one list, `circuitOrder`; the expected chain below is
// written out by hand and deliberately NOT derived from `circuitGroups`, so
// this file catches a reordering that the production module's own invariant
// would happily accept (both lists edited to agree with each other).
const CHAIN = [
  { number: "01", slug: "frontier-forge", href: "/projects/frontier-forge", group: "build-run", position: { en: "BUILD & RUN · 01 / 02", zh: "构建与运行 · 01 / 02" } },
  { number: "02", slug: "exactly-once-drills", href: "/projects/exactly-once-drills", group: "build-run", position: { en: "BUILD & RUN · 02 / 02", zh: "构建与运行 · 02 / 02" } },
  { number: "03", slug: "release-guardian", href: "/projects/release-guardian", group: "guard-verify", position: { en: "GUARD & VERIFY · 01 / 04", zh: "把关与验证 · 01 / 04" } },
  { number: "04", slug: "privacy-preflight", href: "/projects/privacy-preflight", group: "guard-verify", position: { en: "GUARD & VERIFY · 02 / 04", zh: "把关与验证 · 02 / 04" } },
  { number: "05", slug: "rag-quality-lab", href: "/projects/rag-quality-lab", group: "guard-verify", position: { en: "GUARD & VERIFY · 03 / 04", zh: "把关与验证 · 03 / 04" } },
  { number: "06", slug: "ask-portfolio", href: "/projects/ask-portfolio", group: "guard-verify", position: { en: "GUARD & VERIFY · 04 / 04", zh: "把关与验证 · 04 / 04" } },
  { number: "07", slug: "triage-router", href: "/projects/triage-router", group: "measure-decide", position: { en: "MEASURE & DECIDE · 01 / 05", zh: "度量与决策 · 01 / 05" } },
  { number: "08", slug: "crossover-study", href: "/projects/crossover-study", group: "measure-decide", position: { en: "MEASURE & DECIDE · 02 / 05", zh: "度量与决策 · 02 / 05" } },
  { number: "09", slug: "margin-control-tower", href: "/projects/margin-control-tower", group: "measure-decide", position: { en: "MEASURE & DECIDE · 03 / 05", zh: "度量与决策 · 03 / 05" } },
  { number: "10", slug: "credit-policy-desk", href: "/projects/credit-policy-desk", group: "measure-decide", position: { en: "MEASURE & DECIDE · 04 / 05", zh: "度量与决策 · 04 / 05" } },
  { number: "11", slug: "groupconv-atlas", href: "/projects/groupconv-atlas", group: "measure-decide", position: { en: "MEASURE & DECIDE · 05 / 05", zh: "度量与决策 · 05 / 05" } },
];

// The one routable project that is not a circuit stop: the archive tier's
// compatibility route. Naming it here means a genuinely new project that
// nobody assigned to a family fails this gate instead of silently
// disappearing from all ten pages' index of work.
const OFF_CIRCUIT = ["analytics-tandem"];

test("the circuit chain order, numbering, and hrefs are exactly the pinned chain", () => {
  assert.deepEqual(circuitOrder, CHAIN.map((stop) => stop.slug));
  assert.deepEqual(circuitStops.map((stop) => stop.slug), CHAIN.map((stop) => stop.slug));
  assert.deepEqual(circuitStops.map((stop) => stop.number), CHAIN.map((stop) => stop.number));
  assert.deepEqual(circuitStops.map((stop) => stop.href), CHAIN.map((stop) => stop.href));
});

test("the chain is the families concatenated in display order", () => {
  // The single agreement the whole design rests on: family label, in-family
  // count, prev/next and index numbering all read off this equality.
  assert.deepEqual(circuitOrder, circuitGroups.flatMap((group) => group.members));
  // Which is the same as saying each family occupies one contiguous run of
  // global numbers, so the index's numbers climb monotonically down every
  // column instead of jumping between families.
  for (const group of circuitGroups) {
    const numbers = circuitStops.filter((stop) => stop.group.id === group.id).map((stop) => Number(stop.number));
    assert.deepEqual(numbers, numbers.map((_, index) => numbers[0] + index), `${group.id} is not a contiguous run`);
  }
});

test("every stop carries its family and position readout in both locales", () => {
  assert.deepEqual(circuitStops.map((stop) => stop.group.id), CHAIN.map((stop) => stop.group));
  assert.deepEqual(circuitStops.map((stop) => stop.indexInGroup), [1, 2, 1, 2, 3, 4, 1, 2, 3, 4, 5]);
  for (const [index, stop] of circuitStops.entries()) {
    assert.equal(circuitPosition(stop, "en"), CHAIN[index].position.en);
    assert.equal(circuitPosition(stop, "zh"), CHAIN[index].position.zh);
  }
});

test("navigation names stay project identities rather than editorial headlines", () => {
  const credit = circuitStops.find((stop) => stop.slug === "credit-policy-desk");
  // The zh editorial headline "分数不是策略。" now lives as a literal in
  // CreditPolicyFrontier.tsx, not in the title field, so the title is free
  // to be the product name (matching the navigation label) in both locales.
  assert.deepEqual(credit.navigationLabel, { en: "Credit Policy Desk", zh: "Credit Policy Desk" });
  assert.deepEqual(credit.project.title, { en: "Credit Policy Desk", zh: "Credit Policy Desk" });
});

test("the taxonomy holds three families with the expected labels, glosses, and members", () => {
  assert.deepEqual(circuitGroups.map((group) => group.id), ["build-run", "guard-verify", "measure-decide"]);
  assert.deepEqual(circuitGroups.map((group) => group.label.en), ["BUILD & RUN", "GUARD & VERIFY", "MEASURE & DECIDE"]);
  assert.deepEqual(circuitGroups.map((group) => group.label.zh), ["构建与运行", "把关与验证", "度量与决策"]);
  assert.deepEqual(circuitGroups.map((group) => group.members.length), [2, 4, 5]);
  assert.deepEqual(circuitGroups.map((group) => group.members), [
    ["frontier-forge", "exactly-once-drills"],
    ["release-guardian", "privacy-preflight", "rag-quality-lab", "ask-portfolio"],
    ["triage-router", "crossover-study", "margin-control-tower", "credit-policy-desk", "groupconv-atlas"],
  ]);
  assert.deepEqual(circuitGroups.map((group) => group.gloss.en), [
    "From standing it up to keeping it running under load and failure.",
    "When it should be stopped, fail rather than let it through.",
    "Use the results to set thresholds and policies, and to say when to refuse.",
  ]);
  assert.deepEqual(circuitGroups.map((group) => group.gloss.zh), [
    "从搭起来，到在负载与故障下继续跑。",
    "该拦下时，宁可失败，也不放行。",
    "用结果定阈值、定策略，也明确什么时候该否决。",
  ]);
});

test("every routable project is on the circuit except the named compatibility route", () => {
  const onCircuit = new Set(circuitOrder);
  const missing = routableProjects.map((project) => project.slug).filter((slug) => !onCircuit.has(slug));
  assert.deepEqual(missing, OFF_CIRCUIT);
});

test("the colophon anchors are derived from the family ids", () => {
  assert.deepEqual(circuitGroups.map((group) => circuitIndexAnchor(group.id)), [
    "index-build-run",
    "index-guard-verify",
    "index-measure-decide",
  ]);
});

test("the TRACK row label scopes the family to this page's index in both locales", () => {
  assert.deepEqual(circuitGroups.map((group) => circuitGroupIndexLabel(group, "en")), [
    "In this index: BUILD & RUN →",
    "In this index: GUARD & VERIFY →",
    "In this index: MEASURE & DECIDE →",
  ]);
  assert.deepEqual(circuitGroups.map((group) => circuitGroupIndexLabel(group, "zh")), [
    "本页索引：构建与运行 →",
    "本页索引：把关与验证 →",
    "本页索引：度量与决策 →",
  ]);
});

test("no circuit string uses a glyph outside the self-hosted zh serif subset", () => {
  // U+2193 and U+65CF are absent from public/fonts/display-serif-zh.woff2;
  // npm run verify:zh-glyphs is the full gate, this is the cheap local one.
  const strings = circuitGroups.flatMap((group) => [
    group.label.en, group.label.zh, group.gloss.en, group.gloss.zh,
    circuitGroupIndexLabel(group, "en"), circuitGroupIndexLabel(group, "zh"),
  ]);
  for (const value of strings) {
    assert.ok(!value.includes("↓"), `${value} uses a glyph the subset does not carry`);
    assert.ok(!value.includes("族"), `${value} uses a glyph the subset does not carry`);
  }
});

test("prev/next is circular over all ten stops and null off the circuit", () => {
  for (const [index, expected] of CHAIN.entries()) {
    const entry = circuitEntryForPath(expected.href);
    assert.ok(entry, `${expected.href} is not on the circuit`);
    assert.equal(entry.stop.slug, expected.slug);
    assert.equal(entry.prev.slug, CHAIN[(index - 1 + CHAIN.length) % CHAIN.length].slug);
    assert.equal(entry.next.slug, CHAIN[(index + 1) % CHAIN.length].slug);
  }
  // Prev/next crosses a family boundary at exactly three places: the two
  // seams between adjacent families and the wrap from the last stop to the
  // first. Anywhere else, NEXT stays inside the family named in the crumb.
  const crossings = CHAIN.filter((stop, index) => stop.group !== CHAIN[(index + 1) % CHAIN.length].group).map((stop) => stop.slug);
  assert.deepEqual(crossings, ["exactly-once-drills", "ask-portfolio", "groupconv-atlas"]);
  // The wrap, spelled out: 10 -> 01 and 01 -> 10.
  assert.equal(circuitEntryForPath("/projects/groupconv-atlas").next.slug, "frontier-forge");
  assert.equal(circuitEntryForPath("/projects/frontier-forge").prev.slug, "groupconv-atlas");
  // Trailing slashes normalize; off-circuit routes render no circuit at all.
  assert.equal(circuitEntryForPath("/projects/frontier-forge/").stop.slug, "frontier-forge");
  assert.equal(circuitEntryForPath("/"), null);
  assert.equal(circuitEntryForPath("/projects/analytics-tandem"), null);
  assert.equal(circuitEntryForPath(null), null);
});

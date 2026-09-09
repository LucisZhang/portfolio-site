import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { artifactPaths, artifactProjects } from "../src/lib/artifact-catalog.generated.mjs";
import { artifactContentHref, artifactViewerHref, resolveArtifactContext, safeArtifactPath } from "../src/lib/artifacts.ts";
import { artifactProvenance } from "../src/lib/artifact-provenance.ts";
import { hasUsefulSections, textSections } from "../src/lib/artifact-sections.ts";

const resolve = (values, locale) => resolveArtifactContext(new URLSearchParams(values), locale);
const rag = "/case-studies/rag-quality-lab/claim-registry.json";

test("every catalog file resolves its exact source, type, project, bilingual provenance, and stable return", async () => {
  const seen = new Set();
  for (const src of artifactPaths) {
    const directory = src.split("/")[2];
    for (const lang of ["en", "zh"]) {
      const context = resolve({ src, lang });
      assert.equal(context.source, src);
      assert.equal(context.project.slug, directory);
      assert.equal(context.project.title[lang], artifactProjects[directory].title[lang]);
      assert.equal(context.from, artifactProjects[directory].route);
      assert.equal(context.locale, lang);
      assert.ok(context.kind);
      assert.ok(artifactProvenance(src)[lang]);
      assert.deepEqual(resolveArtifactContext(new URL(context.canonicalHref, "https://portfolio.local").searchParams), context);
      seen.add(context.kind);
    }
    assert.equal(safeArtifactPath(src), src);
    assert.equal(resolve({ src: `${src}?download=1#details` }).source, src);
    assert.ok((await readFile(new URL(`../public${src}`, import.meta.url))).length);
  }
  assert.deepEqual([...seen].sort(), ["csv", "image", "json", "markdown", "mermaid", "pdf", "text"]);
  assert.equal(new Set(artifactPaths).size, artifactPaths.length);
});

test("all supported file types reject unlisted paths, traversal, separators, controls, schemes, and repeated src", () => {
  const representatives = [...new Map(artifactPaths.map((src) => [resolve({ src }).kind, src])).values()];
  for (const src of representatives) {
    const attacks = [
      `https://evil.test${src}`, `//evil.test${src}`, `javascript:${src}`, `data:text/plain,${src}`,
      `file://${src}`, `blob:https://portfolio.local${src}`, ` ${src}`, `${src}\0`, `${src}\n`,
      src.replace("/case-studies/", "/case-studies/../case-studies/"),
      src.replace("/case-studies/", "/case-studies/%2e%2e/case-studies/"),
      src.replace("/case-studies/", "/case-studies/%252e%252e/case-studies/"),
      src.replace("/case-studies/", "/case-studies%2f"),
      src.replace("/case-studies/", "/case-studies\\"),
      src.replace("/case-studies/", "/case-studies//"), `${src}/anything.json`,
      src.replace(/\.[^.]+$/, ".html"), src.replace(/\.[^.]+$/, ".not-listed.json"),
    ];
    for (const attack of attacks) {
      const context = resolve({ src: attack, from: "//evil.test", lang: "zh" });
      assert.equal(context.source, null, attack);
      assert.equal(context.project, null, attack);
      assert.equal(context.from, "/", attack);
      assert.equal(context.canonicalHref, "/artifact?lang=zh", attack);
    }
    assert.equal(resolve([["src", src], ["src", src]]).source, null);
    // Encoding the *outer* shareable parameter once is supported.
    assert.equal(resolveArtifactContext(new URLSearchParams(`src=${encodeURIComponent(src)}`)).source, src);
  }
  for (const src of ["/.env", "/api/assistant", "/case-studies/privacy-preflight/downloads/Privacy-Preflight-0.1.0-source.zip"]) {
    assert.equal(safeArtifactPath(src), null);
  }
});

test("from only retains the owning project or known home targets and canonicalizes old routes", () => {
  const froms = ["//evil.test", "/\\evil.test", "https://evil.test", "javascript:alert(1)", "/api/assistant", "/artifact", "/projects/frontier-forge", "/projects/../projects/rag-quality-lab", "/%70rojects/rag-quality-lab", "/projects/rag-quality-lab\n"];
  for (const from of froms) assert.equal(resolve({ src: rag, from }).from, "/projects/rag-quality-lab", from);
  assert.equal(resolve({ src: rag, from: "/projects/rag-quality-lab/?lang=zh&next=//evil.test#unknown" }).from, "/projects/rag-quality-lab");
  assert.equal(resolve([["src", rag], ["from", "/"], ["from", "/projects/frontier-forge"]]).from, "/projects/rag-quality-lab");
  for (const [from, target] of [["/", "/"], ["/#archive", "/#archive"], ["/ai", "/#systems"], ["/analytics", "/#archive"]]) {
    assert.equal(resolve({ src: rag, from }).from, target);
  }
  // A stale `from` can still carry a retired taxonomy URL or an older slug;
  // both canonicalize to the project's flat route rather than being discarded.
  for (const [directory, from, target] of [
    ["rag-quality-lab", "/ai/rag-quality-lab", "/projects/rag-quality-lab"],
    ["exactly-once-drills", "/engineering/exactly-once-drills", "/projects/exactly-once-drills"],
    ["exactly-once-drills", "/engineering/p1-reliability-lab", "/projects/exactly-once-drills"],
    ["credit-policy-desk", "/analytics/credit-policy-lab", "/projects/credit-policy-desk"],
    ["privacy-preflight", "/ai/privacy-preflight-mac", "/projects/privacy-preflight"],
  ]) {
    const src = artifactPaths.find((path) => path.split("/")[2] === directory);
    assert.equal(resolve({ src, from }).from, target);
  }
});

test("lang is exact, unambiguous, independent of from/src, and shareable in both languages", () => {
  for (const lang of ["ZH", "zh-CN", "zh ", "en-US", "javascript:zh", "", "%7ah", "zh&lang=en"]) {
    assert.equal(resolve({ src: rag, from: "/projects/rag-quality-lab?lang=zh", lang }, "zh").locale, "en");
  }
  assert.equal(resolve([["src", rag], ["lang", "zh"], ["lang", "en"]], "zh").locale, "en");
  assert.equal(resolve({ src: rag }, "zh").locale, "zh");
  assert.equal(resolve({ src: rag, lang: "en" }, "zh").locale, "en");
  assert.equal(resolve({ src: rag, lang: "zh" }, "en").locale, "zh");
  assert.equal(resolve({ src: rag, from: "/projects/rag-quality-lab?lang=zh", lang: "en" }).locale, "en");
});

test("all callers generate valid context; nested Markdown links remain allowlisted", () => {
  for (const from of ["/", "/projects/rag-quality-lab", "/artifact", "//evil.test"]) {
    const href = artifactViewerHref(rag, from);
    assert.equal(resolveArtifactContext(new URL(href, "https://portfolio.local").searchParams).source, rag);
    assert.ok(!href.includes("evil.test"));
  }
  const md = "/case-studies/exactly-once-drills/README.md";
  const linked = artifactContentHref("results/u6-local-mac/SUMMARY.md", md);
  assert.equal(new URLSearchParams(linked.split("?")[1]).get("src"), "/case-studies/exactly-once-drills/results/u6-local-mac/SUMMARY.md");
  assert.equal(artifactContentHref("#contents", md), "#contents");
  assert.equal(artifactContentHref("https://example.org/source", md), "https://example.org/source");
  for (const href of ["javascript:alert(1)", "data:text/html,hi", "file:///etc/passwd", "//evil.test/a.md", "../../.env", "/api/assistant", "/missing.json", "results/%2e%2e/missing.md"]) assert.equal(artifactContentHref(href, md), undefined, href);
});

test("section navigation preserves source offsets, repeated/Chinese headings, and code fences", () => {
  const text = "# First\r\n\r\ncontent\r\n\r\n## 重复\r\ntext\r\n\r\n## 重复\r\n```md\r\n# not a heading\r\n```\r\n\r\nLicense terms\r\n-------------\r\nexact text\r\n";
  const sections = textSections(text);
  assert.deepEqual(sections.map((entry) => entry.label), ["First", "重复", "重复", "License terms"]);
  assert.deepEqual(sections.map((entry) => entry.id), ["first-1", "重复-2", "重复-3", "license-terms-4"]);
  const reassembled = text.slice(0, sections[0].offset) + sections.map((section, index) => text.slice(section.offset, sections[index + 1]?.offset)).join("");
  assert.equal(reassembled, text);
  assert.equal(hasUsefulSections(text, sections), false);
  assert.equal(hasUsefulSections(text.repeat(20), sections), true);
  assert.equal(hasUsefulSections("long ".repeat(500), []), false);
});

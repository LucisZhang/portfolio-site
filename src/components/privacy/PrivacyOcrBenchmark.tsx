import { Check, CircleAlert } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import ocrBenchmark from "../../../public/case-studies/privacy-preflight/ocr-fixture-benchmark.json";

// Task 3.2 (spec §6.4 exhibit 03, restraint-first reflow): this used to be a
// client component that fetched the fixture benchmark after mount, which
// left the exhibit an empty "Loading..." shell with JavaScript disabled —
// violating spec §6.0's "01-04 have server-rendered static content" rule.
// The benchmark JSON is a small, trusted, build-time file (like
// src/components/forge/ForgePage.tsx importing release.json directly), so
// reading it as a plain static import removes the client boundary,
// removes the now-pointless loading/failed states, and makes the 19/19 ·
// 2 FP figures server-rendered from day one. The internal eyebrow/h3/intro
// paragraph this component used to own are cut too (spec §5 commandment
// "cut internal titles") — PrivacyPage.tsx's own exhibit-03 heading is now
// the page's single title for this content.
const report = ocrBenchmark as {
  summary: { fixtures: number; expectedCount: number; hitCount: number; falsePositiveCount: number; recall: number; precision: number };
  fixtures: { id: string; recall: number; precision: number; misses: string[]; falsePositives: string[] }[];
};

export default function PrivacyOcrBenchmark({ locale }: { locale: Locale }) {
  return (
    <div className="privacy-benchmark">
      <div className="privacy-benchmark-summary">
        <div><span>{locale === "en" ? "Fixture recall" : "夹具召回率"}</span><strong>{(report.summary.recall * 100).toFixed(1)}%</strong><small>{report.summary.hitCount} / {report.summary.expectedCount}</small></div>
        <div><span>{locale === "en" ? "Fixture precision" : "夹具精确率"}</span><strong>{(report.summary.precision * 100).toFixed(1)}%</strong><small>{report.summary.falsePositiveCount} {locale === "en" ? "false positives" : "个误报"}</small></div>
        <div><span>{locale === "en" ? "Fixtures" : "夹具"}</span><strong>{report.summary.fixtures}</strong><small>{locale === "en" ? "fixed cases" : "个固定案例"}</small></div>
      </div>
      <div className="privacy-benchmark-grid">
        {report.fixtures.map((fixture) => <article key={fixture.id}><div>{fixture.misses.length ? <CircleAlert aria-hidden="true" /> : <Check aria-hidden="true" />}<strong>{fixture.id}</strong></div><span>{Math.round(fixture.recall * 100)}% {locale === "en" ? "recall" : "召回率"} / {Math.round(fixture.precision * 100)}% {locale === "en" ? "precision" : "精确率"}</span><small>{fixture.misses.length ? `${locale === "en" ? "Missed" : "漏检"}: ${fixture.misses.join(", ")}` : (locale === "en" ? "No expected value missed" : "未漏检预期值")}</small></article>)}
      </div>
    </div>
  );
}

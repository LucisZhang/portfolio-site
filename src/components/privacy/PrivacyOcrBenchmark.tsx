"use client";

import { Check, CircleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";

interface Benchmark {
  scope: string;
  summary: { fixtures: number; expectedCount: number; hitCount: number; falsePositiveCount: number; recall: number; precision: number };
  fixtures: { id: string; recall: number; precision: number; misses: string[]; falsePositives: string[] }[];
}

export default function PrivacyOcrBenchmark({ locale }: { locale: Locale }) {
  const [report, setReport] = useState<Benchmark | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    void fetch("/case-studies/privacy-preflight/ocr-fixture-benchmark.json")
      .then((response) => {
        if (!response.ok) throw new Error("benchmark unavailable");
        return response.json() as Promise<Benchmark>;
      })
      .then(setReport)
      .catch(() => setFailed(true));
  }, []);

  if (failed) return <p className="privacy-error" role="status">{locale === "en" ? "The fixture benchmark could not be loaded." : "固定夹具基准暂时无法载入。"}</p>;
  if (!report) return <p className="muted" role="status">{locale === "en" ? "Loading the fixture benchmark..." : "正在载入固定夹具基准……"}</p>;

  return (
    <section className="privacy-benchmark" aria-labelledby="privacy-benchmark-title">
      <div>
        <p className="eyebrow">{locale === "en" ? "Fixed synthetic fixture benchmark" : "固定合成夹具基准"}</p>
        <h3 id="privacy-benchmark-title">{locale === "en" ? "OCR misses stay visible" : "文字识别漏检会被明确保留"}</h3>
        <p>{locale === "en" ? "This report runs the same seven generated fixtures with local English and Simplified Chinese language assets. It is not a general OCR accuracy claim." : "本报告仅使用同一组 7 个合成夹具和本地英文、简体中文语言包，不代表通用文字识别准确率。"}</p>
      </div>
      <div className="privacy-benchmark-summary">
        <div><span>{locale === "en" ? "Fixture recall" : "夹具召回率"}</span><strong>{(report.summary.recall * 100).toFixed(1)}%</strong><small>{report.summary.hitCount} / {report.summary.expectedCount}</small></div>
        <div><span>{locale === "en" ? "Fixture precision" : "夹具精确率"}</span><strong>{(report.summary.precision * 100).toFixed(1)}%</strong><small>{report.summary.falsePositiveCount} {locale === "en" ? "false positives" : "个误报"}</small></div>
        <div><span>{locale === "en" ? "Fixtures" : "夹具"}</span><strong>{report.summary.fixtures}</strong><small>{locale === "en" ? "fixed cases" : "个固定案例"}</small></div>
      </div>
      <div className="privacy-benchmark-grid">
        {report.fixtures.map((fixture) => <article key={fixture.id}><div>{fixture.misses.length ? <CircleAlert aria-hidden="true" /> : <Check aria-hidden="true" />}<strong>{fixture.id}</strong></div><span>{Math.round(fixture.recall * 100)}% recall / {Math.round(fixture.precision * 100)}% precision</span><small>{fixture.misses.length ? `${locale === "en" ? "Missed" : "漏检"}: ${fixture.misses.join(", ")}` : (locale === "en" ? "No expected value missed" : "未漏检预期值")}</small></article>)}
      </div>
    </section>
  );
}

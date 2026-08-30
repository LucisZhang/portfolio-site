"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { StatGrid } from "@/components/exhibition/StatGrid";
import { useI18n } from "@/lib/i18n";
import { getProject } from "@/lib/projects";
import {
  RAG_CHECKPOINT_COMMIT,
  RAG_DOCUMENTS,
  RAG_QUESTIONS,
  RAG_TESTS_PASSED,
  RAG_VERIFICATION_DATE,
} from "./ragData";
import {
  computeChecks,
  computeLineDiff,
  summarizeVerdict,
  type DiffRow,
  type RagCheck,
  type RagVerdict,
} from "./ragDiffEngine";
import {
  RAG_DIFF_BASELINE_TEXT,
  RAG_DIFF_DEFAULT_WORKING_TEXT,
  RAG_DIFF_DOCUMENT_LABEL,
  RAG_DIFF_START_LINE,
} from "./ragDiffFixture";

const ragProject = getProject("ai", "rag-quality-lab");

// Two-pane document diff, rendered as real <table> markup rather than a CSS
// grid of <div>s. This is not a cosmetic choice: the fixture document is
// deliberately real-looking English demo prose (it has to be, to give the
// diff something meaningful to compare), rendered unchanged on the zh
// locale too -- kept invariant across locales so the numeric-parity and
// shareable-content checks never see the demo document itself drift. A
// <table>'s cells join with a tab character in rendered innerText, which is
// exactly the existing "evidentiary data, not narrative prose" exemption
// scripts/check-localization.mjs already grants Frontier Forge's claim
// tables (see that file's PROSE_ALLOWLIST_PATTERNS `/\t/` rule) -- the same
// reasoning applies here: a line-numbered document excerpt is data, not a
// sentence this task is translating.
function DiffPane({ heading, rows, footnote, testId }: { heading: ReactNode; rows: DiffRow[]; footnote: ReactNode; testId: string }) {
  return (
    <div className="rag-pane" data-testid={testId}>
      <p className="rag-phead">{heading}</p>
      <table className="rag-dtable">
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.kind}-${row.no}-${index}`} className={`rag-dline rag-dline-${row.kind}`} data-line-kind={row.kind}>
              <td className="rag-dno">{row.no}</td>
              <td className="rag-dsig">{row.kind === "del" ? "−" : row.kind === "add" ? "+" : ""}</td>
              <td className="rag-dtx">{row.text.length > 0 ? row.text : " "}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="rag-panefoot">{footnote}</p>
    </div>
  );
}

function CheckRow({ check, locale }: { check: RagCheck; locale: "en" | "zh" }) {
  return (
    <div className={`rag-drow rag-drow-${check.status}`} data-testid="rag-check-row" data-check-id={check.id} data-check-status={check.status}>
      <span className="rag-drow-k"><code>{check.id}</code></span>
      <span className="rag-drow-d">{check.deltaLabel}</span>
      <span className="rag-drow-note">{locale === "en" ? check.note.en : check.note.zh}</span>
    </div>
  );
}

function FurtherRow({ further, locale }: { further: RagCheck[]; locale: "en" | "zh" }) {
  const bad = further.filter((check) => check.status === "bad").length;
  const good = further.filter((check) => check.status === "good").length;
  const deltaLabel = bad === 0 && good === 0
    ? "±0"
    : [good > 0 ? `+${good}` : null, bad > 0 ? `−${bad}` : null].filter(Boolean).join(" / ");
  const exampleIds = further.slice(0, 2).map((check) => check.id).join(", ");
  return (
    <div className="rag-drow rag-drow-tie" data-testid="rag-further-row" data-further-bad={bad} data-further-good={good}>
      <span className="rag-drow-k">{locale === "en" ? `${further.length} further checks` : `另外 ${further.length} 项检查`}</span>
      <span className="rag-drow-d">{deltaLabel}</span>
      <span className="rag-drow-note"><code>{exampleIds}</code>, {"…"}</span>
    </div>
  );
}

function verdictHeadline(verdict: RagVerdict, locale: "en" | "zh"): ReactNode {
  const word = <span className="rag-verdict-word" data-testid="rag-verdict-word" data-verdict={verdict.word}>{verdict.word}</span>;
  if (verdict.word === "REGRESSION") {
    return locale === "en"
      ? <><b>{verdict.degraded}/{verdict.total}</b> checks degraded {"—"} {word}.</>
      : <><b>{verdict.total} 项检查中有 {verdict.degraded} 项</b>退化 {"—"} {word}。</>;
  }
  if (verdict.word === "IMPROVEMENT") {
    return locale === "en"
      ? <><b>{verdict.improved}/{verdict.total}</b> checks improved {"—"} {word}.</>
      : <><b>{verdict.total} 项检查中有 {verdict.improved} 项</b>改善 {"—"} {word}。</>;
  }
  if (verdict.word === "TRADEOFF") {
    return locale === "en"
      ? <><b>{verdict.degraded}/{verdict.total}</b> degraded, <b>{verdict.improved}/{verdict.total}</b> improved {"—"} {word}.</>
      : <><b>{verdict.total} 项检查中有 {verdict.degraded} 项</b>退化、<b>{verdict.improved} 项</b>改善 {"—"} {word}。</>;
  }
  return locale === "en"
    ? <><b>0/{verdict.total}</b> checks changed {"—"} {word}.</>
    : <><b>{verdict.total} 项检查</b>全部持平 {"—"} {word}。</>;
}

// Exhibit 01 -- the drift lab itself. Spec §6.7's 3-exhibit light
// prescription mapped onto the diff/对照 genre (design authority
// output/design-genres/genre-rag-diff.html): the diff instrument, folding
// the hero headline, verified stat line, hunk header, two-pane diff, the
// deterministic-comparison verdict block, and the C3 honesty note into one
// continuous first screen -- matching the mock's own composition (no
// separate hero exhibit) and the Triage Router / Margin precedent of
// folding hero content into exhibit 01.
//
// RAG_DIFF_DEFAULT_WORKING_TEXT (the mock's own illustrative edit) seeds
// useState's initial value, so computeChecks/computeLineDiff run
// synchronously during render -- no useEffect, no fetch, nothing that
// requires JavaScript to produce the first paint. Disabling JavaScript
// leaves a real, populated diff and verdict on the page (only further
// edits stop working) -- see the "no-JS static baseline" coverage in
// tests/e2e/rag-r2.spec.ts.
export function RagDiffLab() {
  const { locale } = useI18n();
  const [workingText, setWorkingText] = useState(RAG_DIFF_DEFAULT_WORKING_TEXT);

  const checks = useMemo(() => computeChecks(RAG_DIFF_BASELINE_TEXT, workingText), [workingText]);
  const verdict = useMemo(() => summarizeVerdict(checks), [checks]);
  const { baseline, working } = useMemo(
    () => computeLineDiff(RAG_DIFF_BASELINE_TEXT, workingText, RAG_DIFF_START_LINE),
    [workingText],
  );
  const featured = checks.filter((check) => check.group === "featured");
  const further = checks.filter((check) => check.group === "further");

  const stats = [
    { value: RAG_DOCUMENTS.toLocaleString("en-US"), label: locale === "en" ? "S1 documents · verified" : "S1 文档 · 已验证" },
    { value: String(RAG_QUESTIONS), label: locale === "en" ? "questions · verified" : "问题 · 已验证" },
    { value: String(RAG_TESTS_PASSED), label: locale === "en" ? "passing tests · verified" : "通过测试 · 已验证" },
  ];

  return (
    <section id="exhibit-01" className="exhibit rag-diff" data-exhibit="01" data-bg="paper" aria-labelledby="exhibit-01-title" data-testid="rag-diff-instrument">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">01</span>
        <span className="exhibit-eyebrow">
          {locale === "en"
            ? `DETERMINISTIC VERIFIER · CHECKPOINT ${RAG_CHECKPOINT_COMMIT} · VERIFIED ${RAG_VERIFICATION_DATE}`
            : `确定性校验 · 检查点 ${RAG_CHECKPOINT_COMMIT} · 验证于 ${RAG_VERIFICATION_DATE}`}
        </span>
      </p>
      <h1 id="exhibit-01-title" className="exhibit-title">
        {locale === "en"
          ? <>Baseline against working copy.<br /><em>The diff is the verdict.</em></>
          : <>基线对照工作副本，<br /><em>差异即结论。</em></>}
      </h1>
      {locale === "zh" && ragProject ? <p className="cn-gloss" lang="zh">{ragProject.glossZh}</p> : null}
      <p className="exhibit-intro">
        {locale === "en"
          ? "Edit the controlled document below and the lab re-compares it against the pinned baseline deterministically — no model call, no judged score. Left is what checkpoint 6c887a1 indexed; right is your working copy; the panel underneath is the arithmetic between them."
          : "编辑下方这份受控文档，实验室会以确定性方式将它与锁定的基线重新比对——不调用模型，也没有裁判打分。左边是检查点 6c887a1 索引时的样子；右边是你的工作副本；下面的面板是两者之间的算术结果。"}
      </p>

      <StatGrid items={stats} />

      <div className="rag-hunk">
        <span className="rag-hunk-at">
          @@ {RAG_DIFF_DOCUMENT_LABEL} <span className="rag-hunk-aa">{locale === "en" ? "· demo edit, never enters the registry" : "· 演示编辑，不会进入注册表"}</span> @@
        </span>
        <span className="sectlabel">{locale === "en" ? "chunker + embedder pinned at checkpoint · comparison exact, replayable" : "分块器与向量化器锁定于该检查点 · 对比可精确复现"}</span>
      </div>

      <div className="rag-panes">
        <DiffPane
          testId="rag-pane-baseline"
          heading={<>{locale === "en" ? "Baseline — " : "基线 — "}<b>{locale === "en" ? `as indexed @ ${RAG_CHECKPOINT_COMMIT}` : `于 ${RAG_CHECKPOINT_COMMIT} 索引`}</b></>}
          rows={baseline}
          footnote={locale === "en"
            ? <>1 of {RAG_DOCUMENTS.toLocaleString("en-US")} documents · sealed under a fixed manifest hash</>
            : <>{RAG_DOCUMENTS.toLocaleString("en-US")} 份文档中的 1 份 · 已用固定清单哈希封存</>}
        />
        <DiffPane
          testId="rag-pane-working"
          heading={<>{locale === "en" ? "Working copy — " : "工作副本 — "}<b>{locale === "en" ? "your edit" : "你的编辑"}</b></>}
          rows={working}
          footnote={locale === "en"
            ? "re-indexed on edit · manifest hash recomputed, lineage recorded"
            : "编辑后重新索引 · 清单哈希已重算，谱系已记录"}
        />
      </div>

      <div className="rag-editor-row">
        <label className="rag-editor-label" htmlFor="rag-working-copy">
          {locale === "en" ? "Edit the working copy" : "编辑工作副本"}
        </label>
        <textarea
          id="rag-working-copy"
          className="rag-editor"
          value={workingText}
          onChange={(event) => setWorkingText(event.target.value)}
          spellCheck={false}
          maxLength={2000}
          rows={6}
          data-testid="rag-working-copy-editor"
        />
        <button
          type="button"
          className="rag-editor-reset"
          onClick={() => setWorkingText(RAG_DIFF_DEFAULT_WORKING_TEXT)}
          data-testid="rag-working-copy-reset"
        >
          {locale === "en" ? "Reset to the example edit" : "重置为示例编辑"}
        </button>
      </div>

      <div className="rag-stat-verdict">
        <div className="rag-diffstat">
          <div className="rag-dhead">
            <span className="sectlabel">{locale === "en" ? `Deterministic comparison — ${verdict.total} checks` : `确定性对比 — ${verdict.total} 项检查`}</span>
            <span className="rag-demo-tag" data-testid="rag-demo-deterministic">demo · deterministic</span>
          </div>
          <div className="rag-drows" data-testid="rag-check-list">
            {featured.map((check) => <CheckRow key={check.id} check={check} locale={locale} />)}
            <FurtherRow further={further} locale={locale} />
          </div>
        </div>
        <div>
          <p className="rag-diff-verdict">{verdictHeadline(verdict, locale)}</p>
          <p className="rag-vnote">
            {locale === "en"
              ? <>Verdict vocabulary: improvement / regression / tradeoff / tie. Every delta above is the <strong>runtime-deterministic output of this demo comparison</strong> — arithmetic on the edit above, never a claim about the project.</>
              : <>结论词表：improvement（改善）/ regression（退化）/ tradeoff（有得有失）/ tie（打平）。以上每个差值都是<strong>本次演示对比的运行时确定性输出</strong>——只是对上面这次编辑的算术结果，从来不是关于本项目的结论。</>}
          </p>
        </div>
      </div>

      <div className="rag-never" data-testid="rag-c3-honesty">
        <p className="rag-never-label">{locale === "en" ? "RESULTS NEVER PRODUCED" : "结果从未产出"}</p>
        <p>
          {locale === "en"
            ? "C3 closed without metrics: the evaluation timebox expired at dependency preflight, so no retrieval table, answer-quality score, judged result, or fallback metric was ever produced — and none appears here. Dataset integrity is what this page can prove, so that is all it shows."
            : "C3 在未产出任何指标的情况下关闭：评估时间盒在依赖预检阶段就已到期，因此从未产出检索表、答案质量分数、裁判结果或兜底指标——这里也不会出现它们。这个页面能证明的只有数据集完整性，所以它展示的也只有这些。"}
        </p>
      </div>
    </section>
  );
}

export default RagDiffLab;

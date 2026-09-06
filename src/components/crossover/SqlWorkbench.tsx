"use client";

import { useMemo, useState } from "react";
import ScrollRegion from "@/components/ScrollRegion";
import { ProjectReportSection } from "@/components/report/ProjectReport";
import { useI18n } from "@/lib/i18n";
import { zhGroup, zhWrapDisplay } from "@/lib/zh-wrap";
import { getProject } from "@/lib/projects";
import { ml32mNStar } from "./crossoverCurvesData";
import {
  catalogItemCount,
  icebergPlate,
  resultForQuery,
  workbenchQueries,
  workbenchResultHref,
  type WorkbenchResult,
  type WorkbenchResultRow,
} from "./crossoverWorkbenchData";

// Task L6 [CLAUDE]: the notebook/workbench genre's cached-state first
// screen (spec §6.6, plan Task 5.1, user-approved mock output/design-
// legacy/legacy-4-crossover-study.html). The seven-element cap: preloaded
// query, editor chrome, RUN + telemetry line, the results table, the
// six-item curated query index, and the Iceberg nameplate <details>. The
// live DuckDB engine (idle prefetch, brotli transport, cached->live flip,
// URL-hash sharing) is out of scope -- R6 (spec §6.6's first paragraph) --
// so RUN only ever shows "ENGINE ARRIVES WITH R6" and the telemetry line
// always reads the committed cached values, never "--".
//
// Every one of the six curated queries and its result is a static build-
// time import (crossoverWorkbenchData.ts); clicking a different query in
// the index only swaps already-loaded React state, so no request of any
// kind (let alone a duckdb/parquet one) ever fires from this component.

// The site's UI-fabric convention (spec §2.6, Finding.tsx's own comment):
// instrument chrome -- SQL syntax, telemetry, table headers, the RUN
// affordance, the Iceberg nameplate's field labels -- stays English-only
// in both locales, the same treatment RagDiffLab.tsx's two-pane diff and
// Forge's claim tables already carry. Only the narrative copy (exhibit
// title/intro, the data-layering disclosure, and each curated query's
// index blurb) is independently translated.
//
// The RUN button's `data-asset`/`data-bytes` below must stay LITERAL
// string attributes (not JSX-expression variables): scripts/verify-heavy-
// assets.mjs's source scan requires the literal tag text itself to carry
// `data-asset="..."`/`data-bytes="N"` (or the `{"..."}`/`{N}` expression-
// literal forms it also accepts) so it can check the advertised byte count
// against heavy-assets.json without executing any code -- see
// LocalInference.tsx's identical precedent. 39,362,651 is duckdb-mvp.wasm's
// registered, disk-verified size (heavy-assets.json), shared with Margin/
// Credit's own click-gated DuckDB verify -- this page never fetches it
// (RUN only shows "ENGINE ARRIVES WITH R6"), so the advertisement is
// purely the ledger-checked "what R6 will cost" honesty label.

const SQL_KEYWORD_PATTERN = /\b(WITH|SELECT|DISTINCT|AS|FROM|JOIN|ON|WHERE|GROUP BY|ORDER BY|LIMIT|UNION ALL|OVER|PARTITION BY|COALESCE|NULLIF|TRIM|ROUND|COUNT|AND|OR|NOT|IS|TRUE|FALSE|DESC|ASC|USING)\b/g;

function highlightSql(sql: string) {
  return sql.split(SQL_KEYWORD_PATTERN).map((part, index) => (index % 2 === 1 ? <b key={index}>{part}</b> : <span key={index}>{part}</span>));
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) return value.toLocaleString("en-US");
  return Math.abs(value) < 1 ? value.toFixed(4) : value.toFixed(2);
}

function formatCell(value: WorkbenchResultRow[string]): string {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return formatNumber(value);
  return value;
}

function isNumericColumn(rows: WorkbenchResultRow[], column: string): boolean {
  return rows.every((row) => typeof row[column] === "number");
}

function formatTelemetry(result: WorkbenchResult): string {
  const date = result.builtAt.slice(0, 10);
  return `${result.telemetry.rowsScanned.toLocaleString("en-US")} rows scanned · ${result.telemetry.elapsedMs.toFixed(2)} ms · cached · build ${date}`;
}

function formatBytesGb(bytes: number): string {
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

// Query-02's index blurb quotes the top-3 catalog categories -- derived
// live from the committed result + the data-scale catalog size, never a
// literal number in this file.
function useQuery02Blurb() {
  const categoryResult = resultForQuery("category-distribution");
  const catalogLabel = `${(catalogItemCount() / 1_000_000).toFixed(2)}M`;
  const top3 = categoryResult.rows.slice(0, 3) as { category: string; catalog_pct: number }[];
  const listEn = top3.map((row) => `${row.category} ${formatNumber(row.catalog_pct)}%`).join(", ");
  const listZh = top3.map((row) => `${row.category} ${formatNumber(row.catalog_pct)}%`).join("、");
  return {
    en: `Which product categories dominate the ${catalogLabel}-item catalog? ${listEn}.`,
    zh: `这份 ${catalogLabel} 件商品的目录里，哪些品类最集中？${listZh}。`,
  };
}

const INDEX_BLURBS: Record<string, { en: string; zh: string }> = {
  "data-scale": {
    en: "How large is the current contract-checked silver data plane? The counts come from the full local DuckDB silver mirrors, not display constants.",
    zh: "契约校验过的 silver 数据面到底有多大？这些计数直接来自本地全量 DuckDB 的 silver 镜像，不是写死的展示常量。",
  },
  "cross-purchase": {
    en: "Which leading category pairs share the most verified purchasers? The query scans the interaction-item join and deduplicates each user-category edge first.",
    zh: "哪些头部品类组合共享的核实购买者最多？查询会扫描交互与商品的关联表，先去重每条用户-品类边。",
  },
  "amazon-null-test": {
    en: "Does any personalized Amazon arm beat recent popularity as user history grows? These paired TEST deltas retain their bootstrap intervals across all five frozen depth buckets.",
    zh: "随着用户历史变长，有没有哪个个性化 Amazon 模型能超过近期热门榜？这些配对的 TEST 差值，在全部五个冻结深度分段上都保留了自举置信区间。",
  },
  "ml32m-counterexample": {
    en: `Does the null survive in the lower-churn ML-32M contrast regime? The confirmatory deep buckets show the declared n*=${ml32mNStar} NDCG@10 counterexample.`,
    zh: `换到换血率更低的 ML-32M 对照数据集，这个 null 结果还成立吗？验证性的深历史分段显示出预先声明的 n*=${ml32mNStar} NDCG@10 反例。`,
  },
  "counterexample-caveat": {
    en: "What prevents the ML-32M crossover from becoming a universal win claim? Depth-0 users lose sharply, and the independent Recall@20 guard does not confirm the winning buckets.",
    zh: "是什么阻止 ML-32M 的交叉点被说成一次普遍性的胜利？零历史用户的表现大幅下滑，独立的 Recall@20 稳健性检查也没能确认那些获胜分段。",
  },
};

// queries.json's own `title` field is English-only real data (like the
// SQL/comment content). Unlike that raw SQL syntax, these titles function
// as narrative section labels (rendered in the col-head and the query
// index), so they get an independent zh rendering here rather than the
// "stays English in both locales" UI-fabric treatment -- also avoids a
// false-positive untranslated-prose leak (e.g. "Establish the data scale"
// alone is 4 plain English words with no digit/CJK to reset the scan).
const TITLE_ZH: Record<string, string> = {
  "data-scale": "01 · 认清数据规模",
  "category-distribution": "02 · 画出目录集中度",
  "cross-purchase": "03 · 追踪跨品类购买路径",
  "amazon-null-test": "04 · 检验个性化交叉点",
  "ml32m-counterexample": "05 · 找到对照数据集的交叉点",
  "counterexample-caveat": "06 · 压力测试这个反例",
};

const crossoverProject = getProject("engineering", "crossover-study");

// The Iceberg snapshotId in iceberg-plate.json is a real 64-bit snapshot
// ID (884031112460958161) that exceeds Number.MAX_SAFE_INTEGER -- parsing
// it as a JS `number` (the normal JSON-import path) silently rounds it to
// the nearest representable double. The route's own Server Component
// (src/app/engineering/crossover-study/page.tsx) reads the committed
// file's raw text and regex-extracts the digit string before any
// JSON.parse ever touches it, and passes it down as a plain string prop
// -- the only way to render the exact committed value.
export function SqlWorkbench({ icebergSnapshotId }: { icebergSnapshotId: string }) {
  const { locale } = useI18n();
  const [activeId, setActiveId] = useState(workbenchQueries[0].id);
  const [runAttempted, setRunAttempted] = useState(false);
  const query02Blurb = useQuery02Blurb();

  const activeQuery = useMemo(() => workbenchQueries.find((item) => item.id === activeId) ?? workbenchQueries[0], [activeId]);
  const activeResult = useMemo(() => resultForQuery(activeQuery.id), [activeQuery.id]);
  // Only the comment's first line (the research question, per the mock's
  // "注释首行=研究问题" requirement) renders inside the code block itself;
  // the second ("why it matters") line surfaces in the curated query index
  // instead, where it is independently translated rather than kept
  // English-only alongside real SQL syntax.
  const researchQuestion = activeQuery.comment.split("\n")[0];
  const columns = Object.keys(activeResult.rows[0] ?? {});

  function selectQuery(id: string) {
    setActiveId(id);
    setRunAttempted(false);
  }

  return (
    <section id="exhibit-01" className="exhibit crossover-workbench" data-exhibit="01" data-bg="paper" aria-labelledby="exhibit-01-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">01</span>
        <span className="exhibit-eyebrow">SQL WORKBENCH · CACHED STATE · BUILD {activeResult.builtAt.slice(0, 10)}</span>
      </p>
      <h1 id="exhibit-01-title" className="exhibit-title">
        {locale === "en" ? <>Run the argument, <em>query by query.</em></> : zhWrapDisplay(<>跑一遍论证过程，<em>{zhGroup("一条查询", "接一条查询。")}</em></>)}
      </h1>
      {locale === "zh" && crossoverProject ? <p className="cn-gloss" lang="zh">{zhWrapDisplay(crossoverProject.glossZh)}</p> : null}
      <ProjectReportSection concept="architecture" layout="instrument" title={locale === "en" ? "SQL workbench" : "SQL 工作台"}>
        <p className="exhibit-intro">
          {locale === "en"
            ? "Six curated queries walk from raw scale to the study's null result and its one honest counterexample. Every result on this screen is cached from the full local build — the workbench replays it exactly, and says so."
            : "六条精选查询，从原始数据规模一路走到这项研究的 null 结果，以及它唯一如实交代的反例。这一屏上的每个结果，都是本地全量构建缓存下来的——工作台原样回放，并如实标注。"}
        </p>
        <p className="crossover-layering-note">
          {locale === "en"
            ? "This workbench renders pre-aggregated, cached views of the committed Iceberg snapshot; the full Spark batch results appear in the analysis exhibit below."
            : "工作台展示的是已提交 Iceberg 快照上的预聚合缓存视图；全量 Spark 批处理结果见下方的分析展区。"}
        </p>

        <div className="crossover-bench">
          <div className="crossover-bench-main" data-testid="crossover-workbench-main">
            <div className="crossover-col-head">
              <span className="crossover-eyebrow-small">{locale === "en" ? activeQuery.title : TITLE_ZH[activeQuery.id]}</span>
              <span className="crossover-eyebrow-small">CACHED</span>
            </div>

            <ScrollRegion className="crossover-sql-scroll" label={{ en: "SQL query", zh: "SQL 查询" }}>
              <pre className="crossover-sql" data-testid="crossover-sql">
                <span className="crossover-sql-comment">{`-- ${researchQuestion}`}</span>
                {"\n\n"}
                {highlightSql(activeQuery.sql)}
              </pre>
            </ScrollRegion>

            <p className="crossover-runline">
              <button
                type="button"
                className="crossover-run-button"
                data-asset="/duckdb/duckdb-mvp.wasm"
                data-bytes="39362651"
                aria-label={locale === "en" ? "Run (Cmd+Enter) — the live engine is not connected until R6" : "运行（Cmd+Enter）——在线引擎将在 R6 阶段接入"}
                onClick={() => setRunAttempted(true)}
              >
                RUN ↵
              </button>
              <span className="crossover-telemetry" data-testid="crossover-telemetry">{formatTelemetry(activeResult)}</span>
            </p>
            {runAttempted ? <p className="crossover-engine-note" data-testid="crossover-engine-note">{locale === "en" ? "ENGINE ARRIVES WITH R6" : "引擎将在 R6 阶段接入"}</p> : null}

            <ScrollRegion className="crossover-table-scroll" label={{ en: "Results table", zh: "结果表" }}>
              <table className="crossover-results-table" data-testid="crossover-results-table">
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th key={column} className={isNumericColumn(activeResult.rows, column) ? "r" : undefined}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeResult.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {columns.map((column) => (
                        <td key={column} data-label={column} className={typeof row[column] === "number" ? "r" : undefined}>{formatCell(row[column])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollRegion>
            <div className="crossover-table-foot">
              <span>{activeResult.rows.length} rows</span>
              <a href={workbenchResultHref(activeQuery.id)} download>{locale === "en" ? "Download JSON" : "下载 JSON"}</a>
            </div>

            <details className="crossover-iceberg-plate" data-testid="crossover-iceberg-plate">
              <summary>ICEBERG</summary>
              <dl>
                <div><dt>snapshotId</dt><dd>{icebergSnapshotId}</dd></div>
                <div><dt>committedAt</dt><dd>{icebergPlate.committedAt.slice(0, 10)}</dd></div>
                <div><dt>schema</dt><dd>v{icebergPlate.schemaVersion}</dd></div>
                <div><dt>rowCount</dt><dd>{icebergPlate.rowCount.toLocaleString("en-US")}</dd></div>
                <div><dt>files</dt><dd>{icebergPlate.files}</dd></div>
                <div><dt>bytes</dt><dd>{formatBytesGb(icebergPlate.bytes)}</dd></div>
              </dl>
            </details>
          </div>

          <div className="crossover-bench-index">
            <div className="crossover-col-head">
              <span className="crossover-eyebrow-small">{locale === "en" ? "The six queries" : "六条查询"}</span>
              <span className="crossover-eyebrow-small">{locale === "en" ? "a narrative index" : "按论证顺序排列"}</span>
            </div>
            <ol className="crossover-query-index">
              {workbenchQueries.map((item) => {
                const blurb = item.id === "category-distribution" ? query02Blurb : INDEX_BLURBS[item.id];
                return (
                  <li key={item.id} className={item.id === activeId ? "active" : undefined}>
                    <button type="button" onClick={() => selectQuery(item.id)} aria-current={item.id === activeId ? "true" : undefined}>
                      <span className="crossover-query-title">{locale === "en" ? item.title : TITLE_ZH[item.id]}</span>
                      <span className="crossover-query-blurb">{locale === "en" ? blurb.en : blurb.zh}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </ProjectReportSection>
    </section>
  );
}

export default SqlWorkbench;

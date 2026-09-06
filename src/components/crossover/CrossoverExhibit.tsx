"use client";

import exhibitsJson from "../../../public/case-studies/crossover-study/exhibits.json";
import ScrollRegion from "@/components/ScrollRegion";
import { useI18n } from "@/lib/i18n";
import styles from "./CrossoverExhibit.module.css";

type CurvePoint = {
  segment: string;
  n_users: number;
  value: number;
  ci_lo: number;
  ci_hi: number;
};

type CurveSeries = {
  key: string;
  label: string;
  run_id: string;
  model_name: string;
  points: CurvePoint[];
};

type Receipt = {
  run_id: string;
  kind: string;
  run_ts: string;
  git_sha: string;
  config_path?: string;
  config_hash: string;
  dataset_manifest_hash: string;
  splits: { version: number; frozen_at: string; file_hash: string };
  seeds?: { bootstrap?: number; model?: number | null };
  model?: { name: string; params: Record<string, unknown> } | null;
  wall_clock_s: number;
  hardware: string;
};

const data = exhibitsJson;
const chart = { width: 680, height: 280, left: 62, right: 18, top: 22, bottom: 50 };

function formatMetric(value: number, maximum: number) {
  return maximum < 0.02 ? value.toFixed(4) : value.toFixed(2);
}

function LineChart({ title, segments, series, markerAt }: { title: string; segments: string[]; series: CurveSeries[]; markerAt?: number }) {
  const values = series.flatMap((item) => item.points.flatMap((point) => [point.value, point.ci_hi]));
  const maximum = Math.max(...values) * 1.08;
  const innerWidth = chart.width - chart.left - chart.right;
  const innerHeight = chart.height - chart.top - chart.bottom;
  const x = (index: number) => chart.left + (segments.length === 1 ? 0 : index * innerWidth / (segments.length - 1));
  const y = (value: number) => chart.top + innerHeight - value / maximum * innerHeight;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ratio * maximum);

  return (
    <ScrollRegion className="crossover-chart-scroll" label={{ en: "Results chart", zh: "结果图表" }}>
      <svg className="crossover-line-chart" viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label={title}>
        <title>{title}</title>
        {ticks.map((tick) => <g className="crossover-gridline" key={tick}>
          <line x1={chart.left} x2={chart.width - chart.right} y1={y(tick)} y2={y(tick)} />
          <text x={chart.left - 9} y={y(tick) + 4}>{formatMetric(tick, maximum)}</text>
        </g>)}
        {markerAt !== undefined ? <g className="crossover-marker">
          <line x1={x(markerAt)} x2={x(markerAt)} y1={chart.top} y2={chart.top + innerHeight} />
          <text x={x(markerAt) + 7} y={chart.top + 13}>n*=20</text>
        </g> : null}
        {series.map((item, seriesIndex) => {
          const path = item.points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(point.value)}`).join(" ");
          return <g className={`crossover-series series-${seriesIndex + 1}`} data-series={item.key} key={item.key}>
            {item.points.map((point, index) => <g className="crossover-ci" key={point.segment}>
              <line x1={x(index)} x2={x(index)} y1={y(point.ci_hi)} y2={y(point.ci_lo)} />
              <line x1={x(index) - 4} x2={x(index) + 4} y1={y(point.ci_hi)} y2={y(point.ci_hi)} />
              <line x1={x(index) - 4} x2={x(index) + 4} y1={y(point.ci_lo)} y2={y(point.ci_lo)} />
            </g>)}
            <path d={path} />
            {item.points.map((point, index) => <rect x={x(index) - 3} y={y(point.value) - 3} width="6" height="6" key={point.segment} />)}
          </g>;
        })}
        {segments.map((segment, index) => <text className="crossover-axis-label" textAnchor="middle" x={x(index)} y={chart.height - 18} key={segment}>{segment}</text>)}
      </svg>
    </ScrollRegion>
  );
}

function Legend({ series }: { series: CurveSeries[] }) {
  return <div className="crossover-legend">{series.map((item, index) => <span className={`series-${index + 1}`} key={item.key}><i aria-hidden="true" />{item.label}<code>{item.run_id}</code></span>)}</div>;
}

function ReceiptDetails({ receipt }: { receipt: Receipt }) {
  const { locale } = useI18n();
  return (
    <details data-receipt={receipt.run_id}>
      <summary><code>{receipt.run_id}</code><span>{receipt.model?.name ?? receipt.kind}</span></summary>
      <dl>
        <div><dt>git SHA</dt><dd><code>{receipt.git_sha}</code></dd></div>
        <div><dt>{locale === "en" ? "Recorded" : "记录时间"}</dt><dd>{receipt.run_ts}</dd></div>
        <div><dt>{locale === "en" ? "Config" : "配置"}</dt><dd><code>{receipt.config_path ?? "—"}</code></dd></div>
        <div><dt>config SHA-256</dt><dd><code>{receipt.config_hash}</code></dd></div>
        <div><dt>dataset SHA-256</dt><dd><code>{receipt.dataset_manifest_hash}</code></dd></div>
        <div><dt>{locale === "en" ? "Frozen split" : "冻结切分"}</dt><dd>{receipt.splits.frozen_at}</dd></div>
        <div><dt>{locale === "en" ? "Runtime" : "运行耗时"}</dt><dd>{receipt.wall_clock_s.toFixed(3)} s · {receipt.hardware}</dd></div>
      </dl>
    </details>
  );
}

export default function CrossoverExhibit() {
  const { locale } = useI18n();
  const amazon = data.amazon_null;
  const ml32m = data.ml32m_crossover;
  const churn = data.catalog_churn;
  const support = [
    { key: "zero", value: churn.amazon.zero_support_share, label: locale === "en" ? "0 TRAIN support" : "训练期支持度为 0" },
    { key: "low", value: churn.amazon.low_support_share, label: locale === "en" ? "1–4 TRAIN support" : "训练期支持度 1–4" },
    { key: "high", value: churn.amazon.high_support_share, label: locale === "en" ? "5+ TRAIN support" : "训练期支持度 5+" },
  ];

  return (
    <div className={`crossover-exhibit ${styles.scope}`} data-testid="crossover-exhibit">
      <article className="crossover-panel negative-finding" data-exhibit="amazon-null">
        <header><p className="eyebrow">01 · Amazon Electronics</p><h3>{locale === "en" ? "No crossover on Amazon" : "Amazon 上没有交叉点"}</h3><p>{locale === "en" ? "ALS stays below recency-weighted popularity in every observed history bucket. The gap narrows, but never reaches zero." : "每一个观测到的历史深度里，ALS 都低于近 12 个月热门榜。差距在缩小，但始终没有走到零。"}</p></header>
        <LineChart title={locale === "en" ? "Amazon NDCG at 10 by history depth" : "Amazon 各历史深度的 NDCG@10"} segments={amazon.segments} series={amazon.series as CurveSeries[]} />
        <Legend series={amazon.series as CurveSeries[]} />
        <div className="crossover-verdict"><span>{locale === "en" ? "Measured routing threshold" : "实测路由阈值"}</span><strong>n*=∞</strong><p>{locale === "en" ? "No finite threshold beat routing nobody to ALS." : "所有有限阈值都不如不把任何用户路由给 ALS。"}</p></div>
      </article>

      <article className="crossover-panel" data-exhibit="ml32m-crossover">
        <header><p className="eyebrow">02 · MovieLens-32M</p><h3>{locale === "en" ? "The crossover appears at n*=20" : "交叉点出现在 n*=20"}</h3><p>{locale === "en" ? "With 6.40% churn, trailing-window item-kNN overtakes popularity from 20 interactions onward on NDCG@10." : "目录换血率降到 6.40% 后，按时间窗训练的 item-kNN 从 20 次历史交互开始，在 NDCG@10 上超过热门榜。"}</p></header>
        <LineChart title={locale === "en" ? "MovieLens-32M NDCG at 10 by history depth" : "MovieLens-32M 各历史深度的 NDCG@10"} segments={ml32m.segments} series={ml32m.series as CurveSeries[]} markerAt={4} />
        <Legend series={ml32m.series as CurveSeries[]} />
        <div className="crossover-deep-grid">{ml32m.confirmatory.winning_deep_buckets.map((point) => <div key={point.segment}><span>{point.segment}</span><strong>+{point.delta.toFixed(4)}</strong><code>q={point.q_value.toFixed(4)}</code></div>)}</div>
        <p className="crossover-caveat">{locale === "en" ? "The Recall@20 guard confirmed none of these three buckets; this is a ranking-quality result, not a recall result." : "Recall@20 稳健性检查没有确认这三个分段中的任何一个；这是排序质量结果，不是召回结果。"}</p>
      </article>

      <article className="crossover-panel" data-exhibit="catalog-churn">
        <header><p className="eyebrow">03 · Mechanism</p><h3>{locale === "en" ? "41.11% of test purchases changed the feasible catalog" : "41.11% 的测试期购买落在新换进的目录"}</h3><p>{locale === "en" ? "Those purchases land on items with zero or only 1–4 interactions in TRAIN. A train-frozen factor model has no useful support for them." : "这些购买落在训练期支持度为 0 或只有 1–4 次交互的商品上。冻结在训练期的因子模型没有足够信号去排它们。"}</p></header>
        <div className="crossover-churn-bars" aria-label={locale === "en" ? "Amazon test purchase mass by training support" : "Amazon 测试期购买份额按训练支持度拆分"}>
          <div className="crossover-stacked-bar">{support.map((item) => <span className={item.key} style={{ width: `${item.value * 100}%` }} key={item.key}><i>{(item.value * 100).toFixed(2)}%</i></span>)}</div>
          <div className="crossover-support-legend">{support.map((item) => <span className={item.key} key={item.key}><i aria-hidden="true" />{item.label}<strong>{(item.value * 100).toFixed(2)}%</strong></span>)}</div>
        </div>
        <div className="crossover-regime-contrast">
          <div><span>Amazon Electronics</span><strong>{(churn.amazon.churn_share * 100).toFixed(2)}%</strong><code>{churn.amazon.run_id}</code></div>
          <div><span>MovieLens-32M</span><strong>{(churn.ml32m.churn_share * 100).toFixed(2)}%</strong><code>{churn.ml32m.run_id}</code></div>
          <p>{locale === "en" ? "A 6.4× churn gap accompanies the regime flip. It does not isolate churn as the only cause." : "两套数据的换血率相差 6.4 倍，并伴随结果翻转；这不能证明换血率是唯一原因。"}</p>
        </div>
      </article>

      <details className="crossover-receipts">
        <summary>{locale === "en" ? "Run receipts" : "运行收据"}</summary>
        <p>{locale === "en" ? "Six source runs, reduced to the provenance fields needed to audit these exhibits." : "六次源运行，只保留审计这三件展品所需的出处字段。"}</p>
        <div>{(data.receipts as Receipt[]).map((item) => <ReceiptDetails receipt={item} key={item.run_id} />)}</div>
      </details>
    </div>
  );
}

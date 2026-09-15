"use client";

import { EvidenceDisclosure } from "@/components/exhibition/EvidenceDisclosure";
import { EvidenceFileLink } from "@/components/exhibition/EvidenceFileLink";
import { useI18n } from "@/lib/i18n";
import evidence from "../../../public/case-studies/crossover-study/engineering-evidence.json";

const sourceRoot = `https://github.com/${evidence.source.repository}/blob/${evidence.source.revision}`;

export function CrossoverEngineeringEvidence() {
  const { locale } = useI18n();
  const hive = evidence.hive_catalog;
  const skew = evidence.spark_skew;

  return (
    <section id="exhibit-04" className="exhibit crossover-engineering" data-exhibit="04" aria-labelledby="exhibit-04-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">04</span>
        <span className="exhibit-eyebrow">ENGINEERING EVIDENCE</span>
      </p>
      <h1 id="exhibit-04-title" className="exhibit-title">
        {locale === "en" ? <>Balance improved.<br /><em>Speed did not settle.</em></> : <>任务更均衡。<br /><em>耗时没有稳稳变快。</em></>}
      </h1>

      <EvidenceDisclosure project="crossover">
        <div className="crossover-engineering-list" data-testid="crossover-engineering-evidence">
          <article>
            <p className="crossover-eyebrow-small">HIVE METASTORE · GOLD SQL</p>
            <h2>{locale === "en" ? `${hive.registered_tables} tables · ${hive.snapshot_checks} snapshots · ${hive.difference_rows} differing rows` : `${hive.registered_tables} 张表 · ${hive.snapshot_checks} 个快照 · 差异 ${hive.difference_rows} 行`}</h2>
            <p>
              {locale === "en"
                ? `${hive.execution_engine} registered existing Iceberg metadata in ${hive.catalog_backend} without rewriting data. Across ${hive.source_interactions.toLocaleString("en-US")} source interactions, all ${hive.parity_outputs} gold projections matched the PySpark reference by bidirectional EXCEPT ALL.`
                : `Spark 的 SQL 引擎把既有 Iceberg 元数据注册到 Hive 元数据服务，后端由 Postgres 承载，没有重写数据。在 ${hive.source_interactions.toLocaleString("en-US")} 条源交互上，${hive.parity_outputs} 类金层指标与 PySpark 参考实现做保留重复行的双向差集，全量差异为零。`}
            </p>
            <a href={`${sourceRoot}/docs/hive-gold/README.md`} target="_blank" rel="noreferrer noopener">
              {locale === "en" ? "Open the pinned Hive verification" : "查看锁定版本的 Hive 验证"}
            </a>
          </article>

          <article>
            <p className="crossover-eyebrow-small">AQE · SKEW JOIN · BROADCAST</p>
            <h2>{locale === "en" ? `Join-stage max/median ${skew.baseline.join_time_max_median.toFixed(2)} → ${skew.skew_join.join_time_max_median.toFixed(2)}` : `连接阶段最大值/中位数 ${skew.baseline.join_time_max_median.toFixed(2)} → ${skew.skew_join.join_time_max_median.toFixed(2)}`}</h2>
            <p>
              {locale === "en"
                ? `On ${skew.interactions.toLocaleString("en-US")} interactions, every arm kept the same content fingerprint. Skew join improved task balance, while broadcast removed the join shuffle. The three-run medians differed by only ${Math.abs(skew.skew_join.median_change_vs_baseline_percent).toFixed(2)}%, with overlapping elapsed ranges: no stable end-to-end speedup is claimed.`
                : `在 ${skew.interactions.toLocaleString("en-US")} 条交互上，各组内容指纹一致。倾斜连接改善了任务均衡性，广播连接消除了连接混洗。三次正式测量的中位数只相差 ${Math.abs(skew.skew_join.median_change_vs_baseline_percent).toFixed(2)}%，耗时区间仍重叠，因此不主张端到端稳定提速。`}
            </p>
            <a href={`${sourceRoot}/docs/spark-skew/RESULTS.md`} target="_blank" rel="noreferrer noopener">
              {locale === "en" ? "Open the pinned skew experiment" : "查看锁定版本的倾斜实验"}
            </a>
          </article>
        </div>

        <p className="crossover-engineering-boundary">
          {locale === "en"
            ? `The broadcast arm recorded ${skew.broadcast.query_shuffle_read_bytes.toLocaleString("en-US")} B of later fingerprint-aggregation shuffle; that excludes broadcast traffic and is not total network transfer. Hive stores catalog metadata here; Spark remains the execution engine.`
            : `广播组记录的 ${skew.broadcast.query_shuffle_read_bytes.toLocaleString("en-US")} 字节来自后续指纹聚合，不含广播流量，也不是总网络传输量。Hive 在这里保存目录元数据，计算仍由 Spark 执行。`}
        </p>
        <p><EvidenceFileLink source="public/case-studies/crossover-study/engineering-evidence.json" /></p>
      </EvidenceDisclosure>
    </section>
  );
}

export default CrossoverEngineeringEvidence;

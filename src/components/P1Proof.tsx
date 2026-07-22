"use client";

import dynamic from "next/dynamic";
import ArtifactLink from "@/components/ArtifactLink";
import { useI18n } from "@/lib/i18n";
import OptionalMedia from "./OptionalMedia";
import ProjectProofSection from "./ProjectProofSection";

function P1ReplayLoading() {
  const { locale } = useI18n();
  return <div className="p1-replay-loading" aria-live="polite">{locale === "en" ? "Loading recorded evidence..." : "正在载入录制证据……"}</div>;
}

const P1FailureReplay = dynamic(() => import("./p1/P1FailureReplay"), {
  loading: () => <P1ReplayLoading />,
});

const p1Artifacts = [
  { phase: "1.1", name: { en: "Toolchain and core-stack smoke", zh: "工具链与核心栈冒烟检查" }, run: "20260527T093100Z-phase-1-1-smoke", sha: "b5668d9", command: "make doctor / up-core / gen", href: "/case-studies/p1-reliability-lab/results/phase-1.1-smoke.json" },
  { phase: "1.2", name: { en: "CDC correctness smoke", zh: "CDC 正确性冒烟检查" }, run: "20260527T133945Z-58e25cd1", sha: "b2434d1", command: "make test-cdc", href: "/case-studies/p1-reliability-lab/results/phase-1.2-cdc-smoke.json" },
  { phase: "2.1", name: { en: "Five-failure reconciliation", zh: "五类故障对账" }, run: "20260527T151754Z-ef73a5a5", sha: "b2434d1", command: "make eo-verify", href: "/case-studies/p1-reliability-lab/results/eo_reconciliation.json" },
  { phase: "2.2", name: { en: "Iceberg small-file rewrite", zh: "Iceberg 小文件重写" }, run: "20260527T155713Z-a88e18f6", sha: "ad7ad52", command: "make small-file-rewrite", href: "/case-studies/p1-reliability-lab/results/iceberg_small_file_rewrite.json" },
  { phase: "2.3", name: { en: "Checkpoint pressure capture", zh: "检查点压力留证" }, run: "20260527T233135Z-0b65b846", sha: "ce084a5", command: "make ckpt-metrics", href: "/case-studies/p1-reliability-lab/results/checkpoint_metrics.json" },
] as const;

export default function P1Proof() {
  const { locale, dict } = useI18n();
  return (
    <ProjectProofSection title={dict.evidence} className="tinted-section">
      <div className="era-grid">
        <div className="era-label"><span>{locale === "en" ? "Original benchmark run" : "原始基准运行"}</span><strong>{locale === "en" ? "May capture" : "五月运行记录"}</strong><p>{locale === "en" ? "Result JSON, charts, dashboard capture, and incident runbook at commit 47b4268." : "提交 47b4268 对应的结果 JSON、图表、面板截图与事故处置手册。"}</p></div>
        <div className="era-label current"><span>{locale === "en" ? "Later workstation reproduction" : "后续工作站复现"}</span><strong>20260711T034018Z-local-mac</strong><p>{locale === "en" ? "Commit 7eab9c3 records the full command, timing, and reconciliation result." : "提交 7eab9c3 记录完整命令、运行时间与对账结果。"}</p></div>
      </div>
      <P1FailureReplay />
      <div className="artifact-table" role="table" aria-label={locale === "en" ? "Historical p1 evidence artifacts" : "p1 历史证据产物"}>
        <div className="artifact-head" role="row"><span role="columnheader">{locale === "en" ? "Phase / artifact" : "阶段 / 产物"}</span><span role="columnheader">{locale === "en" ? "Run ID" : "运行 ID"}</span><span role="columnheader">{locale === "en" ? "Git SHA" : "Git 提交哈希"}</span><span role="columnheader">{locale === "en" ? "Command" : "命令"}</span></div>
        {p1Artifacts.map((artifact) => <ArtifactLink role="row" href={artifact.href} key={artifact.phase}><span role="cell"><code>{artifact.phase}</code><strong>{artifact.name[locale]}</strong></span><code role="cell">{artifact.run}</code><code role="cell">{artifact.sha}</code><code role="cell">{artifact.command}</code></ArtifactLink>)}
      </div>
      <div className="p1-pressure-section" aria-label={locale === "en" ? "Recorded historical checkpoint pressure evidence" : "已记录的历史检查点压力证据"}>
        <p className="eyebrow">{locale === "en" ? "Recorded historical evidence" : "已记录的历史证据"}</p>
        <h3>{locale === "en" ? "Checkpoint pressure under induced backpressure" : "注入背压下的检查点压力"}</h3>
        <p className="evidence-link"><ArtifactLink href="/case-studies/p1-reliability-lab/results/checkpoint_metrics.json">{locale === "en" ? "Open source JSON" : "查看源 JSON"}</ArtifactLink></p>
        <div className="p1-pressure-evidence release-mode-ledger"><div><span>{locale === "en" ? "Maximum checkpoint duration" : "最大检查点时长"}</span><strong>55 ms → 19,022 ms</strong><small>{locale === "en" ? "baseline → induced backpressure" : "基线 → 注入背压"}</small></div><div><span>{locale === "en" ? "Maximum commit lag" : "最大提交延迟"}</span><strong>320 {locale === "en" ? "events" : "个事件"} → 0</strong><small>{locale === "en" ? "recovered in the recorded run" : "在已记录运行中恢复"}</small></div><div><span>{locale === "en" ? "Checkpoint failure" : "检查点失败"}</span><strong>1</strong><small>{locale === "en" ? "captured in the run record" : "已写入运行记录"}</small></div></div>
      </div>
      <OptionalMedia candidates={[
        { src: "/case-studies/p1-reliability-lab/media/phase-1.4-dashboard.jpg", alt: { en: "Historical evidence dashboard for the captured p1 run", zh: "p1 历史运行记录的证据面板" }, caption: { en: "The dashboard summarizes reconciliation status, failure-class outcomes, source counts, and Iceberg snapshot differences in one operational view.", zh: "该面板在一个运行视图中汇总对账状态、各故障类别结果、源端计数与 Iceberg 快照差异。" } },
        { src: { en: "/case-studies/p1-reliability-lab/media/phase-2.2-small-file-rewrite.svg", zh: "/case-studies/p1-reliability-lab/media/phase-2.2-small-file-rewrite-zh.svg" }, alt: { en: "Historical Iceberg small-file rewrite evidence", zh: "历史 Iceberg 小文件重写证据" }, caption: { en: "The maintenance view shows how Iceberg data files were compacted while preserving table state.", zh: "维护视图展示 Iceberg 数据文件如何在保持表状态的同时完成合并压缩。" } },
      ]} />
    </ProjectProofSection>
  );
}

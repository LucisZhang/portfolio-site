"use client";

import { Check, CircleAlert, ShieldCheck } from "lucide-react";
import dynamic from "next/dynamic";
import ArtifactLink from "@/components/ArtifactLink";
import { useI18n } from "@/lib/i18n";
import OptionalMedia from "./OptionalMedia";
import ProjectProofSection from "./ProjectProofSection";

function ReleaseReplayLoading() {
  const { locale } = useI18n();
  return <div className="release-replay-loading" aria-live="polite">{locale === "en" ? "Loading synthetic replay..." : "正在载入合成回放……"}</div>;
}

const ReleaseChangeReplay = dynamic(() => import("./release/ReleaseChangeReplay"), {
  loading: () => <ReleaseReplayLoading />,
});

const releaseMetrics = [
  [{ en: "Missed dependency", zh: "依赖漏检" }, "17.42%", "<= 25%"],
  [{ en: "False impact", zh: "误报影响率" }, "12.32%", "<= 25%"],
  [{ en: "Risk grade accuracy", zh: "风险等级准确率" }, "72.73%", ">= 70%"],
  [{ en: "Plan completeness", zh: "计划完整度" }, "95.98%", ">= 90%"],
  [{ en: "Citation fidelity", zh: "引用忠实度" }, "100%", ">= 99.9%"],
  [{ en: "Tool misuse", zh: "工具误用率" }, "0%", "<= 0.0000001%"],
  [{ en: "Step efficiency", zh: "步骤效率" }, "1.001", "<= 1.35"],
  [{ en: "Injection defense", zh: "注入防御率" }, "100%", ">= 99.9%"],
] as const;

const releaseFindings = [
  {
    id: "W3-02",
    issue: { en: "Current-evaluation copy mixed deterministic stub values into a live-sounding statement.", zh: "当前评估文案把确定性 stub 数值混入了类似在线结果的声明。" },
    disposition: { en: "Keep live and stub evidence separate and visibly labeled.", zh: "将在线证据与 stub 证据分开并显式标注。" },
  },
  {
    id: "W3-03",
    issue: { en: "Aggregate-pass wording omitted the strict all-trials residual.", zh: "聚合通过文案遗漏了全部试验均须达标的剩余项。" },
    disposition: { en: "Place the 30/44 live residual beside the aggregate gates.", zh: "将在线 30/44 严格残差与聚合门禁并列。" },
  },
  {
    id: "W3-04",
    issue: { en: "The funded Phase-L reports are archive-only artifacts.", zh: "付费 Phase-L 报告仅存在于归档产物中。" },
    disposition: { en: "Use the verified archive hash as the durable report reference.", zh: "以已核验的归档哈希作为报告的持久引用。" },
  },
  {
    id: "W3-05",
    issue: { en: "Cost material combined measured, estimated, projected, and modeled evidence.", zh: "成本材料混合了实测、估算、推算与建模证据。" },
    disposition: { en: "Preserve evidence class and the pre-migration snapshot date on every claim.", zh: "每项声明保留证据类别与迁移前快照日期。" },
  },
  {
    id: "W3-06",
    issue: { en: "Workstation-selected models differ from tracked defaults.", zh: "工作站选择的模型与仓库跟踪默认值不同。" },
    disposition: { en: "Label the runtime settings independently from repository defaults.", zh: "将运行时设置与仓库默认配置分别标注。" },
  },
] as const;

export default function ReleaseGuardianProof() {
  const { locale, dict } = useI18n();
  const costClasses = locale === "en" ? [
    ["Measured", "Routed versus all-strong observation"],
    ["Estimated", "Prompt-pruning token counts"],
    ["Projected", "Assumption-dependent cache savings"],
    ["Modeled", "ReAct call and cost comparison"],
  ] : [
    ["实测", "路由与全强模型的观察"],
    ["估算", "提示词裁剪的 token 计数"],
    ["推算", "依赖假设的缓存节省"],
    ["建模", "ReAct 调用与成本对比"],
  ];

  return (
    <ProjectProofSection title={dict.evidence} className="tinted-section">
      <ReleaseChangeReplay />
      <div className="release-evidence-boundary">
        <p className="eyebrow">{locale === "en" ? "Separate measured evidence" : "独立实测证据"}</p>
        <h3>{locale === "en" ? "Funded live evaluation context" : "付费在线评估上下文"}</h3>
        <div className="release-eval-pair">
          <article className="aggregate"><ShieldCheck aria-hidden="true" /><span>{locale === "en" ? "Aggregate gates" : "聚合门禁"}</span><strong>8 / 8</strong><p>{locale === "en" ? "aggregate gates passed across 132 funded runs (44 scenarios x 3 trials)." : "132 次付费运行（44 个场景 x 3 次试验）的八项聚合门禁全部通过。"}</p></article>
          <div>
            <p className="rag-historical-boundary release-strict-definition">{locale === "en" ? "Definition: a scenario is flagged if any criterion failed in any of its three trials — a stricter lens than the aggregate gates." : "定义：只要任一项标准在三次试验中的任何一次失败，该场景就会被标记；这比聚合门禁更严格。"}</p>
            <article className="strict"><CircleAlert aria-hidden="true" /><span>{locale === "en" ? "Strict all-trials residual" : "全部试验均须达标的剩余项"}</span><strong>30 / 44</strong><p>{locale === "en" ? "scenarios had outcome_pass: false; one trajectory failure." : "场景的 outcome_pass 为 false；另有一次轨迹失败。"}</p></article>
          </div>
        </div>
        <div className="release-funded-stats" aria-label={locale === "en" ? "Funded evaluation cost and latency" : "付费评估成本与延迟"}>
          <div><span>{locale === "en" ? "Total model cost" : "模型总成本"}</span><strong>$8.1214</strong><small>{locale === "en" ? "measured, 2026-07-11 funded run" : "实测，2026-07-11 付费运行"}</small></div>
          <div><span>{locale === "en" ? "Mean latency per run" : "每次运行平均延迟"}</span><strong>~35.08 s</strong><small>{locale === "en" ? "measured, 2026-07-11 funded run" : "实测，2026-07-11 付费运行"}</small></div>
        </div>
        <div className="release-what-changed"><span>{locale === "en" ? "What I changed" : "我做的调整"}</span><strong>{locale === "en" ? "I turned three distinct operating modes into a review surface that makes their results immediately comparable." : "我把三种不同运行模式整理成可直接比较结果的审查界面。"}</strong><p>{locale === "en" ? "Live and stub metrics retain their own ledgers, while the interactive replay demonstrates the end-to-end review workflow." : "在线与 stub 指标分别保留独立台账，交互回放则完整展示端到端审查工作流。"}</p></div>
        <div className="release-mode-ledger"><div><strong>{locale === "en" ? "Funded live" : "付费在线"}</strong><span>{locale === "en" ? "Measured: 132 runs / strict 30 of 44 flagged" : "实测：132 次运行 / 44 项中严格标记 30 项"}</span></div><div><strong>{locale === "en" ? "Existing deterministic stub" : "既有确定性 stub"}</strong><span>{locale === "en" ? "Stub: 132 runs / strict 15 of 44 flagged" : "Stub：132 次运行 / 44 项中严格标记 15 项"}</span></div><div><strong>{locale === "en" ? "New change replay" : "新增变更回放"}</strong><span>{locale === "en" ? "Interactive demonstration of the complete review workflow" : "完整审查工作流的交互式演示"}</span></div></div>
        <div className="gate-panel">
          <div className="panel-heading"><ShieldCheck aria-hidden="true" /><div><strong>{locale === "en" ? "Funded live aggregate metric detail" : "付费在线聚合指标明细"}</strong><span>{locale === "en" ? "Measured 2026-07-11; read these only alongside the strict residual above." : "2026-07-11 实测；以下数据须与上方严格残差一并阅读。"}</span></div></div>
          <div className="metric-table" role="table" aria-label={locale === "en" ? "Release gate metrics" : "发布门禁指标"}>{releaseMetrics.map(([name, value, threshold]) => <div role="row" key={name.en}><span role="cell">{name[locale]}</span><strong role="cell">{value}</strong><code role="cell">{threshold}</code><Check role="cell" aria-label={locale === "en" ? "pass" : "通过"} /></div>)}</div>
        </div>
      </div>
      <div className="classification-row">
        <p>{locale === "en" ? "Cost evidence from 2026-07-08 — before the migration" : "成本证据取自 2026-07-08——迁移之前。"}</p>
        <div>
          {costClasses.map(([label, detail]) => <span key={label}><strong>{label}</strong>{detail}</span>)}
        </div>
      </div>
      <div className="finding-table" role="table" aria-label={locale === "en" ? "Sanitized consistency findings" : "脱敏一致性审查记录"}>
        <div className="finding-head" role="row"><span role="columnheader">ID</span><span role="columnheader">{locale === "en" ? "Audit finding" : "审计发现"}</span><span role="columnheader">{locale === "en" ? "Public disposition" : "公开处理"}</span></div>
        {releaseFindings.map((finding) => <div role="row" key={finding.id}><code role="cell">{finding.id}</code><span role="cell">{finding.issue[locale]}</span><strong role="cell">{finding.disposition[locale]}</strong></div>)}
      </div>
      <p className="evidence-link"><ArtifactLink href="/case-studies/release-guardian/data/findings.csv">{locale === "en" ? "View all 13 sanitized findings" : "查看全部 13 项脱敏审查记录"}</ArtifactLink></p>
      <OptionalMedia layout="release-staggered" candidates={[
        { src: "/case-studies/release-guardian/screenshots/risk-guardrail.png", alt: { en: "Sanitized deterministic risk guardrail", zh: "脱敏后的确定性风险门禁" }, caption: { en: "The risk view turns change type, CI history, and downstream impact into an inspectable score with factor-level contributions.", zh: "风险视图把变更类型、CI 历史和下游影响汇总为可检查的分数，并逐项展示各因素贡献。" } },
        { src: "/case-studies/release-guardian/screenshots/evaluation-stub.png", alt: { en: "Sanitized deterministic stub evaluation", zh: "脱敏后的确定性 stub 评估" }, caption: { en: "The evaluation board places the regression gate beside six operating metrics so reviewers can read pass/fail status at a glance.", zh: "评估面板将回归门禁与六项运行指标并列，让评审者一眼读出通过状态与关键数值。" } },
        { src: "/case-studies/release-guardian/screenshots/pipeline-trace-stub.png", alt: { en: "Sanitized deterministic stub pipeline trace", zh: "脱敏后的确定性 stub 流水线追踪图" }, caption: { en: "The trace reveals how intake, retrieval, grading, planning, validation, and approval spans connect across the release workflow.", zh: "追踪图展示接入、检索、风险分级、计划、校验与审批 span 如何贯穿整个发布流程。" } },
      ]} />
    </ProjectProofSection>
  );
}

"use client";

import { Check, ChevronLeft, ChevronRight, CircleAlert, FileJson, GitPullRequest, Pause, Play, RotateCcw, ShieldCheck, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ArtifactLink from "@/components/ArtifactLink";
import { type Locale, useI18n } from "@/lib/i18n";
import { localizeStructuralValue } from "@/lib/structural-copy";

const SCENARIO_URL = "/case-studies/release-guardian/replay/synthetic-scenarios.json";
const APPROVAL_STAGE = 7;
const AUDIT_STAGE = 8;
const SCENARIO_LOAD_ERROR = {
  en: "Couldn't load the synthetic replay.",
  zh: "无法加载合成回放。",
} as const;

type Retriever = {
  status: "complete" | "partial";
  items: string[];
  support: string;
  details: Record<string, string>;
};

type Scenario = {
  id: string;
  kind: string;
  summary: string;
  affected_components: string[];
  proposed_change: string;
  declared_owner: string;
  expected_impact: string;
  synthetic_timestamp: string;
  facts: Record<string, boolean>;
  retrievers: Record<"code" | "schema" | "api" | "operations", Retriever>;
  missing_evidence: string[];
  rollout: string[];
  rollback: string[];
  verification_checks: string[];
  stopping_conditions: string[];
  approval_requirements: string[];
};

type ReplayData = {
  seed: string;
  evidence_modes: string[];
  classification: string[];
  fixed_disclosure: string;
  rules: Record<string, number | Record<string, number>>;
  scenarios: Scenario[];
};

type Decision = "approved" | "rejected";

const retrieverOrder = ["code", "schema", "api", "operations"] as const;
const stageKeys = ["intake", "code", "schema", "api", "operations", "risk", "plan", "approval", "audit"] as const;
const scenarioKinds: Record<string, { en: string; zh: string }> = {
  "SYN-AUTH-01": { en: "Authentication configuration", zh: "身份验证配置" },
  "SYN-SCHEMA-02": { en: "Database schema change", zh: "数据库结构变更" },
  "SYN-API-03": { en: "API field removal", zh: "移除 API 字段" },
  "SYN-DEP-04": { en: "Dependency upgrade", zh: "依赖升级" },
};

const evidenceDetailLabels: Record<string, { en: string; zh: string }> = {
  changed_component: { en: "Changed component", zh: "变更组件" },
  changed_symbol: { en: "Changed symbol", zh: "变更符号" },
  dependency_edge: { en: "Dependency edge", zh: "依赖关系" },
  risky_pattern: { en: "Risky pattern", zh: "风险模式" },
  test_status: { en: "Test status", zh: "测试状态" },
  source_boundary: { en: "Source boundary", zh: "源码边界" },
  before_field: { en: "Before field", zh: "变更前字段" },
  after_field: { en: "After field", zh: "变更后字段" },
  type_change: { en: "Type change", zh: "类型变化" },
  nullable_change: { en: "Nullable change", zh: "可空性变化" },
  compatibility: { en: "Compatibility", zh: "兼容性" },
  migration_requirement: { en: "Migration requirement", zh: "迁移要求" },
  affected_consumer: { en: "Affected consumer", zh: "受影响消费者" },
  endpoint: { en: "Endpoint", zh: "端点" },
  contract_diff: { en: "Contract diff", zh: "契约差异" },
  removed_or_changed_field: { en: "Removed or changed field", zh: "移除或变更字段" },
  consumer_impact: { en: "Consumer impact", zh: "消费者影响" },
  backward_compatibility: { en: "Backward compatibility", zh: "向后兼容" },
  versioning_requirement: { en: "Versioning requirement", zh: "版本要求" },
  rollout_readiness: { en: "Rollout readiness", zh: "发布准备" },
  rollback_readiness: { en: "Rollback readiness", zh: "回滚准备" },
  runbook_status: { en: "Runbook status", zh: "运行手册状态" },
  alert_coverage: { en: "Alert coverage", zh: "告警覆盖" },
  possible_slo_impact: { en: "Possible SLO impact", zh: "可能的 SLO 影响" },
  required_owner_or_approval: { en: "Required owner / approval", zh: "所需负责人 / 审批" },
};

const verifiedEvidence = [
  { id: "live", stages: [], title: { en: "Funded live evaluation", zh: "付费在线评估" }, href: "/case-studies/release-guardian/data/evaluation-live.csv", date: "2026-07-11", evidenceClass: { en: "measured historical evaluation", zh: "历史实测评估" }, result: { en: "8 / 8 aggregate gates passed across 44 scenarios × 3 trials = 132 graph runs; 30 / 44 outcome_pass:false in the strict all-trials view.", zh: "44 个场景 × 3 次试验 = 132 次图运行，8 / 8 聚合门禁通过；严格全试验视图中 30 / 44 的 outcome_pass:false。" }, boundary: { en: "A scenario is flagged if any criterion failed in any of its three trials; this is historical evidence, not an output of the synthetic replay.", zh: "只要任一标准在三次试验中的任何一次失败，场景就会被标记；这是历史证据，不是合成回放的输出。" } },
  { id: "stub", stages: [], title: { en: "Deterministic stub evaluation", zh: "确定性 stub 评估" }, href: "/case-studies/release-guardian/data/evaluation-stub.csv", date: "2026-07-11", evidenceClass: { en: "deterministic historical stub", zh: "历史确定性 stub" }, result: { en: "132 stub graph runs; 15 / 44 flagged in the strict all-trials view.", zh: "132 次 stub 图运行；严格全试验视图标记 15 / 44。" }, boundary: { en: "Stub metrics are never described as funded live performance.", zh: "Stub 指标不会被描述为付费在线表现。" } },
  { id: "architecture", stages: [1, 2, 3, 4], title: { en: "Sanitized architecture", zh: "脱敏系统架构" }, href: "/case-studies/release-guardian/architecture.mmd", date: "2026-07-12", evidenceClass: { en: "presentation-layer derivative", zh: "展示层衍生物" }, result: { en: "Historical source exists; private graph details are withheld.", zh: "历史来源存在；私有依赖图细节未公开。" }, boundary: { en: "Shows the public review contract, not private repository lineage.", zh: "仅展示公开审查契约，不证明私有仓库的完整沿袭关系。" } },
  { id: "risk", stages: [5], title: { en: "Risk guardrail capture", zh: "风险门禁截图" }, href: "/case-studies/release-guardian/screenshots/risk-guardrail.png", date: "2026-07-12", evidenceClass: { en: "sanitized historical capture", zh: "脱敏历史截图" }, result: { en: "A public risk-factor view exists; the replay score remains synthetic.", zh: "公开包中存在风险因子视图；当前回放分数仍是合成结果。" }, boundary: { en: "No private scenario, service, path, or prompt is exposed.", zh: "不公开私有场景、服务、路径或提示词。" } },
  { id: "findings", stages: [6, 7, 8], title: { en: "Consistency findings", zh: "一致性审计发现" }, href: "/case-studies/release-guardian/data/findings.csv", date: "2026-07-12", evidenceClass: { en: "13 sanitized findings", zh: "13 项脱敏审计发现" }, result: { en: "Documents the live/stub wording correction and publication boundaries.", zh: "记录在线/stub 文案纠正和公开边界。" }, boundary: { en: "Finding summaries only; private traces and internal paths remain withheld.", zh: "仅公开发现摘要；私有追踪记录与内部路径不公开。" } },
] as const;

function riskFor(scenario: Scenario) {
  const matches: [string, number][] = [];
  if (scenario.facts.breaking_api) matches.push(["breaking_api", 40]);
  if (scenario.facts.irreversible_schema) matches.push(["irreversible_schema", 35]);
  if (scenario.facts.auth_boundary) matches.push(["auth_boundary", 25]);
  if (scenario.facts.major_dependency) matches.push(["major_dependency", 20]);
  if (!scenario.facts.rollback_tested) matches.push(["rollback_untested", 20]);
  if (scenario.facts.monitoring_gap) matches.push(["monitoring_gap", 15]);
  if (scenario.missing_evidence.length) matches.push(["missing_evidence", scenario.missing_evidence.length * 10]);
  const score = Math.min(100, matches.reduce((sum, [, value]) => sum + value, 0));
  const level = score >= 70 ? "critical" : score >= 45 ? "high" : score >= 20 ? "medium" : "low";
  const blockers = [
    scenario.facts.breaking_api && scenario.missing_evidence.length > 0 ? "Consumer compatibility evidence is incomplete." : null,
    scenario.facts.irreversible_schema && !scenario.facts.rollback_tested ? "Destructive schema rollback is untested." : null,
    scenario.facts.monitoring_gap ? "A required monitor is missing." : null,
  ].filter((item): item is string => item !== null);
  return { score, level, matches, blockers };
}

function auditId(scenario: Scenario, decision: Decision) {
  return `${scenario.id}-${decision === "approved" ? "APPROVE" : "REJECT"}`;
}

export default function ReleaseChangeReplay() {
  const { locale } = useI18n();
  const localize = (value: string) => localizeStructuralValue(value, locale);
  const [data, setData] = useState<ReplayData | null>(null);
  const [scenarioId, setScenarioId] = useState("");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(SCENARIO_URL).then((response) => {
      if (!response.ok) throw new Error(`Synthetic scenarios returned ${response.status}`);
      return response.json() as Promise<ReplayData>;
    }).then((next) => {
      if (!active) return;
      setData(next);
      setScenarioId(next.scenarios[0]?.id ?? "");
    }).catch((reason: unknown) => {
      console.error("Release Guardian synthetic replay could not load.", reason);
      if (active) setLoadError(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setStep((current) => {
        if (current >= APPROVAL_STAGE - 1) {
          setPlaying(false);
          return APPROVAL_STAGE;
        }
        return current + 1;
      });
    }, 900);
    return () => window.clearInterval(timer);
  }, [playing]);

  const scenario = data?.scenarios.find((item) => item.id === scenarioId) ?? data?.scenarios[0];
  const risk = useMemo(() => scenario ? riskFor(scenario) : null, [scenario]);

  const stageLabels = locale === "en"
    ? ["Change intake", "Code evidence", "Schema evidence", "API evidence", "Operations evidence", "Risk reasoning", "Release planning", "Approval gate", "Audit record"]
    : ["变更接收", "代码证据", "数据库结构证据", "API 证据", "运维证据", "风险判断", "发布计划", "审批门禁", "审计记录"];

  function selectScenario(id: string) {
    setScenarioId(id);
    setStep(0);
    setPlaying(false);
    setDecisions([]);
  }

  function decide(decision: Decision) {
    setPlaying(false);
    setDecisions((current) => current.includes(decision) ? current : [...current, decision]);
    setStep(AUDIT_STAGE);
  }

  function reset() {
    setPlaying(false);
    setStep(0);
    setDecisions([]);
  }

  if (loadError) return <div className="release-replay-loading error"><CircleAlert aria-hidden="true" />{SCENARIO_LOAD_ERROR[locale]}</div>;
  if (!data || !scenario || !risk) return <div className="release-replay-loading" aria-live="polite">{locale === "en" ? "Loading synthetic replay..." : "正在载入合成回放……"}</div>;

  const currentRetriever = step >= 1 && step <= 4 ? scenario.retrievers[retrieverOrder[step - 1]] : null;

  return (
    <section className="release-replay" data-testid="release-change-replay" aria-labelledby="release-replay-title">
      <header className="release-replay-header">
        <div><p className="eyebrow">{locale === "en" ? "Synthetic scenario / deterministic replay" : "合成场景 / 确定性回放"}</p><h3 id="release-replay-title">{locale === "en" ? "Sanitized Change Review Replay" : "脱敏变更审查回放"}</h3><p>{locale === "en" ? "Follow a fictional change from intake through parallel evidence, deterministic risk rules, release planning, and human approval." : "跟随一个虚构变更，从受理入口经并行证据、确定性风险规则、发布计划，最终到人工审批。"}</p></div>
        <div className="release-fixed-disclosure"><ShieldCheck aria-hidden="true" /><strong>{localize(data.fixed_disclosure)}</strong></div>
      </header>

      <div className="release-replay-body">
        <div className="release-replay-setup">
          <div className="release-scenario-tabs" role="tablist" aria-label={locale === "en" ? "Synthetic change scenario" : "合成变更场景"}>
            {data.scenarios.map((item) => <button type="button" role="tab" aria-selected={item.id === scenario.id} key={item.id} onClick={() => selectScenario(item.id)}><span>{scenarioKinds[item.id]?.[locale] || localize(item.kind)}</span><code>{item.id}</code></button>)}
          </div>

          <div className="release-intake-strip">
            <div><span>{locale === "en" ? "Synthetic summary" : "合成摘要"}</span><strong>{localize(scenario.summary)}</strong></div>
            <div><span>{locale === "en" ? "Declared owner" : "声明负责人"}</span><strong>{localize(scenario.declared_owner)}</strong></div>
            <div><span>{locale === "en" ? "Expected impact" : "预期影响"}</span><strong>{localize(scenario.expected_impact)}</strong></div>
            <div className="wide"><span>{locale === "en" ? "Proposed change" : "拟议变更"}</span><strong>{localize(scenario.proposed_change)}</strong><p>{scenario.affected_components.map((component) => <code key={component}>{localize(component)}</code>)}</p></div>
          </div>
        </div>

        <div className="release-replay-canvas">
          <ol className="release-stage-track" aria-label={locale === "en" ? "Replay progression" : "回放进度"}>
            {stageKeys.map((key, index) => <li key={key} className={index < step ? "complete" : index === step ? "active" : ""}><span>{index < step ? <Check aria-hidden="true" /> : String(index + 1).padStart(2, "0")}</span><strong>{stageLabels[index]}</strong></li>)}
          </ol>

          <div className="release-replay-workspace" aria-live="polite">
        <div className="release-stage-main">
          <div className="release-stage-heading"><span>{locale === "en" ? "Current stage" : "当前阶段"}</span><strong>{String(step + 1).padStart(2, "0")} / 09</strong><h4>{stageLabels[step]}</h4></div>

          {step === 0 && <div className="release-fact-panel"><p><span>{locale === "en" ? "synthetic fact" : "合成事实"}</span>{localize(scenario.summary)}</p><p><span>{locale === "en" ? "synthetic fact" : "合成事实"}</span>{localize(scenario.proposed_change)}</p><p><span>{locale === "en" ? "UI explanation" : "界面说明"}</span>{locale === "en" ? "The intake is fictional and exists only to demonstrate the review contract." : "该受理入口完全虚构，仅用于演示审查契约。"}</p></div>}

          {currentRetriever && <div className="release-retriever-result"><div><GitPullRequest aria-hidden="true" /><span>{locale === "en" ? "Synthetic structured result" : "合成结构化结果"}</span><strong>{localize(retrieverOrder[step - 1])} {locale === "en" ? "evidence" : "证据"}</strong><code>{localize(currentRetriever.status)}</code></div><dl className="release-evidence-detail-grid">{Object.entries(currentRetriever.details).map(([key, value]) => <div key={key} className={key === "source_boundary" ? "withheld" : ""}><dt>{evidenceDetailLabels[key]?.[locale] ?? key.replaceAll("_", " ")}</dt><dd>{localize(value)}</dd></div>)}</dl><ul>{currentRetriever.items.map((item) => <li key={item}>{localize(item)}</li>)}</ul><p><strong>{locale === "en" ? "Supporting evidence" : "支持证据"}</strong>{localize(currentRetriever.support)}</p></div>}

          {step === 5 && <div className="release-risk-grid"><div className={`release-risk-score ${risk.level}`}><span>{locale === "en" ? "deterministic rule result" : "确定性规则结果"}</span><strong>{localize(risk.level)}</strong><code>{risk.score} / 100</code></div><div className="release-rule-list"><h5>{locale === "en" ? "Matched rules" : "命中规则"}</h5>{risk.matches.length ? risk.matches.map(([name, points]) => <p key={name}><span>+{points}</span><strong>{localize(name.replaceAll("_", " "))}</strong></p>) : <p><span>+0</span><strong>{locale === "en" ? "No weighted risk rule matched" : "没有命中加权风险规则"}</strong></p>}</div><div className="release-blocker-list"><h5>{locale === "en" ? "Blocking conditions" : "阻断条件"}</h5>{risk.blockers.length ? risk.blockers.map((blocker) => <p key={blocker}><CircleAlert aria-hidden="true" />{localize(blocker)}</p>) : <p><Check aria-hidden="true" />{locale === "en" ? "No deterministic blocker." : "没有确定性阻断项。"}</p>}</div><p className="release-risk-explanation"><span>{locale === "en" ? "UI explanation" : "界面说明"}</span>{locale === "en" ? "The score is the visible sum of fixed rule weights. This is not model reasoning or hidden chain-of-thought." : "分数是固定规则权重的可见求和，不是模型推理或隐藏思维链。"}</p></div>}

          {step === 6 && <div className="release-plan-grid"><PlanColumn title={locale === "en" ? "Rollout" : "发布步骤"} items={scenario.rollout} locale={locale} localize={localizeStructuralValue} /><PlanColumn title={locale === "en" ? "Rollback" : "回滚步骤"} items={scenario.rollback} locale={locale} localize={localizeStructuralValue} /><PlanColumn title={locale === "en" ? "Verification" : "校验检查"} items={scenario.verification_checks} locale={locale} localize={localizeStructuralValue} /><PlanColumn title={locale === "en" ? "Stop when" : "停止条件"} items={scenario.stopping_conditions} locale={locale} localize={localizeStructuralValue} /></div>}

          {step === 7 && <div className="release-approval-gate"><ShieldCheck aria-hidden="true" /><span>{locale === "en" ? "Human approval interrupt" : "人工审批中断"}</span><h4>{risk.blockers.length ? (locale === "en" ? "Deterministic recommendation: reject until evidence gaps close" : "确定性建议：证据缺口关闭前拒绝") : (locale === "en" ? "Deterministic recommendation: review and approve" : "确定性建议：审查后批准")}</h4><p>{locale === "en" ? "You make the call here. Either outcome writes a synthetic audit record, and the two can be compared." : "此处由你决定。任一结果都会写入一条合成审计记录，二者可供比对。"}</p><div><button type="button" className="approve" onClick={() => decide("approved")}><Check aria-hidden="true" />{locale === "en" ? "Approve" : "批准"}</button><button type="button" className="reject" onClick={() => decide("rejected")}><X aria-hidden="true" />{locale === "en" ? "Reject" : "拒绝"}</button></div></div>}

          {step === 8 && <div className="release-audit-grid">{decisions.map((decision) => <article key={decision} className={decision}><span>{locale === "en" ? "synthetic audit record" : "合成审计记录"}</span><strong>{locale === "en" ? decision : decision === "approved" ? "已批准" : "已拒绝"}</strong><dl><div><dt>ID</dt><dd>{auditId(scenario, decision)}</dd></div><div><dt>{locale === "en" ? "Scenario" : "场景"}</dt><dd>{scenario.id}</dd></div><div><dt>{locale === "en" ? "Fixed time" : "固定时间"}</dt><dd>{scenario.synthetic_timestamp}</dd></div><div><dt>{locale === "en" ? "Risk" : "风险"}</dt><dd>{localize(risk.level)} / {risk.score}</dd></div><div><dt>{locale === "en" ? "Requirements" : "审批要求"}</dt><dd>{scenario.approval_requirements.map(localize).join(", ")}</dd></div></dl></article>)}</div>}
        </div>

        <aside className="release-evidence-progress">
          <span>{locale === "en" ? "Parallel retriever progression" : "并行检索器进度"}</span>
          {retrieverOrder.map((name, index) => {
            const reached = step >= index + 1;
            return <div key={name} className={reached ? "reached" : ""}><strong>{localize(name)}</strong><code>{localize(reached ? scenario.retrievers[name].status : "queued")}</code><p>{reached ? scenario.retrievers[name].items.length : 0} {locale === "en" ? "structured items" : "条结构化结果"}</p></div>;
          })}
          <div className="release-evidence-gap"><strong>{locale === "en" ? "Missing evidence" : "缺失证据"}</strong><code>{step >= 5 ? scenario.missing_evidence.length : "-"}</code><p>{step >= 5 ? (scenario.missing_evidence.map(localize).join("; ") || (locale === "en" ? "None" : "无")) : (locale === "en" ? "Evaluated after retrieval" : "检索后评估")}</p></div>
        </aside>
          </div>

          <div className="release-replay-controls">
            <div><button type="button" aria-label={locale === "en" ? "Previous stage" : "上一步"} title={locale === "en" ? "Previous stage" : "上一步"} disabled={step === 0} onClick={() => { setPlaying(false); setStep((value) => Math.max(0, value - 1)); }}><ChevronLeft aria-hidden="true" /></button><button type="button" className="primary" aria-label={playing ? (locale === "en" ? "Pause replay" : "暂停回放") : (locale === "en" ? "Play replay" : "播放回放")} title={playing ? (locale === "en" ? "Pause replay" : "暂停回放") : (locale === "en" ? "Play replay" : "播放回放")} disabled={step >= APPROVAL_STAGE} onClick={() => setPlaying((value) => !value)}>{playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}</button><button type="button" aria-label={locale === "en" ? "Next stage" : "下一步"} title={locale === "en" ? "Next stage" : "下一步"} disabled={step >= APPROVAL_STAGE} onClick={() => { setPlaying(false); setStep((value) => Math.min(APPROVAL_STAGE, value + 1)); }}><ChevronRight aria-hidden="true" /></button><button type="button" aria-label={locale === "en" ? "Reset replay" : "重置回放"} title={locale === "en" ? "Reset replay" : "重置回放"} onClick={reset}><RotateCcw aria-hidden="true" /></button></div>
            <label><span>{locale === "en" ? "Replay stage" : "回放阶段"}</span><input type="range" min="0" max={APPROVAL_STAGE} value={Math.min(step, APPROVAL_STAGE)} aria-label={locale === "en" ? "Replay stage" : "回放阶段"} onChange={(event) => { setPlaying(false); setStep(Number(event.target.value)); }} /></label>
            <strong><FileJson aria-hidden="true" />{locale === "en" ? "Fixed JSON + deterministic rules" : "固定 JSON + 确定性规则"}</strong>
          </div>
        </div>

        <section className="release-verified-rail" aria-labelledby="release-verified-title">
          <header><div><p className="eyebrow">{locale === "en" ? "Verified evidence" : "已核验资料"}</p><h4 id="release-verified-title">{locale === "en" ? "How this replay connects to historical evidence" : "当前回放如何连接历史资料"}</h4></div><p>{locale === "en" ? "The selected scenario and every replay result are synthetic. Historical files below keep their own date, evidence class, and boundary." : "所选场景和全部回放结果均为合成。下方历史文件分别保留日期、证据类别和边界。"}</p></header>
          <div className="release-verified-rail-list">
            <article className="active synthetic"><span>{locale === "en" ? "Current replay" : "当前回放"}</span><strong>{scenario.id}</strong><dl><div><dt>{locale === "en" ? "Date" : "日期"}</dt><dd>{scenario.synthetic_timestamp} ({locale === "en" ? "fictional" : "虚构"})</dd></div><div><dt>{locale === "en" ? "Class" : "类别"}</dt><dd>{locale === "en" ? "synthetic / deterministic" : "合成 / 确定性"}</dd></div><div><dt>{locale === "en" ? "Result" : "结果"}</dt><dd>{locale === "en" ? "No evaluation metric is produced." : "不产生评估指标。"}</dd></div><div><dt>{locale === "en" ? "Boundary" : "边界"}</dt><dd>{locale === "en" ? "Not connected to the private repository or a live model." : "未连接私有仓库或在线模型。"}</dd></div></dl><ArtifactLink href={SCENARIO_URL}>{locale === "en" ? "Explore synthetic scenario" : "浏览合成场景"}</ArtifactLink></article>
            {verifiedEvidence.map((item) => <article key={item.id} className={(item.stages as readonly number[]).includes(step) ? "active" : ""}><span>{item.stages.length ? (locale === "en" ? "Related to this stage" : "与当前阶段相关") : (locale === "en" ? "Historical evaluation" : "历史评估")}</span><strong>{item.title[locale]}</strong><dl><div><dt>{locale === "en" ? "Date" : "日期"}</dt><dd>{item.date}</dd></div><div><dt>{locale === "en" ? "Class" : "类别"}</dt><dd>{item.evidenceClass[locale]}</dd></div><div><dt>{locale === "en" ? "Result" : "结果"}</dt><dd>{item.result[locale]}</dd></div><div><dt>{locale === "en" ? "Boundary" : "边界"}</dt><dd>{item.boundary[locale]}</dd></div></dl><ArtifactLink href={item.href}>{locale === "en" ? "Open evidence" : "查看资料"}</ArtifactLink></article>)}
          </div>
        </section>
      </div>

      <footer className="release-replay-footer"><div><span>{locale === "en" ? "Fixture seed" : "夹具 seed"}</span><code>{data.seed}</code></div><div><span>{locale === "en" ? "Classification" : "分类"}</span><strong>{data.classification.map(localize).join(" / ")}</strong></div><ArtifactLink href={SCENARIO_URL}>{locale === "en" ? "Explore scenario data" : "浏览合成场景数据"}</ArtifactLink></footer>
    </section>
  );
}

function PlanColumn({ title, items, locale, localize }: { title: string; items: string[]; locale: Locale; localize: (value: string, locale: Locale) => string }) {
  return <section><h5>{title}</h5><ol>{items.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span>{localize(item, locale)}</li>)}</ol></section>;
}

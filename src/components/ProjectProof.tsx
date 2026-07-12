"use client";

import { Check, CircleAlert, ShieldCheck } from "lucide-react";
import { LocalizedText, useI18n, type LocalizedString } from "@/lib/i18n";
import type { Project, ProjectId } from "@/lib/projects";
import OptionalMedia from "./OptionalMedia";

const releaseMetrics = [
  [{ en: "Missed dependency", zh: "依赖漏检" }, "17.42%", "<= 25%"],
  [{ en: "False impact", zh: "错误影响" }, "12.32%", "<= 25%"],
  [{ en: "Risk grade accuracy", zh: "风险等级准确率" }, "72.73%", ">= 70%"],
  [{ en: "Plan completeness", zh: "计划完整度" }, "95.98%", ">= 90%"],
  [{ en: "Citation fidelity", zh: "引用忠实度" }, "100%", ">= 99.9%"],
  [{ en: "Tool misuse", zh: "工具误用率" }, "0%", "<= 0.0000001%"],
  [{ en: "Step efficiency", zh: "步骤效率" }, "1.001", "<= 1.35"],
  [{ en: "Injection defense", zh: "注入防御率" }, "100%", ">= 99.9%"],
] as const;

const p1Failures: { name: string; detail: LocalizedString }[] = [
  { name: "task-crash", detail: { en: "Automatic task restart", zh: "任务自动重启" } },
  { name: "checkpoint-restore", detail: { en: "Restore from externalized checkpoint", zh: "从外部化检查点恢复" } },
  { name: "jobmanager-restart", detail: { en: "Coordinator restart and checkpoint recovery", zh: "协调器重启与检查点恢复" } },
  { name: "savepoint-restore", detail: { en: "Explicit savepoint recovery", zh: "显式保存点恢复" } },
  { name: "sink-commit-fault", detail: { en: "Checkpoint-complete callback fault", zh: "检查点完成回调故障" } },
];

const releaseFindings = [
  {
    id: "W3-02",
    issue: { en: "Current-evaluation copy mixed deterministic stub values into a live-sounding statement.", zh: "当前评估文案把确定性 stub 数值混入了类似在线结果的声明。" },
    disposition: { en: "Keep live and stub evidence separate and visibly labeled.", zh: "将在线证据与 stub 证据分开并显式标注。" },
  },
  {
    id: "W3-03",
    issue: { en: "Aggregate-pass wording omitted the strict all-trials residual.", zh: "聚合通过文案遗漏了全试验严格残差。" },
    disposition: { en: "Place the 30/44 live residual beside the aggregate gates.", zh: "将在线 30/44 严格残差与聚合门禁并列。" },
  },
  {
    id: "W3-04",
    issue: { en: "The funded Phase-L reports are archive-only artifacts.", zh: "付费 Phase-L 报告仅存在于归档产物中。" },
    disposition: { en: "Cite the verified archive hash; do not imply the report is tracked source.", zh: "引用已核验归档哈希，不暗示报告在源码中受跟踪。" },
  },
  {
    id: "W3-05",
    issue: { en: "Cost material combined measured, estimated, projected, and modeled evidence.", zh: "成本材料混合了实测、估算、推算与建模证据。" },
    disposition: { en: "Preserve evidence class and the pre-migration snapshot date on every claim.", zh: "每项声明保留证据类别与迁移前快照日期。" },
  },
  {
    id: "W3-06",
    issue: { en: "Workstation-selected models differ from tracked defaults.", zh: "工作站选择的模型与仓库跟踪默认值不同。" },
    disposition: { en: "Do not claim repository-default alignment.", zh: "不声明与仓库默认配置一致。" },
  },
] as const;

const p1Artifacts = [
  { phase: "1.1", name: { en: "Toolchain and core-stack smoke", zh: "工具链与核心栈 smoke" }, run: "20260527T093100Z-phase-1-1-smoke", sha: "b5668d9", command: "make doctor / up-core / gen", href: "/case-studies/p1-reliability-lab/results/phase-1.1-smoke.json" },
  { phase: "1.2", name: { en: "CDC correctness smoke", zh: "CDC 正确性 smoke" }, run: "20260527T133945Z-58e25cd1", sha: "b2434d1", command: "make test-cdc", href: "/case-studies/p1-reliability-lab/results/phase-1.2-cdc-smoke.json" },
  { phase: "2.1", name: { en: "Five-failure reconciliation", zh: "五类故障对账" }, run: "20260527T151754Z-ef73a5a5", sha: "b2434d1", command: "make eo-verify", href: "/case-studies/p1-reliability-lab/results/eo_reconciliation.json" },
  { phase: "2.2", name: { en: "Iceberg small-file rewrite", zh: "Iceberg 小文件重写" }, run: "20260527T155713Z-a88e18f6", sha: "ad7ad52", command: "make small-file-rewrite", href: "/case-studies/p1-reliability-lab/results/iceberg_small_file_rewrite.json" },
  { phase: "2.3", name: { en: "Checkpoint pressure capture", zh: "检查点压力捕获" }, run: "20260527T233135Z-0b65b846", sha: "ce084a5", command: "make ckpt-metrics", href: "/case-studies/p1-reliability-lab/results/checkpoint_metrics.json" },
] as const;

function Section({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`proof-section ${className}`}>
      <div className="page-shell">
        <h2>{title}</h2>
        {children}
      </div>
    </section>
  );
}

function ReleaseProof() {
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
    <Section title={dict.evidence} className="tinted-section">
      <div className="release-summary">
        <div className="gate-panel">
          <div className="panel-heading">
            <ShieldCheck aria-hidden="true" />
            <div>
              <strong>{locale === "en" ? "Funded live aggregate gates" : "付费在线聚合门禁"}</strong>
              <span>{locale === "en" ? "44 scenarios x 3 trials = 132 graph runs" : "44 个场景 x 3 次试验 = 132 次图运行"}</span>
            </div>
          </div>
          <div className="metric-table" role="table" aria-label={locale === "en" ? "Release gate metrics" : "发布门禁指标"}>
            {releaseMetrics.map(([name, value, threshold]) => (
              <div role="row" key={name.en}>
                <span role="cell">{name[locale]}</span><strong role="cell">{value}</strong><code role="cell">{threshold}</code><Check role="cell" aria-label={locale === "en" ? "pass" : "通过"} />
              </div>
            ))}
          </div>
        </div>
        <aside className="residual-panel">
          <CircleAlert aria-hidden="true" />
          <p>{locale === "en" ? "Strict all-trials residual" : "全试验严格残差"}</p>
          <strong>30 / 44</strong>
          <span>{locale === "en" ? "scenarios had outcome_pass: false. Aggregate success is not universal scenario success." : "场景的 outcome_pass 为 false。聚合通过不等于所有场景通过。"}</span>
        </aside>
      </div>
      <div className="classification-row">
        <p>{locale === "en" ? "Cost evidence, dated 2026-07-08 and pre-migration" : "成本证据：日期为 2026-07-08，且早于迁移"}</p>
        <div>
          {costClasses.map(([label, detail]) => <span key={label}><strong>{label}</strong>{detail}</span>)}
        </div>
      </div>
      <div className="finding-table" role="table" aria-label={locale === "en" ? "Sanitized consistency findings" : "脱敏一致性 findings"}>
        <div className="finding-head" role="row"><span role="columnheader">ID</span><span role="columnheader">{locale === "en" ? "Audit finding" : "审计发现"}</span><span role="columnheader">{locale === "en" ? "Public disposition" : "公开处理"}</span></div>
        {releaseFindings.map((finding) => <div role="row" key={finding.id}><code role="cell">{finding.id}</code><span role="cell">{finding.issue[locale]}</span><strong role="cell">{finding.disposition[locale]}</strong></div>)}
      </div>
      <p className="evidence-link"><a href="/case-studies/release-guardian/data/findings.csv">{locale === "en" ? "Inspect all 13 sanitized findings (CSV)" : "查看全部 13 项脱敏 findings（CSV）"}</a></p>
      <OptionalMedia candidates={[
        { src: "/case-studies/release-guardian/screenshots/risk-guardrail.png", alt: { en: "Sanitized deterministic risk guardrail", zh: "脱敏后的确定性风险门禁" }, caption: { en: "Approved sanitized risk-factor view; its exact hash is recorded in the immutable evidence manifest.", zh: "已批准的脱敏风险因子视图；其精确哈希记录在不可变证据清单中。" } },
        { src: "/case-studies/release-guardian/screenshots/pipeline-trace-stub.png", alt: { en: "Sanitized deterministic stub pipeline trace", zh: "脱敏后的确定性 stub 流水线 trace" }, caption: { en: "Deterministic stub design trace only; timing marks are not a live-performance benchmark.", zh: "仅为确定性 stub 设计 trace；时间标记不是在线性能基准。" } },
        { src: "/case-studies/release-guardian/screenshots/evaluation-stub.png", alt: { en: "Sanitized deterministic stub evaluation", zh: "脱敏后的确定性 stub 评估" }, caption: { en: "Deterministic stub only: 15 of 44 scenarios were flagged by the strict all-trials view; not live performance.", zh: "仅为确定性 stub：严格全试验视图标记了 44 个场景中的 15 个；不是在线性能。" } },
      ]} />
    </Section>
  );
}

function P1Proof() {
  const { locale, dict } = useI18n();
  return (
    <Section title={dict.evidence} className="tinted-section">
      <div className="era-grid">
        <div className="era-label"><span>{locale === "en" ? "Historical public evidence" : "历史公开证据"}</span><strong>{locale === "en" ? "May capture" : "五月捕获"}</strong><p>{locale === "en" ? "Result JSON, charts, dashboard capture, and incident runbook at evidence commit 47b4268." : "证据提交 47b4268 下的结果 JSON、图表、面板截图与事故 runbook。"}</p></div>
        <div className="era-label current"><span>{locale === "en" ? "Later local-Mac reproduction" : "后续本地 Mac 复现"}</span><strong>20260711T034018Z-local-mac</strong><p>{locale === "en" ? "Evidence commit 7eab9c3. The result applies only to the recorded environment." : "证据提交 7eab9c3。结果仅适用于已记录环境。"}</p></div>
      </div>
      <div className="artifact-table" role="table" aria-label={locale === "en" ? "Historical p1 evidence artifacts" : "p1 历史证据产物"}>
        <div className="artifact-head" role="row"><span role="columnheader">{locale === "en" ? "Phase / artifact" : "阶段 / 产物"}</span><span role="columnheader">Run ID</span><span role="columnheader">Git SHA</span><span role="columnheader">{locale === "en" ? "Command" : "命令"}</span></div>
        {p1Artifacts.map((artifact) => <a role="row" href={artifact.href} key={artifact.phase}><span role="cell"><code>{artifact.phase}</code><strong>{artifact.name[locale]}</strong></span><code role="cell">{artifact.run}</code><code role="cell">{artifact.sha}</code><code role="cell">{artifact.command}</code></a>)}
      </div>
      <div className="failure-table">
        <div className="failure-head"><span>{locale === "en" ? "Induced failure" : "注入故障"}</span><span>{locale === "en" ? "Recovery path" : "恢复路径"}</span><span>{locale === "en" ? "Audit" : "审计"}</span></div>
        {p1Failures.map((failure) => <div key={failure.name}><code>{failure.name}</code><span><LocalizedText text={failure.detail} /></span><strong><Check aria-hidden="true" />{locale === "en" ? "Zero diff / IDs consistent" : "零差异 / ID 一致"}</strong></div>)}
      </div>
      <OptionalMedia candidates={[
        { src: "/case-studies/p1-reliability-lab/media/phase-1.4-dashboard.jpg", alt: { en: "Historical evidence dashboard for the captured p1 run", zh: "p1 历史捕获运行的证据面板" }, caption: { en: "Historical dashboard. It proves only the captured May run.", zh: "历史面板，仅证明五月捕获的运行。" } },
        { src: "/case-studies/p1-reliability-lab/media/phase-2.2-small-file-rewrite.svg", alt: { en: "Historical Iceberg small-file rewrite evidence", zh: "历史 Iceberg 小文件重写证据" }, caption: { en: "Historical maintenance evidence from the May artifact set.", zh: "五月产物集中的历史维护证据。" } },
      ]} />
    </Section>
  );
}

function RagProof() {
  const { locale, dict } = useI18n();
  const checks = locale === "en" ? ["S1 corpus adapter", "S1-answerable question adapter", "Deterministic manifest", "Backend-aware verifier", "A3 wrapper", "Ruff and test suite"] : ["S1 语料适配器", "S1 可回答问题适配器", "确定性清单", "后端感知校验器", "A3 wrapper", "Ruff 与测试套件"];
  return (
    <Section title={dict.evidence} className="tinted-section">
      <div className="rag-floor">
        <div><span>{locale === "en" ? "Documents in the bounded S1 scope" : "S1 有界范围内文档"}</span><strong>11,309</strong></div>
        <div><span>{locale === "en" ? "S1-answerable questions" : "S1 可回答问题"}</span><strong>130</strong></div>
        <div><span>{locale === "en" ? "Passing tests" : "通过测试"}</span><strong>68</strong></div>
      </div>
      <div className="check-grid">{checks.map((item) => <span key={item}><Check aria-hidden="true" />{item}</span>)}</div>
      <div className="not-claimed"><CircleAlert aria-hidden="true" /><p><strong>{locale === "en" ? "C3 closed without metrics." : "C3 已结束且无指标。"}</strong>{locale === "en" ? " The real hybrid dependencies and uncached reranker were unavailable inside the offline timebox; no toy fallback was substituted." : " 离线限时内缺少真实混合检索依赖与未缓存重排器；没有使用玩具替代方案。"}</p></div>
    </Section>
  );
}

function PrivacyProof() {
  const { locale, dict } = useI18n();
  const paths = locale === "en" ? [
    ["Text", "Deterministic entity replacement with review"],
    ["PNG / JPEG", "OCR-guided raster redaction"],
    ["Image-only PDF", "Destructive rendering and validation"],
  ] : [
    ["文本", "可审查的确定性实体替换"],
    ["PNG / JPEG", "OCR 引导的栅格脱敏"],
    ["纯图像 PDF", "破坏式渲染与校验"],
  ];
  return (
    <Section title={dict.evidence} className="tinted-section">
      <div className="privacy-paths">{paths.map(([label, detail], index) => <div key={label}><span>{String(index + 1).padStart(2, "0")}</span><strong>{label}</strong><p>{detail}</p></div>)}</div>
      <div className="text-redaction-proof">
        <div><span>{locale === "en" ? "Synthetic input" : "合成输入"}</span><code>Synthetic demo record for Ada Example. Contact ada@example.com or 415-555-0188. Draft: /Users/demo/Private/brief.txt</code></div>
        <div><span>{locale === "en" ? "Redacted output" : "脱敏输出"}</span><code>Synthetic demo record for Ada Example. Contact [EMAIL] or [PHONE]. Draft: [LOCAL_PATH]</code></div>
      </div>
      <div className="verification-strip"><ShieldCheck aria-hidden="true" /><p><strong>{locale === "en" ? "Documented local verification" : "已记录的本地验证"}</strong><span>{locale === "en" ? "95 tests passed and the Swift build succeeded in the documented environment." : "在记录环境中，95 项测试通过且 Swift 构建成功。"}</span></p></div>
      <div className="redline-grid">
        <span><Check aria-hidden="true" /><strong>{locale === "en" ? "Text" : "文本"}</strong>{locale === "en" ? "Email, phone, and local path replaced in the synthetic fixture." : "合成夹具中的邮箱、电话与本地路径均被替换。"}</span>
        <span><Check aria-hidden="true" /><strong>{locale === "en" ? "Raster" : "栅格图"}</strong>{locale === "en" ? "Detected regions and manual rectangles were burned into a fresh PNG export." : "检测区域与手动矩形被烧录进全新 PNG 导出。"}</span>
        <span><Check aria-hidden="true" /><strong>PDF</strong>{locale === "en" ? "Three known terms absent, text layer empty, and no unapplied redaction annotation." : "三个已知词项均不存在、文本层为空，且无未应用脱敏标注。"}</span>
      </div>
      <OptionalMedia candidates={[
        { src: "/case-studies/privacy-preflight/swiftui-app.png", alt: { en: "Privacy Preflight SwiftUI development app", zh: "Privacy Preflight SwiftUI 开发应用" }, caption: { en: "Current development app running against the local worker; not a signed or notarized distribution.", zh: "当前开发应用连接本地 worker 运行；不是已签名或公证的分发版本。" } },
        { src: "/case-studies/privacy-preflight/image-synthetic-input.png", alt: { en: "Fictional image input before redaction", zh: "脱敏前的虚构图片输入" }, caption: { en: "Synthetic PNG input; all identity data is fictional.", zh: "合成 PNG 输入；所有身份数据均为虚构。" } },
        { src: "/case-studies/privacy-preflight/image-synthetic-redacted.png", alt: { en: "Fictional image output after redaction", zh: "脱敏后的虚构图片输出" }, caption: { en: "Fresh PNG export after OCR-guided redaction.", zh: "OCR 引导脱敏后的全新 PNG 导出。" } },
        { src: "/case-studies/privacy-preflight/pdf-synthetic-input-preview.png", alt: { en: "Fictional PDF input preview", zh: "虚构 PDF 输入预览" }, caption: { en: "Synthetic PDF input preview.", zh: "合成 PDF 输入预览。" } },
        { src: "/case-studies/privacy-preflight/pdf-synthetic-redacted-preview.png", alt: { en: "Destructive PDF redaction preview", zh: "破坏式 PDF 脱敏预览" }, caption: { en: "Image-only PDF output; the validation record reports an empty extractable text layer.", zh: "纯图像 PDF 输出；验证记录显示可提取文本层为空。" } },
      ]} />
    </Section>
  );
}

function AnalyticsProof() {
  const { locale, dict } = useI18n();
  return (
    <Section title={dict.evidence} className="tinted-section">
      <div className="analytics-pair">
        <article><p>{locale === "en" ? "Business intelligence" : "商业智能"}</p><h3>{locale === "en" ? "E-commerce funnel, RFM, and segmentation" : "电商漏斗、RFM 与客户分群"}</h3><span>{locale === "en" ? "A public Tableau surface for inspecting customer movement and segment views. No funnel or segment figures are quoted here." : "通过公开 Tableau 界面检查客户流转与分群视图；本页不引用漏斗或分群数字。"}</span></article>
        <article><p>{locale === "en" ? "Model interaction" : "模型交互"}</p><h3>{locale === "en" ? "Bilingual risk exploration" : "双语风险探索"}</h3><span>{locale === "en" ? "A Streamlit demo for model switching, synthetic inputs, and a predict_proba-driven approve-or-block interaction. No validation metric is claimed." : "Streamlit 演示支持模型切换、合成输入，以及由 predict_proba 驱动的批准或拦截交互；不声明验证指标。"}</span></article>
      </div>
    </Section>
  );
}

function Architecture({ project }: { project: Project }) {
  const { dict } = useI18n();
  return (
    <Section title={dict.architecture}>
      <ol className="architecture-flow">
        {project.architecture.map((step, index) => <li key={step.label.en}><span>{String(index + 1).padStart(2, "0")}</span><div><strong><LocalizedText text={step.label} /></strong><p><LocalizedText text={step.detail} /></p></div></li>)}
      </ol>
    </Section>
  );
}

function Notes({ project }: { project: Project }) {
  const { dict } = useI18n();
  return (
    <section className="notes-section">
      <div className="page-shell notes-grid">
        <div><h2>{dict.provenance}</h2><ul>{project.provenance.map((item) => <li key={item.en}><LocalizedText text={item} /></li>)}</ul></div>
        <div><h2>{dict.boundaries}</h2><ul>{project.boundaries.map((item) => <li key={item.en}><LocalizedText text={item} /></li>)}</ul></div>
      </div>
    </section>
  );
}

const proofByProject: Record<ProjectId, () => React.JSX.Element> = {
  "release-guardian": ReleaseProof,
  "p1-reliability-lab": P1Proof,
  "rag-quality-lab": RagProof,
  "privacy-preflight-mac": PrivacyProof,
  "analytics-tandem": AnalyticsProof,
};

export default function ProjectProof({ project }: { project: Project }) {
  const Proof = proofByProject[project.slug];
  return <><Architecture project={project} /><Proof /><Notes project={project} /></>;
}

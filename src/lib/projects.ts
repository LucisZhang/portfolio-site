import type { LocalizedString } from "./i18n";

export type TrackId = "analytics" | "engineering" | "ai";
export type ProjectId =
  | "release-guardian"
  | "p1-reliability-lab"
  | "rag-quality-lab"
  | "privacy-preflight-mac"
  | "analytics-tandem";

export interface Track {
  id: TrackId;
  label: LocalizedString;
  thesis: LocalizedString;
}

export interface ProjectLink {
  label: LocalizedString;
  href: string;
}

export interface ArchitectureStep {
  label: LocalizedString;
  detail: LocalizedString;
}

export interface Project {
  slug: ProjectId;
  track: TrackId;
  title: LocalizedString;
  eyebrow: LocalizedString;
  summary: LocalizedString;
  problem: LocalizedString;
  audience: LocalizedString;
  role: LocalizedString;
  outcome: LocalizedString;
  stack: string[];
  architecture: ArchitectureStep[];
  provenance: LocalizedString[];
  boundaries: LocalizedString[];
  links: ProjectLink[];
}

export const tracks: Track[] = [
  {
    id: "engineering",
    label: { en: "Data engineering", zh: "数据工程" },
    thesis: {
      en: "Failure-aware pipelines, reconciliation, and evidence that survives inspection.",
      zh: "面向故障的数据管道、对账机制，以及经得起检查的证据。",
    },
  },
  {
    id: "analytics",
    label: { en: "Data analytics", zh: "数据分析" },
    thesis: {
      en: "Decision interfaces grounded in inspectable public artifacts, without borrowed metrics.",
      zh: "用可检查的公开产物支撑决策界面，不借用未经核实的指标。",
    },
  },
  {
    id: "ai",
    label: { en: "AI applications", zh: "AI 应用" },
    thesis: {
      en: "Applied AI systems with evaluation contracts, human gates, and explicit operating limits.",
      zh: "以评估契约、人工门禁和明确运行边界支撑 AI 应用系统。",
    },
  },
];

export const projects: Project[] = [
  {
    slug: "release-guardian",
    track: "ai",
    title: { en: "Release Guardian", zh: "Release Guardian" },
    eyebrow: { en: "AI application / release engineering", zh: "AI 应用 / 发布工程" },
    summary: {
      en: "A production-shaped change-impact and risk gatekeeper that gathers evidence, grades release risk, pauses for approval, and publishes only through the approved branch.",
      zh: "一个面向生产形态的变更影响与风险门禁系统：收集证据、评定发布风险、暂停等待审批，并仅通过获批分支发布。",
    },
    problem: {
      en: "Release decisions need dependency evidence, bounded model behavior, and a durable approval record before an automated action can publish.",
      zh: "自动化发布之前，需要依赖证据、受约束的模型行为，以及可持久审计的审批记录。",
    },
    audience: {
      en: "Platform, release-engineering, and applied-AI tooling teams that need defensible change approvals.",
      zh: "需要可辩护变更审批的平台工程、发布工程与应用 AI 工具团队。",
    },
    role: {
      en: "Designed and built the multi-service workflow, deterministic and live evaluation harnesses, approval boundary, audit path, and observability surface.",
      zh: "设计并构建多服务工作流、确定性与在线评估框架、审批边界、审计路径和可观测界面。",
    },
    outcome: {
      en: "In the funded live evaluation, all eight aggregate gates passed across 132 graph runs. The stricter scenario view still flagged 30 of 44 scenarios and is reported beside the gate result.",
      zh: "在付费在线评估中，132 次图运行的八项聚合门禁全部通过；更严格的场景视图仍标记了 44 个场景中的 30 个，并与门禁结果并列呈现。",
    },
    stack: ["LangGraph", "FastAPI", "Go", "Spring Boot", "PostgreSQL + pgvector", "OpenTelemetry", "Next.js"],
    architecture: [
      { label: { en: "Intake", zh: "接入" }, detail: { en: "Classify and parse an incoming change.", zh: "分类并解析传入的变更。" } },
      { label: { en: "Evidence", zh: "证据" }, detail: { en: "Run four evidence retrievers in parallel.", zh: "并行运行四个证据检索器。" } },
      { label: { en: "Risk", zh: "风险" }, detail: { en: "Aggregate, grade, plan, and validate.", zh: "聚合、分级、制定计划并校验。" } },
      { label: { en: "Approval", zh: "审批" }, detail: { en: "Interrupt durably before publish.", zh: "发布前持久化中断并等待审批。" } },
      { label: { en: "Audit", zh: "审计" }, detail: { en: "Publish through the approved branch and record the decision.", zh: "仅通过获批分支发布并记录决策。" } },
    ],
    provenance: [
      {
        en: "Funded live report dated 2026-07-11: 44 scenarios, three trials, 132 graph runs; raw report is archive-only and not tracked in the source repository.",
        zh: "2026-07-11 付费在线报告：44 个场景、每场景三次试验、132 次图运行；原始报告仅存在于归档中，不在源码仓库内。",
      },
      {
        en: "System and delivery claims are bounded to source commit ca2ef58 and the W2/W3 claims-and-evidence audit.",
        zh: "系统与交付声明限定于源码提交 ca2ef58 以及 W2/W3 声明证据审计。",
      },
      {
        en: "The exact nine-file sanitized package was approved after its immutable candidate manifest was generated; the approval record is published separately.",
        zh: "九文件脱敏包在不可变候选清单生成后按精确哈希获批；批准记录单独公开。",
      },
    ],
    boundaries: [
      {
        en: "The aggregate gate result is not a claim that every strict scenario passed; 30 of 44 scenarios had a strict all-trials residual.",
        zh: "聚合门禁通过不代表每个严格场景都通过；44 个场景中有 30 个存在全试验严格残差。",
      },
      {
        en: "No local rerun was performed on this Mac. Workstation-selected models are not the tracked repository defaults.",
        zh: "本机未进行本地重跑；工作站选择的模型并非仓库中已跟踪的默认配置。",
      },
      {
        en: "No private source link is provided. Only media that passed sanitization and exact-hash sign-off is displayed.",
        zh: "不提供私有源码链接；仅展示已通过脱敏与精确哈希签核的媒体。",
      },
    ],
    links: [
      { label: { en: "Sanitized findings table", zh: "脱敏 findings 表" }, href: "/case-studies/release-guardian/data/findings.csv" },
      { label: { en: "Architecture source", zh: "架构图源文件" }, href: "/case-studies/release-guardian/architecture.mmd" },
      { label: { en: "Publication record", zh: "发布记录" }, href: "https://github.com/LucisZhang/portfolio-site/blob/main/PUBLICATION.md" },
    ],
  },
  {
    slug: "p1-reliability-lab",
    track: "engineering",
    title: { en: "p1-reliability-lab", zh: "p1-reliability-lab" },
    eyebrow: { en: "Streaming reliability laboratory", zh: "流式可靠性实验室" },
    summary: {
      en: "A MySQL CDC to Flink to Iceberg lab that induces failures and reconciles source state, table snapshots, and event identities after recovery.",
      zh: "一个从 MySQL CDC 到 Flink 再到 Iceberg 的实验室：主动注入故障，并在恢复后对账源状态、表快照和事件身份。",
    },
    problem: {
      en: "A happy-path pipeline demo does not establish correctness when tasks, coordinators, checkpoints, savepoints, or sink commits fail.",
      zh: "成功路径演示无法证明任务、协调器、检查点、保存点或 sink 提交故障时仍保持正确。",
    },
    audience: {
      en: "Data and platform engineers who need auditable streaming correctness under induced failure.",
      zh: "需要审计故障注入下流式正确性的数据工程与平台工程团队。",
    },
    role: {
      en: "Built the lab, deterministic event generator, failure harness, reconciliation contract, incident runbook, and evidence dashboard.",
      zh: "构建实验环境、确定性事件生成器、故障框架、对账契约、事故 runbook 和证据面板。",
    },
    outcome: {
      en: "The July U6 run completed all five induced failure classes with zero snapshot differences and consistent event-ID audits in its documented local-Mac environment.",
      zh: "七月 U6 运行在记录的本地 Mac 环境中完成五类故障注入，快照差异为零，事件 ID 审计一致。",
    },
    stack: ["MySQL CDC", "Apache Flink", "Apache Iceberg", "MinIO", "Docker Compose", "Python", "Java"],
    architecture: [
      { label: { en: "Source", zh: "数据源" }, detail: { en: "Deterministic inserts, updates, and deletes in MySQL.", zh: "在 MySQL 中生成确定性的新增、更新与删除。" } },
      { label: { en: "CDC", zh: "CDC" }, detail: { en: "Flink captures and checkpoints the changelog.", zh: "Flink 捕获变更日志并建立检查点。" } },
      { label: { en: "Table", zh: "数据表" }, detail: { en: "Iceberg stores current state and changelog evidence.", zh: "Iceberg 保存当前状态与变更日志证据。" } },
      { label: { en: "Failure", zh: "故障" }, detail: { en: "The harness triggers one bounded failure class at a time.", zh: "框架每次触发一种有边界的故障类型。" } },
      { label: { en: "Reconcile", zh: "对账" }, detail: { en: "Source, snapshot, and event-ID sets are audited after recovery.", zh: "恢复后审计源数据、快照与事件 ID 集合。" } },
    ],
    provenance: [
      {
        en: "Historical public artifacts were captured in May at evidence commit 47b4268 and include result JSON, charts, a dashboard capture, and incident notes.",
        zh: "历史公开产物于五月在证据提交 47b4268 捕获，包含结果 JSON、图表、面板截图和事故记录。",
      },
      {
        en: "The later U6 run is 20260711T034018Z-local-mac at evidence commit 7eab9c3; its exported summary and reconciliation JSON are the authority for the local-Mac result.",
        zh: "后续 U6 运行标识为 20260711T034018Z-local-mac，证据提交为 7eab9c3；导出的摘要与对账 JSON 是本地 Mac 结果的权威来源。",
      },
    ],
    boundaries: [
      {
        en: "The U6 result is environment-specific: Apple Silicon macOS with 16 GiB RAM and a Docker VM reporting 10 CPUs and about 7.65 GiB memory.",
        zh: "U6 结果依赖具体环境：Apple Silicon macOS、16 GiB 内存，Docker 虚拟机报告 10 个 CPU 和约 7.65 GiB 内存。",
      },
      {
        en: "One captured run does not establish universal hardware compatibility or one-command reproducibility. The historical dashboard proves only the run it captured.",
        zh: "一次已捕获运行不能证明通用硬件兼容性或一键复现；历史面板仅证明其捕获的那次运行。",
      },
    ],
    links: [
      { label: { en: "Public source repository", zh: "公开源码仓库" }, href: "https://github.com/LucisZhang/p1-reliability-lab" },
      { label: { en: "Reproduction guide", zh: "复现指南" }, href: "/case-studies/p1-reliability-lab/workstation-reproduction-guide.md" },
    ],
  },
  {
    slug: "rag-quality-lab",
    track: "ai",
    title: { en: "RAG Quality Lab", zh: "RAG Quality Lab" },
    eyebrow: { en: "Deterministic RAG evaluation", zh: "确定性 RAG 评估" },
    summary: {
      en: "A judge-free evaluation workbench that turns a bounded corpus and question set into deterministic manifests, adapters, backend contracts, and regression checks.",
      zh: "一个无需裁判模型的评估工作台，将有边界的语料与问题集转化为确定性清单、适配器、后端契约和回归检查。",
    },
    problem: {
      en: "RAG iteration needs a reproducible data and evaluation floor before retrieval comparisons or answer-quality claims are credible.",
      zh: "在比较检索方案或声明回答质量之前，RAG 迭代需要可复现的数据与评估基线。",
    },
    audience: {
      en: "Applied-AI and evaluation teams establishing a reproducible retrieval-test floor before quality claims.",
      zh: "在质量声明前建立可复现检索测试基线的应用 AI 与评估团队。",
    },
    role: {
      en: "Built the corpus and question adapters, deterministic manifest, backend seam, verifier, retrieval runner, tests, and operating documentation.",
      zh: "构建语料与问题适配器、确定性清单、后端接口、校验器、检索运行器、测试与运行文档。",
    },
    outcome: {
      en: "C2 is the v1 evidence floor: 11,309 S1 documents and 130 S1-answerable questions pass deterministic manifest verification and the A3 wrapper; the suite records 68 passing tests after the C3 provenance update.",
      zh: "C2 是 v1 的证据基线：11,309 份 S1 文档与 130 个 S1 可回答问题通过确定性清单验证和 A3 wrapper；C3 provenance 更新后测试套件记录 68 项通过。",
    },
    stack: ["Python", "Pytest", "Ruff", "Ollama", "Hugging Face", "Deterministic manifests"],
    architecture: [
      { label: { en: "Acquire", zh: "采集" }, detail: { en: "Mirror the bounded S1 inputs with integrity records.", zh: "镜像有边界的 S1 输入并记录完整性。" } },
      { label: { en: "Adapt", zh: "适配" }, detail: { en: "Normalize documents and answerable questions.", zh: "规范化文档与可回答问题。" } },
      { label: { en: "Manifest", zh: "清单" }, detail: { en: "Hash the exact evaluation scope deterministically.", zh: "确定性哈希精确评估范围。" } },
      { label: { en: "Run", zh: "运行" }, detail: { en: "Use a backend-aware, judge-free retrieval contract.", zh: "使用感知后端且无需裁判模型的检索契约。" } },
      { label: { en: "Verify", zh: "校验" }, detail: { en: "Fail on data drift, contract breaks, or regression.", zh: "数据漂移、契约破坏或回归时直接失败。" } },
    ],
    provenance: [
      {
        en: "Local C2 checkpoint 5944232 records the completed documentation layer after corpus, question, manifest, backend, verifier, and runner checkpoints.",
        zh: "本地 C2 检查点 5944232 记录了语料、问题、清单、后端、校验器和运行器完成后的文档层。",
      },
      {
        en: "Verification on 2026-07-12: Ruff passed, 68 tests passed, data verification passed, and the deterministic A3 wrapper passed with dependency stubs.",
        zh: "2026-07-12 校验：Ruff 通过、68 项测试通过、数据校验通过，确定性 A3 wrapper 在依赖 stub 下通过。",
      },
    ],
    boundaries: [
      {
        en: "Legacy corpus-scale and performance claims are excluded from v1. C2 proves the evaluation foundation, not answer quality.",
        zh: "v1 排除旧版语料规模与性能声明；C2 证明评估基础设施，而非回答质量。",
      },
      {
        en: "The C3 timebox closed before execution: the real hybrid stack and uncached reranker were unavailable locally, so no result artifact or fallback metric was produced. Paid judging, the full corpus, and judged replication remain out of scope.",
        zh: "C3 在执行前结束限时：本地缺少真实混合检索栈与未缓存的重排器，因此没有结果产物，也没有替代指标。付费裁判、完整语料与裁判式复现均不在范围内。",
      },
    ],
    links: [
      { label: { en: "Clean public code", zh: "公开净化代码" }, href: "https://github.com/LucisZhang/rag-quality-lab" },
      { label: { en: "C3 timebox record", zh: "C3 限时记录" }, href: "/case-studies/rag-quality-lab/c3-timebox/README.md" },
    ],
  },
  {
    slug: "privacy-preflight-mac",
    track: "ai",
    title: { en: "Privacy Preflight for Mac", zh: "Privacy Preflight for Mac" },
    eyebrow: { en: "Local-first privacy utility", zh: "本地优先隐私工具" },
    summary: {
      en: "A source-run macOS preflight utility for reviewing and redacting sensitive text and documents before they reach downstream tools or optional external models.",
      zh: "一个从源码运行的 macOS 预检工具，在敏感文本与文档进入下游工具或可选外部模型前完成审查与脱敏。",
    },
    problem: {
      en: "Sensitive material needs a reviewable redaction step before reuse, with destructive document paths validated separately from visual overlays.",
      zh: "敏感材料在复用前需要可审查的脱敏步骤，且破坏式文档路径必须与视觉遮罩分开验证。",
    },
    audience: {
      en: "Knowledge workers and application developers reviewing sensitive material before downstream reuse.",
      zh: "在下游复用前审查敏感材料的知识工作者与应用开发者。",
    },
    role: {
      en: "Built the SwiftUI client, local worker boundary, detector adapters, three redaction paths, and privacy red-line tests.",
      zh: "构建 SwiftUI 客户端、本地 worker 边界、检测器适配器、三条脱敏路径和隐私红线测试。",
    },
    outcome: {
      en: "In the documented local environment, 95 tests and the Swift build passed across text, PNG/JPEG, and destructive image-only PDF paths.",
      zh: "在记录的本地环境中，95 项测试与 Swift 构建通过，覆盖文本、PNG/JPEG 和破坏式纯图像 PDF 路径。",
    },
    stack: ["SwiftUI", "FastAPI", "OCR", "PyMuPDF", "Presidio", "HanLP"],
    architecture: [
      { label: { en: "Review", zh: "审查" }, detail: { en: "Inspect local input before export.", zh: "导出前在本地检查输入。" } },
      { label: { en: "Detect", zh: "检测" }, detail: { en: "Run deterministic and language-aware detectors.", zh: "运行确定性与语言感知检测器。" } },
      { label: { en: "Redact", zh: "脱敏" }, detail: { en: "Route text, raster images, and PDFs through distinct paths.", zh: "将文本、栅格图片和 PDF 分流处理。" } },
      { label: { en: "Validate", zh: "验证" }, detail: { en: "Apply privacy red-line checks to the produced artifact.", zh: "对产出文件执行隐私红线校验。" } },
      { label: { en: "Export", zh: "导出" }, detail: { en: "Release only the reviewed redacted result.", zh: "仅导出已审查的脱敏结果。" } },
    ],
    provenance: [
      {
        en: "Source-plus-demo evidence only at source commit 78f13d5. The hashed synthetic manifest records 95 passing tests and a successful Swift build.",
        zh: "仅提供源码加演示证据，源码提交为 78f13d5。带哈希的合成数据清单记录 95 项测试通过与 Swift 构建成功。",
      },
      {
        en: "The demonstrated paths are deterministic text redaction, PNG/JPEG redaction, and destructive image-only PDF output.",
        zh: "演示路径包括确定性文本脱敏、PNG/JPEG 脱敏，以及破坏式纯图像 PDF 输出。",
      },
    ],
    boundaries: [
      {
        en: "The external-model provider is optional; redacted-only is the default boundary. Offline operation is not claimed when an external provider is enabled.",
        zh: "外部模型提供商为可选项，默认边界是仅发送已脱敏内容；启用外部提供商时不声明离线运行。",
      },
      {
        en: "This is not a signed, notarized, or distributed app. It does not claim legal-grade redaction or mathematical irreversibility.",
        zh: "这不是已签名、公证或分发的应用，也不声明法律级脱敏或数学意义上的不可逆。",
      },
      {
        en: "PyMuPDF creates a distribution-license blocker for binary packaging; packaging remains a separate post-v1 decision.",
        zh: "PyMuPDF 对二进制打包形成分发许可阻碍；打包仍是 v1 之后的独立决策。",
      },
    ],
    links: [
      { label: { en: "Synthetic evidence manifest", zh: "合成证据清单" }, href: "/case-studies/privacy-preflight/manifest.json" },
      { label: { en: "Validated redacted PDF", zh: "已验证脱敏 PDF" }, href: "/case-studies/privacy-preflight/pdf-synthetic-redacted.pdf" },
    ],
  },
  {
    slug: "analytics-tandem",
    track: "analytics",
    title: { en: "Analytics Tandem", zh: "分析双项目" },
    eyebrow: { en: "BI exploration and model interaction", zh: "BI 探索与模型交互" },
    summary: {
      en: "One qualitative case study pairing an e-commerce decision dashboard with a bilingual interactive risk exploration demo.",
      zh: "一个定性组合案例，将电商决策仪表盘与双语交互式风险探索演示放在一起。",
    },
    problem: {
      en: "Operational reviewers need to move from customer and funnel exploration to a clear model-decision interface without treating presentation artifacts as validated performance evidence.",
      zh: "业务评审需要从客户与漏斗探索进入清晰的模型决策界面，同时不能把展示产物当作已验证的性能证据。",
    },
    audience: {
      en: "Analytics, BI, and applied-ML reviewers assessing decision interfaces rather than borrowed performance claims.",
      zh: "评估决策界面而非借用性能声明的数据分析、BI 与应用机器学习评审者。",
    },
    role: {
      en: "Created the e-commerce analysis views and the deployed bilingual Streamlit interaction for exploring model decisions with synthetic inputs.",
      zh: "制作电商分析视图，并部署双语 Streamlit 交互，用合成输入探索模型决策。",
    },
    outcome: {
      en: "The public artifacts support qualitative inspection of funnel, RFM, segmentation, model switching, synthetic inputs, and a predict_proba-driven approve-or-block demonstration.",
      zh: "公开产物支持定性检查漏斗、RFM、客户分群、模型切换、合成输入，以及由 predict_proba 驱动的批准或拦截演示。",
    },
    stack: ["Tableau", "Streamlit", "Python", "predict_proba"],
    architecture: [
      { label: { en: "Explore", zh: "探索" }, detail: { en: "Inspect e-commerce funnel and customer behavior.", zh: "检查电商漏斗与客户行为。" } },
      { label: { en: "Segment", zh: "分群" }, detail: { en: "Use RFM and segmentation views to organize questions.", zh: "用 RFM 与分群视图组织分析问题。" } },
      { label: { en: "Switch", zh: "切换" }, detail: { en: "Choose among the models exposed by the demo.", zh: "在演示提供的模型之间切换。" } },
      { label: { en: "Simulate", zh: "模拟" }, detail: { en: "Enter synthetic cases in either interface language.", zh: "用任一界面语言输入合成案例。" } },
      { label: { en: "Decide", zh: "决策" }, detail: { en: "Show the approve-or-block outcome from predict_proba.", zh: "展示由 predict_proba 产生的批准或拦截结果。" } },
    ],
    provenance: [
      {
        en: "The Tableau dashboard, Hugging Face Space, and clean GitHub repository are public inspection surfaces.",
        zh: "Tableau 仪表盘、Hugging Face Space 与净化后的 GitHub 仓库是公开检查界面。",
      },
    ],
    boundaries: [
      {
        en: "This page makes no dataset-size, funnel-rate, segment-size, class-balance, validation, or model-performance claim.",
        zh: "本页不声明数据集规模、漏斗比率、分群规模、类别平衡、验证结果或模型性能。",
      },
      {
        en: "The model interaction is a demonstration with synthetic inputs, not production risk approval or verified predictive performance.",
        zh: "模型交互是使用合成输入的演示，不代表生产风险审批或已验证的预测性能。",
      },
    ],
    links: [
      { label: { en: "Tableau dashboard", zh: "Tableau 仪表盘" }, href: "https://public.tableau.com/app/profile/lucis.zhang/viz/Ecommerce_RFM_and_Funnel_Analysis/Dashboard1" },
      { label: { en: "Interactive demo", zh: "交互演示" }, href: "https://huggingface.co/spaces/Luciss007/Risk-Control-Portfolio" },
      { label: { en: "Public code", zh: "公开代码" }, href: "https://github.com/LucisZhang/Risk-Control-Portfolio" },
    ],
  },
];

export const featuredProjects = projects;

export function getTrack(id: string) {
  return tracks.find((track) => track.id === id);
}

export function getProjectsForTrack(track: TrackId) {
  return projects.filter((project) => project.track === track);
}

export function getProject(track: string, slug: string) {
  return projects.find((project) => project.track === track && project.slug === slug);
}

export function isTrackId(value: string): value is TrackId {
  return value === "analytics" || value === "engineering" || value === "ai";
}

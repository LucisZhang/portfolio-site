import type { LocalizedString } from "./i18n";

export type TrackId = "analytics" | "engineering" | "ai";
export type ProjectId =
  | "release-guardian"
  | "p1-reliability-lab"
  | "rag-quality-lab"
  | "privacy-preflight-mac"
  | "margin-control-tower"
  | "credit-policy-lab"
  | "analytics-tandem";

export interface Track {
  id: TrackId;
  label: LocalizedString;
  thesis: LocalizedString;
}

export interface ProjectLink {
  label: LocalizedString;
  href?: string;
  pending?: LocalizedString;
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
  legacy?: boolean;
}

export const tracks: Track[] = [
  {
    id: "engineering",
    label: { en: "Data engineering", zh: "数据工程" },
    thesis: {
      en: "I break pipelines on purpose, then check recovery against source, table, and event state.",
      zh: "我主动让数据管道发生故障，再对照源端、表和事件状态检查恢复结果。",
    },
  },
  {
    id: "analytics",
    label: { en: "Data analytics", zh: "数据分析" },
    thesis: {
      en: "I build decision tools from governed data and make every assumption visible.",
      zh: "我从定义清楚的数据出发构建决策工具，并把每一项假设写明。",
    },
  },
  {
    id: "ai",
    label: { en: "AI applications", zh: "AI 应用" },
    thesis: {
      en: "I build AI applications with repeatable checks, human approval, and clear operating limits.",
      zh: "我用可重复检查、人工审批和明确的运行限制来构建 AI 应用。",
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
      en: "I built a release gatekeeper that gathers code, schema, API, and operations evidence, grades risk, and pauses for a human decision before anything publishes.",
      zh: "我做了一个发布风险门禁：收集代码、Schema、API 与运维证据，评估风险，并在发布前暂停等待人工审批，只通过已获批分支发布。",
    },
    problem: {
      en: "Before code ships automatically, someone needs to know what it touches, keep the model inside clear limits, and leave a durable approval record.",
      zh: "自动发布之前，需要有证据支持、有边界的模型行为，以及经得起事后审计的审批记录。",
    },
    audience: {
      en: "Platform, release-engineering, and applied-AI teams that need to review and explain automated change decisions.",
      zh: "需要可辩护变更审批的平台工程、发布工程与应用 AI 工具团队。",
    },
    role: {
      en: "I designed and built the multi-service workflow, deterministic and live evaluation harnesses, human approval gate, audit trail, and observability views.",
      zh: "设计并构建多服务工作流、确定性与在线评估框架、审批边界、审计路径和可观测界面。",
    },
    outcome: {
      en: "In the funded live evaluation, all eight aggregate gates passed across 132 graph runs. The stricter scenario view still flagged 30 of 44 scenarios and is reported beside the gate result.",
      zh: "在付费在线评估中，132 次图运行的八项聚合门禁全部通过；更严格的场景视图仍标记了 44 个场景中的 30 个，并与门禁结果并列呈现。",
    },
    stack: ["LangGraph", "FastAPI", "Go", "Spring Boot", "PostgreSQL + pgvector", "OpenTelemetry", "Next.js"],
    architecture: [
      { label: { en: "Intake", zh: "接入" }, detail: { en: "Classify and parse an incoming change.", zh: "分类并解析传入的变更。" } },
      { label: { en: "Evidence", zh: "证据" }, detail: { en: "Gather code, schema, API, and operations evidence in parallel.", zh: "并行运行四个证据检索器。" } },
      { label: { en: "Risk", zh: "风险" }, detail: { en: "Grade the change, build a plan, and check both against the rules.", zh: "聚合、分级、制定计划并校验。" } },
      { label: { en: "Approval", zh: "审批" }, detail: { en: "Pause and wait for a human decision before publish.", zh: "发布前持久化中断并等待审批。" } },
      { label: { en: "Audit", zh: "审计" }, detail: { en: "Publish through the approved branch and record the decision.", zh: "仅通过获批分支发布并记录决策。" } },
    ],
    provenance: [
      {
        en: "Funded live report dated 2026-07-11: 44 scenarios, three trials, 132 graph runs; raw report is archive-only and not tracked in the source repository.",
        zh: "2026-07-11 付费在线报告：44 个场景、每场景三次试验、132 次图运行；原始报告仅存在于归档中，不在源码仓库内。",
      },
      {
        en: "System and delivery details come from source commit ca2ef58 and the W2/W3 review of claims against their source files.",
        zh: "系统与交付声明限定于源码提交 ca2ef58 以及 W2/W3 声明证据审计。",
      },
      {
        en: "The exact nine-file sanitized package was approved after its immutable candidate manifest was generated; the approval record is published separately.",
        zh: "九文件脱敏包在不可变候选清单生成后按精确哈希获批；批准记录单独公开。",
      },
    ],
    boundaries: [
      {
        en: "Aggregate pass does not mean every scenario passed strictly: 30 of 44 scenarios failed at least one criterion across all trials.",
        zh: "聚合门禁通过不代表每个严格场景都通过；44 个场景中有 30 个存在全试验严格残差。",
      },
      {
        en: "No local rerun was performed on this Mac. Workstation-selected models are not the tracked repository defaults.",
        zh: "本机未进行本地重跑；工作站选择的模型并非仓库中已跟踪的默认配置。",
      },
      {
        en: "The private source is not linked. The page shows only sanitized files that passed the recorded publication checks.",
        zh: "不提供私有源码链接；仅展示已通过脱敏与精确哈希签核的媒体。",
      },
    ],
    links: [
      { label: { en: "Public sanitized demo source", zh: "公开脱敏演示源码" }, href: "https://github.com/LucisZhang/portfolio-site/tree/codex/portfolio-phase2/src/components/release" },
      { label: { en: "View findings", zh: "脱敏审查记录" }, href: "/case-studies/release-guardian/data/findings.csv" },
      { label: { en: "Open architecture", zh: "架构图源文件" }, href: "/case-studies/release-guardian/architecture.mmd" },
      { label: { en: "Read publication record", zh: "发布记录" }, href: "https://github.com/LucisZhang/portfolio-site/blob/main/PUBLICATION.md" },
    ],
  },
  {
    slug: "p1-reliability-lab",
    track: "engineering",
    title: { en: "p1-reliability-lab", zh: "p1-reliability-lab" },
    eyebrow: { en: "Streaming reliability laboratory", zh: "流式可靠性实验室" },
    summary: {
      en: "I built a MySQL-to-Flink-to-Iceberg lab that injects failures on purpose, then reconciles source state, table snapshots, and event IDs after recovery.",
      zh: "我做了一个从 MySQL CDC 到 Flink 再到 Iceberg 的实验室：主动注入故障，并在恢复后对照源状态、表快照和事件 ID。",
    },
    problem: {
      en: "A happy-path demo cannot show what happens when a task, coordinator, checkpoint, savepoint, or sink commit fails.",
      zh: "成功路径演示无法证明任务、协调器、检查点、保存点或 sink 提交故障时仍保持正确。",
    },
    audience: {
      en: "Data and platform engineers who need to inspect recovery and reconciliation before trusting a streaming pipeline.",
      zh: "需要审计故障注入下流式正确性的数据工程与平台工程团队。",
    },
    role: {
      en: "I built the lab, deterministic event generator, failure harness, reconciliation checks, incident runbook, and recorded-run dashboard.",
      zh: "我构建了实验环境、确定性事件生成器、故障框架、对账检查、事故 runbook 和已记录运行面板。",
    },
    outcome: {
      en: "The July U6 run completed all five induced failure classes with zero snapshot differences and consistent event-ID audits in its documented local-Mac environment.",
      zh: "七月 U6 运行在记录的本地 Mac 环境中完成五类故障注入，快照差异为零，事件 ID 审计一致。",
    },
    stack: ["MySQL CDC", "Apache Flink", "Apache Iceberg", "MinIO", "Docker Compose", "Python", "Java"],
    architecture: [
      { label: { en: "Source", zh: "数据源" }, detail: { en: "Deterministic inserts, updates, and deletes in MySQL.", zh: "在 MySQL 中生成确定性的新增、更新与删除。" } },
      { label: { en: "CDC", zh: "CDC" }, detail: { en: "Flink captures and checkpoints the changelog.", zh: "Flink 捕获变更日志并建立检查点。" } },
      { label: { en: "Table", zh: "数据表" }, detail: { en: "Iceberg stores the current state and change history.", zh: "Iceberg 保存当前状态与变更日志证据。" } },
      { label: { en: "Failure", zh: "故障" }, detail: { en: "The harness triggers one recorded failure type at a time.", zh: "框架每次触发一种有边界的故障类型。" } },
      { label: { en: "Reconcile", zh: "对账" }, detail: { en: "Check source, snapshot, and event-ID sets after recovery.", zh: "恢复后审计源数据、快照与事件 ID 集合。" } },
    ],
    provenance: [
      {
        en: "The May public run files come from commit 47b4268 and include result JSON, charts, a dashboard capture, and incident notes.",
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
      { label: { en: "GitHub repository", zh: "公开源码仓库" }, href: "https://github.com/LucisZhang/p1-reliability-lab" },
      { label: { en: "Read reproduction guide", zh: "复现指南" }, href: "/case-studies/p1-reliability-lab/workstation-reproduction-guide.md" },
    ],
  },
  {
    slug: "rag-quality-lab",
    track: "ai",
    title: { en: "RAG Quality Lab", zh: "RAG Quality Lab" },
    eyebrow: { en: "Deterministic RAG evaluation", zh: "确定性 RAG 评估" },
    summary: {
      en: "I built a judge-free RAG workbench that turns a fixed document set and question list into hashed manifests, backend contracts, and repeatable regression checks.",
      zh: "我做了一个无需裁判模型的 RAG 评估工作台，把固定的文档集和问题列表转成带哈希的清单、后端契约和可重复回归检查。",
    },
    problem: {
      en: "Before comparing retrieval methods or better answers, RAG work needs a data and test setup that can be rerun and checked.",
      zh: "在比较检索方案或声明回答质量之前，RAG 迭代需要可复现的数据与评估基线。",
    },
    audience: {
      en: "Applied-AI and evaluation engineers who need a reproducible test foundation before comparing retrieval or answer quality.",
      zh: "在质量声明前建立可复现检索测试基线的应用 AI 与评估团队。",
    },
    role: {
      en: "I built the document and question adapters, deterministic manifest, backend interface, verifier, retrieval runner, tests, and operating docs.",
      zh: "构建语料与问题适配器、确定性清单、后端接口、校验器、检索运行器、测试与运行文档。",
    },
    outcome: {
      en: "At the current checkpoint, 11,309 S1 documents and 130 answerable questions pass manifest verification, and the suite records 68 passing tests. This checks the setup, not answer quality.",
      zh: "在当前检查点，11,309 份文档与 130 个可回答问题通过了清单校验，测试套件记录 68 项通过。这证明的是评估基础设施本身，而不是回答质量。",
    },
    stack: ["Python", "Pytest", "Ruff", "Ollama", "Hugging Face", "Deterministic manifests"],
    architecture: [
      { label: { en: "Acquire", zh: "采集" }, detail: { en: "Mirror the fixed S1 inputs and record their integrity.", zh: "镜像有边界的 S1 输入并记录完整性。" } },
      { label: { en: "Adapt", zh: "适配" }, detail: { en: "Normalize documents and answerable questions.", zh: "规范化文档与可回答问题。" } },
      { label: { en: "Manifest", zh: "清单" }, detail: { en: "Hash the exact evaluation scope deterministically.", zh: "确定性哈希精确评估范围。" } },
      { label: { en: "Run", zh: "运行" }, detail: { en: "Use a backend-aware, judge-free retrieval contract.", zh: "使用感知后端且无需裁判模型的检索契约。" } },
      { label: { en: "Verify", zh: "校验" }, detail: { en: "Fail on data drift, contract breaks, or regression.", zh: "数据漂移、契约破坏或回归时直接失败。" } },
    ],
    provenance: [
      {
        en: "Local evidence checkpoint 6c887a1 contains the C2 corpus, question, manifest, backend, verifier, and runner work plus the C3 no-results record.",
        zh: "本地证据检查点 6c887a1 包含语料、问题、清单、后端、校验器与运行器的工作，以及一次没有产生结果的限时评估记录。",
      },
      {
        en: "Verification on 2026-07-12: Ruff passed, 68 tests passed, data verification passed, and the deterministic A3 wrapper passed with dependency stubs.",
        zh: "2026-07-12 校验：Ruff 通过、68 项测试通过、数据校验通过，确定性检索契约在依赖 stub 下也通过。",
      },
    ],
    boundaries: [
      {
        en: "Legacy corpus-scale and performance results are excluded from v1. C2 checks the evaluation foundation, not answer quality.",
        zh: "v1 不包含旧版的语料规模或性能声明；当前检查点证明的是评估基础设施，而不是回答质量。",
      },
      {
        en: "C3 ended before execution because the real hybrid stack and uncached reranker were unavailable locally. It produced no result file and no fallback metric.",
        zh: "一次限时评估在执行前结束：本地缺少真实混合检索依赖与未缓存的重排器，因此没有产生结果文件，也没有使用替代指标；付费裁判、完整语料与裁判式复现都不在这次范围内。",
      },
      {
        en: "The public repository remains at baseline commit 0fc1433; the local C2 checkpoints have not been synced. The linked code is therefore labeled as a public baseline, not as the C2 implementation.",
        zh: "公开仓库仍停留在基线提交 0fc1433；本地检查点的工作尚未同步过去，因此这里的链接标注为公开基线，而不是当前实现。",
      },
    ],
    links: [
      { label: { en: "Current claim reconciliation PR", zh: "当前声明核对 PR" }, href: "https://github.com/LucisZhang/rag-quality-lab/pull/1" },
      { label: { en: "View current results", zh: "当前声明注册表" }, href: "/case-studies/rag-quality-lab/claim-registry.json" },
      { label: { en: "Read C3 timebox record", zh: "C3 限时记录" }, href: "/case-studies/rag-quality-lab/c3-timebox/README.md" },
    ],
  },
  {
    slug: "privacy-preflight-mac",
    track: "ai",
    title: { en: "Privacy Preflight Web + Mac", zh: "Privacy Preflight Web + Mac" },
    eyebrow: { en: "Browser-local redaction workbench", zh: "浏览器本地脱敏工作台" },
    summary: {
      en: "I built a Mac app for reviewing sensitive text, images, and PDFs, then brought the same review flow to a browser workspace with local OCR and destructive export checks.",
      zh: "我先做了一个 Mac 应用，用来复核和脱敏敏感文本、图片与 PDF，再把同样的流程搬进浏览器：检测、复核、破坏式脱敏，导出前验证。",
    },
    problem: {
      en: "Sensitive material needs a careful review step before sharing, and destructive redaction must be checked separately from a visual overlay.",
      zh: "敏感材料在复用前需要可审查的脱敏步骤，且破坏式文档路径必须与视觉遮罩分开验证。",
    },
    audience: {
      en: "People reviewing sensitive material in desktop or mobile browsers, plus developers building a review step into an application.",
      zh: "在桌面或移动浏览器中处理敏感材料的知识工作者，以及构建下游复用流程的应用开发者。",
    },
    role: {
      en: "I built the SwiftUI baseline, then ported its review model to TypeScript with same-origin OCR and PDF workers, pixel burn-in, and fail-closed export checks.",
      zh: "先构建 SwiftUI 基线，再将复核模型移植为浏览器本地 TypeScript 工作区，加入同源 OCR/PDF worker、确定性检测、像素烧录与 fail-closed 导出验证。",
    },
    outcome: {
      en: "The Mac baseline records 95 passing tests and a successful Swift build. The web workspace now executes text review, same-origin OCR, fresh PNG burn-in, and verified image-only PDF reconstruction in the browser.",
      zh: "Mac 基线记录 95 项测试通过与 Swift 构建成功；网页工作区现可在浏览器内执行文本复核、同源 OCR、全新 PNG 像素烧录和经验证的纯图像 PDF 重建。",
    },
    stack: ["TypeScript", "Canvas", "Web Workers", "Tesseract.js", "PDF.js", "pdf-lib", "Web Crypto", "SwiftUI"],
    architecture: [
      { label: { en: "Review", zh: "审查" }, detail: { en: "Look at the local input before changing it.", zh: "导出前在本地检查输入。" } },
      { label: { en: "Detect", zh: "检测" }, detail: { en: "Run text rules or local OCR inside the browser.", zh: "运行确定性文本规则或同源本地 OCR。" } },
      { label: { en: "Redact", zh: "脱敏" }, detail: { en: "Handle text, raster images, and PDFs through separate paths.", zh: "将文本、栅格图片和 PDF 分流处理。" } },
      { label: { en: "Validate", zh: "验证" }, detail: { en: "Reopen outputs and check hashes, pixels, text layers, annotations, and document structure.", zh: "重新打开输出并检查哈希、像素、文本层、annotation 与文档结构。" } },
      { label: { en: "Export", zh: "导出" }, detail: { en: "Release only the reviewed redacted result.", zh: "仅导出已审查的脱敏结果。" } },
    ],
    provenance: [
      {
        en: "Source-plus-demo evidence only at source commit 78f13d5. The hashed synthetic manifest records 95 passing tests and a successful Swift build.",
        zh: "仅提供源码加演示证据，源码提交为 78f13d5。带哈希的合成数据清单记录 95 项测试通过与 Swift 构建成功。",
      },
      {
        en: "The tested paths cover text redaction, PNG/JPEG pixel burn-in, and destructive image-only PDF output.",
        zh: "演示路径包括确定性文本脱敏、PNG/JPEG 脱敏，以及破坏式纯图像 PDF 输出。",
      },
      {
        en: "The web runtime assets are generated from locked npm packages at build time. Automated browser checks allow only same-origin GET requests while user content is being processed.",
        zh: "网页运行资产在构建时由锁定的 npm 包生成；自动化浏览器检查确认处理用户内容时仅允许同源 GET 请求。",
      },
    ],
    boundaries: [
      {
        en: "An external model is optional and receives redacted content only by default. The app is not described as offline when that provider is enabled.",
        zh: "外部模型提供商为可选项，默认边界是仅发送已脱敏内容；启用外部提供商时不声明离线运行。",
      },
      {
        en: "The Mac build is not signed, notarized, or distributed. Neither version promises legal-grade redaction or mathematical irreversibility.",
        zh: "这不是已签名、公证或分发的应用，也不声明法律级脱敏或数学意义上的不可逆。",
      },
      {
        en: "PyMuPDF creates a distribution-license blocker for binary packaging; packaging remains a separate post-v1 decision.",
        zh: "PyMuPDF 对二进制打包形成分发许可阻碍；打包仍是 v1 之后的独立决策。",
      },
      {
        en: "Browser OCR can miss or mis-box text and still needs human review. Image-only PDF export removes search, selection, links, and accessibility structure and is limited to 20 MB, 20 pages, and the recorded render limits.",
        zh: "浏览器 OCR 可能漏检或框选错误，仍需人工复核；纯图像 PDF 导出会有意移除搜索、选择、链接与无障碍结构，并限制为 20 MB、20 页和有界渲染尺寸。",
      },
    ],
    links: [
      { label: { en: "Use the web app", zh: "使用网页版" }, href: "#privacy-web-app" },
      { label: { en: "macOS version", zh: "macOS 版本" }, href: "#privacy-macos-status" },
      { label: { en: "Web implementation source", zh: "网页版源码" }, pending: { en: "Source publication pending", zh: "源码发布待定" } },
      { label: { en: "View test manifest", zh: "合成证据清单" }, href: "/case-studies/privacy-preflight/manifest.json" },
      { label: { en: "Review documented PDF output", zh: "查看已记录的 PDF 输出" }, href: "/case-studies/privacy-preflight/pdf-synthetic-redacted.pdf" },
    ],
  },
  {
    slug: "margin-control-tower",
    track: "analytics",
    title: { en: "Margin Control Tower", zh: "Margin Control Tower" },
    eyebrow: { en: "Analytics engineering / margin decisions", zh: "分析工程 / 毛利决策" },
    summary: { en: "I built a browser tool that traces weekly contribution-margin changes to discounts, returns, cost of goods, and fulfillment, then tests a synthetic promotion scenario before recording an action.", zh: "我做了一个浏览器工具，用来追查每周贡献毛利变化的原因：折扣、退货、成本与履约，然后测试一次促销方案，再用留出的合成周期验证。" },
    problem: { en: "Looking only at revenue hides margin loss from discounts, returns, cost of goods, and fulfillment, leaving a category manager without a way to test a response.", zh: "只看收入会掩盖折扣、退货、成本与履约造成的毛利流失，品类经理也就没法验证自己的应对方案。" },
    audience: { en: "E-commerce category managers and analytics engineers who need to test a margin decision, not just chart it.", zh: "电商品类经理与分析工程团队。" },
    role: { en: "I built the fixed-seed generator, data contracts, metric definitions, diagnosis and scenario engine, holdout check, browser UI, and tests.", zh: "构建固定 seed 生成器、契约与指标注册表、诊断/情景引擎、holdout 检查、浏览器界面和测试。" },
    outcome: { en: "The demo checks its data before diagnosing an injected margin anomaly, recomputes a promotion scenario, and records a category action that can be reviewed.", zh: "稳定演示会运行十项数据检查，诊断一个明确标注的注入异常，重新计算一次促销方案，并生成可审查的行动建议。" },
    stack: ["TypeScript", "Fixed-seed JSON", "Metric registry", "Data contracts", "Static Next.js"],
    architecture: [
      { label: { en: "Generate", zh: "生成" }, detail: { en: "Build a fixed-seed fictional weekly margin fixture.", zh: "生成固定 seed 的虚构周度毛利夹具。" } },
      { label: { en: "Contract", zh: "契约" }, detail: { en: "Stop if the schema, grain, source label, or accounting math drifts.", zh: "schema、粒度、来源或会计恒等式出现漂移时，校验失败即停止。" } },
      { label: { en: "Diagnose", zh: "诊断" }, detail: { en: "Decompose an injected category margin anomaly.", zh: "分解一个注入的品类毛利异常。" } },
      { label: { en: "Simulate", zh: "模拟" }, detail: { en: "Apply a disclosed promotion elasticity assumption.", zh: "应用公开说明的促销弹性假设。" } },
      { label: { en: "Verify", zh: "验证" }, detail: { en: "Compare a later synthetic week and record action.", zh: "比较后续合成周并记录行动。" } },
    ],
    provenance: [
      { en: "Greenfield rebuild generated from seed 2026071301; all 9,360 rows across 52 weeks are synthetic and newly computed.", zh: "Greenfield 重建使用 seed 2026071301；覆盖 52 周的 9,360 条记录全部为合成且本轮新计算。" },
      { en: "The inherited Tableau/RFM dashboard is prior work only and is not evidence for this rebuild.", zh: "继承的 Tableau/RFM 仪表盘仅为 prior work，不是本重建的证据。" },
    ],
    boundaries: [
      { en: "Synthetic currency and injected anomalies do not show real lift, detection accuracy, or causal impact.", zh: "合成货币与注入异常不证明真实提升、检测精度或因果影响。" },
      { en: "The scenario uses a disclosed elasticity assumption and is not a forecast.", zh: "情景使用公开说明的弹性假设，不是预测。" },
    ],
    links: [
      { label: { en: "Margin Control Tower source", zh: "Margin Control Tower 源码" }, pending: { en: "Source publication pending", zh: "源码等待公开授权" } },
      { label: { en: "Read project README", zh: "项目 README" }, href: "/case-studies/margin-control-tower/README.md" },
      { label: { en: "Open data contract", zh: "数据契约" }, href: "/case-studies/margin-control-tower/data-contract.json" },
    ],
  },
  {
    slug: "credit-policy-lab",
    track: "analytics",
    title: { en: "Credit Policy Lab", zh: "Credit Policy Lab" },
    eyebrow: { en: "Risk analytics / policy governance", zh: "风险分析 / 策略治理" },
    summary: { en: "I built a browser lab that keeps a synthetic risk score separate from expected-loss math, policy thresholds, review capacity, monitoring, and the final recorded decision.", zh: "一个确定性浏览器实验室，将合成分数、校准、预期损失、策略阈值、复核容量、vintage 监控与审计分离。" },
    problem: { en: "A probability and one cutoff cannot capture loss economics, review capacity, score drift, or the human decision that sets policy.", zh: "一个概率和单一 cutoff 无法表达损失经济、复核容量、漂移和人工策略决策。" },
    audience: { en: "Credit policy managers, risk analysts, and applied-ML governance teams that need to inspect the decision, not just the score.", zh: "信贷策略经理、风险分析师与应用机器学习治理团队。" },
    role: { en: "I built the fictional application data, score-to-policy contracts, expected-loss and queue engine, monitoring, audit flow, browser UI, and tests.", zh: "构建虚构组合、分数到策略契约、预期损失与队列引擎、合成监控、审计流程、浏览器界面和测试。" },
    outcome: { en: "The demo recomputes approve, review, and decline bands, queue overflow, expected loss, synthetic calibration, vintage drift, descriptive slices, and a policy audit record.", zh: "演示重算批准/复核/拒绝分段、队列溢出、预期损失成本、合成校准、vintage 漂移、描述性切片和策略审计记录。" },
    stack: ["TypeScript", "Fixed-seed JSON", "Policy engine", "Backtesting", "PSI", "Static Next.js"],
    architecture: [
      { label: { en: "Score", zh: "分数" }, detail: { en: "Load synthetic raw and calibrated probability of default.", zh: "载入有边界的合成原始与校准 PD。" } },
      { label: { en: "Economics", zh: "经济" }, detail: { en: "Compute expected loss from PD, LGD, and EAD.", zh: "由 PD、LGD 与 EAD 计算预期损失。" } },
      { label: { en: "Policy", zh: "策略" }, detail: { en: "Apply approve, review, and decline thresholds.", zh: "应用批准、复核与拒绝阈值。" } },
      { label: { en: "Review", zh: "复核" }, detail: { en: "Enforce analyst-capacity constraints.", zh: "执行分析师容量约束。" } },
      { label: { en: "Monitor", zh: "监控" }, detail: { en: "Backtest vintages, PSI, slices, and audit changes.", zh: "回测 vintage、PSI、切片并审计变更。" } },
    ],
    provenance: [
      { en: "Greenfield rebuild generated from seed 2026071302; all 12,000 applications, scores, loans, and outcomes are fictional.", zh: "Greenfield 重建使用 seed 2026071302；12,000 个申请、分数、贷款和结果全部虚构。" },
      { en: "The inherited Streamlit/HF demo is prior work only; no original model is claimed as recovered or validated.", zh: "继承的 Streamlit/HF 演示仅为 prior work；不声明原模型已恢复或验证。" },
    ],
    boundaries: [
      { en: "Synthetic Brier, PSI, loss, and slice values are fixture results, not real performance or fairness evidence.", zh: "合成 Brier、PSI、损失与切片数值是夹具结果，不是真实性能或公平性声明。" },
      { en: "The lab does not process PII or represent regulatory compliance, deployed accuracy, or a real applicant decision.", zh: "不声明 PII、监管合规、部署准确率或真实申请人决策。" },
    ],
    links: [
      { label: { en: "Credit Policy Lab source", zh: "Credit Policy Lab 源码" }, pending: { en: "Source publication pending", zh: "源码等待公开授权" } },
      { label: { en: "Read project README", zh: "项目 README" }, href: "/case-studies/credit-policy-lab/README.md" },
      { label: { en: "Open policy contract", zh: "策略契约" }, href: "/case-studies/credit-policy-lab/policy-contract.json" },
      { label: { en: "Prior Streamlit demo", zh: "先前 Streamlit 演示" }, href: "https://huggingface.co/spaces/Luciss007/Risk-Control-Portfolio" },
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
      { label: { en: "Interactive demo", zh: "交互演示" }, href: "https://huggingface.co/spaces/Luciss007/Risk-Control-Portfolio" },
      { label: { en: "Public code", zh: "公开代码" }, href: "https://github.com/LucisZhang/Risk-Control-Portfolio" },
    ],
    legacy: true,
  },
];

export const featuredProjects = projects.filter((project) => !project.legacy);

export function getTrack(id: string) {
  return tracks.find((track) => track.id === id);
}

export function getProjectsForTrack(track: TrackId) {
  return projects.filter((project) => project.track === track && !project.legacy);
}

export function getProject(track: string, slug: string) {
  return projects.find((project) => project.track === track && project.slug === slug);
}

export function isTrackId(value: string): value is TrackId {
  return value === "analytics" || value === "engineering" || value === "ai";
}

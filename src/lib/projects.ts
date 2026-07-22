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
  metrics: LocalizedString;
  problem: LocalizedString;
  audience: LocalizedString;
  role: LocalizedString;
  outcome: LocalizedString;
  stack: LocalizedString[];
  architecture: ArchitectureStep[];
  provenance: LocalizedString[];
  boundaries: LocalizedString[];
  links: ProjectLink[];
  legacy?: boolean;
}

function projectStack(...items: Array<string | LocalizedString>): LocalizedString[] {
  return items.map((item) => (typeof item === "string" ? { en: item, zh: item } : item));
}

export const tracks: Track[] = [
  {
    id: "ai",
    label: { en: "AI applications", zh: "AI 应用" },
    thesis: {
      en: "I build AI applications with repeatable checks, human approval, and clear operating limits.",
      zh: "我用可重复检查、人工审批和明确的运行限制来构建 AI 应用。",
    },
  },
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
];

export const projects: Project[] = [
  {
    slug: "release-guardian",
    track: "ai",
    title: { en: "Release Guardian", zh: "发布守门人" },
    eyebrow: { en: "AI application / release engineering", zh: "AI 应用 / 发布工程" },
    summary: {
      en: "A 13-node LangGraph release gate: four evidence retrievers, deterministic validators, bounded retries — and the publish decision stays with a human.",
      zh: "13 节点 LangGraph 发布门禁：四个证据检索器、确定性验证器、有限重试——发布决策由人工做出。",
    },
    metrics: { en: "132 live graph runs · 8/8 aggregate gates passed · 100% citation fidelity", zh: "132 次在线图运行 · 8/8 聚合门禁通过 · 引用忠实度 100%" },
    problem: {
      en: "Before code ships automatically, someone needs to know what it touches, keep the model inside clear limits, and leave a durable approval record.",
      zh: "代码自动发布前，必须厘清影响范围，将模型约束在清晰边界内，并留存持久可查的审批记录。",
    },
    audience: {
      en: "Platform, release-engineering, and applied-AI teams that have to review automated change decisions — and then explain them.",
      zh: "平台、发布工程与 AI 应用团队——他们需要审阅自动化的变更判定，并解释其理由。",
    },
    role: {
      en: "I designed the four-retriever workflow and its bounded validator retries, then built the services around it in Python, Go, Java, and TypeScript: the human approval gate, the observability layer, and a tamper-evident SHA-256 audit hash chain.",
      zh: "我先设计了一套由四类证据检索器组成的工作流，以及有界校验重试机制，再以此流程为核心，用 Python、Go、Java 和 TypeScript 构建了人工审批关卡、可观测层，以及可检测篡改的 SHA-256 审计哈希链。",
    },
    outcome: {
      en: "In the funded live evaluation, all eight aggregate gates passed across 132 graph runs, with 100% citation fidelity, zero tool misuse, and 100% injection defense.",
      zh: "付费在线评估覆盖 132 次图运行，八项聚合门禁全部通过；引用忠实度 100%、工具误用率为 0、注入防御率 100%。",
    },
    stack: projectStack("LangGraph", "FastAPI", "Go", "Spring Boot", "PostgreSQL + pgvector", "OpenTelemetry", "Next.js"),
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
        zh: "聚合通过并不代表每个场景都严格通过：44 个场景中有 30 个在所有试验中至少有一项指标未通过。",
      },
      {
        en: "No local rerun was performed on this Mac. Workstation-selected models are not the tracked repository defaults.",
        zh: "本机未进行本地重跑；工作站选择的模型并非仓库中已跟踪的默认配置。",
      },
      {
        en: "The private source is not linked. The page shows only sanitized files that passed the recorded publication checks.",
        zh: "私有源码未提供链接；页面仅展示已通过记录中的发布检查的脱敏文件。",
      },
    ],
    links: [
      { label: { en: "GitHub repository", zh: "GitHub 仓库" }, href: "https://github.com/LucisZhang/portfolio-site" },
    ],
  },
  {
    slug: "p1-reliability-lab",
    track: "engineering",
    title: { en: "Streaming Reliability Lab", zh: "流式可靠性实验室" },
    eyebrow: { en: "MySQL CDC → Flink → Iceberg · failure injection", zh: "MySQL CDC → Flink → Iceberg · 故障注入" },
    summary: {
      en: "I break a MySQL-to-Flink-to-Iceberg pipeline on purpose, then check that source state, table snapshots, and event IDs still agree after recovery.",
      zh: "我故意破坏 MySQL→Flink→Iceberg 管道，恢复后核对源状态、表快照与事件 ID 仍一致。",
    },
    metrics: { en: "5 induced failure classes · 0 snapshot diffs after recovery", zh: "5 类故障注入 · 恢复后快照差异为 0" },
    problem: {
      en: "A happy-path demo cannot show what happens when a task, coordinator, checkpoint, savepoint, or sink commit fails.",
      zh: "成功路径演示无法展示任务、协调器、检查点、保存点或 sink 提交失败时会发生什么。",
    },
    audience: {
      en: "Data and platform engineers who need to inspect recovery and reconciliation before trusting a streaming pipeline.",
      zh: "需要审计故障注入下流式正确性的数据工程与平台工程团队。",
    },
    role: {
      en: "I built all of it: the deterministic event generator, the failure harness, the reconciliation checks, the incident runbook, and the recorded-run dashboard.",
      zh: "我全程自建：确定性事件生成器、故障注入框架、对账检查、事故处置手册和已记录运行面板。",
    },
    outcome: {
      en: "The July U6 run completed all five induced failure classes with zero snapshot differences and consistent event-ID audits after recovery.",
      zh: "七月 U6 运行完成五类注入故障；恢复后快照差异为零，事件 ID 审计保持一致。",
    },
    stack: projectStack("MySQL CDC", "Apache Flink", "Apache Iceberg", "MinIO", "Docker Compose", "Python", "Java"),
    architecture: [
      { label: { en: "Source", zh: "数据源" }, detail: { en: "Deterministic inserts, updates, and deletes in MySQL.", zh: "在 MySQL 中生成确定性的新增、更新与删除。" } },
      { label: { en: "CDC", zh: "CDC" }, detail: { en: "Flink captures and checkpoints the changelog.", zh: "Flink 捕获变更日志并建立检查点。" } },
      { label: { en: "Table", zh: "数据表" }, detail: { en: "Iceberg stores the current state and change history.", zh: "Iceberg 保存当前状态与变更日志证据。" } },
      { label: { en: "Failure", zh: "故障" }, detail: { en: "The harness triggers one recorded failure type at a time.", zh: "框架每次触发一种已记录的故障类型。" } },
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
    ],
  },
  {
    slug: "rag-quality-lab",
    track: "ai",
    title: { en: "RAG Quality Lab", zh: "RAG 质量实验室" },
    eyebrow: { en: "Deterministic RAG evaluation", zh: "确定性 RAG 评估" },
    summary: {
      en: "I built this RAG workbench to work without an LLM judge: a fixed document set and question list become hashed manifests, backend contracts, and repeatable regression checks.",
      zh: "我搭建的 RAG 工作台不用 LLM 当裁判：固定文档集和问题列表会生成带哈希的清单、后端契约和可复现的回归检查。",
    },
    metrics: { en: "11,309 docs hashed · 130 questions · 68 tests passing", zh: "11,309 份文档已哈希 · 130 个问题 · 68 项测试通过" },
    problem: {
      en: "Before you can compare retrieval methods — or claim better answers — RAG work needs a data and test setup that can be rerun and checked.",
      zh: "比较检索方法或声称答案更优之前，RAG 工作需要的是可重跑、可核验的数据与测试配置。",
    },
    audience: {
      en: "Applied-AI and evaluation engineers who want a reproducible foundation in place before making any quality comparison.",
      zh: "AI 应用与评估工程师，希望在比较质量之前先建立可复现的测试基础。",
    },
    role: {
      en: "I built the document and question adapters, deterministic manifest, backend interface, verifier, retrieval runner, tests, and operating docs.",
      zh: "构建语料与问题适配器、确定性清单、后端接口、校验器、检索运行器、测试与运行文档。",
    },
    outcome: {
      en: "At the current checkpoint, 11,309 S1 documents and 130 answerable questions pass manifest verification, and the suite records 68 passing tests across the evaluation foundation.",
      zh: "在当前检查点，11,309 份文档与 130 个可回答问题通过清单校验，评估基础设施共有 68 项测试通过。",
    },
    stack: projectStack(
      "Python",
      "Chroma",
      { en: "BM25 + cross-encoder rerank", zh: "BM25 + 交叉编码器重排" },
      "Sentence Transformers",
      "LangChain",
      { en: "Deterministic manifests", zh: "确定性清单" },
    ),
    architecture: [
      { label: { en: "Acquire", zh: "采集" }, detail: { en: "Mirror the fixed S1 inputs and record their integrity.", zh: "镜像固定的 S1 输入并记录其完整性。" } },
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
        en: "Historical 12-question corpus only; does not transfer to the 11,309-document S1 checkpoint.",
        zh: "仅适用于历史 12 问题语料；不能迁移解释为 11,309 文档 S1 检查点的结果。",
      },
      {
        en: "Legacy corpus-scale and performance results are excluded from v1. C2 checks the evaluation foundation, not answer quality.",
        zh: "v1 不包含旧版的语料规模或性能声明；当前检查点证明的是评估基础设施，而不是回答质量。",
      },
      {
        en: "C3 ended before execution because the real hybrid stack and uncached reranker were unavailable locally. It produced no result file and no fallback metric.",
        zh: "C3 在执行前终止，因为本地无法提供真实的混合检索栈和未缓存的重排器；未产生结果文件，也未使用替代指标。",
      },
      {
        en: "The public repository remains at baseline commit 0fc1433; the local C2 checkpoints have not been synced. The linked code is therefore labeled as a public baseline, not as the C2 implementation.",
        zh: "公开仓库仍停留在基线提交 0fc1433；本地检查点的工作尚未同步过去，因此这里的链接标注为公开基线，而不是当前实现。",
      },
    ],
    links: [
      { label: { en: "GitHub repository", zh: "GitHub 仓库" }, href: "https://github.com/LucisZhang/rag-quality-lab" },
    ],
  },
  {
    slug: "privacy-preflight-mac",
    track: "ai",
    title: { en: "Privacy Preflight Web", zh: "隐私预检网页版" },
    eyebrow: { en: "Browser-local redaction workbench", zh: "浏览器本地脱敏工作台" },
    summary: {
      en: "A browser-local workbench for reviewing sensitive text, images, and multi-page PDFs with English + Simplified Chinese OCR and destructive export checks.",
      zh: "一套浏览器本地工作台，用于审阅敏感文本、图片与多页 PDF，支持英文与简体中文 OCR 及破坏式导出检查。",
    },
    metrics: {
      en: "96 embedded-worker tests · 67 recorded browser cases · OCR 19/19 hits / 2 false positives",
      zh: "96 项嵌入式 worker 测试 · 67 个已记录浏览器案例 · OCR 命中 19/19 / 误报 2",
    },
    problem: {
      en: "Sensitive material needs a careful review step before sharing, and a visual black box is not proof of redaction — the destruction itself has to be checked.",
      zh: "敏感材料分享前需仔细审阅，而视觉上的黑块覆盖不等于完成脱敏——破坏性处理本身必须被核验。",
    },
    audience: {
      en: "Anyone reviewing sensitive material in a desktop or mobile browser, plus developers who want the same review step inside their own applications.",
      zh: "任何在桌面或移动浏览器中审阅敏感材料的人，以及希望将这一复核环节嵌入自身应用的开发者。",
    },
    role: {
      en: "I built the TypeScript review model, same-origin OCR and PDF workers, editable redaction regions, pixel burn-in, and fail-closed export checks.",
      zh: "我构建了 TypeScript 复核模型、同源 OCR 与 PDF worker、可编辑脱敏区域、像素烧录，以及 fail-closed（失败即拦截）的导出校验。",
    },
    outcome: {
      en: "The browser workbench covers reviewed text, image, and multi-page PDF redaction, with local OCR, before/after comparison, and verified rebuilt outputs.",
      zh: "浏览器工作台已覆盖文本、图片与多页 PDF 脱敏，并提供本地 OCR、前后对照和重建输出验证。",
    },
    stack: projectStack("TypeScript", "Canvas", "Web Workers", "Tesseract.js", "PDF.js", "pdf-lib", "Web Crypto"),
    architecture: [
      { label: { en: "Review", zh: "审查" }, detail: { en: "Look at the local input before changing it.", zh: "修改前先查看本地输入。" } },
      { label: { en: "Detect", zh: "检测" }, detail: { en: "Run text rules or local OCR inside the browser.", zh: "运行确定性文本规则或同源本地 OCR。" } },
      { label: { en: "Redact", zh: "脱敏" }, detail: { en: "Handle text, raster images, and PDFs through separate paths.", zh: "将文本、栅格图片和 PDF 分流处理。" } },
      { label: { en: "Validate", zh: "验证" }, detail: { en: "Reopen outputs and check hashes, pixels, text layers, annotations, and document structure.", zh: "重新打开输出文件，逐一校验哈希值、像素、文本图层、批注与文档结构。" } },
      { label: { en: "Export", zh: "导出" }, detail: { en: "Release only the reviewed redacted result.", zh: "仅导出已审查的脱敏结果。" } },
    ],
    provenance: [
      {
        en: "The fixed seven-fixture OCR benchmark ran the complete browser-equivalent multi-pass union: 19/19 expected-value hits, 21 detections, 2 false positives, and 90.5% precision. This is synthetic fixture evidence, not a claim of general OCR accuracy.",
        zh: "固定的 7 组 OCR 夹具运行了与浏览器等价的完整多路结果并集：预期值命中 19/19、检测 21 项、误报 2 项、精确率 90.5%。这是合成夹具证据，不代表通用 OCR 准确率。",
      },
      {
        en: "The browser workflow recorded 67 passing end-to-end cases for text, image, and PDF review, with separate embedded-worker verification covering the local processing path.",
        zh: "浏览器流程记录了 67 个通过的端到端案例，覆盖文本、图片与 PDF 复核；本地处理路径另有嵌入式 worker 验证。",
      },
    ],
    boundaries: [
      {
        en: "OCR can miss, misread, or mis-box text, so every selected region and output still needs human review. The browser workflow does not claim legal-grade redaction or mathematical irreversibility.",
        zh: "OCR 仍可能漏检、误读或框选错误，因此每个选中区域及输出都需要人工复核。浏览器流程不声明法律级脱敏或数学意义上的不可逆。",
      },
      {
        en: "Image-only PDF export intentionally removes search, selection, links, forms, and accessibility structure. The browser path remains limited to 20 MB, 20 pages, and the recorded render-pixel limits.",
        zh: "纯图像 PDF 导出会有意移除搜索、选择、链接、表单与无障碍结构。浏览器路径仍限制为 20 MB、20 页及已记录的渲染像素上限。",
      },
      {
        en: "An external model remains optional and receives redacted content only by default. The workflow is not described as offline when that provider is enabled.",
        zh: "外部模型仍为可选项，默认仅接收已脱敏内容；启用外部提供商时，不将该流程描述为离线运行。",
      },
    ],
    links: [
      { label: { en: "GitHub repository", zh: "GitHub 仓库" }, href: "https://github.com/LucisZhang/privacy-preflight-web" },
    ],
  },
  {
    slug: "margin-control-tower",
    track: "analytics",
    title: { en: "Margin Control Tower", zh: "毛利控制塔" },
    eyebrow: { en: "Analytics engineering / margin decisions", zh: "分析工程 / 毛利决策" },
    summary: { en: "When weekly contribution margin drops, this browser tool traces the change to discounts, returns, cost of goods, and fulfillment, then tests a synthetic promotion scenario before recording an action.", zh: "每周贡献毛利下降时，这个浏览器工具把变化拆到折扣、退货、商品成本、履约四个驱动因素，并在记录行动前先测试合成促销情景。" },
    metrics: { en: "9,360 rows · traces a −10.3K margin anomaly to its cost drivers · 10 fail-closed contract checks", zh: "9,360 行 · 将 −10.3K 毛利异常追溯到成本驱动项 · 10 项 fail-closed（失败即拦截）契约检查" },
    problem: { en: "A revenue-only view hides the margin lost to discounts, returns, cost of goods, and fulfillment, and gives a category manager no way to test a response.", zh: "只看收入会看不见折扣、退货、商品成本、履约这四类因素造成的毛利损失，品类经理也没法测试应对方案。" },
    audience: { en: "E-commerce category managers and analytics engineers who need to test a margin decision, not just chart it.", zh: "本页面面向电商品类经理与数据分析工程师，帮助他们验证毛利决策，而非仅将决策绘制成图表。" },
    role: { en: "I built the fixed-seed generator, data contracts, metric definitions, diagnosis and scenario engine, holdout check, browser UI, and tests.", zh: "我搭建了固定 seed 生成器、数据契约、指标定义、诊断与情景引擎、留出期校验、浏览器界面，以及全套测试。" },
    outcome: { en: "The demo checks its own data first, then diagnoses an injected margin anomaly, recomputes a promotion scenario, and records a category action for review.", zh: "演示先检查数据，再诊断注入的毛利异常，重算促销情景，然后记录一项品类行动供复核。" },
    stack: projectStack(
      { en: "Data contracts", zh: "数据契约" },
      { en: "Metric registry", zh: "指标注册表" },
      { en: "Margin-bridge decomposition", zh: "贡献毛利变动拆解" },
      { en: "Holdout validation", zh: "留出期验证" },
      "Parquet + DuckDB-WASM",
    ),
    architecture: [
      { label: { en: "Generate", zh: "生成" }, detail: { en: "Build a fixed-seed fictional weekly margin fixture.", zh: "生成固定 seed 的虚构周度毛利夹具。" } },
      { label: { en: "Contract", zh: "契约" }, detail: { en: "Stop if the schema, grain, source label, or accounting math drifts.", zh: "数据模式、粒度、来源标签或核算逻辑任一漂移，即刻中止。" } },
      { label: { en: "Diagnose", zh: "诊断" }, detail: { en: "Decompose an injected category margin anomaly.", zh: "分解一个注入的品类毛利异常。" } },
      { label: { en: "Simulate", zh: "模拟" }, detail: { en: "Apply a disclosed promotion elasticity assumption.", zh: "应用公开说明的促销弹性假设。" } },
      { label: { en: "Verify", zh: "验证" }, detail: { en: "Compare a later synthetic week and record action.", zh: "比较后续合成周并记录行动。" } },
    ],
    provenance: [
      { en: "Greenfield rebuild generated from seed 2026071301; all 9,360 rows across 52 weeks are synthetic and newly computed.", zh: "基于 seed 2026071301 从零重建；52 周共 9,360 行均为合成数据，且均为本轮重新计算。" },
      { en: "The source toggle requests real data first: the browser loads and verifies olist-margin.parquet through DuckDB-WASM by default. If that offline-pipeline artifact is missing or invalid, the real path fails closed, stays labeled pending or blocked, and falls back to the governed synthetic fixture.", zh: "来源切换优先请求真实数据：浏览器默认通过 DuckDB-WASM 加载并校验 olist-margin.parquet。若该离线管道产物缺失或无效，真实路径直接阻断，状态保持标注为 pending 或 blocked，并单独回退至受约束的合成数据。" },
      { en: "Real mode loads the committed Olist aggregate produced from 99,441 orders and 112,650 item rows under CC BY-NC-SA 4.0 (retrieved 2026-07-17); source-table hashes, transport commit, transforms, and proxy boundaries are embedded in the Parquet metadata.", zh: "真实模式载入由 99,441 个订单与 112,650 条商品明细生成的已提交 Olist 聚合产物，许可证为 CC BY-NC-SA 4.0（获取于 2026-07-17）；Parquet 元数据内嵌源表哈希、传输 commit、转换与代理边界。" },
      { en: "Measured fields use observed order items and freight after payment/review reconciliation; discounts, returns, and COGS remain explicitly documented proxies. The first observed week of each category falls back to current item price and therefore has zero proxy discount.", zh: "实测字段来自支付/评价对账后的订单明细与运费；折扣、退货和 COGS 仍是明确记录的代理值。各品类首个观测周回填当前商品价格，因此代理折扣为零。" },
      { en: "The inherited Tableau/RFM dashboard is prior work only and is not evidence for this rebuild.", zh: "继承的 Tableau/RFM 仪表盘仅为既往成果，不构成本次重建的证据。" },
    ],
    boundaries: [
      { en: "Synthetic currency and injected anomalies do not show real lift, detection accuracy, or causal impact.", zh: "合成货币与注入异常不证明真实提升、检测精度或因果影响。" },
      { en: "The scenario uses a disclosed elasticity assumption and is not a forecast.", zh: "情景使用公开说明的弹性假设，不是预测。" },
      { en: "Olist detection and elasticity results appear only from committed detection-report.json and elasticity-report.json files; missing reports remain visibly pending and never render placeholder results.", zh: "Olist 检测与弹性结果只会来自已提交的 detection-report.json 与 elasticity-report.json；报告缺失时保持明确的待提交状态，不会渲染占位结果。" },
      { en: "Detection precision and recall evaluate six deterministic perturbations on observed Mondays after the real totals are reindexed to a complete Monday calendar; 11 weeks with no derived cells are zero-filled. No manually labeled real anomaly is claimed, and neither calendar-completion rows nor perturbations enter the Parquet artifact.", zh: "检测的精确率与召回率评估方式如下：先将真实周总额重建为完整的星期一日历，对 11 个无衍生单元的周补零，再在有观测的星期一上施加 6 个确定性扰动。不声称存在人工标注的真实异常，日历补全行与扰动均不进入 Parquet 产物。" },
      { en: "The associational elasticity coefficient is fit on the analysis window; the later eight-week holdout evaluates MAPE only. Reference price, return deductions, and 60% COGS are disclosed proxies; no causal lift, audited company margin, forecast, or production decision is claimed.", zh: "相关性弹性系数在分析期窗口内拟合；后续 8 周留出期仅用于评估 MAPE。参考价、退货扣减与 60% COGS 均为已披露的代理变量；不声称因果提升、经审计的公司毛利、预测结果或生产决策依据。" },
    ],
    links: [
      { label: { en: "GitHub repository", zh: "GitHub 仓库" }, href: "https://github.com/LucisZhang/margin-control-tower" },
    ],
  },
  {
    slug: "credit-policy-lab",
    track: "analytics",
    title: { en: "Credit Policy Lab", zh: "信贷策略实验室" },
    eyebrow: { en: "Risk analytics / policy governance", zh: "风险分析 / 策略治理" },
    summary: { en: "This browser lab keeps a synthetic risk score separate from expected-loss math, policy thresholds, review capacity, monitoring, and the final recorded decision.", zh: "浏览器实验室将合成风险评分与预期损失计算、策略阈值、复核容量、监控和最终决策留档各层分开。" },
    metrics: { en: "12,000 applications · baseline↔challenger swap set + expected-loss delta · capacity-gated policy audit", zh: "12,000 个申请 · 基准模型↔挑战模型换入换出集合 + 预期损失差额 · 容量门控的策略审计" },
    problem: { en: "A probability and one cutoff cannot capture loss economics, review capacity, score drift, or the human decision that sets policy.", zh: "单一概率与阈值无法涵盖损失经济学、复核容量、评分漂移，以及制定策略所需的人工决策。" },
    audience: { en: "Credit policy managers, risk analysts, and applied-ML governance teams whose job starts where the score ends.", zh: "信贷策略经理、风险分析师和机器学习治理团队——评分结束后，才进入他们负责的决策工作。" },
    role: { en: "I built the fictional application data, score-to-policy contracts, expected-loss and queue engine, monitoring, audit flow, browser UI, and tests.", zh: "我构建了虚构的申请数据、分数到策略契约、预期损失与队列引擎、监控模块、审计流程、浏览器界面和测试。" },
    outcome: { en: "The demo recomputes the whole decision chain: approve, review, and decline bands, queue overflow, expected loss, synthetic calibration, vintage drift, descriptive slices, and a policy audit record.", zh: "演示系统重新计算整条决策链：批准、复核、拒绝三段区间、队列溢出、预期损失、合成校准、申请批次漂移、描述性切片，以及策略审计记录。" },
    stack: projectStack(
      "PD × LGD × EAD",
      { en: "Calibration & Brier", zh: "校准与 Brier" },
      { en: "PSI / vintage monitoring", zh: "PSI / 申请批次监控" },
      { en: "Policy simulation", zh: "策略模拟" },
      { en: "Directional SHAP reason codes", zh: "SHAP 方向性原因码" },
      "Parquet + DuckDB-WASM",
    ),
    architecture: [
      { label: { en: "Score", zh: "分数" }, detail: { en: "Load synthetic raw and calibrated probability of default.", zh: "载入合成的原始违约概率与校准后的 PD。" } },
      { label: { en: "Economics", zh: "经济" }, detail: { en: "Compute expected loss from PD, LGD, and EAD.", zh: "由 PD、LGD 与 EAD 计算预期损失。" } },
      { label: { en: "Policy", zh: "策略" }, detail: { en: "Apply approve, review, and decline thresholds.", zh: "应用批准、复核与拒绝阈值。" } },
      { label: { en: "Review", zh: "复核" }, detail: { en: "Enforce analyst-capacity constraints.", zh: "执行分析师容量约束。" } },
      { label: { en: "Monitor", zh: "监控" }, detail: { en: "Backtest vintages, PSI, slices, and audit changes.", zh: "回测放款批次、PSI、切片并审计变更。" } },
    ],
    provenance: [
      { en: "Greenfield rebuild generated from seed 2026071302; all 12,000 applications, scores, loans, and outcomes are fictional.", zh: "基于 seed 2026071302 从零重建；12,000 笔申请、评分、贷款及结果均为虚构数据。" },
      { en: "The source toggle requests real data first: the browser verifies scored-backtest.parquet through DuckDB-WASM by default. If that offline training artifact is missing or invalid, the real backtest fails closed, stays labeled pending or blocked, and falls back to the governed synthetic fixture.", zh: "来源切换优先请求真实数据：浏览器默认通过 DuckDB-WASM 校验 scored-backtest.parquet。若该离线训练产物缺失或无效，真实回测直接阻断，状态保持标注为 pending 或 blocked，并单独回退至受约束的合成数据。" },
      { en: "Real mode loads 120,000 deterministically selected applications from the 1,347,681-row UCM-curated Lending Club granting archive (Zenodo 10.5281/zenodo.11295916, CC BY 4.0, retrieved 2026-07-17); the source size, MD5, SHA-256, creators, and time cutoffs are embedded in the Parquet metadata.", zh: "真实模式载入从 UCM 整理的 1,347,681 行 Lending Club 授信档案中确定性选取的 120,000 条申请（Zenodo 10.5281/zenodo.11295916，CC BY 4.0，获取于 2026-07-17）；Parquet 元数据内嵌源文件大小、MD5、SHA-256、作者与时间截止点。" },
      { en: "The committed artifact contains disjoint time-ordered 72,000 / 24,000 / 24,000 train, isotonic-calibration, and later backtest rows, observed final outcomes, calibrated logistic/XGBoost scores, and top-three SHAP-derived reason codes.", zh: "已提交产物包含互不重叠且按时间排序的 72,000 / 24,000 / 24,000 条训练集、等渗校准集与后续回测集记录，含观测到的最终结局、校准后的逻辑回归/XGBoost 分数，以及 SHAP 推导的前三位原因码。" },
      { en: "The inherited Streamlit/HF demo is prior work only; no original model is claimed as recovered or validated.", zh: "继承的 Streamlit/HF 演示仅为既往成果；不主张原模型已恢复，亦不主张其已获验证。" },
    ],
    boundaries: [
      { en: "Synthetic Brier, PSI, loss, and slice values are fixture results, not real performance or fairness evidence.", zh: "合成 Brier、PSI、损失与切片数值是夹具结果，不是真实性能或公平性声明。" },
      { en: "The lab does not process PII or represent regulatory compliance, deployed accuracy, or a real applicant decision.", zh: "本实验室不处理个人身份信息（PII），也不代表或证明监管合规性、部署准确率或真实申请人决策。" },
      { en: "LGD is a disclosed 45% assumption; legacy browser fields absent upstream use explicit unavailable sentinels, and home-ownership slices are descriptive only.", zh: "LGD 是明确披露的 45% 假设；上游缺失的旧版浏览器字段使用明确的不可用哨兵，住房状态切片仅作描述。" },
      { en: "This granted-loan-only archive does not represent rejected applicants or identify acceptance-population policy effects; it is an offline historical backtest, not causal impact, live or production decisioning, regulatory validation, or real-world fairness evidence.", zh: "该档案仅含已授信贷款，不代表被拒申请人，也不能识别完整受理人群的策略效果；它是离线历史回测，不构成因果影响、在线或生产决策、监管验证或真实世界公平性证据。" },
    ],
    links: [
      { label: { en: "GitHub repository", zh: "GitHub 仓库" }, href: "https://github.com/LucisZhang/credit-policy-lab" },
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
    metrics: { en: "Legacy migration route", zh: "旧版迁移路由" },
    problem: {
      en: "Operational reviewers need a path from customer and funnel exploration to a clear model-decision interface — without mistaking presentation artifacts for validated performance evidence.",
      zh: "业务评审人员需要从客户与漏斗分析转到模型决策界面，且不能把展示材料当成已验证的性能证据。",
    },
    audience: {
      en: "Analytics, BI, and applied-ML reviewers assessing decision interfaces rather than borrowed performance claims.",
      zh: "评估决策界面而非借用性能声明的数据分析、BI 与应用机器学习评审者。",
    },
    role: {
      en: "I created the e-commerce analysis views and the deployed bilingual Streamlit interaction for exploring model decisions with synthetic inputs.",
      zh: "我创建了电商分析视图，并部署了双语 Streamlit 交互，可用合成输入查看模型决策。",
    },
    outcome: {
      en: "The public artifacts support qualitative inspection of funnel, RFM, segmentation, model switching, synthetic inputs, and a predict_proba-driven approve-or-block demonstration.",
      zh: "公开产物支持定性检查漏斗、RFM、客户分群、模型切换、合成输入，以及由 predict_proba 驱动的批准或拦截演示。",
    },
    stack: projectStack("Tableau", "Streamlit", "Python", "predict_proba"),
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
      { label: { en: "GitHub repository", zh: "GitHub 仓库" }, href: "https://github.com/LucisZhang/Risk-Control-Portfolio" },
    ],
    legacy: true,
  },
];

const featuredProjectOrder: ProjectId[] = [
  "release-guardian",
  "rag-quality-lab",
  "privacy-preflight-mac",
  "margin-control-tower",
  "p1-reliability-lab",
  "credit-policy-lab",
];

export const featuredProjects = featuredProjectOrder
  .map((slug) => projects.find((project) => project.slug === slug))
  .filter((project): project is Project => Boolean(project));

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

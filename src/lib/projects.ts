import type { LocalizedString } from "./i18n";

export type TrackId = "analytics" | "engineering" | "ai";
export type ProjectId =
  | "frontier-forge"
  | "release-guardian"
  | "exactly-once-drills"
  | "rag-quality-lab"
  | "triage-router"
  | "privacy-preflight"
  | "margin-control-tower"
  | "crossover-study"
  | "ask-portfolio"
  | "credit-policy-desk"
  | "analytics-tandem";

export type ProjectTier = "flagship" | "core" | "secondary" | "archive";

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
  published?: boolean;
  routeEnabled?: boolean;
  tier: ProjectTier;
  title: LocalizedString;
  glossZh: string;
  eyebrow: LocalizedString;
  summary: LocalizedString;
  metrics: LocalizedString;
  problem: LocalizedString;
  audience: LocalizedString;
  role: LocalizedString;
  outcome: LocalizedString;
  stack: LocalizedString[];
  architecture: ArchitectureStep[];
  fieldNotes?: LocalizedString[];
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
      en: "I build AI applications to be second-guessed: hard checks, bounded retries, and a human on the last gate.",
      zh: "我做的 AI 应用经得起追问：硬性检查、有界重试，最后一道关口留给人。",
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
      en: "Decision tools should show their assumptions instead of burying them under a chart.",
      zh: "决策工具应当把假设摆在明处，而不是埋在图表底下。",
    },
  },
];

const projectCatalog: Project[] = [
  {
    slug: "frontier-forge",
    track: "ai",
    routeEnabled: true,
    tier: "flagship",
    title: { en: "Frontier Forge", zh: "Frontier Forge" },
    glossZh: "SFT 微调到 vLLM 上线跑通",
    eyebrow: { en: "Frontier Forge", zh: "Frontier Forge" },
    summary: {
      en: "Scaling free rule labels from 1,450 to 20,000 lifted a 4B model from 66.35% to 99.05% task success on complaint triage (n=2000, paired 95% CI), served with vLLM behind a C++20 token-aware gateway, scaled 1→3→1 on k3s. Total measured spend: $35.68. Under 3× overload the gateway sheds load with HTTP 429 and zero upstream 5xx; bare vLLM crashed at 5×. Distillation lost 14.2 pp to free rule labels and GRPO's CI includes zero — both runs are kept on the page.",
      zh: "投诉分诊任务上，免费规则标签从 1,450 条加到 20,000 条，把 Qwen3.5-4B 的任务成功率从 66.35% 提到 99.05%（SFT，n=2000，配对 95% CI）。vLLM 部署，前面挡一层自己写的 C++20 网关：按 token 预算限流，k3s 上 1→3→1 自动伸缩。全程花了 $35.68，账单实测。压到 3 倍过载，网关用 429 把多余请求挡在门外，上游零 5xx；裸 vLLM 顶到 5 倍直接崩。蒸馏比免费的规则标签还低 14.2 个点，GRPO 置信区间含零——这两次没做成的实验，原样留在页面上。",
    },
    metrics: {
      en: "99.05% TASK SUCCESS · +32.7 pp PAIRED GAIN · $35.68 TOTAL MEASURED SPEND · 0 UPSTREAM 5XX @ 3× OVERLOAD",
      zh: "99.05% TASK SUCCESS · +32.7 pp PAIRED GAIN · $35.68 TOTAL MEASURED SPEND · 0 UPSTREAM 5XX @ 3× OVERLOAD",
    },
    problem: { en: "", zh: "" },
    audience: { en: "", zh: "" },
    role: { en: "", zh: "" },
    outcome: { en: "", zh: "" },
    stack: projectStack("Qwen3.5-4B", "SFT", "vLLM", "C++20", "k3s"),
    architecture: [],
    provenance: [],
    boundaries: [],
    links: [
      { label: { en: "Evidence Explorer", zh: "证据浏览器" }, href: "#evidence-explorer" },
      { label: { en: "Technical report", zh: "技术报告" }, href: "https://github.com/LucisZhang/frontier-forge#results" },
      { label: { en: "GitHub repository", zh: "GitHub 仓库" }, href: "https://github.com/LucisZhang/frontier-forge" },
    ],
  },
  {
    slug: "release-guardian",
    track: "ai",
    tier: "core",
    title: { en: "Release Guardian", zh: "Release Guardian" },
    glossZh: "Agent 发布门禁：编排与审批",
    eyebrow: { en: "AI Agent / LLM systems", zh: "AI Agent / LLM systems" },
    summary: {
      en: "A production-shaped LLM agent gate: 13-node LangGraph orchestration, four parallel evidence collectors, policy-guarded tools, deterministic validators with bounded retries, and a human approval that survives a process kill. 132 funded live runs, 8/8 aggregate gates (30/44 strict).",
      zh: "按生产模式设计的 LLM Agent 发布门禁：13 节点 LangGraph 编排，四路并行证据采集，工具层按节点白名单加调用预算，确定性校验挡在出口，人工审批断电也能恢复。132 次付费在线评测，8/8 聚合门禁全过（严格口径 30/44）。",
    },
    metrics: { en: "132 live runs · 8/8 gates · 30/44 strict · citation fidelity 100%", zh: "132 live runs · 8/8 gates · 30/44 strict · citation fidelity 100%" },
    problem: {
      en: "Before code ships automatically, someone needs to know what it touches, keep the model inside clear limits, and leave a durable approval record.",
      zh: "代码自动发布前，必须厘清影响范围，将模型约束在清晰边界内，并留存持久可查的审批记录。",
    },
    audience: {
      en: "Teams that have to sign off on automated changes — and explain that sign-off six months later.",
      zh: "需要为自动化变更签字放行的团队——而且半年后还得说清当初为什么放行。",
    },
    role: {
      en: "The graph design is mine, and so is everything around it: the human approval gate, the observability layer, and a tamper-evident SHA-256 audit chain, built across Python, Go, Java, and TypeScript.",
      zh: "图的设计是我做的，围绕它的东西也是：人工审批关卡、可观测层、防篡改的 SHA-256 审计哈希链，用 Python、Go、Java 和 TypeScript 搭起来。",
    },
    outcome: {
      en: "All eight aggregate gates passed across 132 funded live graph runs — 100% citation fidelity, zero tool misuse, 100% injection defense.",
      zh: "132 次付费在线图运行，八项聚合门禁全部通过——引用忠实度 100%，工具误用为零，注入防御 100%。",
    },
    stack: projectStack("LangGraph", "FastAPI", "Go", "Spring Boot", "PostgreSQL + pgvector", "OpenTelemetry", "Next.js"),
    architecture: [
      { label: { en: "Intake", zh: "接入" }, detail: { en: "Classify and parse an incoming change.", zh: "分类并解析传入的变更。" } },
      { label: { en: "Evidence", zh: "证据" }, detail: { en: "Four parallel evidence collectors.", zh: "四路并行证据采集。" } },
      { label: { en: "Risk", zh: "风险" }, detail: { en: "Grade the change, build a plan, and check both against the rules.", zh: "聚合、分级、制定计划并校验。" } },
      { label: { en: "Approval", zh: "审批" }, detail: { en: "Pause and wait for a human decision before publish.", zh: "发布前持久化中断并等待审批。" } },
      { label: { en: "Audit", zh: "审计" }, detail: { en: "Publish through the approved branch and record the decision.", zh: "仅通过获批分支发布并记录决策。" } },
    ],
    fieldNotes: [
      {
        en: "The first live rerun after Phase L ran out of OpenRouter credit halfway through: 3 graph failures, 42 judge calls answered with HTTP 402, citation fidelity 0.977. I funded a clean rerun, kept the burned one out of the handoff archive, and it is not tracked in the repository either.",
        zh: "L 阶段之后的第一次在线重跑，跑到一半 OpenRouter 额度就用光了：3 次图运行失败、42 次裁判调用收到 HTTP 402、引用忠实度 0.977。我付费重跑了一份干净的，那份烧光额度的报告没有进交付归档，仓库里也没有跟踪它。",
      },
      {
        en: "One scenario kept dying on \"'NoneType' object has no attribute 'strip'\". OpenRouter was returning a null message.content and my code called .strip() on it. Routing null content back through the structured-validation retry fixed it; citation fidelity moved 0.984848 → 1.000000 in the same window, which I report as an operational before-and-after rather than a causal estimate.",
        zh: "有个场景反复挂在 \"'NoneType' object has no attribute 'strip'\" 上。OpenRouter 返回了空的 message.content，而我的代码直接对它调用了 .strip()。把空内容重新走一遍结构化校验重试就解决了；同一时间窗里引用忠实度从 0.984848 变成 1.000000——我只把它当作运维层面的前后对比，不当因果估计。",
      },
      {
        en: "Eight aggregate gates pass, and the agent still misses roughly 17% of the dependencies it should find: missed_dependency_rate 0.1742 against a ≤0.25 threshold. Scenario by scenario it reads worse — 30 of 44 fail at least one criterion in at least one of their three trials. Both views are on this page.",
        zh: "八项聚合门禁全部通过，可它依然漏掉了大约 17% 本该找出来的依赖：missed_dependency_rate 0.1742，阈值是 ≤0.25。逐场景看更难看——44 个场景里有 30 个，在三次试验中至少一次至少有一项标准没过。这两种视角都摆在本页上。",
      },
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
      { label: { en: "GitHub repository", zh: "GitHub 仓库" }, href: "https://github.com/LucisZhang/release-guardian" },
    ],
  },
  {
    slug: "exactly-once-drills",
    track: "engineering",
    tier: "core",
    title: { en: "Exactly-Once Drills", zh: "Exactly-Once Drills" },
    glossZh: "消息队列与流处理的故障恢复验证",
    eyebrow: { en: "MySQL CDC → Flink → Iceberg · failure injection", zh: "MySQL CDC → Flink → Iceberg · 故障注入" },
    summary: {
      en: "Ten ways to break the same pipeline: MySQL CDC on one path, Debezium → Avro contracts → Kafka on the other, both landing in Flink → Iceberg. After every induced failure, source state, table snapshots, and event IDs are reconciled — all ten recoveries came back with zero diffs. Sustained throughput measured at 1,791 events/s in the B4 SLO run.",
      zh: "一条管道两路进：MySQL CDC 直连一路，Debezium → Avro 契约 → Kafka 一路，汇进 Flink → Iceberg——然后换十种方法把它弄断。每次弄断之后，核对源库状态、表快照、事件 ID 三方对不对得上：十种恢复全部零差异，压测吞吐 1,791 events/s。",
    },
    metrics: { en: "10 failure classes · 0 snapshot diffs · 1,791 events/s", zh: "10 failure classes · 0 snapshot diffs · 1,791 events/s" },
    problem: {
      en: "Anyone can demo a streaming pipeline on its good days. The question is what happens when the checkpoint, the coordinator, or the sink commit fails.",
      zh: "跑得通的流式管道谁都能演示。真正的问题是：检查点、协调器或 sink 提交挂掉的那一刻，会发生什么。",
    },
    audience: {
      en: "Engineers who won't trust a streaming pipeline until they've watched it fail and come back intact.",
      zh: "那些没亲眼看过管道挂掉又完好恢复、就不肯信它的工程师。",
    },
    role: {
      en: "I built all of it: the deterministic event generator, the failure harness, the reconciliation checks, the incident runbook, and the recorded-run dashboard.",
      zh: "我全程自建：确定性事件生成器、故障注入框架、对账检查、事故处置手册和已记录运行面板。",
    },
    outcome: {
      en: "Ten ways to break the same pipeline: MySQL CDC on one path, Debezium → Avro contracts → Kafka on the other, both landing in Flink → Iceberg. After every induced failure, source state, table snapshots, and event IDs are reconciled — all ten recoveries came back with zero diffs. Sustained throughput measured at 1,791 events/s in the B4 SLO run.",
      zh: "一条管道两路进：MySQL CDC 直连一路，Debezium → Avro 契约 → Kafka 一路，汇进 Flink → Iceberg——然后换十种方法把它弄断。每次弄断之后，核对源库状态、表快照、事件 ID 三方对不对得上：十种恢复全部零差异，压测吞吐 1,791 events/s。",
    },
    stack: projectStack("MySQL CDC", "Apache Flink", "Apache Iceberg", "MinIO", "Docker Compose", "Python", "Java"),
    architecture: [
      { label: { en: "Source", zh: "数据源" }, detail: { en: "Deterministic inserts, updates, and deletes in MySQL.", zh: "在 MySQL 中生成确定性的新增、更新与删除。" } },
      { label: { en: "CDC", zh: "CDC" }, detail: { en: "Flink captures and checkpoints the changelog.", zh: "Flink 捕获变更日志并建立检查点。" } },
      { label: { en: "Table", zh: "数据表" }, detail: { en: "Iceberg stores the current state and change history.", zh: "Iceberg 保存当前状态与变更日志证据。" } },
      { label: { en: "Failure", zh: "故障" }, detail: { en: "The harness triggers one recorded failure type at a time.", zh: "框架每次触发一种已记录的故障类型。" } },
      { label: { en: "Reconcile", zh: "对账" }, detail: { en: "Check source, snapshot, and event-ID sets after recovery.", zh: "恢复后审计源数据、快照与事件 ID 集合。" } },
    ],
    fieldNotes: [
      {
        en: "The task-crash drill fires from a one-shot marker file. A marker left behind by an earlier local run can swallow the next run's induced failure, and the drill then reports a clean recovery it never performed. The note I left in the runbook is to keep the marker path unique per run.",
        zh: "任务崩溃演练靠一个一次性标记文件触发。上一次本地运行遗留的标记，会把下一次注入的故障吞掉，于是演练报告的是一次它根本没做过的恢复。我在手册里留的处置办法是：每次运行都用不同的标记路径。",
      },
      {
        en: "Restoring from a retained checkpoint looks like reading a path and handing it to flink run -s. It is not. The checkpoint the REST API reports can be superseded by a later retained checkpoint during shutdown, so the path has to be resolved after cancellation, not before it.",
        zh: "从保留的检查点恢复，看上去就是读一个路径、交给 flink run -s。并不是。REST 接口报出来的那个检查点，可能在停机过程中被更晚的保留检查点顶掉，所以路径必须在作业取消之后再解析，不能提前。",
      },
      {
        en: "After I restarted the JobManager container the session job was simply gone, and waiting for a registered worker got me nothing. The TaskManager has to be brought back first; only then does the restore from chk-7 take. Reconciliation still came out at zero snapshot differences, but that ordering belongs to this single-node Compose setup, not to Flink.",
        zh: "重启 JobManager 容器之后，会话作业就那么没了，干等注册上来的 worker 也等不到。得先把 TaskManager 拉回来，从 chk-7 的恢复才生效。对账结果依然是零快照差异，但这个先后顺序属于我这套单节点 Compose 环境，不属于 Flink 本身。",
      },
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
      { label: { en: "GitHub repository", zh: "公开源码仓库" }, href: "https://github.com/LucisZhang/exactly-once-drills" },
    ],
  },
  {
    slug: "rag-quality-lab",
    track: "ai",
    tier: "secondary",
    title: { en: "RAG Quality Lab", zh: "RAG Quality Lab" },
    glossZh: "RAG 回归评测基线：知识库一动就重测",
    eyebrow: { en: "Deterministic RAG evaluation", zh: "确定性 RAG 评估" },
    summary: {
      en: "A knowledge-base update that looked harmless degraded the strongest pipeline on 4 of 12 controlled questions. The regression suite caught it; the same evidence lifecycle now survives an 11,309-document corpus.",
      zh: "一次看着无害的知识库更新，让最强的 pipeline 在 12 道受控题里翻了 4 道。回归测试当场抓住；同一套证据流程，现在扛得住 11,309 份文档。",
    },
    metrics: { en: "4/12 questions regressed · 11,309 docs · 130 enterprise questions", zh: "12 题中 4 题退化 · 11,309 份文档 · 130 道企业问题" },
    problem: {
      en: "RAG changes often look harmless while silently reducing answer quality. Teams need a repeatable gate that catches regressions and still works when the corpus becomes too large to inspect manually.",
      zh: "RAG 变更看似无害，却可能悄然降低答案质量。团队需要一套可重复的门禁，既能发现退化，也能在语料大到无法人工逐份检查时继续运作。",
    },
    audience: {
      en: "Applied-AI, retrieval, and evaluation teams that need reviewable evidence before a RAG change reaches users.",
      zh: "需要在 RAG 变更触达用户前取得可审阅证据的 AI 应用、检索与评估团队。",
    },
    role: {
      en: "I built the A/B and regression harness first, then everything the scale-up needed: corpus adapters, deterministic manifests, a judge-free retrieval runner, and the verifiers that gate a run.",
      zh: "我先做了 A/B 与回归工具，再补上规模化需要的一切：语料适配器、确定性清单、不依赖裁判模型的检索运行器，以及给每次运行把关的校验器。",
    },
    outcome: {
      en: "On the controlled 12-question set, a document-only update degraded four questions and every reported quality metric. The repository now carries the same versioned-data and verification lifecycle to 11,309 synthetic enterprise documents and 130 answerable questions.",
      zh: "在受控的 12 题集合中，仅修改文档就导致 4 道题及全部已报告质量指标退化。仓库现已把同一套版本化数据与验证生命周期扩展至 11,309 份合成企业文档和 130 道可回答问题。",
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
      { label: { en: "Compare", zh: "对比" }, detail: { en: "Run naive vector and hybrid-rerank pipelines on the same controlled questions.", zh: "在同一受控问题集上运行朴素向量与混合重排流水线。" } },
      { label: { en: "Regress", zh: "回归" }, detail: { en: "Compare one pipeline across knowledge-base versions and bucket question-level changes.", zh: "让同一流水线跨知识库版本运行，并对逐题变化分桶。" } },
      { label: { en: "Scale", zh: "扩展" }, detail: { en: "Adapt 11,309 synthetic enterprise documents and 130 grounded questions.", zh: "适配 11,309 份合成企业文档与 130 道带依据的问题。" } },
      { label: { en: "Manifest", zh: "清单" }, detail: { en: "Bind datasets, adapters, and outputs to deterministic hashes.", zh: "以确定性哈希绑定数据集、适配器与输出。" } },
      { label: { en: "Gate", zh: "门禁" }, detail: { en: "Fail on data drift, contract breaks, or measured regression.", zh: "发现数据漂移、契约破坏或已测退化时直接失败。" } },
    ],
    fieldNotes: [
      {
        en: "I changed documents only — no code, no configuration — and Pipeline B's faithfulness fell from 0.988 to 0.867 across the 12 controlled questions. Four questions got worse, eight held, none improved. The regression run is the only reason I know that happened.",
        zh: "我只动了文档——没改代码，也没动配置——12 道受控问题上，流水线 B 的忠实度就从 0.988 掉到 0.867。4 道变差、8 道持平、一道也没变好。我之所以知道这件事，只是因为跑了回归。",
      },
      {
        en: "The hybrid-plus-rerank pipeline wins all five quality metrics and retrieves 4.6× slower at 50K documents: P50 128.44 ms against 28.13 ms, P99 212.43 ms against 39.65 ms. I keep the two tables side by side, because the quality table on its own makes the choice look obvious.",
        zh: "混合加重排的流水线赢下了全部五项质量指标，而在 50K 文档规模上，它的检索慢 4.6 倍：P50 128.44 毫秒对 28.13 毫秒，P99 212.43 毫秒对 39.65 毫秒。我把两张表并排放着，因为只看质量那张表，会觉得这个选择根本不用想。",
      },
    ],
    provenance: [
      {
        en: "The saved 2026-04 controlled run was deterministically re-parsed in 2026-07: Pipeline B moved from 0.988 to 0.867 faithfulness after the V1-to-V2 document update, with 4 degraded, 0 improved, and 8 stable questions.",
        zh: "2026-04 保存的受控运行于 2026-07 完成确定性重解析：V1 到 V2 的文档更新后，流水线 B 的忠实度从 0.988 降至 0.867；逐题结果为 4 题退化、0 题改善、8 题稳定。",
      },
      {
        en: "The public repository at commit 88879a2 contains the enterprise adapters, manifest, backend seam, retrieval runner, tests, and bilingual operating documentation; its CI passed before merge.",
        zh: "公开仓库提交 88879a2 已包含企业语料适配器、清单、后端接口、检索运行器、测试与双语运行文档，并在合并前通过 CI。",
      },
    ],
    boundaries: [
      {
        en: "The reported quality and latency measurements belong to the controlled saved runs; they do not transfer to the 11,309-document enterprise corpus.",
        zh: "已报告的质量与延迟测量仅属于受控的已保存运行，不能迁移解释为 11,309 份企业文档语料的结果。",
      },
      {
        en: "At enterprise scale, the current evidence establishes data integrity and runnable evaluation infrastructure, not a new answer-quality result.",
        zh: "在企业语料规模上，当前证据证明的是数据完整性与可运行的评估基础设施，而不是新的答案质量结论。",
      },
      { en: "The lab is a single-machine evaluation workbench, not a released package or a production serving system.", zh: "该实验室是单机评估工作台，并非已发布的软件包或生产服务系统。" },
    ],
    links: [
      { label: { en: "GitHub repository", zh: "GitHub 仓库" }, href: "https://github.com/LucisZhang/rag-quality-lab" },
    ],
  },
  {
    slug: "triage-router",
    track: "ai",
    tier: "core",
    title: { en: "Triage Router", zh: "Triage Router" },
    glossZh: "大模型成本路由：三层级联按置信度分发",
    eyebrow: { en: "Three model tiers · cost-aware routing", zh: "三层模型 · 成本感知路由" },
    summary: {
      en: "The expensive model was the wrong default: on held-out data Claude Sonnet 5 ties Haiku 4.5 at 2.8× the cost, and under a shared output budget it silently answers nothing on up to 2.5% of calls. A confidence cascade routes each complaint to the cheapest tier that can handle it, measured against 11 years of drift. The in-page demo replays those measured runs.",
      zh: "贵的模型不该是默认选项：留出集上 Claude Sonnet 5 和 Haiku 4.5 统计上打平，Sonnet 价格却是 Haiku 的 2.8 倍，共享输出预算时还会在最多 2.5% 的调用里悄悄交白卷。置信级联把每条投诉分给接得住的最便宜一档，拿跨 11 年的分布漂移数据实测过。页内 demo 回放的是这些实测记录。",
    },
    metrics: {
      en: "+0.037 macro-F1 · −$120.58 / 1k calls · drift 2015–2026",
      zh: "+0.037 macro-F1 · −$120.58 / 1k calls · drift 2015–2026",
    },
    problem: {
      en: "Most teams pick one model for a classification task and never learn what the smaller, cheaper tiers could have done — or when drift will quietly break the one they chose.",
      zh: "多数团队给分类任务选定一个模型就不再回头，既不知道更小更便宜的层级本来能做到什么，也不知道漂移什么时候会悄悄弄坏他们选的那个。",
    },
    audience: {
      en: "Anyone deciding whether a task needs an LLM at all — and what it should cost.",
      zh: "所有在纠结「这个任务到底要不要上 LLM、该花多少钱」的人。",
    },
    role: {
      en: "I built the full ladder: calibrated TF-IDF baselines, ModernBERT and DistilBERT fine-tunes, Claude tiers over OpenRouter, the explicit cost model, the cascade router, and the append-only results log every number traces back to.",
      zh: "整个阶梯都是我搭的：带校准的 TF-IDF 基线、ModernBERT 与 DistilBERT 微调、经 OpenRouter 调用的 Claude 层、显式成本模型、级联路由器，以及每个数字都能回溯到的只增结果日志。",
    },
    outcome: {
      en: "On held-out data the cascade beats the linear baseline by +0.0370 macro-F1 (95% CI +0.0337 to +0.0402) while cutting expected cost by $120.58 per thousand complaints. On the 2026-H1 drift slice the linear tier drops 9.2 points; Claude Sonnet gains ground instead.",
      zh: "在留出集上，级联路由比线性基线高 +0.0370 macro-F1（95% CI +0.0337 ~ +0.0402），每千条投诉的预期成本下降 $120.58。到 2026 上半年的漂移切片上，线性层掉了 9.2 个百分点，Claude Sonnet 反而在涨。",
    },
    stack: projectStack(
      "Python",
      "scikit-learn",
      "ModernBERT / DistilBERT",
      { en: "int8 ONNX in-browser", zh: "浏览器内 int8 ONNX" },
      { en: "Claude via OpenRouter", zh: "经 OpenRouter 调用 Claude" },
      { en: "uv + frozen lockfile", zh: "uv + 冻结 lockfile" },
    ),
    architecture: [
      { label: { en: "Freeze", zh: "冻结" }, detail: { en: "Snapshot the CFPB corpus by hash and split it by time: train, calibration, IID test, drift slices.", zh: "按哈希冻结 CFPB 语料，再按时间切分：训练、校准、同分布测试与漂移切片。" } },
      { label: { en: "Ladder", zh: "阶梯" }, detail: { en: "Train each tier on identical splits: TF-IDF, ModernBERT ×3 seeds, DistilBERT int8, Claude zero-shot.", zh: "在完全相同的切分上训练各层：TF-IDF、三个 seed 的 ModernBERT、int8 DistilBERT、Claude 零样本。" } },
      { label: { en: "Cost", zh: "成本" }, detail: { en: "Price every path with an explicit model: inference dollars, misroute cost, human review.", zh: "用显式成本模型给每条路径定价：推理费用、误分流成本、人工复核。" } },
      { label: { en: "Route", zh: "路由" }, detail: { en: "Fit cascade thresholds on the calibration slice only — never on test.", zh: "级联阈值只在校准切片上拟合，绝不碰测试集。" } },
      { label: { en: "Drift", zh: "漂移" }, detail: { en: "Replay 2023–2026 yearly slices and decompose what actually moved: class mix, not vocabulary.", zh: "回放 2023–2026 年度切片，分解真正变化的因素：是类别构成，不是词表。" } },
    ],
    fieldNotes: [
      {
        en: "I assumed the expensive tier was the safe default. On the same 1,500 held-out IID rows, Sonnet 5 minus Haiku 4.5 comes out at −0.0073 macro-F1, CI [−0.0427, +0.0263], McNemar p=1.00 — indistinguishable, at 2.8× the cost per thousand complaints ($3.66 against $1.32) and 2.3× the p50 latency. It earns its price only on the post-cutoff slice, where the paired gain is +0.0458 macro-F1.",
        zh: "我本来以为贵的那一层就是稳妥的默认选项。在同样的 1,500 条留出同分布样本上，Sonnet 5 减 Haiku 4.5 的结果是 macro-F1 −0.0073，置信区间 [−0.0427, +0.0263]，McNemar p=1.00——分不出高下，代价却是每千条投诉 2.8 倍的成本（$3.66 对 $1.32）和 2.3 倍的 p50 延迟。它只在训练截止之后的切片上才值这个价：配对增益 macro-F1 +0.0458。",
      },
      {
        en: "Under the shared 64-token completion budget the stronger model sometimes answers with nothing at all: 12 of 1,500 calls on the IID slice (0.8%) and 37 of 1,500 on the post-cutoff slice (2.5%), every one with finish_reason \"length\" and no parseable JSON — its reasoning consumed the budget before an answer appeared. Haiku did that on 0 of 10,000 calls. The failures are worst on the drifted slice, which is exactly where you would escalate to the stronger model.",
        zh: "在共用的 64 token 输出预算下，更强的那个模型有时候干脆什么也不答：同分布切片上 1,500 次调用里失败 12 次（0.8%），训练截止后的切片上 1,500 次里失败 37 次（2.5%），每一次的 finish_reason 都是 \"length\"，没有可解析的 JSON——预算被它自己的推理吃光了，答案还没出来。Haiku 在 10,000 次调用里一次都没有。失败率最高的正是漂移切片，而那恰恰是你会想升级到更强模型的地方。",
      },
      {
        en: "I thought Tier C was pinned to Anthropic. Reading the request builder showed nothing of the kind: the body never carried an OpenRouter provider preference — no order, no only, no allow_fallbacks — so the pin never was in effect. Across all 16,050 committed Tier C calls, 16,020 (99.81%) were served by Amazon Bedrock, and every Phase 3 latency figure had to be relabeled as a route through OpenRouter to Bedrock.",
        zh: "我一直以为 Tier C 固定走 Anthropic。翻了一遍请求构造代码才发现根本没有：请求体里从来没带过 OpenRouter 的 provider 偏好——没有 order，没有 only，没有 allow_fallbacks——所谓的固定供应商从未生效。全部 16,050 次已提交的 Tier C 调用里，16,020 次（99.81%）由 Amazon Bedrock 服务，Phase 3 的每一个延迟数字都得重新标注为「经 OpenRouter 路由到 Bedrock」。",
      },
    ],
    provenance: [
      {
        en: "Every headline number is a record in the append-only results log (results/runs.jsonl) carrying its git SHA, config hash, dataset snapshot hash, and a 95% bootstrap confidence interval (n=1,000, fixed seed).",
        zh: "每个关键数字都是只增结果日志 results/runs.jsonl 里的一条记录，带 git SHA、配置哈希、数据快照哈希和 95% 自举置信区间（n=1,000，固定 seed）。",
      },
      {
        en: "The full reproduction target re-ran end-to-end on a 16 GB laptop in 12 h 53 m: 27 of 27 committed outputs byte-identical, metrics verified to 1e-9.",
        zh: "完整复现目标在一台 16 GB 笔记本上端到端重跑，用时 12 小时 53 分：27 个已提交产物全部字节一致，指标校验到 1e-9。",
      },
      {
        en: "The public demo runs Tier A and int8 DistilBERT inference in the browser; every displayed number opens the results-log record it came from.",
        zh: "公开演示在浏览器内运行 Tier A 与 int8 DistilBERT 推理；页面上每个数字都能点开它来自的结果日志记录。",
      },
    ],
    boundaries: [
      {
        en: "A pre-registered hypothesis — that the fine-tuned transformer would behave like the LLM tiers under drift — was refuted: its 2026-H1 drop splits roughly evenly between class-mix shift and within-class decay.",
        zh: "一个预先登记的假设——微调 Transformer 在漂移下会像 LLM 层一样稳——被推翻了：它在 2026 上半年的下跌，大约一半来自类别构成变化，一半来自类内衰减。",
      },
      {
        en: "The obvious explanation did not survive either: out-of-vocabulary rate barely moved, so lexical drift is ruled out; the cliff is class mix.",
        zh: "最顺手的解释也没能成立：词表外比例几乎没动，词汇漂移被排除；悬崖来自类别构成。",
      },
      {
        en: "Results apply to this task, this corpus, and the price sheets at measurement time; the router's dollar savings follow from the disclosed cost model, not a universal claim.",
        zh: "结果只适用于这个任务、这份语料和测量当时的价目表；路由省下的钱由公开披露的成本模型算得，不是普适结论。",
      },
    ],
    links: [
      { label: { en: "GitHub repository", zh: "GitHub 仓库" }, href: "https://github.com/LucisZhang/triage-router" },
    ],
  },
  {
    slug: "privacy-preflight",
    track: "ai",
    tier: "core",
    title: { en: "Privacy Preflight", zh: "Privacy Preflight" },
    glossZh: "浏览器本地的敏感信息脱敏工作台",
    eyebrow: { en: "Browser-local redaction workbench", zh: "浏览器本地脱敏工作台" },
    summary: {
      en: "A black box drawn over text is not redaction. This browser workbench detects sensitive content locally, destroys it, then re-opens the output to prove it is gone — or blocks the export. English and Simplified Chinese OCR included. Nothing leaves your browser.",
      zh: "在文字上盖个黑块不叫脱敏。这个工作台在浏览器本地找出敏感内容、彻底销毁，再把导出的文件重新读一遍，验证内容确实没了——验证不过，导出就被拦下。支持中英双语 OCR，全程不出浏览器。",
    },
    metrics: {
      en: "96 worker tests · OCR 19/19 hits · 2 FP · local-only",
      zh: "96 worker tests · OCR 19/19 hits · 2 FP · local-only",
    },
    problem: {
      en: "Sensitive files get shared in a hurry, and uploading a document somewhere to check it for leaks defeats the point. The review has to happen locally, and the destruction itself has to be checked.",
      zh: "敏感文件往往是在匆忙中发出去的，而为了查泄露先把原件上传到别处，本身就是本末倒置。审查必须在本地完成，破坏性处理本身也必须被核验。",
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
    fieldNotes: [
      {
        en: "On the seven fixed OCR fixtures the detector found every expected value — 19 of 19 — and then reported 21 detections in total. The two extras are false positives, precision 90.5%. Something that misses nothing and also invents two regions is why nothing leaves the workbench before a person confirms each box.",
        zh: "在 7 组固定的 OCR 夹具上，19 项预期值一项不落地全被检测器找到了，可它一共报出了 21 处。多出来的 2 处是误报，精确率 90.5%。一个既不漏、又会凭空多框两块的东西，就是这个工作台坚持让人逐块确认之后才允许导出的原因。",
      },
      {
        en: "The macOS worker suite passed 95 tests alongside five PyMuPDF/SWIG deprecation warnings I had been stepping over. What actually pushed PyMuPDF out was its license, not the warnings: the 0.1.0 runtime rebuilds the PDF path on pypdfium2/PDFium, pypdf, Pillow, and ReportLab, and the final source snapshot replays 96 passed. It is not a clean before-and-after — the 95 predates the general Chinese-mobile regression.",
        zh: "macOS worker 测试套件当时是 95 项通过，外加 5 条我一直视而不见的 PyMuPDF/SWIG 弃用警告。真正把 PyMuPDF 挤出去的是它的许可证，不是这些警告：0.1.0 运行时把 PDF 路径重建在 pypdfium2/PDFium、pypdf、Pillow 和 ReportLab 上，最终源码快照重放为 96 项通过。这不是一次干净的前后对比——95 那次还在通用中文手机号回归之前。",
      },
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
    tier: "archive",
    title: { en: "Margin Control Tower", zh: "Margin Control Tower" },
    glossZh: "浏览器毛利归因工作台",
    eyebrow: { en: "Analytics engineering / margin decisions", zh: "分析工程 / 毛利决策" },
    summary: { en: "Weekly margin moves, decomposed in the browser on a hash-verified Olist aggregate — DuckDB-WASM, no server.", zh: "Weekly margin moves, decomposed in the browser on a hash-verified Olist aggregate — DuckDB-WASM, no server." },
    metrics: { en: "15,809 Olist aggregate rows · 99,441 source orders · 10 fail-closed contract checks", zh: "15,809 条 Olist 聚合记录 · 99,441 个源订单 · 10 项 fail-closed（失败即拦截）契约检查" },
    problem: { en: "A revenue-only view hides the margin lost to discounts, returns, cost of goods, and fulfillment, and gives a category manager no way to test a response.", zh: "只看收入会看不见折扣、退货、商品成本、履约这四类因素造成的毛利损失，品类经理也没法测试应对方案。" },
    audience: { en: "E-commerce category managers and analytics engineers who need to test a margin decision, not just chart it.", zh: "本页面面向电商品类经理与数据分析工程师，帮助他们验证毛利决策，而非仅将决策绘制成图表。" },
    role: { en: "The whole path is mine: the six-table Olist pipeline, the data contracts and source locks that police it, the diagnosis and scenario engine, and the browser UI.", zh: "整条链路都是我搭的：六表 Olist 管线、负责把关的数据契约与来源锁、诊断与情景引擎，以及浏览器界面。" },
    outcome: { en: "The default path verifies the committed Olist artifact before rendering, exposes measured detection and elasticity reports, recomputes a bounded scenario, and records a category action for review.", zh: "默认路径会在渲染前校验已提交的 Olist 产物，展示实测的检测与弹性报告，重算有边界的情景，并记录品类行动供复核。" },
    stack: projectStack(
      { en: "Data contracts", zh: "数据契约" },
      { en: "Metric registry", zh: "指标注册表" },
      { en: "Margin-bridge decomposition", zh: "贡献毛利变动拆解" },
      { en: "Holdout validation", zh: "留出期验证" },
      "Parquet + DuckDB-WASM",
    ),
    architecture: [
      { label: { en: "Acquire", zh: "获取" }, detail: { en: "Lock six licensed Olist source tables by URL, retrieval date, size, and hash.", zh: "按 URL、获取日期、大小与哈希锁定六张获许可的 Olist 源表。" } },
      { label: { en: "Reconcile", zh: "对账" }, detail: { en: "Join orders, items, customers, products, payments, and reviews at a declared weekly grain.", zh: "按声明的周度粒度对订单、商品、客户、产品、支付与评价进行关联对账。" } },
      { label: { en: "Contract", zh: "契约" }, detail: { en: "Stop if source hashes, schema, grain, accounting math, or browser artifact drift.", zh: "源哈希、模式、粒度、核算逻辑或浏览器产物任一漂移，即刻中止。" } },
      { label: { en: "Diagnose", zh: "诊断" }, detail: { en: "Decompose contribution-margin drivers and load artifact-bound detection and elasticity reports.", zh: "拆解贡献毛利驱动项，并载入与产物哈希绑定的检测和弹性报告。" } },
      { label: { en: "Test", zh: "测试" }, detail: { en: "Apply disclosed scenario assumptions, inspect the later holdout, and record an action.", zh: "应用已披露的情景假设，检查后续留出期并记录行动。" } },
    ],
    fieldNotes: [
      {
        en: "The replay detector catches every injected anomaly and cries wolf more often than it is right: 6 true positives, 13 false positives, 0 false negatives — recall 1.000000, precision 0.315789. Roughly two of every three alerts is noise. I left the threshold where it was and wrote both numbers into the audit.",
        zh: "回放检测器把注入的异常一个不漏地抓住了，同时也一直在喊狼来了：6 个真阳性、13 个假阳性、0 个假阴性——召回率 1.000000，精确率 0.315789。差不多每三条告警里有两条是噪声。我没有去动阈值，把这两个数字一起写进了审计。",
      },
      {
        en: "Every category's first observed week shows exactly zero discount, and that says nothing about Olist sellers. It is my cold-start rule: with no earlier week to price against, the reference price falls back to the current item price, so the proxy discount collapses to zero. It is documented rather than fixed.",
        zh: "每个品类的第一个观测周，折扣都恰好是零——这跟 Olist 的卖家没有关系。那是我的冷启动规则：没有更早的一周可以作参照，参考价就回落到当前商品价，代理折扣于是塌成零。这件事我是记录下来，而不是修掉。",
      },
    ],
    provenance: [
      { en: "The source toggle requests real data first: the browser loads and verifies olist-margin.parquet through DuckDB-WASM by default. If that offline-pipeline artifact is missing or invalid, the real path fails closed, stays labeled pending or blocked, and falls back to the governed synthetic fixture.", zh: "来源切换优先请求真实数据：浏览器默认通过 DuckDB-WASM 加载并校验 olist-margin.parquet。若该离线管道产物缺失或无效，真实路径直接阻断，状态保持标注为 pending 或 blocked，并单独回退至受约束的合成数据。" },
      { en: "Real mode loads the committed Olist aggregate produced from 99,441 orders and 112,650 item rows under CC BY-NC-SA 4.0 (retrieved 2026-07-17); source-table hashes, transport commit, transforms, and proxy boundaries are embedded in the Parquet metadata.", zh: "真实模式载入由 99,441 个订单与 112,650 条商品明细生成的已提交 Olist 聚合产物，许可证为 CC BY-NC-SA 4.0（获取于 2026-07-17）；Parquet 元数据内嵌源表哈希、传输 commit、转换与代理边界。" },
      { en: "Measured fields use observed order items and freight after payment/review reconciliation; discounts, returns, and COGS remain explicitly documented proxies. The first observed week of each category falls back to current item price and therefore has zero proxy discount.", zh: "实测字段来自支付/评价对账后的订单明细与运费；折扣、退货和 COGS 仍是明确记录的代理值。各品类首个观测周回填当前商品价格，因此代理折扣为零。" },
      { en: "The optional seed-2026071301 fixture contains 9,360 synthetic rows across 52 weeks and remains isolated as a reproducible fallback and test mode.", zh: "可选的 seed-2026071301 夹具含 52 周共 9,360 条合成记录，仅作为可复现的回退与测试模式独立保留。" },
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
    slug: "crossover-study",
    track: "engineering",
    routeEnabled: true,
    tier: "secondary",
    title: { en: "Crossover Study", zh: "Crossover Study" },
    glossZh: "推荐系统个性化收益对照研究",
    eyebrow: { en: "Spark + Iceberg lakehouse · recommender evaluation", zh: "Spark + Iceberg 湖仓 · 推荐系统评估" },
    summary: {
      en: "How much history does a user need before personalization beats popularity? On 43.9M Amazon reviews: never — the mechanism is 41% catalog churn, measured under pre-registered tests. On a low-churn corpus the crossover appears at n*=20. Spark + Iceberg, one 16GB laptop.",
      zh: "用户要攒多少历史，个性化才赢得过热门榜？43.9M 条 Amazon 评论给的答案是：攒多少都不行——原因量出来了，是 41% 的目录换血率。所有检验预先注册。换到换血慢的数据集，交叉点出现在 n*=20。Spark + Iceberg，一台 16GB 的 Mac 跑完全程。",
    },
    metrics: {
      en: "43.9M reviews ingested · 15.5M five-core interactions · crossover: not found",
      zh: "灌入 43.9M 条评论 · 五核过滤后剩 15.5M 条交互 · 交叉点：未出现",
    },
    problem: {
      en: "The expensive question is not which recommender wins. It is whether any observed history depth justifies segmentation, routing, and another model to operate.",
      zh: "真正贵的问题不是哪种推荐器赢，而是用户历史深到什么程度，才值得为分群、路由和另一套模型多建一套系统。",
    },
    audience: {
      en: "Recommender and data-platform engineers deciding whether a personalization tier is worth building.",
      zh: "需要判断个性化分层值不值得做的推荐系统与数据平台工程师。",
    },
    role: {
      en: "I built the 43.9M-interaction Spark + Iceberg pipeline, froze the temporal splits, ranked against the full catalog, fitted routing on validation, and committed both preregistrations before the tests that judged them.",
      zh: "我用 Spark + Iceberg 跑完 43.9M 条交互，冻结时间切分，做全目录排序，只在验证集上拟合路由；两次检验都先提交预注册，再看测试结果。",
    },
    outcome: {
      en: "Amazon produced no crossover at any observed depth. The mechanism measurement found 41.11% catalog churn. Under the same ladder on MovieLens-32M, where churn was 6.40%, item-kNN crossed popularity at n*=20 on NDCG@10.",
      zh: "Amazon 在所有观测深度都没有交叉点，机制测量给出 41.11% 的目录换血率。同一套检验换到换血率 6.40% 的 MovieLens-32M 后，item-kNN 在 NDCG@10 上从 n*=20 开始超过热门榜。",
    },
    stack: projectStack(
      "PySpark",
      "Apache Iceberg",
      { en: "Full-catalog ranking", zh: "全目录排序" },
      { en: "Paired bootstrap", zh: "配对自举" },
      { en: "Benjamini–Hochberg FDR", zh: "Benjamini–Hochberg FDR" },
    ),
    architecture: [
      { label: { en: "Freeze", zh: "冻结" }, detail: { en: "Lock temporal splits, dataset manifests, Iceberg snapshots, and bootstrap seeds before evaluation.", zh: "评估前锁定时间切分、数据清单、Iceberg 快照与 bootstrap seed。" } },
      { label: { en: "Rank", zh: "排序" }, detail: { en: "Compare popularity and personalized arms against every eligible item, with no sampled negatives.", zh: "不抽样负例，让热门榜与个性化模型对全部候选商品排序。" } },
      { label: { en: "Route", zh: "路由" }, detail: { en: "Select the history-depth threshold on validation; keep the test window untouched.", zh: "只在验证集选择历史深度阈值，测试窗口全程不动。" } },
      { label: { en: "Measure", zh: "量机制" }, detail: { en: "Count test purchases on items with zero or low training support before changing the model.", zh: "先数测试期购买中有多少落在训练支持度为零或很低的商品上，再谈换模型。" } },
      { label: { en: "Falsify", zh: "反证" }, detail: { en: "Repeat the registered ladder on ML-32M, a low-churn catalog, and correct the depth tests for multiplicity.", zh: "在换血慢的 ML-32M 上重复预先登记的检验，并对各深度结果做多重检验校正。" } },
    ],
    fieldNotes: [
      {
        en: "On Amazon, ALS trails trailing-12-month popularity at every observed history depth. The deficit narrows from −0.00256 at 1–4 interactions to −0.00146 at 20+, but never reaches zero. The fitted policy is n*=∞: build no personalization-routing layer for this regime.",
        zh: "Amazon 上，ALS 在每个观测深度都落后于近 12 个月热门榜。差距从 1–4 次交互时的 −0.00256 收窄到 20+ 时的 −0.00146，但始终没有到零。拟合结果是 n*=∞：这套数据不值得再建个性化路由层。",
      },
      {
        en: "On ML-32M, item-kNN turns positive from 20 interactions onward on NDCG@10 after Benjamini–Hochberg correction. Recall@20 confirms none of the three winning buckets, so the result is ranking quality only; it is not a recall win.",
        zh: "ML-32M 上，item-kNN 从 20 次交互开始在 NDCG@10 上转正，经过 Benjamini–Hochberg 校正仍成立。但 Recall@20 没有确认三个获胜分段中的任何一个，所以这里只能说排序质量赢了，不能说召回也赢了。",
      },
      {
        en: "The same ML-32M arm loses −0.3844 at zero history, a bucket containing 43.9% of test users. Popularity still wins globally. The crossover changes the deep-history tail; it does not reverse the deployment default.",
        zh: "同一个 ML-32M 模型在零历史用户上输掉 −0.3844，而这个分段占测试用户的 43.9%。全局仍是热门榜赢。交叉点改变的是深历史尾部，不是默认部署选择。",
      },
    ],
    provenance: [
      {
        en: "The Amazon curve resolves to runs 20260805T172047Z-035042b and 20260806T082441Z-2f2f26d; the 41.11% mechanism resolves to 20260817T095926Z-633d454.",
        zh: "Amazon 曲线对应运行 20260805T172047Z-035042b 与 20260806T082441Z-2f2f26d；41.11% 的机制测量对应 20260817T095926Z-633d454。",
      },
      {
        en: "The ML-32M curve resolves to runs 20260820T221055Z-20d8ff9 and 20260820T221701Z-20d8ff9. The page projection preserves config hashes, dataset hashes, snapshot IDs, seeds, hardware, and wall-clock time for all six source runs.",
        zh: "ML-32M 曲线对应运行 20260820T221055Z-20d8ff9 与 20260820T221701Z-20d8ff9。页面投影保留六次源运行的配置哈希、数据哈希、快照 ID、seed、硬件与耗时。",
      },
    ],
    boundaries: [
      {
        en: "The Amazon null applies to this catalog, five-core population, temporal split, and observed history depths — not to recommenders in general.",
        zh: "Amazon 的 null 结果只适用于这份目录、五核用户、时间切分与已观测历史深度，不是对推荐系统的普遍结论。",
      },
      {
        en: "Amazon and ML-32M differ in domain, density, catalog size, and feedback semantics. Their contrast measures a regime association; it does not isolate churn as a cause.",
        zh: "Amazon 与 ML-32M 的领域、密度、目录规模和反馈含义都不同。两者对照只说明结果随 regime 一起变化，不能把换血率单独认作原因。",
      },
      {
        en: "Single-machine batch evaluation only: no serving system, online metric, or A/B test. Raw reviews, per-user arrays, and MiniLM weights are not shipped with this page.",
        zh: "仅为单机批式评估：没有服务系统、在线指标或 A/B 测试。本页不分发原始评论、逐用户数组或 MiniLM 权重。",
      },
    ],
    links: [
      { label: { en: "GitHub repository", zh: "GitHub 仓库" }, href: "https://github.com/LucisZhang/crossover-study" },
      { label: { en: "Full demo source", zh: "完整版 demo 源码" }, href: "https://github.com/LucisZhang/crossover-study/tree/main/demo" },
    ],
  },
  {
    slug: "ask-portfolio",
    track: "ai",
    routeEnabled: true,
    tier: "secondary",
    title: { en: "Ask Portfolio", zh: "Ask Portfolio" },
    glossZh: "可溯源的作品集问答助手",
    eyebrow: { en: "Ask Portfolio", zh: "Ask Portfolio" },
    summary: {
      en: "The assistant in the corner is a project too: a knowledge base built from these repos at build time, keyword retrieval, a guard model in front, Redis rate limits behind. Ask it about any number on this site.",
      zh: "右下角那个助手本身也是个项目：构建的时候从这几个仓库生成知识库，回答前先过一道审查模型，身后还挂一层 Redis 限流。站里任何一个数字，都可以拿去问它。",
    },
    metrics: { en: "", zh: "" },
    problem: { en: "", zh: "" },
    audience: { en: "", zh: "" },
    role: { en: "", zh: "" },
    outcome: { en: "", zh: "" },
    stack: projectStack("RAG", "Redis"),
    architecture: [],
    provenance: [],
    boundaries: [],
    links: [],
  },
  {
    slug: "credit-policy-desk",
    track: "analytics",
    tier: "archive",
    title: { en: "Credit Policy Desk", zh: "Credit Policy Desk" },
    glossZh: "信贷策略模拟工作台",
    eyebrow: { en: "Risk analytics / policy governance", zh: "风险分析 / 策略治理" },
    summary: { en: "A score is not a policy. This desk walks the rest of the way: expected loss, thresholds, review capacity, and a recorded human decision.", zh: "A score is not a policy. This desk walks the rest of the way: expected loss, thresholds, review capacity, and a recorded human decision." },
    metrics: { en: "120,000 scored loans · 24,000 later backtest rows · capacity-gated policy audit", zh: "120,000 笔已评分贷款 · 24,000 条后续回测记录 · 容量门控的策略审计" },
    problem: { en: "A probability and one cutoff cannot capture loss economics, review capacity, score drift, or the human decision that sets policy.", zh: "单一概率与阈值无法涵盖损失经济学、复核容量、评分漂移，以及制定策略所需的人工决策。" },
    audience: { en: "Credit policy managers, risk analysts, and applied-ML governance teams whose job starts where the score ends.", zh: "信贷策略经理、风险分析师和机器学习治理团队——评分结束后，才进入他们负责的决策工作。" },
    role: { en: "I built the time-disciplined training and backtest pipeline, the score-to-policy contracts, the expected-loss and queue engine, and the browser UI that holds it together.", zh: "我构建了严格按时间切分的训练与回测管线、评分到策略的契约、预期损失与队列引擎，以及把这一切串起来的浏览器界面。" },
    outcome: { en: "The default path verifies committed offline scores, then recomputes approve/review/decline bands, swap sets, queue overflow, expected loss, calibration, vintage drift, descriptive slices, and a policy audit record.", zh: "默认路径先校验已提交的离线评分，再重算批准/复核/拒绝区间、换入换出集合、队列溢出、预期损失、校准、批次漂移、描述性切片与策略审计记录。" },
    stack: projectStack(
      "PD × LGD × EAD",
      { en: "Calibration & Brier", zh: "校准与 Brier" },
      { en: "PSI / vintage monitoring", zh: "PSI / 申请批次监控" },
      { en: "Policy simulation", zh: "策略模拟" },
      { en: "Directional SHAP reason codes", zh: "SHAP 方向性原因码" },
      "Parquet + DuckDB-WASM",
    ),
    architecture: [
      { label: { en: "Backtest", zh: "回测" }, detail: { en: "Train, calibrate, and score disjoint chronological Lending Club windows offline.", zh: "在互不重叠的 Lending Club 时间窗口上离线训练、校准与评分。" } },
      { label: { en: "Economics", zh: "经济" }, detail: { en: "Compute expected loss from PD, LGD, and EAD.", zh: "由 PD、LGD 与 EAD 计算预期损失。" } },
      { label: { en: "Policy", zh: "策略" }, detail: { en: "Apply approve, review, and decline thresholds.", zh: "应用批准、复核与拒绝阈值。" } },
      { label: { en: "Review", zh: "复核" }, detail: { en: "Enforce analyst-capacity constraints.", zh: "执行分析师容量约束。" } },
      { label: { en: "Monitor", zh: "监控" }, detail: { en: "Backtest vintages, PSI, slices, and audit changes.", zh: "回测放款批次、PSI、切片并审计变更。" } },
    ],
    fieldNotes: [
      {
        en: "I expected the 240-tree XGBoost challenger to pull away from the calibrated logistic baseline on the 24,000 later-backtest rows. It didn't: Brier 0.159253 against 0.159280, log loss 0.494320 against 0.493403, ROC AUC 0.675262 against 0.674615. Better on two of the three, worse on one, every margin far too small to act on.",
        zh: "我以为那个 240 棵树的 XGBoost 挑战者模型，会在 24,000 条后期回测记录上把校准过的逻辑回归基线甩开。并没有：Brier 0.159253 对 0.159280，对数损失 0.494320 对 0.493403，ROC AUC 0.675262 对 0.674615。三项里赢两项、输一项，每一项的差距都小到不足以据此做任何决定。",
      },
      {
        en: "The workbench opens on a policy that cannot be published, and that is deliberate. At approve ≤12% / review ≤28% with a review capacity of 180, the fixture's final vintage sends 345 applications to manual review — 165 over capacity — so the capacity gate blocks publication. I did not slide the threshold until the queue fit.",
        zh: "工作台一打开，摆在那里的就是一条无法发布的策略，这是故意的。批准 ≤12% / 复核 ≤28%、复核容量 180 时，夹具最后一个放款批次会把 345 笔申请推进人工复核——超出容量 165 笔——容量门禁于是拦下发布。我没有为了让队列装得下而去挪阈值。",
      },
    ],
    provenance: [
      { en: "The source toggle requests real data first: the browser verifies scored-backtest.parquet through DuckDB-WASM by default. If that offline training artifact is missing or invalid, the real backtest fails closed, stays labeled pending or blocked, and falls back to the governed synthetic fixture.", zh: "来源切换优先请求真实数据：浏览器默认通过 DuckDB-WASM 校验 scored-backtest.parquet。若该离线训练产物缺失或无效，真实回测直接阻断，状态保持标注为 pending 或 blocked，并单独回退至受约束的合成数据。" },
      { en: "Real mode loads 120,000 deterministically selected applications from the 1,347,681-row UCM-curated Lending Club granting archive (Zenodo 10.5281/zenodo.11295916, CC BY 4.0, retrieved 2026-07-17); the source size, MD5, SHA-256, creators, and time cutoffs are embedded in the Parquet metadata.", zh: "真实模式载入从 UCM 整理的 1,347,681 行 Lending Club 授信档案中确定性选取的 120,000 条申请（Zenodo 10.5281/zenodo.11295916，CC BY 4.0，获取于 2026-07-17）；Parquet 元数据内嵌源文件大小、MD5、SHA-256、作者与时间截止点。" },
      { en: "The committed artifact contains disjoint time-ordered 72,000 / 24,000 / 24,000 train, isotonic-calibration, and later backtest rows, observed final outcomes, calibrated logistic/XGBoost scores, and top-three SHAP-derived reason codes.", zh: "已提交产物包含互不重叠且按时间排序的 72,000 / 24,000 / 24,000 条训练集、等渗校准集与后续回测集记录，含观测到的最终结局、校准后的逻辑回归/XGBoost 分数，以及 SHAP 推导的前三位原因码。" },
      { en: "The optional seed-2026071302 fixture contains 12,000 fictional applications and remains isolated as a reproducible fallback and test mode.", zh: "可选的 seed-2026071302 夹具含 12,000 笔虚构申请，仅作为可复现的回退与测试模式独立保留。" },
      { en: "The inherited Streamlit/HF demo is prior work only; no original model is claimed as recovered or validated.", zh: "继承的 Streamlit/HF 演示仅为既往成果；不主张原模型已恢复，亦不主张其已获验证。" },
    ],
    boundaries: [
      { en: "Synthetic Brier, PSI, loss, and slice values are fixture results, not real performance or fairness evidence.", zh: "合成 Brier、PSI、损失与切片数值是夹具结果，不是真实性能或公平性声明。" },
      { en: "The lab does not process PII or represent regulatory compliance, deployed accuracy, or a real applicant decision.", zh: "本实验室不处理个人身份信息（PII），也不代表或证明监管合规性、部署准确率或真实申请人决策。" },
      { en: "LGD is a disclosed 45% assumption; legacy browser fields absent upstream use explicit unavailable sentinels, and home-ownership slices are descriptive only.", zh: "LGD 是明确披露的 45% 假设；上游缺失的旧版浏览器字段使用明确的不可用哨兵，住房状态切片仅作描述。" },
      { en: "This granted-loan-only archive does not represent rejected applicants or identify acceptance-population policy effects; it is an offline historical backtest, not causal impact, live or production decisioning, regulatory validation, or real-world fairness evidence.", zh: "该档案仅含已授信贷款，不代表被拒申请人，也不能识别完整受理人群的策略效果；它是离线历史回测，不构成因果影响、在线或生产决策、监管验证或真实世界公平性证据。" },
    ],
    links: [
      { label: { en: "GitHub repository", zh: "GitHub 仓库" }, href: "https://github.com/LucisZhang/credit-policy-desk" },
    ],
  },
  {
    slug: "analytics-tandem",
    track: "analytics",
    tier: "archive",
    title: { en: "Analytics Tandem", zh: "Analytics Tandem" },
    glossZh: "旧版分析项目兼容入口",
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
        en: "The Tableau dashboard and Hugging Face Space remain the public inspection surfaces. The source repository is private and is not used as public evidence.",
        zh: "Tableau 仪表盘与 Hugging Face Space 仍是公开检查界面；源码仓库为私有状态，不作为公开证据。",
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
      {
        label: { en: "GitHub repository", zh: "GitHub 仓库" },
        pending: { en: "The legacy Risk-Control-Portfolio repository is private; its rebuilt successor is Credit Policy Desk.", zh: "旧的 Risk-Control-Portfolio 仓库已转为私有；重建后的继任项目是 Credit Policy Desk。" },
      },
    ],
    legacy: true,
  },
];

export const projects = projectCatalog.filter((project) => project.published !== false);
export const routableProjects = projects.filter((project) => project.routeEnabled !== false);

const featuredProjectOrder: ProjectId[] = [
  "frontier-forge",
  "release-guardian",
  "triage-router",
  "privacy-preflight",
  "exactly-once-drills",
  "crossover-study",
  "rag-quality-lab",
  "ask-portfolio",
  "margin-control-tower",
  "credit-policy-desk",
];

export const homepageProjects = featuredProjectOrder
  .map((slug) => projects.find((project) => project.slug === slug))
  .filter((project): project is Project => Boolean(project));

export const featuredProjects = featuredProjectOrder
  .map((slug) => routableProjects.find((project) => project.slug === slug))
  .filter((project): project is Project => Boolean(project));

export function getTrack(id: string) {
  return tracks.find((track) => track.id === id);
}

export function getProjectsForTrack(track: TrackId) {
  return routableProjects.filter((project) => project.track === track && !project.legacy);
}

export function getProject(track: string, slug: string) {
  return routableProjects.find((project) => project.track === track && project.slug === slug);
}

export function isTrackId(value: string): value is TrackId {
  return value === "analytics" || value === "engineering" || value === "ai";
}

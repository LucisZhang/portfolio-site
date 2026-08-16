import type { LocalizedString } from "./i18n";

export type TrackId = "analytics" | "engineering" | "ai";
export type ProjectId =
  | "release-guardian"
  | "exactly-once-drills"
  | "rag-quality-lab"
  | "triage-router"
  | "privacy-preflight-mac"
  | "margin-control-tower"
  | "crossover-study"
  | "credit-policy-desk"
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

export const projects: Project[] = [
  {
    slug: "release-guardian",
    track: "ai",
    title: { en: "Release Guardian", zh: "发布守门人" },
    eyebrow: { en: "AI application / release engineering", zh: "AI 应用 / 发布工程" },
    summary: {
      en: "A 13-node LangGraph gate that decides whether a change is safe to ship — four evidence retrievers, deterministic validators, bounded retries. The publish button stays with a human.",
      zh: "一个判断变更能否安全发布的 13 节点 LangGraph 门禁——四路证据检索、确定性校验、有界重试。发布键始终握在人手里。",
    },
    metrics: { en: "132 live graph runs · 8/8 aggregate gates passed · 100% citation fidelity", zh: "132 次在线图运行 · 8/8 聚合门禁通过 · 引用忠实度 100%" },
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
      { label: { en: "Evidence", zh: "证据" }, detail: { en: "Gather code, schema, API, and operations evidence in parallel.", zh: "并行运行四个证据检索器。" } },
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
    title: { en: "Exactly-Once Drills", zh: "精确一次演练" },
    eyebrow: { en: "MySQL CDC → Flink → Iceberg · failure injection", zh: "MySQL CDC → Flink → Iceberg · 故障注入" },
    summary: {
      en: "I break a MySQL-to-Flink-to-Iceberg pipeline on purpose, then check that source state, table snapshots, and event IDs still agree after recovery.",
      zh: "我故意破坏 MySQL→Flink→Iceberg 管道，恢复后核对源状态、表快照与事件 ID 仍一致。",
    },
    metrics: { en: "5 induced failure classes · 0 snapshot diffs after recovery", zh: "5 类故障注入 · 恢复后快照差异为 0" },
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
    title: { en: "RAG Quality Lab", zh: "RAG 质量实验室" },
    eyebrow: { en: "Deterministic RAG evaluation", zh: "确定性 RAG 评估" },
    summary: {
      en: "A knowledge-base update that looked harmless degraded the strongest pipeline on 4 of 12 controlled questions. The regression run caught it; I then rebuilt the same evidence lifecycle to survive an 11,309-document corpus.",
      zh: "一次看起来无害的知识库更新，让最强的流水线在 12 道受控问题里退化了 4 道。回归测试抓住了它；随后我把同一套证据生命周期重建到能撑住 11,309 份文档的规模。",
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
    title: { en: "Triage Router", zh: "投诉分流路由" },
    eyebrow: { en: "Three model tiers · cost-aware routing", zh: "三层模型 · 成本感知路由" },
    summary: {
      en: "The expensive model was the wrong default: on held-out IID data Claude Sonnet 5 is statistically indistinguishable from Haiku 4.5 at 2.8× the cost, and under a shared output budget it silently answers nothing on up to 2.5% of calls. TF-IDF linear models, fine-tuned transformers, and Claude tiers triage the same CFPB consumer complaints; a confidence cascade routes each one to the cheapest tier that can handle it, measured against 11 years of distribution drift.",
      zh: "贵的模型并不是稳妥的默认选项：在留出的同分布数据上，Claude Sonnet 5 与 Haiku 4.5 在统计上分不出高下，成本却是 2.8 倍；在共用的输出预算下，它还会在最多 2.5% 的调用上悄无声息地什么都不答。TF-IDF 线性模型、微调 Transformer 和 Claude 各层对同一批 CFPB 消费者投诉做分流；置信级联把每条投诉路由到能处理它的最便宜一层，并在 11 年的分布漂移上实测。",
    },
    metrics: {
      en: "Router +0.037 macro-F1 over baseline · −$120.58 expected cost per 1k · drift measured 2015–2026",
      zh: "路由较基线 +0.037 macro-F1 · 每千条预期成本 −$120.58 · 实测 2015–2026 漂移",
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
      { label: { en: "Live demo", zh: "在线演示" }, href: "https://luciszhang.github.io/triage-router/" },
    ],
  },
  {
    slug: "privacy-preflight-mac",
    track: "ai",
    title: { en: "Privacy Preflight Web", zh: "隐私预检网页版" },
    eyebrow: { en: "Browser-local redaction workbench", zh: "浏览器本地脱敏工作台" },
    summary: {
      en: "A black box drawn over text is not redaction. This browser workbench detects sensitive content locally, destroys it, then re-opens the output to prove it is gone — or blocks the export. English and Simplified Chinese OCR included.",
      zh: "在文字上盖个黑块不叫脱敏。这个浏览器工作台在本地检测敏感内容、做破坏性清除，再重新打开输出文件验证内容确实消失——验证不过就拦下导出。支持英文与简体中文 OCR。",
    },
    metrics: {
      en: "96 embedded-worker tests · 67 recorded browser cases · OCR 19/19 hits / 2 false positives",
      zh: "96 项嵌入式 worker 测试 · 67 个已记录浏览器案例 · OCR 命中 19/19 / 误报 2",
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
    title: { en: "Margin Control Tower", zh: "毛利控制塔" },
    eyebrow: { en: "Analytics engineering / margin decisions", zh: "分析工程 / 毛利决策" },
    summary: { en: "When weekly contribution margin moves, this browser tool shows where it went — discounts, returns, cost of goods, or fulfillment — starting from a hash-verified Olist aggregate. A category manager can test a bounded promotion scenario before recording an action.", zh: "周度贡献毛利一动，这个浏览器工具就能拆出它去了哪——折扣、退货、货品成本还是履约——起点是经过哈希校验的 Olist 聚合数据。品类经理可以先在有边界的促销情景里试一遍，再记录行动。" },
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
    title: { en: "Crossover Study", zh: "交叉点研究" },
    eyebrow: { en: "Spark + Iceberg lakehouse · recommender evaluation", zh: "Spark + Iceberg 湖仓 · 推荐系统评估" },
    summary: {
      en: "How much history does a user need before personalization beats popularity? I pushed 43.9M Amazon reviews through a contract-checked Spark + Iceberg lakehouse on a 16 GB laptop to find the crossover point. At every measured history depth, it never came.",
      zh: "用户要攒下多少历史，个性化推荐才能赢过热门榜？我在一台 16 GB 笔记本上，把 43.9M 条亚马逊评论灌进带契约检查的 Spark + Iceberg 湖仓去找这个交叉点。在所有实测的历史深度上，它始终没有出现。",
    },
    metrics: {
      en: "43.9M reviews ingested · 15.5M five-core interactions · crossover: not found",
      zh: "灌入 43.9M 条评论 · 五核过滤后剩 15.5M 条交互 · 交叉点：未出现",
    },
    problem: {
      en: "Personalization is assumed to win once you have data. Nobody says how much data, and few evaluations use full-catalog ranking — the setting where the answer would actually show.",
      zh: "大家默认只要有了数据，个性化就会赢。但没人说清要多少数据；而真正能让答案现形的全目录排序评估，很少有人做。",
    },
    audience: {
      en: "Recommender and data-platform engineers who want the evaluation governed as strictly as the pipeline.",
      zh: "希望评估环节和数据管道一样受严格治理的推荐系统与数据平台工程师。",
    },
    role: {
      en: "I built the lakehouse and the evaluation on top of it: bronze-to-gold Iceberg tables with enforced contracts, a reconciliation waterfall accounted to the row, four model families, and a routing policy fitted only on validation.",
      zh: "湖仓和它上面的评估都是我做的：带强制契约的 bronze 到 gold Iceberg 表、逐行对得上的对账瀑布、四类模型，以及只在验证集上拟合的路由策略。",
    },
    outcome: {
      en: "43,886,944 raw reviews reconcile to 15,473,536 five-core interactions with every dropped row accounted for. Popularity holds the top of the full-catalog ranking at every observed history depth — the honest headline is the crossover that never came.",
      zh: "43,886,944 条原始评论对账到 15,473,536 条五核交互，每一条被剔除的记录都有去处。在所有观测到的历史深度上，热门榜都守住了全目录排序的头名——诚实的结论就是：交叉点没有出现。",
    },
    stack: projectStack(
      "PySpark",
      "Apache Iceberg",
      { en: "MinHash dedup", zh: "MinHash 去重" },
      { en: "Implicit ALS", zh: "隐式反馈 ALS" },
      { en: "MiniLM embeddings", zh: "MiniLM 向量" },
      { en: "Bootstrap CIs", zh: "自举置信区间" },
    ),
    architecture: [
      { label: { en: "Ingest", zh: "落库" }, detail: { en: "Land 43.9M raw reviews and 1.61M items into schema-enforced bronze Iceberg tables.", zh: "把 43.9M 条原始评论与 1.61M 件商品落入强制 schema 的 bronze Iceberg 表。" } },
      { label: { en: "Gate", zh: "门禁" }, detail: { en: "Contracts drop 521,520 rows — rating violations, duplicates, superseded records — each one counted.", zh: "契约共剔除 521,520 行——评分越界、重复、被覆盖的记录——每一行都有计数。" } },
      { label: { en: "Core", zh: "过滤" }, detail: { en: "Iterative five-core filtering converges in 16 rounds to 15.5M interactions.", zh: "迭代式五核过滤 16 轮收敛，得到 15.5M 条交互。" } },
      { label: { en: "Rank", zh: "排序" }, detail: { en: "Score popularity, item-kNN, ALS, and semantic retrieval on full-catalog ranking over 368k items.", zh: "在 368k 件商品的全目录排序上评估热门、item-kNN、ALS 与语义检索。" } },
      { label: { en: "Route", zh: "路由" }, detail: { en: "Fit a history-depth routing threshold on validation; report only on the untouched test window.", zh: "在验证集上拟合历史深度路由阈值，只在从未动过的测试窗口上报告。" } },
    ],
    fieldNotes: [
      {
        en: "I built the lakehouse to find the history depth where personalization overtakes popularity, and there isn't one. ALS trails trailing-12-month popularity in every warm segment, every CI excluding zero: −0.00256 at 1–4 interactions, −0.00230 at 5–9, −0.00257 at 10–19, −0.00146 at 20+. The deficit does shrink as history deepens. It never reaches zero inside the depths I can observe.",
        zh: "我搭这套湖仓，是为了找出个性化超过热门榜的那个历史深度——它不存在。在每一个暖用户分段上，ALS 都落后于近 12 个月的热门榜，每个置信区间都不含零：1–4 次交互 −0.00256，5–9 次 −0.00230，10–19 次 −0.00257，20+ 次 −0.00146。差距确实随历史加深而收窄，但在我能观测到的深度里，它从未走到零。",
      },
      {
        en: "Rank-128 ALS died mid-training on java.io.IOException: No space left on device, with about 24GB free. Each iteration shuffles roughly 7.3GB at that rank, and Spark only reclaims shuffle files when checkpointing truncates lineage — at checkpointInterval=5 that keeps about 36GB alive. checkpoint_interval=2 bounded retention to about 15GB, and the retry finished in 1,034 s.",
        zh: "rank=128 的 ALS 训练到一半就死在 java.io.IOException: No space left on device 上，当时磁盘大约还剩 24GB。这个 rank 下每轮迭代的 shuffle 大约 7.3GB，而 Spark 只有在检查点截断血缘时才回收 shuffle 文件——checkpointInterval=5 意味着留着大约 36GB 不放。改成 checkpoint_interval=2 把留存压到大约 15GB，重试用 1,034 秒跑完。",
      },
      {
        en: "Two chained grid runs were killed by external SIGTERMs. I checked the obvious explanation — a timeout — and it did not hold: every run was already backgrounded, and longer chains completed fine. I never found the source. The per-point background execution and RSS capture I added to survive it are still in the harness.",
        zh: "有两次串起来跑的网格实验被外部 SIGTERM 杀掉了。我查了最顺手的解释——超时——但站不住脚：所有运行本来就在后台，更长的链条反而跑完了。原因我始终没有找到。为了扛过它而加的逐点后台执行和 RSS 记录，至今还留在框架里。",
      },
    ],
    provenance: [
      {
        en: "Temporal splits are frozen in config: train through 2022-06-30, validation on 2022-H2, test from 2023-01-01. The test window was untouched during iteration.",
        zh: "时间切分冻结在配置里：训练截至 2022-06-30，验证用 2022 下半年，测试从 2023-01-01 起。迭代期间从未碰过测试窗口。",
      },
      {
        en: "Every reported number is a results-log record bound to its config hash, git SHA, and Iceberg snapshot ID, with 95% user-bootstrap confidence intervals (n=1,000).",
        zh: "每个报告数字都是结果日志记录，绑定配置哈希、git SHA 与 Iceberg 快照 ID，附 95% 用户自举置信区间（n=1,000）。",
      },
      {
        en: "The demo reads only committed projections of that log; user IDs are re-hashed and the research-licensed raw data is never redistributed.",
        zh: "演示只读取该日志的已提交投影；用户 ID 经过重新哈希，研究许可的原始数据不做再分发。",
      },
    ],
    boundaries: [
      {
        en: "\"Personalization never crossed\" applies to this catalog, five-core filtering, and the observed history depths — not to recommenders in general.",
        zh: "「个性化没有跨过热门榜」只适用于这份商品目录、五核过滤和观测到的历史深度，不是对推荐系统的普遍结论。",
      },
      {
        en: "Absolute NDCG values are small because ranking runs over the full 368k-item catalog with no sampled negatives; the comparisons between models are the meaningful part.",
        zh: "NDCG 绝对值很小，因为排序在 368k 件商品的全目录上进行、不做负采样；有意义的是模型之间的比较。",
      },
      {
        en: "Single-machine batch evaluation only: no serving system, no online metric, no A/B test.",
        zh: "仅为单机批式评估：没有服务系统、没有在线指标、没有 A/B 测试。",
      },
    ],
    links: [
      { label: { en: "GitHub repository", zh: "GitHub 仓库" }, href: "https://github.com/LucisZhang/crossover-study" },
    ],
  },
  {
    slug: "credit-policy-desk",
    track: "analytics",
    title: { en: "Credit Policy Desk", zh: "信贷策略工作台" },
    eyebrow: { en: "Risk analytics / policy governance", zh: "风险分析 / 策略治理" },
    summary: { en: "A score is not a policy. This workbench starts from a hash-verified Lending Club backtest and walks the rest of the way: expected loss, approval thresholds, review capacity, monitoring, and a recorded human decision at the end.", zh: "评分不等于策略。这个工作台从经哈希校验的 Lending Club 回测出发，把剩下的路走完：预期损失、审批阈值、复核容量、监控，最后落到一条留档的人工决策。" },
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
      {
        label: { en: "GitHub repository", zh: "GitHub 仓库" },
        pending: { en: "The legacy Risk-Control-Portfolio repository is private; its rebuilt successor is Credit Policy Desk.", zh: "旧的 Risk-Control-Portfolio 仓库已转为私有；重建后的继任项目是信贷策略工作台。" },
      },
    ],
    legacy: true,
  },
];

const featuredProjectOrder: ProjectId[] = [
  "release-guardian",
  "rag-quality-lab",
  "triage-router",
  "privacy-preflight-mac",
  "margin-control-tower",
  "exactly-once-drills",
  "crossover-study",
  "credit-policy-desk",
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

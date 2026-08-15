export const recruiterQuestionsByRoute: Record<string, { en: string[]; zh: string[] }> = {
  "/": {
    en: [
      "Which of the three disciplines you list — Applied AI, data engineering, or data analytics — do you consider your strongest fit, and why?",
      "Your headline says your projects show how they work and where they stop — what does that look like in practice across the six case studies?",
      "Can I actually run the six interactive demos in my browser, and what does each one demonstrate?",
      "The project cards cite specific numbers, such as 132 graph runs and zero snapshot diffs — how were those measured, and where can I verify them?",
    ],
    zh: [
      "在你列出的三个方向——AI 应用、数据工程和数据分析——中，你认为自己最适合哪一个？为什么？",
      "首页标题说这些项目既展示如何工作，也说明能力边界——这在六个案例中分别如何体现？",
      "这六个交互式演示都能直接在浏览器中运行吗？它们各自展示了什么？",
      "项目卡片列出了 132 次图工作流运行、零快照差异等具体数字——这些结果如何测量，又能在哪里核验？",
    ],
  },
  "/ai": {
    en: [
      "Your AI thesis emphasizes repeatable checks, human approval, and clear operating limits — how do the three projects on this page put that into practice?",
      "Which of these three projects is your strongest evidence for an Applied AI engineering role, and what does it show?",
      "Release Guardian and RAG Quality Lab both gate changes with evaluation — how do their approaches differ?",
      "Are any of these AI systems production deployments, or are they evaluation and workbench environments?",
    ],
    zh: [
      "你的 AI 主张强调可重复检查、人工批准和清晰的运行边界——本页三个项目如何把这些原则落到实践？",
      "这三个项目中，哪一个最能证明你适合 AI 应用工程岗位？它具体展示了什么？",
      "Release Guardian 和 RAG Quality Lab 都以评估门控变更——两者的做法有何不同？",
      "这些 AI 系统中有生产部署吗，还是目前属于评估与工作台环境？",
    ],
  },
  "/engineering": {
    en: [
      "Why is breaking pipelines on purpose your data-engineering thesis, and what does it show that a happy-path demo cannot?",
      "What do the Release Guardian and RAG Quality Lab entries under related engineering evidence add to your data-engineering story?",
      "How much of the MySQL-to-Flink-to-Iceberg stack did you build and operate yourself?",
      "After you inject a failure, how do you verify that recovery actually restored a correct state?",
    ],
    zh: [
      "为什么“故意打坏流水线”是你的数据工程主张？它能展示仅有正常路径的演示无法展示什么？",
      "相关工程证据中的 Release Guardian 和 RAG Quality Lab，为你的数据工程能力补充了什么？",
      "从 MySQL 到 Flink 再到 Iceberg 的技术栈中，哪些部分由你亲自搭建和运行？",
      "注入故障后，你如何验证恢复确实回到了正确状态？",
    ],
  },
  "/analytics": {
    en: [
      "Both analytics projects start from a hash-verified dataset — why does that level of rigor matter for analytics work?",
      "How do these two tools go beyond dashboards to support an actual recorded decision?",
      "You say you make every assumption visible — what are examples of assumptions you deliberately disclosed in these projects?",
      "You use public Olist and Lending Club data — how well does that translate to a company's real margin or credit problems?",
    ],
    zh: [
      "两个分析项目都从经过哈希校验的数据集开始——这种严谨度为什么对分析工作重要？",
      "这两个工具如何超越仪表盘，真正支撑一次有记录的决策？",
      "你说会让每项假设都清晰可见——在这些项目中，你主动披露了哪些假设？",
      "你使用公开的 Olist 和 Lending Club 数据——这些分析能在多大程度上迁移到企业真实的毛利或信贷问题？",
    ],
  },
  "/ai/release-guardian": {
    en: [
      "Why does the publish decision stay with a human, and how does the workflow enforce that pause?",
      "The evaluation reports 8/8 aggregate gates passed but also a 30/44 strict all-trials residual — how should I read those two numbers together?",
      "You built Python, Go, Java, and TypeScript services around the LangGraph workflow — what does each part of that stack do?",
      "How does the SHA-256 audit hash chain make the approval record tamper-evident?",
    ],
    zh: [
      "为什么发布决定必须由人做出？工作流如何强制保留这次人工停顿？",
      "评估报告显示 8/8 个聚合门禁通过，但严格全试验视角仍有 30/44 的残余——这两个数字应如何放在一起理解？",
      "你围绕 LangGraph 工作流搭建了 Python、Go、Java 和 TypeScript 服务——技术栈中的每一部分分别负责什么？",
      "SHA-256 审计哈希链如何让批准记录具备可验证的防篡改能力？",
    ],
  },
  "/ai/rag-quality-lab": {
    en: [
      "Walk me through the regression that started this project — what changed and how did the harness catch it?",
      "How does the retrieval runner evaluate quality without using an LLM judge?",
      "At the 11,309-document scale, what does your current evidence actually prove, and what would still need to be measured?",
      "What do the deterministic manifests and the Manifest and Drift Lab verify, and why does that matter for trusting the results?",
    ],
    zh: [
      "请复盘一下引发这个项目的回归——当时发生了什么变化，评测框架又是如何捕获它的？",
      "检索运行器如何在不使用 LLM 裁判的情况下评估质量？",
      "在 11,309 份文档规模下，现有证据实际证明了什么？还有哪些内容仍需测量？",
      "确定性清单与 Manifest and Drift Lab 分别核验什么？为什么这些检查会影响结果的可信度？",
    ],
  },
  "/ai/privacy-preflight-mac": {
    en: [
      "Why did you build the redaction workbench to run entirely in the browser, and what constraints did that impose?",
      "What do the destructive export checks verify before a redacted file is released?",
      "The OCR benchmark shows 19/19 expected-value hits with 2 false positives — how far should I generalize that result?",
      "Where does human review remain mandatory in this workflow, and why can't the OCR be fully trusted?",
    ],
    zh: [
      "为什么你把脱敏工作台设计为完全在浏览器内运行？这带来了哪些约束？",
      "破坏式导出检查会在脱敏文件释放前核验哪些内容？",
      "OCR 基准测试显示 19/19 个期望值命中、2 个误报——这个结果可以外推到什么范围？",
      "这个流程中的哪些环节仍必须人工复核？为什么不能完全依赖 OCR？",
    ],
  },
  "/engineering/exactly-once-drills": {
    en: [
      "Which five failure classes do you induce, and why did you choose those?",
      "After recovery, how do you prove the pipeline didn't silently lose or duplicate events?",
      "The page shows a May benchmark run and a later July reproduction on a local Mac — what does the second run add?",
      "What are the stated limits of this evidence — would the zero-snapshot-diff result hold on different hardware?",
    ],
    zh: [
      "你会注入哪五类故障？为什么选择这五类？",
      "恢复后，你如何证明流水线没有静默丢失或重复处理事件？",
      "页面展示了 5 月的基准运行和后来在本地 Mac 上完成的 7 月复现——第二次运行补充了什么？",
      "这项证据明确写出的边界是什么？零快照差异的结果在不同硬件上还会成立吗？",
    ],
  },
  "/analytics/margin-control-tower": {
    en: [
      "What can a category manager decide with this tool that a revenue-only dashboard wouldn't support?",
      "What do the ten fail-closed contract checks guard against, and what happens when one of them fails?",
      "How does the margin-bridge decomposition attribute a weekly change to discounts, returns, cost of goods, and fulfillment?",
      "The promotion scenario depends on an elasticity assumption — how is it disclosed and checked, and what does it deliberately not claim?",
    ],
    zh: [
      "品类经理能用这个工具做出哪些只看收入的仪表盘无法支持的决策？",
      "十项失败即拦截的契约检查分别防范什么？其中一项失败时会发生什么？",
      "毛利桥接分解如何把每周变化归因到折扣、退货、商品成本和履约？",
      "促销场景依赖弹性假设——这个假设如何披露和检查，又明确不主张什么？",
    ],
  },
  "/analytics/credit-policy-desk": {
    en: [
      "Your premise is that a probability and one cutoff aren't a policy — what does the lab add on top of the model score?",
      "How does the time-disciplined backtest prevent leakage between the training, calibration, and later backtest windows?",
      "How do review capacity and queue overflow shape the approve, review, and decline thresholds?",
      "The archive covers granted loans only — what does that limit about your conclusions, and how do you handle it?",
    ],
    zh: [
      "你的前提是一个概率加一个截止值并不构成策略——实验室在模型分数之上补充了什么？",
      "遵守时间边界的回测如何防止训练、校准和后续回测窗口之间发生泄漏？",
      "复核容量与队列溢出如何共同影响批准、复核和拒绝阈值？",
      "数据档案只覆盖已放款贷款——这会限制哪些结论？你如何处理这一边界？",
    ],
  },
  "/ai/triage-router": {
    en: [
      "How does the three-tier cascade decide when to escalate a complaint instead of routing it at the cheapest tier?",
      "What does cost-aware routing mean here, and how do you measure the cost and accuracy tradeoff?",
      "Why CFPB complaint data specifically, and what does that dataset let you claim or not claim?",
      "What happens when a complaint is ambiguous across tiers, and how does the router avoid silent misrouting?",
    ],
    zh: [
      "三层级联路由如何决定何时升级投诉，而不是用最低成本层级处理？",
      "这里的成本感知路由具体指什么？你如何衡量成本与准确率之间的权衡？",
      "为什么选择 CFPB 投诉数据？这个数据集能支持哪些结论，又不能支持哪些？",
      "当一条投诉在多个层级之间界限模糊时会发生什么？路由器如何避免静默误判？",
    ],
  },
  "/engineering/crossover-study": {
    en: [
      "What does the 43.9M-review Spark and Iceberg lakehouse pipeline actually build and evaluate?",
      "You ran a full-catalog recsys evaluation and popularity never crossed — what does that negative result mean, and why report it?",
      "What would need to change for a popularity-based baseline to be overtaken in this setup?",
      "How does the Spark and Iceberg layer keep the full-catalog evaluation reproducible at that scale?",
    ],
    zh: [
      "这个基于 4390 万条评论的 Spark + Iceberg 数据湖仓管道具体构建并评估了什么？",
      "你进行了全目录推荐系统评估，热门基线始终未被超越——这个否定结果说明了什么？为什么要报告它？",
      "在这个实验设置下，要让基于热门度的基线被超越，需要改变什么？",
      "在这个规模下，Spark 与 Iceberg 这一层如何保证全目录评估的可复现性？",
    ],
  },
};

export interface RecruiterSearchSuggestion {
  id: string;
  label: { en: string; zh: string };
  intent: string;
  expectedId: string;
  acceptableIds: string[];
}

export const recruiterSearchSuggestions: RecruiterSearchSuggestion[] = [
  { id: "langgraph-release-gate", label: { en: "LangGraph release gate", zh: "LangGraph 发布门禁" }, intent: "tool", expectedId: "release-guardian", acceptableIds: ["track-ai"] },
  { id: "prompt-injection-defense", label: { en: "prompt injection defense", zh: "提示注入防护" }, intent: "outcome", expectedId: "release-guardian", acceptableIds: ["track-ai"] },
  { id: "rag-regression-evaluation", label: { en: "RAG regression evaluation", zh: "RAG 回归评估" }, intent: "capability", expectedId: "rag-quality-lab", acceptableIds: ["track-ai"] },
  { id: "browser-local-pdf-redaction", label: { en: "browser-local PDF redaction", zh: "浏览器本地 PDF 脱敏" }, intent: "use-case", expectedId: "privacy-preflight-mac", acceptableIds: ["track-ai"] },
  { id: "simplified-chinese-ocr", label: { en: "Simplified Chinese OCR", zh: "简体中文 OCR" }, intent: "capability", expectedId: "privacy-preflight-mac", acceptableIds: ["track-ai"] },
  { id: "streaming-failure-injection", label: { en: "streaming failure injection", zh: "流式故障注入" }, intent: "capability", expectedId: "exactly-once-drills", acceptableIds: ["track-engineering"] },
  { id: "flink-cdc-iceberg", label: { en: "Flink CDC to Iceberg", zh: "Flink CDC 到 Iceberg" }, intent: "tool", expectedId: "exactly-once-drills", acceptableIds: ["track-engineering"] },
  { id: "contribution-margin-analysis", label: { en: "contribution margin analysis", zh: "贡献毛利分析" }, intent: "business-problem", expectedId: "margin-control-tower", acceptableIds: ["track-analytics"] },
  { id: "promotion-scenario-elasticity", label: { en: "promotion scenario elasticity", zh: "促销场景弹性" }, intent: "capability", expectedId: "margin-control-tower", acceptableIds: ["track-analytics"] },
  { id: "credit-policy-thresholds", label: { en: "credit approval policy thresholds", zh: "信贷审批策略阈值" }, intent: "business-problem", expectedId: "credit-policy-desk", acceptableIds: ["track-analytics"] },
  { id: "risk-analyst", label: { en: "risk analyst", zh: "风险分析师" }, intent: "role", expectedId: "credit-policy-desk", acceptableIds: ["track-analytics"] },
  { id: "data-engineering", label: { en: "data engineering", zh: "数据工程" }, intent: "role", expectedId: "track-engineering", acceptableIds: ["exactly-once-drills"] },
  { id: "complaint-triage-cascade", label: { en: "complaint triage cascade routing", zh: "投诉分级级联路由" }, intent: "capability", expectedId: "triage-router", acceptableIds: ["track-ai"] },
  { id: "cost-aware-routing", label: { en: "cost-aware routing", zh: "成本感知路由" }, intent: "capability", expectedId: "triage-router", acceptableIds: ["track-ai"] },
  { id: "spark-iceberg-lakehouse", label: { en: "Spark and Iceberg lakehouse", zh: "Spark 与 Iceberg 数据湖仓" }, intent: "tool", expectedId: "crossover-study", acceptableIds: ["track-engineering"] },
  { id: "recsys-popularity-baseline", label: { en: "recsys popularity baseline evaluation", zh: "推荐系统热门基线评估" }, intent: "business-problem", expectedId: "crossover-study", acceptableIds: ["track-engineering"] },
];

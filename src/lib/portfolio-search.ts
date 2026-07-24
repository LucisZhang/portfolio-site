import MiniSearch, { type SearchResult } from "minisearch";
import type { Locale } from "./i18n";
import type { Project, ProjectId, Track } from "./projects";

export interface PortfolioSearchResult {
  id: string;
  href: string;
  label: string;
  context: string;
  reason: string;
  score: number;
}

interface SemanticProfile {
  aliases: string;
  domains: string;
  capabilities: string;
  useCases: string;
  roles: string;
}

interface SearchDocument {
  id: string;
  track: string;
  href: string;
  label: string;
  context: string;
  title: string;
  eyebrow: string;
  summary: string;
  stack: string;
  body: string;
  aliases: string;
  domains: string;
  capabilities: string;
  useCases: string;
  roles: string;
}

const semanticProfiles: Partial<Record<ProjectId, SemanticProfile>> = {
  "release-guardian": {
    aliases: "release gate AI release guard launch approval 发布门禁 上线门禁 发布审批 智能体守门",
    domains: "AI application AI applications agent engineering release engineering LLM operations software quality governance risk control AI 应用 智能体工程 发布工程 大模型运维 软件质量 治理 风控",
    capabilities: "agent workflow multi-agent LangGraph orchestration guardrail evaluator regression evaluation deterministic validator evidence retrieval human approval bounded retry fail closed model routing prompt injection rollback citation 智能体 工作流 多智能体 编排 护栏 评估 回归测试 确定性验证 证据检索 人工审批 有限重试 失败拦截 模型路由 提示注入 回滚 引用",
    useCases: "decide whether an AI system can ship inspect release evidence block unsafe launch compare live and deterministic evaluation 判断 AI 系统能否发布 检查发布证据 拦截不安全上线 比较在线与确定性评估",
    roles: "applied AI engineer AI application engineer agent engineer evaluation engineer release engineer platform engineer AI 应用工程师 智能体工程师 评估工程师 发布工程师 平台工程师",
  },
  "p1-reliability-lab": {
    aliases: "streaming lab reliability lab pipeline recovery 流式实验室 可靠性实验室 数据管道恢复",
    domains: "data engineering streaming systems reliability engineering distributed systems real time analytics 数据工程 流式系统 可靠性工程 分布式系统 实时分析",
    capabilities: "MySQL CDC Flink Iceberg change data capture checkpoint savepoint schema evolution failure injection replay recovery exactly once data consistency source table event state 故障注入 回放 恢复 检查点 保存点 模式演进 数据一致性 源端 表 事件状态",
    useCases: "recover a broken streaming pipeline verify CDC continuity test checkpoint restore audit event delivery 恢复故障流式管道 验证 CDC 连续性 测试检查点恢复 审计事件交付",
    roles: "data engineer streaming engineer platform engineer reliability engineer 数据工程师 流式计算工程师 平台工程师 可靠性工程师",
  },
  "rag-quality-lab": {
    aliases: "retrieval lab RAG evaluation retrieval quality knowledge base quality 检索实验室 RAG 评估 检索质量 知识库质量",
    domains: "AI application AI applications retrieval augmented generation information retrieval AI evaluation search relevance knowledge systems AI 应用 检索增强生成 信息检索 AI 评估 搜索相关性 知识系统",
    capabilities: "RAG retrieval agent agentic assistant ranking recall precision grounded answer citation regression benchmark corpus document adapter query set deterministic runner manifest vector database 检索 智能体 助手 排序 召回 精确率 事实依据 引用 回归 基准 语料 文档适配器 问题集 确定性运行器 清单 向量数据库",
    useCases: "measure retrieval regressions compare search configurations verify grounded answers evaluate a knowledge base 检测检索回归 比较搜索配置 验证有依据的回答 评估知识库",
    roles: "applied AI engineer RAG engineer evaluation engineer search engineer ML engineer AI 应用工程师 RAG 工程师 评估工程师 搜索工程师 机器学习工程师",
  },
  "privacy-preflight-mac": {
    aliases: "privacy preflight redaction workbench document sanitizer 隐私预检 脱敏工作台 文档清理",
    domains: "AI application AI applications privacy engineering document processing browser local security data protection compliance tooling AI 应用 隐私工程 文档处理 浏览器本地 安全 数据保护 合规工具",
    capabilities: "PII redaction OCR PDF image text local processing scan sensitive information bounding box burn in image only export metadata removal validation 个人信息 脱敏 文字识别 图片 文本 本地处理 扫描 敏感信息 检测框 像素烧录 纯图像导出 元数据清理 验证",
    useCases: "remove sensitive information before sharing inspect a PDF locally redact email phone path export a verified document 分享前删除敏感信息 本地检查 PDF 脱敏邮箱电话路径 导出已验证文档",
    roles: "applied AI engineer privacy engineer frontend engineer document AI engineer security tooling engineer AI 应用工程师 隐私工程师 前端工程师 文档智能工程师 安全工具工程师",
  },
  "margin-control-tower": {
    aliases: "margin dashboard profitability control tower profit analysis 毛利看板 利润控制塔 盈利分析",
    domains: "ecommerce finance commercial analytics profitability unit economics category management retail operations 电商 金融 财务 商业分析 盈利能力 单位经济 品类管理 零售运营",
    capabilities: "Olist contribution margin revenue discount return cost of goods COGS fulfillment promotion elasticity anomaly detection holdout scenario pipeline Parquet hash verification 贡献毛利 收入 折扣 退货 商品成本 履约 促销 弹性 异常检测 留出期 情景分析 数据管道 哈希校验",
    useCases: "explain a weekly margin change diagnose lost profit test a promotion decide a category action 解释每周毛利变化 诊断利润损失 测试促销 决定品类行动",
    roles: "data analyst analytics engineer commercial analyst business intelligence category analyst 数据分析师 分析工程师 商业分析师 BI 分析师 品类分析师",
  },
  "credit-policy-lab": {
    aliases: "credit risk lab lending policy simulator loan approval 信贷风控实验室 借贷策略模拟 贷款审批",
    domains: "finance fintech banking lending credit risk analytics risk management policy governance 金融 金融科技 银行 借贷 信贷 风险分析 风险管理 策略治理",
    capabilities: "Lending Club credit score probability of default expected loss approval review decline threshold queue capacity calibration Brier drift PSI vintage backtest challenger swap set audit 评分 违约概率 预期损失 批准 复核 拒绝 阈值 队列容量 校准 漂移 批次 回测 挑战模型 换入换出 审计",
    useCases: "turn model scores into lending policy test approval thresholds manage review capacity monitor credit drift record a policy decision 将模型评分转成信贷策略 测试审批阈值 管理复核容量 监控信贷漂移 记录策略决策",
    roles: "risk analyst credit analyst data analyst decision scientist model risk analyst analytics engineer 风险分析师 信贷分析师 数据分析师 决策科学家 模型风险分析师 分析工程师",
  },
};

const explicitTrackTerms: Record<string, string[]> = {
  ai: ["ai applications", "ai application", "applied ai", "ai 应用", "人工智能应用"],
  engineering: ["data engineering", "数据工程", "流式数据工程"],
  analytics: ["data analytics", "data analysis", "数据分析", "商业分析方向"],
};

const lexicalFields = ["title", "eyebrow", "summary", "stack", "body"];
const semanticFields = ["aliases", "domains", "capabilities", "useCases", "roles"];
const RRF_K = 24;
const explicitNoMatchMarkers = ["unrelated", "not related", "random nonsense", "无关", "随机乱码"];
const ignoredTerms = new Set([
  "a", "an", "and", "about", "completely", "find", "for", "me", "of", "or", "page", "phrase", "project", "show", "something", "the", "to", "unrelated", "with",
  "一个", "一些", "关于", "帮我", "完全", "无关", "查找", "项目", "页面", "看看", "内容",
]);

function normalize(value: string) {
  return value.toLowerCase().normalize("NFKC").replace(/[\p{P}\p{S}]+/gu, " ").replace(/\s+/g, " ").trim();
}

function tokenize(value: string) {
  const normalized = normalize(value);
  if (!normalized) return [];
  const output = new Set<string>();
  const add = (term: string) => {
    const clean = normalize(term);
    if (clean && !ignoredTerms.has(clean)) output.add(clean);
  };

  try {
    const segmenter = new Intl.Segmenter("zh-Hans", { granularity: "word" });
    for (const segment of segmenter.segment(normalized)) {
      if (segment.isWordLike) add(segment.segment);
    }
  } catch {
    normalized.split(" ").forEach(add);
  }

  for (const word of normalized.match(/[a-z0-9][a-z0-9+#.\/-]*/g) ?? []) add(word);
  for (const run of normalized.match(/[\p{Script=Han}]+/gu) ?? []) {
    add(run);
    if (run.length > 1) {
      for (let index = 0; index < run.length - 1; index += 1) add(run.slice(index, index + 2));
    }
  }
  return [...output];
}

function queryUnits(value: string) {
  const normalized = normalize(value);
  const output = new Set<string>();
  const add = (term: string) => {
    const clean = normalize(term);
    if (clean && !ignoredTerms.has(clean)) output.add(clean);
  };
  try {
    const segmenter = new Intl.Segmenter("zh-Hans", { granularity: "word" });
    for (const segment of segmenter.segment(normalized)) {
      if (segment.isWordLike) add(segment.segment);
    }
  } catch {
    normalized.split(" ").forEach(add);
  }
  return [...output];
}

function buildDocuments(projects: Project[], locale: Locale): SearchDocument[] {
  const localized = (value: { en: string; zh: string }) => value[locale];
  return projects.filter((project) => !project.legacy).map((project) => {
    const profile = semanticProfiles[project.slug] ?? { aliases: "", domains: "", capabilities: "", useCases: "", roles: "" };
    const allStack = project.stack.flatMap((item) => [item.en, item.zh]).join(" ");
    return {
      id: project.slug,
      track: project.track,
      href: `/${project.track}/${project.slug}`,
      label: localized(project.title),
      context: localized(project.eyebrow),
      title: `${project.title.en} ${project.title.zh} ${project.slug}`,
      eyebrow: `${project.eyebrow.en} ${project.eyebrow.zh}`,
      summary: `${project.summary.en} ${project.summary.zh}`,
      stack: allStack,
      body: `${project.problem.en} ${project.problem.zh} ${project.role.en} ${project.role.zh} ${project.outcome.en} ${project.outcome.zh}`,
      ...profile,
    };
  });
}

function createIndex(documents: SearchDocument[]) {
  const index = new MiniSearch<SearchDocument>({
    fields: [...lexicalFields, ...semanticFields],
    storeFields: ["track", "href", "label", "context", "title", ...semanticFields],
    tokenize,
    processTerm: (term) => normalize(term),
  });
  index.addAll(documents);
  return index;
}

function searchOptions(fields: string[], boosts: Record<string, number>) {
  return {
    fields,
    boost: boosts,
    prefix: (term: string) => term.length >= 3,
    fuzzy: (term: string, index: number, terms: string[]) => {
      if (terms.length > 1 && index > 0) return false;
      return /^[a-z0-9]/.test(term) && term.length >= 6 ? .25 : /^[a-z0-9]/.test(term) && term.length >= 5 ? .2 : false;
    },
    weights: { prefix: .78, fuzzy: .56 },
    combineWith: "OR" as const,
  };
}

function reasonFor(hit: SearchResult, locale: Locale) {
  const fields = new Set(Object.values(hit.match).flat());
  const matched = hit.queryTerms[0] || hit.terms[0] || "";
  const quoted = matched ? `“${matched}”` : locale === "en" ? "your query" : "当前查询";
  if (fields.has("title") || fields.has("aliases")) return locale === "en" ? `Name or known term: ${quoted}` : `名称或常用说法：${quoted}`;
  if (fields.has("domains") || fields.has("useCases")) return locale === "en" ? `Business context: ${quoted}` : `业务场景：${quoted}`;
  if (fields.has("roles")) return locale === "en" ? `Role relevance: ${quoted}` : `岗位相关：${quoted}`;
  if (fields.has("capabilities") || fields.has("stack")) return locale === "en" ? `Capability or tool: ${quoted}` : `能力或工具：${quoted}`;
  return locale === "en" ? `Project evidence: ${quoted}` : `项目内容：${quoted}`;
}

function explicitTrackId(query: string, tracks: Track[]) {
  const normalized = normalize(query);
  return tracks.find((track) => {
    const terms = explicitTrackTerms[track.id] ?? [];
    return terms.some((term) => normalized === normalize(term));
  })?.id;
}

function explicitTrackResults(query: string, tracks: Track[], locale: Locale): PortfolioSearchResult[] {
  const selectedTrackId = explicitTrackId(query, tracks);
  return tracks.flatMap((track) => {
    if (track.id !== selectedTrackId) return [];
    return [{
      id: `track-${track.id}`,
      href: `/${track.id}`,
      label: track.label[locale],
      context: locale === "en" ? "Discipline overview" : "方向总览",
      reason: locale === "en" ? "Exact discipline query" : "明确的方向查询",
      score: 2,
    }];
  });
}

export function searchPortfolio(query: string, tracks: Track[], projects: Project[], locale: Locale, limit = 5): PortfolioSearchResult[] {
  const documents = buildDocuments(projects, locale);
  const normalized = normalize(query);
  if (!normalized) {
    return documents.slice(0, limit).map((document, index) => ({
      id: document.id,
      href: document.href,
      label: document.label,
      context: document.context,
      reason: locale === "en" ? "Suggested project" : "推荐项目",
      score: 1 - index * .01,
    }));
  }
  if (explicitNoMatchMarkers.some((marker) => normalized.includes(marker))) return [];

  const index = createIndex(documents);
  const lexical = index.search(normalized, searchOptions(lexicalFields, {
    title: 9,
    eyebrow: 5,
    stack: 4,
    summary: 3,
    body: 1.5,
  }));
  const semantic = index.search(normalized, searchOptions(semanticFields, {
    aliases: 8,
    domains: 6,
    capabilities: 5,
    useCases: 4,
    roles: 3,
  }));

  const fused = new Map<string, { hit: SearchResult; score: number; raw: number; matched: Set<string> }>();
  const merge = (hits: SearchResult[], weight: number) => {
    hits.forEach((hit, rank) => {
      const id = String(hit.id);
      const current = fused.get(id) ?? { hit, score: 0, raw: 0, matched: new Set<string>() };
      current.score += weight / (RRF_K + rank + 1);
      current.raw = Math.max(current.raw, hit.score);
      hit.queryTerms.map(normalize).forEach((term) => current.matched.add(term));
      if (hit.score >= current.hit.score) current.hit = hit;
      fused.set(id, current);
    });
  };
  merge(lexical, .48);
  merge(semantic, .52);

  const units = queryUnits(normalized);
  const projectResults = [...fused.values()]
    .filter((entry) => {
      if (entry.raw < .18) return false;
      if (units.length < 2) return true;
      const covered = units.filter((unit) => entry.matched.has(unit)).length;
      return covered / units.length >= .66;
    })
    .map(({ hit, score, raw }) => ({
      id: String(hit.id),
      href: String(hit.href),
      label: String(hit.label),
      context: String(hit.context),
      reason: reasonFor(hit, locale),
      score: score + Math.min(raw, 20) / 1000,
    }))
    .sort((left, right) => right.score - left.score);
  const selectedTrackId = explicitTrackId(query, tracks);
  const trackScopedProjectResults = selectedTrackId
    ? projectResults.filter((result) => fused.get(result.id)?.hit.track === selectedTrackId)
    : projectResults;
  const strongestProjectScore = trackScopedProjectResults[0]?.score ?? 0;
  const confidentProjectResults = trackScopedProjectResults.filter((result) => result.score >= strongestProjectScore * .55);

  return [...explicitTrackResults(query, tracks, locale), ...confidentProjectResults]
    .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label, locale === "zh" ? "zh-CN" : "en"))
    .slice(0, limit);
}

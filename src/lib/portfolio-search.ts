import MiniSearch, { type SearchResult } from "minisearch";
import generatedProfiles from "@/data/portfolio-search-aliases.generated.json";
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
  searchAliases: string;
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
  searchAliases: string;
}

const semanticProfiles = generatedProfiles as Partial<Record<ProjectId, SemanticProfile>>;

const explicitTrackTerms: Record<string, string[]> = {
  ai: ["ai applications", "ai application", "applied ai", "ai 应用", "ai 應用", "人工智能应用", "人工智慧應用", "ai ying yong", "aiyingyong"],
  engineering: ["data engineering", "数据工程", "資料工程", "流式数据工程", "串流資料工程", "shu ju gong cheng", "shujugongcheng", "sjgc"],
  analytics: ["data analytics", "data analysis", "数据分析", "資料分析", "商业分析方向", "商業分析方向", "shu ju fen xi", "shujufenxi", "sjfx"],
};

const lexicalFields = ["title", "eyebrow", "summary", "stack", "body"];
const semanticFields = ["aliases", "domains", "capabilities", "useCases", "roles", "searchAliases"];
const RRF_K = 24;
const explicitNoMatchMarkers = ["unrelated", "not related", "random nonsense", "无关", "随机乱码"];
const ignoredTerms = new Set([
  "a", "an", "and", "about", "completely", "find", "for", "me", "of", "or", "page", "phrase", "project", "show", "something", "the", "to", "unrelated", "with",
  "一个", "一些", "关于", "帮我", "完全", "无关", "查找", "项目", "页面", "看看", "内容",
]);

export function normalizePortfolioSearchText(value: string) {
  return value.toLowerCase().normalize("NFKC").replace(/[\p{P}\p{S}]+/gu, " ").replace(/\s+/g, " ").trim();
}

const normalize = normalizePortfolioSearchText;

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
    const profile = semanticProfiles[project.slug] ?? { aliases: "", domains: "", capabilities: "", useCases: "", roles: "", searchAliases: "" };
    const allStack = project.stack.flatMap((item) => [item.en, item.zh]).join(" ");
    return {
      id: project.slug,
      track: project.track,
      href: `/projects/${project.slug}`,
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
    prefix: (term: string) => /\p{Script=Han}/u.test(term) || term.length >= 2,
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
  if (fields.has("title") || fields.has("aliases") || fields.has("searchAliases")) return locale === "en" ? `Name, translation, or pinyin: ${quoted}` : `名称、繁简体或拼音：${quoted}`;
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

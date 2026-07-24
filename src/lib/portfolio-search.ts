import type { Locale } from "./i18n";
import type { Project, Track } from "./projects";

export interface PortfolioSearchResult {
  id: string;
  href: string;
  label: string;
  context: string;
  reason: string;
  score: number;
}

interface SearchDocument {
  id: string;
  href: string;
  label: string;
  context: string;
  fields: Array<{ value: string; weight: number }>;
}

const aliases: Record<string, string[]> = {
  ai: ["artificial intelligence", "llm", "rag", "agent", "人工智能", "大模型", "智能应用"],
  "artificial intelligence": ["ai", "llm", "rag", "人工智能", "大模型"],
  rag: ["retrieval", "evaluation", "检索增强", "知识库", "召回"],
  recruiter: ["hiring", "role", "contribution", "impact", "招聘", "求职", "个人贡献"],
  hiring: ["recruiter", "role", "contribution", "招聘", "求职"],
  pipeline: ["data engineering", "streaming", "etl", "数据管道", "数据工程"],
  reliability: ["recovery", "failure", "release", "可靠性", "故障", "恢复"],
  privacy: ["redaction", "ocr", "pdf", "脱敏", "隐私", "扫描"],
  finance: ["margin", "credit", "risk", "profit", "毛利", "信贷", "风控"],
  analytics: ["analysis", "decision", "dashboard", "数据分析", "决策", "分析"],
  数据: ["data", "analytics", "engineering", "pipeline", "分析", "工程"],
  招聘: ["recruiter", "hiring", "role", "contribution", "求职", "个人贡献"],
  脱敏: ["privacy", "redaction", "ocr", "pdf", "隐私"],
  风控: ["risk", "credit", "policy", "信贷", "策略"],
};

function normalize(value: string) {
  return value.toLowerCase().normalize("NFKC").replace(/[\p{P}\p{S}]+/gu, " ").replace(/\s+/g, " ").trim();
}

function tokens(value: string) {
  const normalized = normalize(value);
  const words = normalized.split(" ").filter(Boolean);
  const chinese = normalized.match(/[\p{Script=Han}]+/gu) ?? [];
  for (const segment of chinese) {
    if (segment.length === 1) words.push(segment);
    for (let index = 0; index < segment.length - 1; index += 1) words.push(segment.slice(index, index + 2));
  }
  return [...new Set(words)];
}

function editDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    let diagonal = previous[0];
    previous[0] = row;
    for (let column = 1; column <= right.length; column += 1) {
      const above = previous[column];
      previous[column] = left[row - 1] === right[column - 1]
        ? diagonal
        : Math.min(diagonal, above, previous[column - 1]) + 1;
      diagonal = above;
    }
  }
  return previous[right.length];
}

function expandedQuery(query: string) {
  const base = tokens(query);
  const expanded = [...base];
  for (const token of base) {
    for (const [key, values] of Object.entries(aliases)) {
      if (token === key || key.includes(token) || token.includes(key)) expanded.push(...values.flatMap(tokens));
    }
  }
  return [...new Set(expanded)];
}

function tokenScore(query: string, candidate: string) {
  if (candidate === query) return 1;
  if (candidate.startsWith(query) || query.startsWith(candidate)) return .82;
  if (candidate.includes(query) || query.includes(candidate)) return .68;
  if (query.length >= 4 && candidate.length >= 4) {
    const distance = editDistance(query, candidate);
    const similarity = 1 - distance / Math.max(query.length, candidate.length);
    if (similarity >= .66) return similarity * .72;
  }
  return 0;
}

function searchDocuments(tracks: Track[], projects: Project[], locale: Locale): SearchDocument[] {
  const localized = (value: { en: string; zh: string }) => value[locale];
  const trackDocs = tracks.map((track) => ({
    id: `track-${track.id}`,
    href: `/${track.id}`,
    label: localized(track.label),
    context: locale === "en" ? "Discipline overview" : "方向总览",
    fields: [
      { value: localized(track.label), weight: 8 },
      { value: localized(track.thesis), weight: 3 },
      { value: `${track.id} recruiter hiring role 招聘 求职`, weight: 2 },
    ],
  }));
  const projectDocs = projects.filter((project) => !project.legacy).map((project) => ({
    id: project.slug,
    href: `/${project.track}/${project.slug}`,
    label: localized(project.title),
    context: localized(project.eyebrow),
    fields: [
      { value: `${localized(project.title)} ${project.slug}`, weight: 10 },
      { value: localized(project.eyebrow), weight: 7 },
      { value: project.stack.map(localized).join(" "), weight: 6 },
      { value: `${localized(project.summary)} ${localized(project.problem)} ${localized(project.role)} ${localized(project.outcome)}`, weight: 4 },
      { value: `${project.track} recruiter hiring contribution architecture evidence 招聘 个人贡献 架构 证据`, weight: 2 },
    ],
  }));
  return [...trackDocs, ...projectDocs];
}

export function searchPortfolio(query: string, tracks: Track[], projects: Project[], locale: Locale, limit = 3): PortfolioSearchResult[] {
  const documents = searchDocuments(tracks, projects, locale);
  const queryTokens = expandedQuery(query);
  const fallback = locale === "en" ? "Closest portfolio page" : "最接近的作品集页面";
  if (!queryTokens.length) return documents.slice(0, limit).map((document, index) => ({ ...document, reason: fallback, score: 1 - index * .01 }));

  return documents.map((document, index) => {
    let score = 0;
    let strongest = "";
    let strongestValue = 0;
    for (const field of document.fields) {
      const fieldTokens = tokens(field.value);
      for (const queryToken of queryTokens) {
        const best = fieldTokens.reduce((current, candidate) => Math.max(current, tokenScore(queryToken, candidate)), 0);
        score += best * field.weight;
        if (best * field.weight > strongestValue) {
          strongestValue = best * field.weight;
          strongest = queryToken;
        }
      }
    }
    return {
      id: document.id,
      href: document.href,
      label: document.label,
      context: document.context,
      reason: strongest
        ? (locale === "en" ? `Related to “${strongest}”` : `与“${strongest}”相关`)
        : fallback,
      score: score + (documents.length - index) * .0001,
    };
  }).sort((left, right) => right.score - left.score).slice(0, limit);
}

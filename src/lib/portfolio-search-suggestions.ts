import { recruiterSearchSuggestions, type RecruiterSearchSuggestion } from "@/data/recruiter-content";
import type { Locale } from "./i18n";
import { normalizePortfolioSearchText, type PortfolioSearchResult } from "./portfolio-search";

export interface PortfolioSearchHistoryEntry {
  query: string;
  resultId?: string;
  at: number;
}

const coldStartOrder = [
  "rag-regression-evaluation",
  "streaming-failure-injection",
  "contribution-margin-analysis",
  "browser-local-pdf-redaction",
  "credit-policy-thresholds",
  "langgraph-release-gate",
  "data-engineering",
  "prompt-injection-defense",
  "flink-cdc-iceberg",
  "promotion-scenario-elasticity",
  "risk-analyst",
  "simplified-chinese-ocr",
  "complaint-triage-cascade",
  "cost-aware-routing",
];

function targetIds(suggestion: RecruiterSearchSuggestion) {
  return new Set([suggestion.expectedId, ...suggestion.acceptableIds]);
}

function queryAffinity(suggestion: RecruiterSearchSuggestion, query: string, locale: Locale) {
  const normalizedQuery = normalizePortfolioSearchText(query);
  const labels = [suggestion.label[locale], suggestion.label.en, suggestion.label.zh].map(normalizePortfolioSearchText);
  if (!normalizedQuery) return 0;
  if (labels.some((label) => label.startsWith(normalizedQuery))) return 16;
  if (labels.some((label) => label.includes(normalizedQuery))) return 8;
  return 0;
}

export function rankPortfolioSearchSuggestions({
  locale,
  history,
  query,
  results,
  limit = 3,
}: {
  locale: Locale;
  history: PortfolioSearchHistoryEntry[];
  query: string;
  results: PortfolioSearchResult[];
  limit?: number;
}) {
  const resultRank = new Map(results.map((result, index) => [result.id, index]));
  const ranked = recruiterSearchSuggestions.map((suggestion) => {
    const targets = targetIds(suggestion);
    const bestResultRank = Math.min(...[...targets].map((id) => resultRank.get(id) ?? Number.POSITIVE_INFINITY));
    let score = 100 - Math.max(0, coldStartOrder.indexOf(suggestion.id));
    if (query.trim()) {
      if (Number.isFinite(bestResultRank)) score += 220 - bestResultRank * 24;
      score += queryAffinity(suggestion, query, locale);
    }
    history.slice(0, 20).forEach((entry, index) => {
      const recency = Math.max(2, 28 - index * 2);
      if (entry.resultId && targets.has(entry.resultId)) score += recency;
      score += queryAffinity(suggestion, entry.query, locale) * .35;
    });
    return { suggestion, score, hasResultAffinity: Number.isFinite(bestResultRank) };
  }).filter((entry) => !query.trim() || entry.hasResultAffinity || queryAffinity(entry.suggestion, query, locale) > 0)
    .sort((left, right) => right.score - left.score || left.suggestion.id.localeCompare(right.suggestion.id));

  const selected: RecruiterSearchSuggestion[] = [];
  const selectedTargets = new Set<string>();
  for (const entry of ranked) {
    if (selectedTargets.has(entry.suggestion.expectedId)) continue;
    selected.push(entry.suggestion);
    selectedTargets.add(entry.suggestion.expectedId);
    if (selected.length === limit) return selected;
  }
  for (const entry of ranked) {
    if (selected.includes(entry.suggestion)) continue;
    selected.push(entry.suggestion);
    if (selected.length === limit) break;
  }
  return selected;
}

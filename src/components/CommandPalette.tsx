"use client";

import { Command } from "cmdk";
import { ArrowRight, Clock3, Search, Sparkles, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { localeHref, useI18n } from "@/lib/i18n";
import { searchPortfolio } from "@/lib/portfolio-search";
import { rankPortfolioSearchSuggestions, type PortfolioSearchHistoryEntry } from "@/lib/portfolio-search-suggestions";
import type { Project, Track } from "@/lib/projects";

const recentSearchKey = "portfolio-recent-searches-v1";
const searchHistoryKey = "portfolio-search-history-v2";

export default function CommandPalette({
  tracks,
  projects,
  initiallyOpen = false,
}: {
  tracks: Track[];
  projects: Project[];
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<PortfolioSearchHistoryEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { locale, dict } = useI18n();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    let next: PortfolioSearchHistoryEntry[] = [];
    try {
      const stored = JSON.parse(window.localStorage.getItem(searchHistoryKey) ?? "[]") as unknown;
      if (Array.isArray(stored)) next = stored.filter((item): item is PortfolioSearchHistoryEntry => (
        typeof item === "object" && item !== null && "query" in item && typeof item.query === "string"
        && "at" in item && typeof item.at === "number"
        && (!("resultId" in item) || item.resultId === undefined || typeof item.resultId === "string")
      )).slice(0, 20);
      if (!next.length) {
        const legacy = JSON.parse(window.localStorage.getItem(recentSearchKey) ?? "[]") as unknown;
        if (Array.isArray(legacy)) next = legacy.filter((item): item is string => typeof item === "string").slice(0, 4).map((item, index) => ({ query: item, at: Date.now() - index }));
      }
    } catch { /* Ignore malformed local history. */ }
    const timer = window.setTimeout(() => setHistory(next), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  const results = useMemo(() => searchPortfolio(query, tracks, projects, locale), [locale, projects, query, tracks]);
  const recent = useMemo(() => [...new Set(history.map((item) => item.query.trim()).filter(Boolean))].slice(0, 4), [history]);
  const suggestions = useMemo(() => rankPortfolioSearchSuggestions({ locale, history, query: "", results: [], limit: 3 }), [history, locale]);
  const completions = useMemo(() => query.trim() ? rankPortfolioSearchSuggestions({ locale, history, query, results, limit: 3 }) : [], [history, locale, query, results]);

  function remember(value: string, resultId?: string) {
    const normalized = value.trim();
    if (!normalized) return;
    const next = [{ query: normalized, ...(resultId ? { resultId } : {}), at: (history[0]?.at ?? 0) + 1 }, ...history.filter((item) => item.query !== normalized || item.resultId !== resultId)].slice(0, 20);
    setHistory(next);
    try {
      window.localStorage.setItem(searchHistoryKey, JSON.stringify(next));
      window.localStorage.setItem(recentSearchKey, JSON.stringify([...new Set(next.map((item) => item.query))].slice(0, 4)));
    } catch { /* Storage can be unavailable in privacy mode. */ }
  }

  function go(href: string, resultId: string) {
    remember(query, resultId);
    setOpen(false);
    setQuery("");
    router.push(localeHref(href, locale));
  }

  function clearRecent() {
    setHistory([]);
    try {
      window.localStorage.removeItem(recentSearchKey);
      window.localStorage.removeItem(searchHistoryKey);
    } catch { /* Storage can be unavailable in privacy mode. */ }
  }

  function closeOrClear() {
    if (query) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
      return;
    }
    setOpen(false);
  }

  function askPortfolio() {
    remember(query);
    setOpen(false);
    setQuery("");
    window.dispatchEvent(new Event("portfolio:open-assistant"));
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="search-button"
        title={`${dict.paletteOpen} (Cmd/Ctrl K)`}
      >
        <Search className="size-4" aria-hidden="true" />
        <span>{dict.paletteOpen}</span><kbd>⌘K</kbd>
      </button>

      <Command.Dialog open={open} onOpenChange={setOpen} label={dict.paletteOpen} shouldFilter={false}>
        <div className="command-overlay" />
        <div className="command-dialog">
          <button className="command-close" type="button" onClick={closeOrClear} aria-label={query ? (locale === "en" ? "Clear search" : "清空搜索") : (locale === "en" ? "Close search" : "关闭搜索")} title={query ? (locale === "en" ? "Clear search" : "清空搜索") : (locale === "en" ? "Close search" : "关闭搜索")}><X aria-hidden="true" /></button>
          <Command.Input
            ref={inputRef}
            placeholder={dict.palettePlaceholder}
            className="command-input"
            value={query}
            onValueChange={setQuery}
          />
          {!query ? <div className="command-discovery">
            <div className="command-suggestions"><Sparkles aria-hidden="true" />{suggestions.map((suggestion) => <button type="button" key={suggestion.id} onClick={() => setQuery(suggestion.label[locale])}>{suggestion.label[locale]}</button>)}</div>
            {recent.length ? <div className="command-recents"><span><Clock3 aria-hidden="true" />{locale === "en" ? "Recent" : "最近搜索"}</span>{recent.map((item) => <button type="button" key={item} onClick={() => setQuery(item)}>{item}</button>)}<button type="button" className="command-clear" onClick={clearRecent} aria-label={locale === "en" ? "Clear recent searches" : "清除最近搜索"}><Trash2 aria-hidden="true" /></button></div> : null}
          </div> : null}
          {query && completions.length ? <div className="command-completions"><span>{locale === "en" ? "You may be looking for" : "你可能想看"}</span>{completions.map((suggestion) => <button type="button" key={suggestion.id} onClick={() => setQuery(suggestion.label[locale])}>{suggestion.label[locale]}</button>)}</div> : null}
          <Command.List className="command-list">
            <Command.Group heading={query ? (locale === "en" ? "Closest portfolio pages" : "最接近的作品集页面") : (locale === "en" ? "Suggested starting points" : "推荐入口")} className="command-group">
              {results.map((item) => (
                <Command.Item
                  key={item.id}
                  value={item.id}
                  onSelect={() => go(item.href, item.id)}
                  className="command-item"
                >
                  <span className="command-result-copy"><strong>{item.label}</strong><small>{item.context}</small></span>
                  <span className="command-result-reason">{item.reason}</span>
                  <ArrowRight aria-hidden="true" />
                </Command.Item>
              ))}
            </Command.Group>
            {query && !results.length ? <Command.Empty className="command-empty">{locale === "en" ? "No confident project match. Try a project, business problem, capability, or tool." : "目前没有足够可靠的匹配。换个说法试试，项目名、业务问题、能力或工具都可以。"}</Command.Empty> : null}
            {query ? <p className="command-search-note"><span>{locale === "en" ? "Results update while you type and support English, Simplified and Traditional Chinese, pinyin, initials, synonyms, and typos." : "输入时即时更新，并支持英文、简繁中文、全拼、拼音首字母、同义词与拼写容错。"}</span><button type="button" onClick={askPortfolio}>{locale === "en" ? "Ask an open-ended question" : "直接提问"}<ArrowRight aria-hidden="true" /></button></p> : null}
          </Command.List>
        </div>
      </Command.Dialog>
    </>
  );
}

"use client";

import { Command } from "cmdk";
import { ArrowRight, Clock3, Search, Sparkles, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { localeHref, useI18n } from "@/lib/i18n";
import { searchPortfolio } from "@/lib/portfolio-search";
import type { Project, Track } from "@/lib/projects";

const recentSearchKey = "portfolio-recent-searches-v1";

export default function CommandPalette({
  tracks,
  projects,
}: {
  tracks: Track[];
  projects: Project[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
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
    let next: string[] = [];
    try {
      const stored = JSON.parse(window.localStorage.getItem(recentSearchKey) ?? "[]") as unknown;
      if (Array.isArray(stored)) next = stored.filter((item): item is string => typeof item === "string").slice(0, 4);
    } catch { /* Ignore malformed local history. */ }
    const timer = window.setTimeout(() => setRecent(next), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  const results = useMemo(() => searchPortfolio(query, tracks, projects, locale), [locale, projects, query, tracks]);
  const suggestions = locale === "en"
    ? ["AI recruiter", "reliable data pipelines", "privacy PDF"]
    : ["AI 应用招聘", "可靠数据管道", "PDF 脱敏"];

  function remember(value: string) {
    const normalized = value.trim();
    if (!normalized) return;
    const next = [normalized, ...recent.filter((item) => item !== normalized)].slice(0, 4);
    setRecent(next);
    try { window.localStorage.setItem(recentSearchKey, JSON.stringify(next)); } catch { /* Storage can be unavailable in privacy mode. */ }
  }

  function go(href: string) {
    remember(query);
    setOpen(false);
    setQuery("");
    router.push(localeHref(href, locale));
  }

  function clearRecent() {
    setRecent([]);
    try { window.localStorage.removeItem(recentSearchKey); } catch { /* Storage can be unavailable in privacy mode. */ }
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
          <button className="command-close" type="button" onClick={() => setOpen(false)} aria-label={dict.paletteClose} title={dict.paletteClose}><X aria-hidden="true" /></button>
          <Command.Input
            placeholder={dict.palettePlaceholder}
            className="command-input"
            value={query}
            onValueChange={setQuery}
          />
          {!query ? <div className="command-discovery">
            <div className="command-suggestions"><Sparkles aria-hidden="true" />{suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => setQuery(suggestion)}>{suggestion}</button>)}</div>
            {recent.length ? <div className="command-recents"><span><Clock3 aria-hidden="true" />{locale === "en" ? "Recent" : "最近搜索"}</span>{recent.map((item) => <button type="button" key={item} onClick={() => setQuery(item)}>{item}</button>)}<button type="button" className="command-clear" onClick={clearRecent} aria-label={locale === "en" ? "Clear recent searches" : "清除最近搜索"}><Trash2 aria-hidden="true" /></button></div> : null}
          </div> : null}
          <Command.List className="command-list">
            <Command.Group heading={query ? (locale === "en" ? "Closest portfolio pages" : "最接近的作品集页面") : (locale === "en" ? "Suggested starting points" : "推荐入口")} className="command-group">
              {results.map((item) => (
                <Command.Item
                  key={item.id}
                  value={item.id}
                  onSelect={() => go(item.href)}
                  className="command-item"
                >
                  <span className="command-result-copy"><strong>{item.label}</strong><small>{item.context}</small></span>
                  <span className="command-result-reason">{item.reason}</span>
                  <ArrowRight aria-hidden="true" />
                </Command.Item>
              ))}
            </Command.Group>
            {query ? <p className="command-search-note"><span>{locale === "en" ? "Results use bilingual concepts, synonyms, and typo-tolerant matching." : "结果综合双语概念、同义词与拼写容错。"}</span><button type="button" onClick={askPortfolio}>{locale === "en" ? "Ask an open-ended question" : "询问开放式问题"}<ArrowRight aria-hidden="true" /></button></p> : null}
          </Command.List>
        </div>
      </Command.Dialog>
    </>
  );
}

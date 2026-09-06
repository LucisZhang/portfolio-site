"use client";

import { artifactLocale } from "./artifact-locale.mjs";
import { jsx } from "@/lib/zh-jsx/jsx-runtime";
import { usePathname, useSearchParams } from "next/navigation";

import {
  Suspense,
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { navigationCopy } from "./navigation";

export type Locale = "en" | "zh";
export type LocalizedString = Record<Locale, string>;

export interface Dictionary {
  brand: string;
  navWork: string;
  navEngineering: string;
  navAnalytics: string;
  navAi: string;
  targetRoles: string;
  paletteOpen: string;
  paletteClose: string;
  palettePlaceholder: string;
  paletteEmpty: string;
  paletteTracks: string;
  paletteProjects: string;
  verifiedOutcome: string;
  stack: string;
  links: string;
  architecture: string;
  evidence: string;
  provenance: string;
  boundaries: string;
  backHome: string;
  backToTrack: string;
  language: string;
  externalLink: string;
  noPublicLink: string;
  mediaEvidence: string;
  mediaUnavailable: string;
  footer: string;
  inspectProject: string;
  homeCore: string;
  homeSecondary: string;
  homeMethodology: string;
  homeArchive: string;
  homeArchiveSummary: string;
  homeEvidenceExplorer: string;
  homeTechnicalReport: string;
  homeCode: string;
  homeArchitecturePlaceholder: string;
  homeTryAssistant: string;
  homeDemoThumbnail: string;
  homeDomainTraining: string;
  homeDomainAgent: string;
  homeDomainBackend: string;
  homeDomainData: string;
  skipToContent: string;
}

const en: Dictionary = {
  brand: "Xiangguo Zhang",
  navWork: "Selected work",
  navEngineering: "Engineering",
  navAnalytics: "Analytics",
  navAi: "AI applications",
  targetRoles: "Open to: AI agent & LLM application engineering · backend & distributed systems · data engineering & analytics",
  paletteOpen: navigationCopy.search.en,
  paletteClose: "Close search",
  palettePlaceholder: "Search projects, systems, or tools",
  paletteEmpty: "No matches found.",
  paletteTracks: "Disciplines",
  paletteProjects: "Projects",
  verifiedOutcome: "Result",
  stack: "System",
  links: "Links",
  architecture: "How it works",
  evidence: "Try it",
  provenance: "How this was verified",
  boundaries: "What this does not prove",
  backHome: "All projects",
  backToTrack: "Back to discipline",
  language: navigationCopy.language.en,
  externalLink: "Opens external site",
  noPublicLink: "Source code isn't public yet.",
  mediaEvidence: "Recorded views",
  mediaUnavailable: "No approved image is included in this build. Run details are still available below.",
  footer: "Applied LLM systems, measured end to end.",
  inspectProject: "Open case study",
  homeCore: "Core systems",
  homeSecondary: "Supporting evidence",
  homeMethodology: "Working method",
  homeArchive: "Archive",
  homeArchiveSummary: "Two earlier product studies",
  homeEvidenceExplorer: "Evidence Explorer",
  homeTechnicalReport: "Technical report",
  homeCode: "Code",
  homeArchitecturePlaceholder: "Frontier Forge measured delivery architecture",
  homeTryAssistant: "Try it",
  homeDemoThumbnail: "demo thumbnail",
  homeDomainTraining: "LLM training & inference",
  homeDomainAgent: "Agents & RAG",
  homeDomainBackend: "Queues & backend",
  homeDomainData: "Data systems",
  skipToContent: "Skip to content",
};

const zh: Dictionary = {
  brand: "章向国",
  navWork: "精选项目",
  navEngineering: "数据工程",
  navAnalytics: "数据分析",
  navAi: "AI 应用",
  targetRoles: "校招方向：AI Agent 与大模型应用工程 / 后端与分布式系统 / 数据工程与分析",
  paletteOpen: navigationCopy.search.zh,
  paletteClose: "关闭搜索",
  palettePlaceholder: "搜索项目、系统或工具",
  paletteEmpty: "未找到匹配项。",
  paletteTracks: "方向",
  paletteProjects: "项目",
  verifiedOutcome: "结果",
  stack: "系统组成",
  links: "链接",
  architecture: "工作原理",
  evidence: "动手体验",
  provenance: "如何验证",
  boundaries: "这项结果不能说明什么",
  backHome: "全部项目",
  backToTrack: "返回方向",
  language: navigationCopy.language.zh,
  externalLink: "打开外部网站",
  noPublicLink: "源代码尚未公开。",
  mediaEvidence: "已记录影像",
  mediaUnavailable: "本次构建暂无可用图片，下方仍可查看运行详情。",
  footer: "大模型应用系统，从训练到上线，每一步都对得上账。",
  inspectProject: "查看案例",
  homeCore: "核心项目",
  homeSecondary: "佐证项目",
  homeMethodology: "工作方法",
  homeArchive: "归档",
  homeArchiveSummary: "两项较早的产品研究",
  homeEvidenceExplorer: "Evidence Explorer",
  homeTechnicalReport: "技术报告",
  homeCode: "Code",
  homeArchitecturePlaceholder: "Frontier Forge 实测交付架构",
  homeTryAssistant: "试一试",
  homeDemoThumbnail: "演示缩略图",
  homeDomainTraining: "大模型训练与推理",
  homeDomainAgent: "Agent 与 RAG",
  homeDomainBackend: "消息队列与后端",
  homeDomainData: "数据系统",
  skipToContent: "跳到主要内容",
};

const dictionaries: Record<Locale, Dictionary> = { en, zh };

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dict: Dictionary;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  setLocale: () => {},
  dict: en,
});

function detectLocale(): Locale {
  const query = new URL(window.location.href).searchParams;
  if (window.location.pathname === "/artifact" && query.has("lang")) return artifactLocale(query, "en");
  const requested = query.get("lang");
  if (requested === "en" || requested === "zh") return requested;
  const stored = window.localStorage.getItem("portfolio-locale");
  if (stored === "en" || stored === "zh") return stored;
  return window.navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

let currentLocale: Locale | null = null;
const localeListeners = new Set<() => void>();

function getLocaleSnapshot(): Locale {
  if (currentLocale === null) currentLocale = detectLocale();
  return currentLocale;
}

function getServerLocaleSnapshot(): Locale {
  return "en";
}

function subscribeLocale(listener: () => void) {
  localeListeners.add(listener);
  return () => localeListeners.delete(listener);
}

function replaceLocaleUrl(url: URL) {
  const href = `${url.pathname}${url.search}${url.hash}`;
  if (href === window.location.pathname + window.location.search + window.location.hash) return;
  // Next restores its router state. Echoing its private flags would bypass
  // query subscribers; keep the rest of the entry's state and its position.
  const state = { ...window.history.state };
  delete state.__NA;
  delete state._N;
  window.history.replaceState(state, "", href);
}

function setStoredLocale(next: Locale) {
  currentLocale = next;
  window.localStorage.setItem("portfolio-locale", next);
  const url = new URL(window.location.href);
  if (url.pathname === "/artifact" || next === "zh") url.searchParams.set("lang", next);
  else url.searchParams.delete("lang");
  replaceLocaleUrl(url);
  localeListeners.forEach((listener) => listener());
}

function LocaleUrlSync() {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const canonicalUrl = useRef("");

  useEffect(() => {
    const url = new URL(window.location.href);
    // A query added by our own cleanup is not a new explicit user choice.
    if (url.href === canonicalUrl.current) return;
    const next = detectLocale();
    const requested = url.searchParams.get("lang");
    // Save an explicit choice before English's canonical URL drops it. Keep
    // the viewer's stricter, single-value language contract.
    if ((requested === "en" || requested === "zh") &&
      (url.pathname !== "/artifact" || url.searchParams.getAll("lang").length === 1)) {
      window.localStorage.setItem("portfolio-locale", next);
    }
    // The root provider survives client navigation. Read the live URL instead
    // of letting its cached locale (or the hydration snapshot) rewrite it.
    if (currentLocale !== next) {
      currentLocale = next;
      localeListeners.forEach((listener) => listener());
    }
    if (url.pathname === "/artifact" || next === "zh") url.searchParams.set("lang", next);
    else url.searchParams.delete("lang");
    canonicalUrl.current = url.href;
    replaceLocaleUrl(url);
  }, [pathname, query]);

  return null;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribeLocale, getLocaleSnapshot, getServerLocaleSnapshot);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  const setLocale = useCallback((next: Locale) => setStoredLocale(next), []);
  const value = useMemo(() => ({ locale, setLocale, dict: dictionaries[locale] }), [locale, setLocale]);

  return createElement(I18nContext.Provider, { value },
    createElement(Suspense, { fallback: null }, createElement(LocaleUrlSync)),
    children,
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function localize(text: LocalizedString, locale: Locale) {
  return text[locale];
}

export function localeHref(href: string, locale: Locale) {
  if (/^(?:[a-z]+:|#)/i.test(href)) return href;
  const url = new URL(href, "https://portfolio.local");
  if (url.pathname === "/artifact" || locale === "zh") url.searchParams.set("lang", locale);
  else url.searchParams.delete("lang");
  return `${url.pathname}${url.search}${url.hash}`;
}

export function LocalizedText({ text, className }: { text: LocalizedString; className?: string }) {
  const { locale } = useI18n();
  // Task D05: created through the zh JSX runtime (src/lib/zh-jsx), which the
  // layout chunk already carries for every route, so this legacy path gets
  // the same word-tier line breaking as JSX-authored copy at no extra weight.
  return jsx("span", { className, children: text[locale] });
}

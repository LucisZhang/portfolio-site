"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

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
  problem: string;
  audience: string;
  role: string;
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
}

const en: Dictionary = {
  brand: "Xiangguo Zhang",
  navWork: "Selected work",
  navEngineering: "Engineering",
  navAnalytics: "Analytics",
  navAi: "AI applications",
  targetRoles: "Open to Data Analytics, Data Engineering, and AI Application Engineering roles.",
  paletteOpen: "Search",
  paletteClose: "Close search",
  palettePlaceholder: "Search projects, systems, or tools",
  paletteEmpty: "No matches found.",
  paletteTracks: "Disciplines",
  paletteProjects: "Projects",
  problem: "Problem",
  audience: "Audience",
  role: "What I built",
  verifiedOutcome: "Result",
  stack: "System",
  links: "Links",
  architecture: "How it works",
  evidence: "Try it",
  provenance: "How this was verified",
  boundaries: "What this does not prove",
  backHome: "All projects",
  backToTrack: "Back to discipline",
  language: "Language",
  externalLink: "Opens external site",
  noPublicLink: "Source code isn't public yet.",
  mediaEvidence: "Recorded views",
  mediaUnavailable: "No approved image is included in this build. Run details are still available below.",
  footer: "A bilingual portfolio of applied AI, data systems, and decision tools built by Xiangguo Zhang.",
  inspectProject: "Open case study",
};

const zh: Dictionary = {
  brand: "章向国",
  navWork: "精选项目",
  navEngineering: "数据工程",
  navAnalytics: "数据分析",
  navAi: "AI 应用",
  targetRoles: "求职方向：数据分析、数据工程与 AI 应用工程。",
  paletteOpen: "搜索",
  paletteClose: "关闭搜索",
  palettePlaceholder: "搜索项目、系统或工具",
  paletteEmpty: "未找到匹配项。",
  paletteTracks: "方向",
  paletteProjects: "项目",
  problem: "问题",
  audience: "受众群体",
  role: "我做了什么",
  verifiedOutcome: "结果",
  stack: "系统组成",
  links: "链接",
  architecture: "工作原理",
  evidence: "动手体验",
  provenance: "如何验证",
  boundaries: "这项结果不能说明什么",
  backHome: "全部项目",
  backToTrack: "返回方向",
  language: "语言",
  externalLink: "打开外部网站",
  noPublicLink: "源代码尚未公开。",
  mediaEvidence: "已记录影像",
  mediaUnavailable: "本次构建暂无可用图片，下方仍可查看运行详情。",
  footer: "章向国的双语作品集：聚焦应用 AI、数据系统与决策工具。",
  inspectProject: "查看案例",
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
  const requested = new URL(window.location.href).searchParams.get("lang");
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

function setStoredLocale(next: Locale) {
  currentLocale = next;
  window.localStorage.setItem("portfolio-locale", next);
  const url = new URL(window.location.href);
  if (next === "zh") url.searchParams.set("lang", "zh");
  else url.searchParams.delete("lang");
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  localeListeners.forEach((listener) => listener());
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribeLocale, getLocaleSnapshot, getServerLocaleSnapshot);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    const url = new URL(window.location.href);
    if (locale === "zh") url.searchParams.set("lang", "zh");
    else url.searchParams.delete("lang");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => setStoredLocale(next), []);
  const value = useMemo(() => ({ locale, setLocale, dict: dictionaries[locale] }), [locale, setLocale]);

  return createElement(I18nContext.Provider, { value }, children);
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
  if (locale === "zh") url.searchParams.set("lang", "zh");
  else url.searchParams.delete("lang");
  return `${url.pathname}${url.search}${url.hash}`;
}

export function LocalizedText({ text, className }: { text: LocalizedString; className?: string }) {
  const { locale } = useI18n();
  return createElement("span", { className }, text[locale]);
}

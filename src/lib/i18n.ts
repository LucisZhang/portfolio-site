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
  brand: "Hsiang Kuo Chang",
  navWork: "Selected work",
  navEngineering: "Engineering",
  navAnalytics: "Analytics",
  navAi: "AI applications",
  paletteOpen: "Search",
  paletteClose: "Close search",
  palettePlaceholder: "Search projects, systems, or tools",
  paletteEmpty: "No matching destination.",
  paletteTracks: "Disciplines",
  paletteProjects: "Projects",
  problem: "Problem",
  audience: "Audience",
  role: "My role",
  verifiedOutcome: "Evidence-backed outcome",
  stack: "System",
  links: "Inspect",
  architecture: "Architecture / pipeline",
  evidence: "Evidence surface",
  provenance: "Provenance",
  boundaries: "Limitations and boundaries",
  backHome: "All projects",
  backToTrack: "Back to discipline",
  language: "Language",
  externalLink: "Opens external site",
  noPublicLink: "No public link is available for this project.",
  mediaEvidence: "Captured evidence",
  mediaUnavailable: "Approved media is not present in this build. The written evidence and boundaries remain available.",
  footer: "Public v1 portfolio. Evidence is scoped to the artifacts named on each project page.",
  inspectProject: "Inspect case study",
};

const zh: Dictionary = {
  brand: "章向国",
  navWork: "精选项目",
  navEngineering: "数据工程",
  navAnalytics: "数据分析",
  navAi: "AI 应用",
  paletteOpen: "搜索",
  paletteClose: "关闭搜索",
  palettePlaceholder: "搜索项目、系统或工具",
  paletteEmpty: "没有匹配的目标。",
  paletteTracks: "方向",
  paletteProjects: "项目",
  problem: "问题",
  audience: "面向对象",
  role: "我的角色",
  verifiedOutcome: "证据支持的结果",
  stack: "系统组成",
  links: "查看产物",
  architecture: "架构 / 流程",
  evidence: "证据界面",
  provenance: "来源与沿革",
  boundaries: "限制与边界",
  backHome: "全部项目",
  backToTrack: "返回方向",
  language: "语言",
  externalLink: "打开外部网站",
  noPublicLink: "该项目不提供公开链接。",
  mediaEvidence: "已捕获证据",
  mediaUnavailable: "本次构建中尚无获批媒体；文字证据与边界说明仍可查看。",
  footer: "公开 v1 作品集。每个项目的证据范围以页面所列产物为准。",
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
  localeListeners.forEach((listener) => listener());
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribeLocale, getLocaleSnapshot, getServerLocaleSnapshot);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
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

export function LocalizedText({ text, className }: { text: LocalizedString; className?: string }) {
  const { locale } = useI18n();
  return createElement("span", { className }, text[locale]);
}

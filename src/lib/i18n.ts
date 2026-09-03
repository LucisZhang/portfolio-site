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
  paletteOpen: "Search",
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
  language: "Language",
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
  paletteOpen: "搜索",
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
  language: "语言",
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
  // Task R8 deliberately does NOT wrap this path: i18n.ts sits in the
  // layout-level chunk every route pays for, and adding zh-wrap here grew
  // /artifact's initial budget (+634 gzip B) for the benefit of a single
  // remaining legacy slug (analytics-tandem — see [track]/[project]/
  // page.tsx). Phrase wrapping rides in the exhibition components instead.
  return createElement("span", { className }, text[locale]);
}

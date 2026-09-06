import { navigationCopy, type RailSpec } from "@/lib/navigation";

// Homepage rail (spec §2.1 "首页" state): exhibit directory 00–06 plus the
// mono footer row (SEARCH ⌘K / ASK / EN·中 / RESUME), the latter rendered
// through HomeRailTools rather than this plain-anchor `footer` list (empty
// here). Labels and positioning copy follow the shared bilingual contract.
export const homeRail: RailSpec = {
  wordmark: { lines: ["Xiangguo", "Zhang"], mark: "XGZ" },
  copy: {
    en: "AI agents and applied LLM systems, measured end to end.",
    zh: "AI Agent 与大模型应用系统，端到端留痕。",
  },
  nav: [
    { id: "contact", num: "00", label: { en: "Hero", zh: "首页介绍" } },
    { id: "exhibit-01", num: "01", label: { en: "Frontier Forge", zh: "Frontier Forge" } },
    { id: "exhibit-02", num: "02", label: { en: "Agent systems", zh: "智能体系统" } },
    { id: "exhibit-03", num: "03", label: { en: "Systems stack", zh: "系统技术栈" } },
    { id: "exhibit-04", num: "04", label: { en: "Negative results", zh: "负结果" } },
    { id: "exhibit-05", num: "05", label: { en: "Secondary & archive", zh: "其他项目与归档" } },
    { id: "exhibit-06", num: "06", label: navigationCopy.sourceReceipts },
  ],
  footer: [],
};

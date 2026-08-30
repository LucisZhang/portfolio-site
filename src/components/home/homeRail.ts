import type { RailSpec } from "@/components/exhibition/ExhibitShell";

// Homepage rail (spec §2.1 "首页" state): exhibit directory 00–06 plus the
// mono footer row (SEARCH ⌘K / ASK / EN·中 / RESUME), the latter rendered
// through HomeRailTools rather than this plain-anchor `footer` list (empty
// here) — see that file for why. Nav labels are UI fabric and therefore
// English-only regardless of locale (spec §2.6 / task 1.2 binding rules),
// unlike the bilingual `rail.copy` positioning line below.
export const homeRail: RailSpec = {
  wordmark: { lines: ["Xiangguo", "Zhang"], mark: "XGZ" },
  copy: {
    en: "AI agents and applied LLM systems, measured end to end.",
    zh: "AI Agent 与大模型应用系统，端到端留痕。",
  },
  nav: [
    { id: "contact", num: "00", label: "Hero" },
    { id: "exhibit-01", num: "01", label: "Frontier Forge" },
    { id: "exhibit-02", num: "02", label: "Agent systems" },
    { id: "exhibit-03", num: "03", label: "Systems stack" },
    { id: "exhibit-04", num: "04", label: "Negative results" },
    { id: "exhibit-05", num: "05", label: "Secondary & archive" },
    { id: "exhibit-06", num: "06", label: "Source & receipts" },
  ],
  footer: [],
};

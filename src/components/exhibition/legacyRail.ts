import { type RailSpec } from "@/lib/navigation";

// Task 0.5 (R0 re-shelling): every pre-rebuild route is wrapped in
// <ExhibitShell> with this one shared rail while its content is still the
// pre-Round-2 markup. The nav list mirrors the deleted site-header's three
// route links (brand-mark/home moves to the always-visible railTools slot
// instead — see LegacyRailTools — since ExhibitShell's nav is duplicated
// once per breakpoint and a locale-persisting home link only needs to exist
// once). Real per-page exhibit tables of contents replace this in the later
// full page rebuilds (task 0.6+).
export const legacyRail: RailSpec = {
  wordmark: { lines: ["Xiangguo", "Zhang"], mark: "XGZ" },
  nav: [
    { id: "/ai", num: "01", label: { en: "AI applications", zh: "AI 应用" } },
    { id: "/engineering", num: "02", label: { en: "Engineering", zh: "系统工程" } },
    { id: "/analytics", num: "03", label: { en: "Analytics", zh: "数据分析" } },
  ],
  footer: [],
};

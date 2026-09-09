import { projectRailFooter, type RailSpec } from "@/lib/navigation";
export const groupconvRail: RailSpec = {
  wordmark: { lines: ["GroupConv", "Atlas"], mark: "GCA" },
  nav: [
    { id: "exhibit-01", num: "01", label: { en: "Shape atlas", zh: "形状地图" } },
    { id: "exhibit-02", num: "02", label: { en: "Kernel design", zh: "内核设计" } },
    { id: "exhibit-03", num: "03", label: { en: "Into a module", zh: "模块实测" } },
    { id: "exhibit-04", num: "04", label: { en: "Source & receipts", zh: "源码与记录" } },
  ],
  footer: projectRailFooter,
  stamp: { label: { en: "MEASURED EVIDENCE", zh: "实测证据" }, tone: "offline" },
};

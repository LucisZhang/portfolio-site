import { navigationCopy, projectRailFooter, type RailSpec } from "@/lib/navigation";
import { getProject } from "@/lib/projects";

// Triage Router project-page rail (spec section 6.0/6.3, task 3.1) --
// follows the forgeRail.ts / eodRail.ts precedent exactly.
const triageProject = getProject("ai", "triage-router");

export const triageRail: RailSpec = {
  wordmark: { lines: ["Triage", "Router"] },
  copy: triageProject ? { en: "A cost-accuracy cascade that routes each complaint to the cheapest tier that can handle it.", zh: triageProject.glossZh } : undefined,
  nav: [
    { id: "exhibit-01", num: "01", label: { en: "Market terminal", zh: "分流终端" } },
    { id: "exhibit-02", num: "02", label: { en: "Known misroutes", zh: "已知误分流" } },
    { id: "exhibit-03", num: "03", label: { en: "Tier frontier", zh: "分层边界" } },
    { id: "exhibit-04", num: "04", label: { en: "Drift", zh: "漂移" } },
    { id: "exhibit-05", num: "05", label: navigationCopy.sourceReceipts },
  ],
  footer: projectRailFooter,
};

export default triageRail;

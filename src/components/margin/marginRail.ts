import { navigationCopy, projectRailFooter, type RailSpec } from "@/lib/navigation";
import { getProject } from "@/lib/projects";

// Margin Control Tower project-page rail (task L2, spec §6.0/§6.7 "Margin /
// Credit(归档)" light prescription) -- follows the triageRail.ts / eodRail.ts
// precedent exactly. Archived pages cap at 4 exhibits (detection figure,
// decision boundary + metric registry, negative-result honesty, source &
// receipts) -- no fifth live/value-add slot per §6.0's optional "05" row.
const marginProject = getProject("analytics", "margin-control-tower");

export const marginRail: RailSpec = {
  wordmark: { lines: ["Margin", "Control Tower"] },
  copy: marginProject ? { en: "Six injected margin leaks, replayed against 106 weeks of real Olist contribution margin.", zh: marginProject.glossZh } : undefined,
  nav: [
    { id: "exhibit-01", num: "01", label: { en: "Detection", zh: "异常检测" } },
    { id: "exhibit-02", num: "02", label: { en: "Decision boundary", zh: "决策边界" } },
    { id: "exhibit-03", num: "03", label: { en: "Negative results", zh: "负结果" } },
    { id: "exhibit-04", num: "04", label: navigationCopy.sourceReceipts },
  ],
  footer: projectRailFooter,
  // §6.7 "全部项目挂 mono 状态标 active / maintained / archived" -- this
  // project's own tier in projects.ts is "archive" (see the homepage shelf's
  // identical projects.ts read), so the tag here is the derived, non-live
  // "ARCHIVED" state. Reuses ExhibitShell's existing rail-stamp slot (the
  // same DOM/CSS Forge's live-status stamp already renders) rather than
  // inventing a second status-tag mechanism -- tone "offline" is the closest
  // existing semantic (not live) since RailSpec's stamp tone enum does not
  // (yet) carry a third "archived" value of its own.
  stamp: { label: navigationCopy.archived, tone: "offline" },
};

export default marginRail;

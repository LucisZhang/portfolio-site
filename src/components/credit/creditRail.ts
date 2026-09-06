import { navigationCopy, projectRailFooter, type RailSpec } from "@/lib/navigation";
import { getProject } from "@/lib/projects";

// Credit Policy Desk project-page rail (task L4, spec §6.0/§6.7 "Margin /
// Credit(归档)" light prescription) -- follows the marginRail.ts precedent
// exactly. Archived pages cap at 4 exhibits (policy frontier, decision
// boundary, negative-result honesty, source & receipts) -- no fifth live/
// value-add slot per §6.0's optional "05" row.
const creditProject = getProject("analytics", "credit-policy-desk");

export const creditRail: RailSpec = {
  wordmark: { lines: ["Credit", "Policy Desk"] },
  copy: creditProject ? { en: "A calibrated score and a threshold, walked forward against 24,000 real later-backtest loans.", zh: creditProject.glossZh } : undefined,
  nav: [
    { id: "exhibit-01", num: "01", label: { en: "Policy frontier", zh: "策略边界" } },
    { id: "exhibit-02", num: "02", label: { en: "Decision boundary", zh: "决策边界" } },
    { id: "exhibit-03", num: "03", label: { en: "Negative results", zh: "负结果" } },
    { id: "exhibit-04", num: "04", label: navigationCopy.sourceReceipts },
  ],
  footer: projectRailFooter,
  // §6.7 "全部项目挂 mono 状态标 active / maintained / archived" -- this
  // project's own tier in projects.ts is "archive" (matches Margin Control
  // Tower's identical treatment), so the tag here is the derived,
  // non-live "ARCHIVED" state, reusing ExhibitShell's existing rail-stamp
  // slot rather than inventing a second status-tag mechanism.
  stamp: { label: navigationCopy.archived, tone: "offline" },
};

export default creditRail;

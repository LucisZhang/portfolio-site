import type { RailSpec } from "@/components/exhibition/ExhibitShell";
import { getProject } from "@/lib/projects";

// Task L1: Release Guardian rail (auto-rail v3, matching triageRail.ts /
// forgeRail.ts precedent). Nav labels adapt the L1 brief's suggested
// left-nav set (Overview / Recorded trace / Approval gate / Recorded
// outcomes / Method notes) to the five exhibits this page actually builds:
// 01 the approval dossier itself (memo + gate), 02 the full 13-node
// recorded trace, 03 the approval/audit chain, 04 the live-vs-stub eval
// disclosure, 05 install + SOURCE/RECEIPTS.
const guardianProject = getProject("ai", "release-guardian");

export const guardianRail: RailSpec = {
  wordmark: { lines: ["Release", "Guardian"] },
  copy: guardianProject ? { en: "A recorded change walks through a 13-node approval gate. The memo writes itself; the signature doesn't.", zh: guardianProject.glossZh } : undefined,
  nav: [
    { id: "exhibit-01", num: "01", label: "Overview" },
    { id: "exhibit-02", num: "02", label: "Recorded trace" },
    { id: "exhibit-03", num: "03", label: "Approval gate" },
    { id: "exhibit-04", num: "04", label: "Recorded outcomes" },
    { id: "exhibit-05", num: "05", label: "Method notes" },
  ],
  footer: [{ label: "← ALL WORK", href: "/" }],
};

export default guardianRail;

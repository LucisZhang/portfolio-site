import type { RailSpec } from "@/components/exhibition/ExhibitShell";
import { getProject } from "@/lib/projects";

// Triage Router project-page rail (spec section 6.0/6.3, task 3.1) --
// follows the forgeRail.ts / eodRail.ts precedent exactly.
const triageProject = getProject("ai", "triage-router");

export const triageRail: RailSpec = {
  wordmark: { lines: ["Triage", "Router"] },
  copy: triageProject ? { en: "A cost-accuracy cascade that routes each complaint to the cheapest tier that can handle it.", zh: triageProject.glossZh } : undefined,
  nav: [
    { id: "exhibit-01", num: "01", label: "Market terminal" },
    { id: "exhibit-02", num: "02", label: "Known misroutes" },
    { id: "exhibit-03", num: "03", label: "Tier frontier" },
    { id: "exhibit-04", num: "04", label: "Drift" },
    { id: "exhibit-05", num: "05", label: "Source & receipts" },
  ],
  footer: [{ label: "← ALL WORK", href: "/" }],
};

export default triageRail;

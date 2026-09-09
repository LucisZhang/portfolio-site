import { navigationCopy, projectRailFooter, type RailSpec } from "@/lib/navigation";
import { getProject } from "@/lib/projects";

// Task L3 [CLAUDE]: RAG Quality Lab rail (auto-rail v3, matching
// marginRail.ts / guardianRail.ts precedent exactly). Spec §6.7's
// "3-exhibit light prescription" mapped onto the diff/对照 genre: 01 the
// drift lab (the diff instrument itself), 02 evidence claims (the
// verified-vs-blocked registry as typographic content), 03 source &
// receipts + the report layer. No stamp: the project's tier in projects.ts
// is "secondary" (not "archive"), so this rail follows the triageRail.ts /
// guardianRail.ts precedent of carrying no rail-stamp at all rather than
// margin's "ARCHIVED" tag, which is specific to that project's "archive"
// tier.
const ragProject = getProject("ai", "rag-quality-lab");

export const ragRail: RailSpec = {
  wordmark: { lines: ["RAG Quality", "Lab"] },
  copy: ragProject ? { en: "Baseline against working copy: a deterministic diff, not a judged score.", zh: ragProject.glossZh } : undefined,
  nav: [
    { id: "exhibit-01", num: "01", label: { en: "Drift lab", zh: "漂移实验" } },
    { id: "exhibit-02", num: "02", label: { en: "Evidence claims", zh: "证据声明" } },
    { id: "exhibit-03", num: "03", label: navigationCopy.sourceReceipts },
  ],
  footer: projectRailFooter,
};

export default ragRail;

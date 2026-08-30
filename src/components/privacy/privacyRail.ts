import type { RailSpec } from "@/components/exhibition/ExhibitShell";
import { getProject } from "@/lib/projects";

// Privacy Preflight project-page rail (spec §2.1 "项目页" state, §6.0
// template, §6.4 exhibit script). Same pattern as
// src/components/forge/forgeRail.ts / triageRail.ts: serif vertical
// project name, an independent zh gloss line within the <=20-character
// rail-gloss budget, this page's own exhibit directory, and a single
// "<- ALL WORK" footer link pointing at "/" rather than the soon-to-be-
// killed "/ai" track index.
const privacyPreflight = getProject("ai", "privacy-preflight");

export const privacyRail: RailSpec = {
  wordmark: { lines: ["Privacy", "Preflight"] },
  copy: privacyPreflight ? { en: "Detect, redact, and verify sensitive content locally.", zh: privacyPreflight.glossZh } : undefined,
  nav: [
    { id: "exhibit-01", num: "01", label: "Workbench" },
    { id: "exhibit-02", num: "02", label: "Detect, review, destroy" },
    { id: "exhibit-03", num: "03", label: "OCR benchmark" },
    { id: "exhibit-04", num: "04", label: "Fail-closed export" },
    { id: "exhibit-05", num: "05", label: "Boundary" },
    { id: "exhibit-06", num: "06", label: "Source & receipts" },
  ],
  footer: [{ label: "← ALL WORK", href: "/" }],
};

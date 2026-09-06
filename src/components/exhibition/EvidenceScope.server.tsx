import type { ReactNode } from "react";
import { EvidenceProvider, type EvidenceContextValue } from "./EvidenceContext";
import * as summaries from "@/data/evidence-summaries";
import links from "@/data/generated/evidence-links.json";

const projects = {
  home: "home", forge: "frontier-forge", guardian: "release-guardian", triage: "triage-router",
  eod: "exactly-once-drills", crossover: "crossover-study", rag: "rag-quality-lab",
  privacy: "privacy-preflight", margin: "margin-control-tower", credit: "credit-policy-desk", ask: "ask-portfolio",
} as const;
const homeFiles = new Set([
  "public/case-studies/frontier-forge/release.json",
  "public/case-studies/exactly-once-drills/results/manifest.json",
  "public/case-studies/privacy-preflight/manifest.json",
]);

/** Static, route-specific data travels as server props, never as a site-wide client registry. */
export function EvidenceScope({ project, children }: { project: keyof typeof projects; children: ReactNode }) {
  const files = Object.fromEntries(Object.entries(links).filter(([id]) => {
    if (project === "home") return homeFiles.has(id);
    if (project === "ask") return id.startsWith("src/") || id.startsWith("scripts/");
    return id.startsWith(`public/case-studies/${projects[project]}/`)
      || (project === "triage" && id.startsWith("public/models/triage-tier-b2/"))
      || (project === "crossover" && id.startsWith("crossover:"));
  })) as EvidenceContextValue["files"];
  return <EvidenceProvider value={{ summary: summaries[`${project}Evidence`], files }}>{children}</EvidenceProvider>;
}

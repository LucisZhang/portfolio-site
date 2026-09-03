// Task R9a (checklist A3, owner decision: directions b AND c combined): the
// single fixed circuit over all 10 standalone project pages, defined once
// here and consumed by CircuitNav.tsx (the shell's prev/next chain + the
// page-bottom colophon index).
//
// OWNER REFINEMENT (binding): the grouping below mirrors the site's
// marketing positioning line (site-config.ts directionLine) — "AI agent &
// LLM application engineering · backend & distributed systems · data
// engineering & analytics" — NOT the legacy track-label trio ("AI
// applications / Data engineering / Data analytics"). Assignments follow
// what each project actually is; privacy-preflight sits in the AI group
// because its substance is an LLM-adjacent application-engineering
// workbench (browser-local detection/redaction with an optional external
// model boundary), not a pipeline or an analytics artifact — and the
// approved A3-c mock shows it inside the AI column (04). This grouping is
// for the index/chain ONLY: routes, tracks, and URLs are untouched, so
// each stop's href still comes from the project's existing track segment.
//
// Ordering = the approved mock's index order, flattened into one circular
// circuit: AI (6) -> ENGINEERING (2) -> ANALYTICS (2), wrapping at the
// ends (credit-policy-desk -> frontier-forge). Prev/next therefore stays
// within-group everywhere except the three group boundaries, per the task
// ruling (the A3-b mock's sample frame showed a within-group wrap for
// Frontier Forge's prev; the task text's single-circuit rule wins and is
// reported as a documented deviation).
import { routableProjects, type Project, type ProjectId } from "./projects";

export type CircuitGroupId = "ai" | "systems" | "data";

export interface CircuitGroup {
  id: CircuitGroupId;
  // Mono UI-fabric handle (approved mock's "AI — 6 / ENGINEERING — 2 /
  // ANALYTICS — 2" column headers): English in both locales per the
  // locale-purity rule for mono fabric labels.
  label: string;
  // The directionLine segment this group mirrors (report/aria context —
  // not rendered in the mono fabric, which keeps the mock's short handle).
  positioning: { en: string; zh: string };
  // Home-section anchor for the crumb's group link and the bottom block's
  // TRACK row — the same targets next.config.ts's 308s use for the retired
  // /ai, /engineering, /analytics routes, linked directly (no redirect hop).
  homeAnchor: string;
  members: ProjectId[];
}

export const circuitGroups: CircuitGroup[] = [
  {
    id: "ai",
    label: "AI",
    positioning: { en: "AI agent & LLM application engineering", zh: "AI Agent 与大模型应用工程" },
    homeAnchor: "/#agent-systems",
    members: [
      "frontier-forge",
      "release-guardian",
      "triage-router",
      "privacy-preflight",
      "rag-quality-lab",
      "ask-portfolio",
    ],
  },
  {
    id: "systems",
    label: "ENGINEERING",
    positioning: { en: "backend & distributed systems", zh: "后端与分布式系统" },
    homeAnchor: "/#systems",
    members: ["exactly-once-drills", "crossover-study"],
  },
  {
    id: "data",
    label: "ANALYTICS",
    positioning: { en: "data engineering & analytics", zh: "数据工程与分析" },
    homeAnchor: "/#archive",
    members: ["margin-control-tower", "credit-policy-desk"],
  },
];

// One-line index descriptions (approved A3-c mock copy, verbatim). zh side
// reuses each project's existing glossZh (already in every route's shared
// chunk via projects.ts), so the circuit adds no new zh source strings.
const circuitBlurbEn: Record<string, string> = {
  "frontier-forge": "SFT fine-tuning to a running vLLM release",
  "release-guardian": "rollouts gated on replayed evidence",
  "triage-router": "complaint triage with measured guardrails",
  "privacy-preflight": "detect, redact, verify — locally",
  "rag-quality-lab": "retrieval quality, measured per change",
  "ask-portfolio": "answers that carry receipts",
  "exactly-once-drills": "delivery semantics under failure drills",
  "crossover-study": "a paired design applied to systems",
  "margin-control-tower": "six injected leaks, six alarms",
  "credit-policy-desk": "a score is not a policy",
};

export interface CircuitStop {
  slug: ProjectId;
  project: Project;
  href: string;
  /** Zero-padded global index in the circuit, "01".."10" (mock numbering). */
  number: string;
  /** 1-based position within the stop's group ("AI · 1 of 6"). */
  indexInGroup: number;
  group: CircuitGroup;
  blurb: { en: string; zh: string };
}

function buildStops(): CircuitStop[] {
  const stops: CircuitStop[] = [];
  for (const group of circuitGroups) {
    group.members.forEach((slug, memberIndex) => {
      const project = routableProjects.find((candidate) => candidate.slug === slug);
      if (!project) return;
      stops.push({
        slug,
        project,
        href: `/${project.track}/${project.slug}`,
        number: String(stops.length + 1).padStart(2, "0"),
        indexInGroup: memberIndex + 1,
        group,
        blurb: { en: circuitBlurbEn[slug] ?? "", zh: project.glossZh },
      });
    });
  }
  return stops;
}

export const circuitStops: CircuitStop[] = buildStops();

export interface CircuitEntry {
  stop: CircuitStop;
  prev: CircuitStop;
  next: CircuitStop;
}

/** The circuit entry for a route pathname, or null off the circuit (home,
 * /artifact, dev fixtures) — CircuitNav renders nothing there. */
export function circuitEntryForPath(pathname: string | null): CircuitEntry | null {
  if (!pathname) return null;
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const index = circuitStops.findIndex((stop) => stop.href === normalized);
  if (index === -1) return null;
  const count = circuitStops.length;
  return {
    stop: circuitStops[index],
    prev: circuitStops[(index - 1 + count) % count],
    next: circuitStops[(index + 1) % count],
  };
}

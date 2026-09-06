// The single fixed circuit over all 10 standalone project pages, defined
// once here and consumed by CircuitNav.tsx (the shell's prev/next chain and
// the page-bottom colophon index of work).
//
// Task D06 (site revamp R2): the circuit is grouped into three families
// named after what the work does --
//   BUILD & RUN      stand a system up and keep it up under load/failure
//   GUARD & VERIFY   gates that fail closed before something ships or leaves
//   MEASURE & DECIDE measurement that ends in a threshold, a policy, or a no
// -- and the families are what the crumb, the prev/next chain and the
// page-bottom index of work all speak in.
//
// The grouping governs the index and the chain ONLY. Routes, tracks and
// URLs are untouched, so every stop's href still comes from the project's
// own track segment and /engineering/crossover-study legitimately shows a
// MEASURE & DECIDE crumb.
//
// One invariant carries the whole design: `circuitOrder` is exactly the
// families of `circuitGroups`, in display order, laid end to end
// (`assertTaxonomy` throws otherwise). Four things the reader sees are
// derived from that single list and therefore cannot disagree with each
// other: the family label in the crumb, the in-family position beside it
// ("GUARD & VERIFY . 02 / 04"), the prev/next chain, and the index's global
// numbers 01..10, which run monotonically down each family's column and
// cross a family boundary only at the seams and the wrap. The list is
// written out explicitly rather than computed so that changing the browsing
// order of the site is a deliberate, reviewable edit in one place.
import { routableProjects, type Project, type ProjectId } from "./projects";
import type { Locale, LocalizedString } from "./i18n";
import { navigationCopy, navigationNumber, navigationPosition } from "./navigation";
import { projectIdentityNavigationLabel, resolveProjectIdentity } from "./project-identities";

export type CircuitGroupId = "build-run" | "guard-verify" | "measure-decide";

export interface CircuitGroup {
  id: CircuitGroupId;
  label: LocalizedString;
  // One muted line under the colophon heading, stating what the family
  // claims. An editorial label needs it: the line has to add the claim, not
  // restate the label back at the reader.
  gloss: LocalizedString;
  // Members in circuit order. `circuitOrder` is asserted below to be
  // exactly these lists concatenated in display order, so `members.length`
  // is both the family size shown beside the colophon heading and the
  // denominator in the crumb's "GUARD & VERIFY . 02 / 04".
  members: ProjectId[];
}

export const circuitGroups: CircuitGroup[] = [
  {
    id: "build-run",
    label: { en: "BUILD & RUN", zh: "构建与运行" },
    gloss: {
      en: "From standing it up to keeping it running under load and failure.",
      zh: "从搭起来，到在负载与故障下继续跑。",
    },
    members: ["frontier-forge", "exactly-once-drills"],
  },
  {
    id: "guard-verify",
    label: { en: "GUARD & VERIFY", zh: "把关与验证" },
    gloss: {
      en: "When it should be stopped, fail rather than let it through.",
      zh: "该拦下时，宁可失败，也不放行。",
    },
    members: ["release-guardian", "privacy-preflight", "rag-quality-lab", "ask-portfolio"],
  },
  {
    id: "measure-decide",
    label: { en: "MEASURE & DECIDE", zh: "度量与决策" },
    gloss: {
      en: "Use the results to set thresholds and policies, and to say when to refuse.",
      zh: "用结果定阈值、定策略，也明确什么时候该否决。",
    },
    members: ["triage-router", "crossover-study", "margin-control-tower", "credit-policy-desk"],
  },
];

// The circular browsing chain, and the source every stop is built from.
// It is the concatenation of the families above in display order --
// `assertTaxonomy` throws otherwise -- and tests/site-circuit.test.mjs
// pins the exact slugs independently of `circuitGroups`, so a regrouping
// cannot move the site's browsing order without failing a gate.
export const circuitOrder: ProjectId[] = [
  "frontier-forge",
  "exactly-once-drills",
  "release-guardian",
  "privacy-preflight",
  "rag-quality-lab",
  "ask-portfolio",
  "triage-router",
  "crossover-study",
  "margin-control-tower",
  "credit-policy-desk",
];

/** The colophon element id a group's crumb/TRACK link jumps to. Derived,
 *  never hand-written, so the link and the landing target cannot drift. */
export function circuitIndexAnchor(id: CircuitGroupId): string {
  return `index-${id}`;
}

/** Bottom TRACK row label: the family, plus the fact that the destination
 *  is the index further down THIS page. The crumb and the TRACK row carry
 *  the same href, so they have to read as the same offer in both locales.
 *  The zh side leads with the qualifier because that is where zh puts it. */
export function circuitGroupIndexLabel(group: CircuitGroup, locale: Locale): string {
  return locale === "zh"
    ? `${navigationCopy.groupIndex.zh}${group.label.zh} →`
    : `${navigationCopy.groupIndex.en} ${group.label.en} →`;
}

// One-line index descriptions for the bottom index. The zh side reuses each
// project's existing glossZh (already in every route's shared
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
  /** Stable navigation name; intentionally separate from editorial headlines. */
  navigationLabel: LocalizedString;
  href: string;
  /** Zero-padded global index in the circuit, "01".."10" (mock numbering). */
  number: string;
  /** 1-based position within the stop's group, formatted at the UI boundary. */
  indexInGroup: number;
  group: CircuitGroup;
  blurb: { en: string; zh: string };
}

// Build-time invariants. These run once at module load (server and client
// alike) and throw rather than degrade: a project silently missing from the
// taxonomy would drop it out of the index of work on all 10 pages, and a
// project in two families would make "you are here" ambiguous.
function assertTaxonomy(): Map<ProjectId, CircuitGroup> {
  const familyOf = new Map<ProjectId, CircuitGroup>();
  for (const group of circuitGroups) {
    for (const slug of group.members) {
      const existing = familyOf.get(slug);
      if (existing) {
        throw new Error(`site-circuit: ${slug} is in both "${existing.id}" and "${group.id}"; every project belongs to exactly one group`);
      }
      familyOf.set(slug, group);
    }
  }
  // Group members must be real routable projects (catches a rename or a
  // typo), but not every routable project is a circuit stop: the archive
  // tier's compatibility route (analytics-tandem) is off the circuit and
  // CircuitNav renders nothing there. tests/site-circuit.test.mjs names
  // that one exclusion explicitly, so a genuinely new project that nobody
  // assigned to a family fails a gate instead of quietly disappearing from
  // the index of work on all ten pages.
  for (const slug of familyOf.keys()) {
    if (!routableProjects.some((project) => project.slug === slug)) {
      throw new Error(`site-circuit: group member ${slug} is not a routable project`);
    }
  }
  // The invariant of this file: the circuit is the families, in display
  // order, laid end to end. Everything the page promises -- "02 / 04" under
  // a family label, a NEXT that stays inside the family until the family
  // ends, an index column whose global numbers climb from top to bottom --
  // is this one equality. Comparing the whole flattened list rather than
  // group by group also catches a reordering of `circuitGroups` itself.
  const flattened = circuitGroups.flatMap((group) => group.members);
  if (flattened.join(",") !== circuitOrder.join(",")) {
    throw new Error(`site-circuit: circuitOrder must be the families concatenated in display order (expected ${flattened.join(", ")}, got ${circuitOrder.join(", ")})`);
  }
  return familyOf;
}

function buildStops(): CircuitStop[] {
  const familyOf = assertTaxonomy();
  return circuitOrder.map((slug, index) => {
    const project = routableProjects.find((candidate) => candidate.slug === slug);
    const group = familyOf.get(slug);
    const identity = resolveProjectIdentity(slug);
    if (!project || !group || !identity) {
      throw new Error(`site-circuit: ${slug} has no routable project`);
    }
    return {
      slug,
      project,
      navigationLabel: projectIdentityNavigationLabel(identity.id),
      href: `/${project.track}/${project.slug}`,
      number: navigationNumber(index + 1),
      indexInGroup: group.members.indexOf(slug) + 1,
      group,
      blurb: { en: circuitBlurbEn[slug] ?? "", zh: project.glossZh },
    };
  });
}

export const circuitStops: CircuitStop[] = buildStops();

export function circuitPosition(stop: CircuitStop, locale: Locale): string {
  return `${stop.group.label[locale]} · ${navigationPosition(stop.indexInGroup, stop.group.members.length)}`;
}

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

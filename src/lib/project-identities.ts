// Public project names and navigation identities. Topic/search vocabulary is
// deliberately separate: e.g. RAG, Iceberg, and a gateway are not project names.
// Historical names resolve navigation only; they never change evidence scope.
export const PROJECT_IDENTITIES = {
  "groupconv-atlas": {
    label: { en: "GroupConv Atlas", zh: "GroupConv Atlas" },
    route: "/projects/groupconv-atlas", href: "/projects/groupconv-atlas", kind: "portfolio",
    aliases: [], routeAliases: ["/ai/groupconv-atlas"],
  },
  "frontier-forge": {
    label: { en: "Frontier Forge", zh: "Frontier Forge" },
    route: "/projects/frontier-forge", href: "/projects/frontier-forge", kind: "portfolio",
    aliases: [], routeAliases: ["/ai/frontier-forge"],
  },
  "release-guardian": {
    label: { en: "Release Guardian", zh: "Release Guardian" },
    route: "/projects/release-guardian", href: "/projects/release-guardian", kind: "portfolio",
    aliases: [], routeAliases: ["/ai/release-guardian"],
  },
  "exactly-once-drills": {
    label: { en: "Exactly-Once Drills", zh: "Exactly-Once Drills" },
    route: "/projects/exactly-once-drills", href: "/projects/exactly-once-drills", kind: "portfolio",
    aliases: ["Streaming Reliability Lab", "p1-reliability-lab", "p1 Reliability Lab", "p1 可靠性实验室", "流式可靠性实验室", "流式可靠性项目", "可靠性实验室", "reliability lab"],
    routeAliases: ["/engineering/exactly-once-drills", "/engineering/p1-reliability-lab", "/engineering/streaming-reliability-lab"],
  },
  "rag-quality-lab": {
    label: { en: "RAG Quality Lab", zh: "RAG Quality Lab" },
    route: "/projects/rag-quality-lab", href: "/projects/rag-quality-lab", kind: "portfolio",
    aliases: [], routeAliases: ["/ai/rag-quality-lab"],
  },
  "triage-router": {
    label: { en: "Triage Router", zh: "Triage Router" },
    route: "/projects/triage-router", href: "/projects/triage-router", kind: "portfolio",
    aliases: ["NLP Eval Lab", "nlp-eval-lab"], routeAliases: ["/ai/triage-router"],
  },
  "privacy-preflight": {
    label: { en: "Privacy Preflight", zh: "Privacy Preflight" },
    route: "/projects/privacy-preflight", href: "/projects/privacy-preflight", kind: "portfolio",
    aliases: ["隐私预检", "隱私預檢", "privacy-preflight-web"],
    routeAliases: ["/ai/privacy-preflight", "/ai/privacy-preflight-mac", "/ai/privacy-preflight-web"],
  },
  "margin-control-tower": {
    label: { en: "Margin Control Tower", zh: "Margin Control Tower" },
    route: "/projects/margin-control-tower", href: "/projects/margin-control-tower", kind: "portfolio",
    aliases: [], routeAliases: ["/analytics/margin-control-tower"],
  },
  "crossover-study": {
    label: { en: "Crossover Study", zh: "Crossover Study" },
    route: "/projects/crossover-study", href: "/projects/crossover-study", kind: "portfolio",
    aliases: ["Batch Recsys Lab", "batch-recsys-lab"], routeAliases: ["/engineering/crossover-study"],
  },
  "ask-portfolio": {
    label: { en: "Ask Portfolio", zh: "Ask Portfolio" },
    route: "/projects/ask-portfolio", href: "/projects/ask-portfolio", kind: "portfolio",
    aliases: [], routeAliases: ["/ai/ask-portfolio"],
  },
  "credit-policy-desk": {
    label: { en: "Credit Policy Desk", zh: "Credit Policy Desk" },
    route: "/projects/credit-policy-desk", href: "/projects/credit-policy-desk", kind: "portfolio",
    aliases: ["Credit Policy Lab", "credit-policy-lab", "信贷策略实验室", "信貸策略實驗室"],
    routeAliases: ["/analytics/credit-policy-desk", "/analytics/credit-policy-lab"],
  },
  "analytics-tandem": {
    label: { en: "Analytics Tandem", zh: "Analytics Tandem" },
    // Route moved to the flat /projects space (Task A1); this page still
    // intentionally sends readers to the archive shelf, not to itself.
    route: "/projects/analytics-tandem", href: "/#archive", kind: "portfolio",
    aliases: [], routeAliases: ["/analytics/analytics-tandem"],
  },
  "Voice-in-Security": {
    label: { en: "Voice-in-Security", zh: "Voice-in-Security" },
    route: null, href: "https://github.com/LucisZhang/Voice-in-Security", kind: "github",
    aliases: ["Voice in Security", "语音安全", "語音安全"], routeAliases: [],
  },
} as const;

export type ProjectIdentityId = keyof typeof PROJECT_IDENTITIES;
export const PROJECT_IDENTITY_IDS = Object.keys(PROJECT_IDENTITIES) as ProjectIdentityId[];
export type ProjectIdentity = (typeof PROJECT_IDENTITIES)[ProjectIdentityId] & { id: ProjectIdentityId };

export function projectIdentityNames(id: ProjectIdentityId): string[] {
  const entry = PROJECT_IDENTITIES[id];
  return [...new Set([id, entry.label.en, entry.label.zh, ...entry.aliases])];
}

export function normalizeProjectAlias(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US")
    .replace(/[\s_\-\u2010-\u2015]+/gu, " ").trim();
}

const aliasIds = new Map<string, ProjectIdentityId>();
const routeIds = new Map<string, ProjectIdentityId>();
for (const id of PROJECT_IDENTITY_IDS) {
  const entry = PROJECT_IDENTITIES[id];
  for (const name of projectIdentityNames(id)) {
    const key = normalizeProjectAlias(name);
    const previous = aliasIds.get(key);
    if (previous && previous !== id) throw new Error(`Project alias collision: ${name} (${previous}, ${id})`);
    aliasIds.set(key, id);
  }
  for (const route of [entry.route, ...entry.routeAliases]) {
    if (!route) continue;
    const previous = routeIds.get(route);
    if (previous && previous !== id) throw new Error(`Project route collision: ${route}`);
    routeIds.set(route, id);
  }
}

/** Exact names or reviewed local routes only. Never guesses from a topic. */
export function resolveProjectIdentity(value: string): ProjectIdentity | null {
  const route = value.split(/[?#]/u)[0].replace(/\/$/u, "");
  const id = value.startsWith("/") ? routeIds.get(route) : aliasIds.get(normalizeProjectAlias(value));
  return id ? { id, ...PROJECT_IDENTITIES[id] } : null;
}

export function projectIdentityHref(id: ProjectIdentityId, locale: "en" | "zh"): string {
  const entry = PROJECT_IDENTITIES[id];
  if (entry.kind === "github" || locale === "en") return entry.href;
  const [pathname, hash] = entry.href.split("#");
  return `${pathname}?lang=zh${hash ? `#${hash}` : ""}`;
}

const mentionPattern = new RegExp([...aliasIds.keys()]
  .sort((a, b) => b.length - a.length || a.localeCompare(b, "en"))
  .map((alias) => {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&").replace(/ /gu, "[\\s_\\-\\u2010-\\u2015]+");
    // Chinese prose often abuts an English name. Latin/number boundaries keep
    // partial words and longer identifiers from accidentally becoming links.
    const left = /^[a-z0-9]/u.test(alias) ? "(?<![\\p{Script=Latin}\\p{N}_])" : "";
    const right = /[a-z0-9]$/u.test(alias) ? "(?![\\p{Script=Latin}\\p{N}_])" : "";
    return `${left}${escaped}${right}`;
  }).join("|"), "giu");

export function findProjectMentions(text: string): Array<{ id: ProjectIdentityId; text: string; index: number }> {
  return [...text.matchAll(mentionPattern)].flatMap((match) => {
    const id = aliasIds.get(normalizeProjectAlias(match[0]));
    return id ? [{ id, text: match[0], index: match.index }] : [];
  });
}

export function mentionedProjectIds(text: string): ProjectIdentityId[] {
  return [...new Set(findProjectMentions(text).map(({ id }) => id))];
}

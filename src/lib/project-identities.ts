// Public project names and navigation identities. Topic/search vocabulary is
// deliberately separate: e.g. RAG, Iceberg, and a gateway are not project names.
// Historical names resolve navigation only; they never change evidence scope.
export const PROJECT_IDENTITIES = {
  "frontier-forge": {
    label: { en: "Frontier Forge", zh: "Frontier Forge" },
    route: "/ai/frontier-forge", href: "/ai/frontier-forge", kind: "portfolio",
    aliases: [], routeAliases: [],
  },
  "release-guardian": {
    label: { en: "Release Guardian", zh: "Release Guardian" },
    route: "/ai/release-guardian", href: "/ai/release-guardian", kind: "portfolio",
    aliases: [], routeAliases: [],
  },
  "exactly-once-drills": {
    label: { en: "Exactly-Once Drills", zh: "Exactly-Once Drills" },
    route: "/engineering/exactly-once-drills", href: "/engineering/exactly-once-drills", kind: "portfolio",
    aliases: ["Streaming Reliability Lab", "p1-reliability-lab", "p1 Reliability Lab", "p1 可靠性实验室", "流式可靠性实验室", "流式可靠性项目", "可靠性实验室", "reliability lab"],
    routeAliases: ["/engineering/p1-reliability-lab", "/engineering/streaming-reliability-lab"],
  },
  "rag-quality-lab": {
    label: { en: "RAG Quality Lab", zh: "RAG Quality Lab" },
    route: "/ai/rag-quality-lab", href: "/ai/rag-quality-lab", kind: "portfolio",
    aliases: [], routeAliases: [],
  },
  "triage-router": {
    label: { en: "Triage Router", zh: "Triage Router" },
    route: "/ai/triage-router", href: "/ai/triage-router", kind: "portfolio",
    aliases: ["NLP Eval Lab", "nlp-eval-lab"], routeAliases: [],
  },
  "privacy-preflight": {
    label: { en: "Privacy Preflight", zh: "Privacy Preflight" },
    route: "/ai/privacy-preflight", href: "/ai/privacy-preflight", kind: "portfolio",
    aliases: ["隐私预检", "隱私預檢", "privacy-preflight-web"],
    routeAliases: ["/ai/privacy-preflight-mac", "/ai/privacy-preflight-web"],
  },
  "margin-control-tower": {
    label: { en: "Margin Control Tower", zh: "Margin Control Tower" },
    route: "/analytics/margin-control-tower", href: "/analytics/margin-control-tower", kind: "portfolio",
    aliases: [], routeAliases: [],
  },
  "crossover-study": {
    label: { en: "Crossover Study", zh: "Crossover Study" },
    route: "/engineering/crossover-study", href: "/engineering/crossover-study", kind: "portfolio",
    aliases: ["Batch Recsys Lab", "batch-recsys-lab"], routeAliases: [],
  },
  "ask-portfolio": {
    label: { en: "Ask Portfolio", zh: "Ask Portfolio" },
    route: "/ai/ask-portfolio", href: "/ai/ask-portfolio", kind: "portfolio",
    aliases: [], routeAliases: [],
  },
  "credit-policy-desk": {
    label: { en: "Credit Policy Desk", zh: "分数不是策略。" },
    route: "/analytics/credit-policy-desk", href: "/analytics/credit-policy-desk", kind: "portfolio",
    aliases: ["Credit Policy Lab", "credit-policy-lab", "信贷策略实验室", "信貸策略實驗室"],
    routeAliases: ["/analytics/credit-policy-lab"],
  },
  "analytics-tandem": {
    label: { en: "Analytics Tandem", zh: "Analytics Tandem" },
    // This compatibility page intentionally redirects to the archive exhibit.
    route: "/analytics/analytics-tandem", href: "/#archive", kind: "portfolio",
    aliases: [], routeAliases: [],
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

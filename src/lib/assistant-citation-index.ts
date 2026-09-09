// Task R9c (B5-c) [CLAUDE]: destination-mapping layer for answer references.
// Owner ruling: the reference block at the end of an answer is a navigation
// index that guides the reader somewhere worth going — technically deep
// GitHub repo files, or this site's own project pages. Never: portfolio-site
// repo file links, raw knowledge-base entry names, or config-file references.
//
// Mapping rules (each entry derives from an actual retrieved citation):
// - global/overview question -> project home or repository root;
// - detailed external project repo chunk -> keep the pinned GitHub line-range link,
//   labeled by repo + what the reader will find there (no path dumps);
// - portfolio-site internal chunk (site-config.ts, projects.ts, README...)
//   -> the relevant PROJECT PAGE route on this site, derived from the route
//   key embedded in the chunk id ("portfolio-site:<routeKey>:<path>:Lx-Ly");
//   an unrecognized route key collapses into the home page-level destination
//   rather than surfacing a raw internal ref;
// - private profile chunk -> label only (existing rule, unchanged).
import type { AssistantCitation } from "@/lib/assistant-policy";
import { resolveProjectIdentity } from "./project-identities";
import { groupconvCitationLabel } from "./groupconv-citation-label";
import { zhCitationLabel } from "./zh-citation-label";
import sectionLabels from "../data/generated/assistant-citation-sections.json" with { type: "json" };

export type CitationIndexEntryKind = "github" | "site" | "private";

export interface CitationIndexEntry {
  key: string;
  /** 1-based citation numbers (matches the answer's superscript markers). */
  refs: number[];
  kind: CitationIndexEntryKind;
  /** Pinned GitHub URL (kind "github") or site route path (kind "site"). */
  href?: string;
  external: boolean;
  title: { en: string; zh: string };
  /** Quiet mono destination line under the title ("" for private). */
  route: { en: string; zh: string };
  badge: { en: string; zh: string };
}

const PORTFOLIO_SITE_SOURCE = /^portfolio-site:([a-z0-9-]+):/u;
const GITHUB_BLOB_URL =
  /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/[a-f0-9]{40}\/([^#]+?)(?:#L(\d+)(?:-L(\d+))?)?$/u;
const PATH_DUMP_LABEL_EN = /^(.+?) · .+ · lines \d+-\d+$/u;
const PATH_DUMP_LABEL_ZH = /^(.+?) · .+ · 第 \d+-\d+ 行$/u;

const BADGE_GITHUB = { en: "EVIDENCE FILE", zh: "证据文件" } as const;
const BADGE_SITE = { en: "PROJECT HOME", zh: "项目首页" } as const;
const BADGE_SECTION = { en: "EXHIBIT SECTION", zh: "具体展区" } as const;
const BADGE_INDEX = { en: "PROJECT INDEX", zh: "项目索引" } as const;
const BADGE_PRIVATE = { en: "PRIVATE SOURCE", zh: "私有材料" } as const;

const HOME_ENTRY = {
  href: "/",
  title: { en: "Browse the full project index", zh: "浏览完整项目索引" },
  route: { en: "/ · project index", zh: "/ · 项目索引" },
};

// What the reader will find behind an external pinned link, from the file's
// role in its repo — a short human descriptor, never a path dump.
function fileDescriptor(filePath: string): { en: string; zh: string } {
  const lower = filePath.toLowerCase();
  if (/readme(?:\.zh-cn)?\.md$/u.test(lower)) {
    return { en: "the README's verified claims", zh: "README 中的已验证结论" };
  }
  if (lower.includes("resume-claims")) {
    return { en: "the gated resume-claim record", zh: "简历结论门禁记录" };
  }
  if (lower.includes("runbook")) return { en: "the operations runbook", zh: "运行手册" };
  if (/\.mmd$/u.test(lower) || lower.includes("architecture")) {
    return { en: "the architecture diagram", zh: "架构图" };
  }
  if (/summary\.md$/u.test(lower)) {
    return { en: "the record of one real run", zh: "一次真实运行的记录" };
  }
  if (/manifest\.json$/u.test(lower) || lower.includes("evidence") || lower.includes("results/")) {
    return { en: "the recorded evidence file", zh: "评测证据文件" };
  }
  if (/^scripts?\//u.test(lower) || /\.(?:mjs|py|sh)$/u.test(lower)) {
    return { en: "a runnable script", zh: "可运行脚本" };
  }
  if (/^docs\//u.test(lower)) return { en: "the project documentation", zh: "项目文档" };
  return { en: "the pinned source lines", zh: "锁定的源码行" };
}

function decodePath(encoded: string): string {
  try {
    return encoded.split("/").map(decodeURIComponent).join("/");
  } catch {
    return encoded;
  }
}

function sectionLabel(slug: string, anchor: string) {
  const sections = sectionLabels as Record<string, Record<string, { en: string; zh: string }>>;
  return sections[slug]?.[anchor] ?? { en: `Section ${anchor.replace("exhibit-", "")}`, zh: `展区 ${anchor.replace("exhibit-", "")}` };
}

function siteEntry(sourceId: string, anchor?: string): Pick<CitationIndexEntry, "href" | "title" | "route" | "badge"> {
  const routeKey = PORTFOLIO_SITE_SOURCE.exec(sourceId)?.[1] ?? "home";
  if (routeKey !== "home") {
    // A route key is the source route with its separators flattened to "-"
    // (scripts/lib/ask-authored-answers.mjs `routeKeyOf`), so the first
    // segment is the URL's first path segment: "projects" for a flat project
    // route, and still "ai"/"engineering"/"analytics" for any key written
    // before the move. Splitting at the FIRST "-" recovers both, and
    // resolveProjectIdentity() accepts the retired routes as routeAliases,
    // so old and new keys resolve to the same identity.
    const separator = routeKey.indexOf("-");
    const firstSegment = separator > 0 ? routeKey.slice(0, separator) : "";
    const slug = separator > 0 ? routeKey.slice(separator + 1) : "";
    if (firstSegment && slug) {
      const project = resolveProjectIdentity(`/${firstSegment}/${slug}`);
      if (project) {
        // Authored citations may pin a section of the destination page
        // (scripts/lib/ask-authored-answers.mjs spreads spec.anchor onto
        // the citation); an unanchored citation still lands cleanly on the
        // page with no stray "#".
        //
        // Task B4: an identity's href may already carry a fragment — the
        // ARCHIVE_ONLY case, where the reference belongs on the home
        // archive shelf ("/#archive") rather than on the bare page (ruling
        // Q3; analytics-tandem is the only one today). Appending a second
        // fragment there would emit "/#archive#exhibit-XX", which resolves
        // to nothing. Keep the authored fragment off any href that already
        // has one; whether the anchor is a real section of the destination
        // is the authored-answer gate's job, not this renderer's.
        const href = anchor && !project.href.includes("#") ? `${project.href}#${anchor}` : project.href;
        const fragment = href.split("#")[1];
        const section = fragment ? (fragment === "archive"
          ? { en: "Project archive", zh: "项目归档" }
          : sectionLabel(project.id, fragment)) : undefined;
        return {
          href,
          badge: section ? { ...BADGE_SECTION } : { ...BADGE_SITE },
          title: section ? {
            en: `${project.label.en} · ${section.en}`,
            zh: `${project.label.zh} · ${section.zh}`,
          } : {
            en: `Explore ${project.label.en}`,
            zh: `查看「${project.label.zh}」`,
          },
          route: section
            ? { en: `${href} · exhibit section`, zh: `${href} · 具体展区` }
            : { en: `${href} · project home`, zh: `${href} · 项目首页` },
        };
      }
    }
  }
  // Home chunks, and anything that maps to nothing recruiter-worthy,
  // collapse into the page-level destination.
  //
  // Task B4: the home page has a rail of its own (src/components/home/
  // homeRail.ts declares exhibit-01…06) and the authored-answer gate accepts
  // an anchored {site:"/"} citation against it, so honor the fragment here
  // too — otherwise the gate would approve a deep link this renderer silently
  // flattens to "/". Only the real home key does this: an unresolved project
  // key that lands here carries someone else's rail anchor, which would be a
  // dead fragment on "/". HOME_ENTRY is a shared constant — build a new
  // object rather than writing into it.
  if (routeKey === "home" && anchor) {
    const href = `/#${anchor}`;
    return {
      ...HOME_ENTRY,
      href,
      title: sectionLabel("home", anchor),
      badge: { ...BADGE_SECTION },
      route: { en: `${href} · exhibit section`, zh: `${href} · 具体展区` },
    };
  }
  return { ...HOME_ENTRY, badge: { ...BADGE_INDEX } };
}

function githubEntry(citation: AssistantCitation): Pick<CitationIndexEntry, "href" | "title" | "route"> {
  const url = citation.url as string;
  const parsed = GITHUB_BLOB_URL.exec(url);
  if (!parsed) {
    // Unexpected shape (upstream validation makes this unreachable in
    // practice): keep the reviewed human label and the working link.
    return { href: url, title: { ...citation.label }, route: { en: "github.com", zh: "github.com" } };
  }
  const [, owner, repo, encodedPath, lineStart, lineEnd] = parsed;
  const filePath = decodePath(encodedPath);
  const lines = lineStart ? ` · L${lineStart}${lineEnd ? `–L${lineEnd}` : ""}` : "";
  const routeLine = `github.com/${owner}/${repo} · ${filePath}${lines}`;
  const groupconvTopic = owner === "LucisZhang" && repo === "groupconv-atlas"
    ? groupconvCitationLabel(filePath, lineStart ? Number(lineStart) : undefined, lineStart ? Number(lineEnd ?? lineStart) : undefined)
    : undefined;
  if (groupconvTopic) return {
    href: url,
    title: { en: `GroupConv Atlas · ${groupconvTopic.en}`, zh: `GroupConv Atlas · ${groupconvTopic.zh}` },
    route: { en: routeLine, zh: routeLine },
  };
  const dumpEn = PATH_DUMP_LABEL_EN.exec(citation.label.en);
  const dumpZh = PATH_DUMP_LABEL_ZH.exec(citation.label.zh);
  if (!dumpEn) {
    // The label is already a short human descriptor (e.g. the reviewed
    // streaming source pack): keep it as the title.
    return { href: url, title: { ...citation.label }, route: { en: routeLine, zh: routeLine } };
  }
  const projectEn = dumpEn[1];
  const projectZh = dumpZh?.[1] ?? projectEn;
  const descriptor = fileDescriptor(filePath);
  return {
    href: url,
    title: {
      en: `See ${descriptor.en} in ${projectEn}`,
      zh: zhCitationLabel(projectZh, descriptor.zh),
    },
    route: { en: routeLine, zh: routeLine },
  };
}

/** Overview navigation stays at project level; implementation questions retain evidence depth. */
export function isOverviewQuestion(question: string): boolean {
  const text = question.trim();
  // Explicit evidence requests win even when the question also asks for a summary.
  if (/源码|文件|哪一行|行号|如何实现|实现细节|算法|误报|残留|\b(?:source code|files?|line numbers?|implementation|algorithm)\b/iu.test(text)) return false;
  const profile = /求职|职业(?:方向|目标|规划)|主要(?:在做什么|工作|做什么)|(?:他的|个人|教育|工作|学术)背景|背景是什么|擅长|适合.*(?:岗位|职位|角色)|\b(?:who is|what kind of work|background|skills?|role fit|career (?:focus|goals?|direction)|suitable roles?|best suited)\b/iu;
  const navigation = /先看|值得.*看|作品集.*(?:内容|介绍)|\b(?:what can i explore|where (?:should|do) i start|which projects)\b/iu;
  const technology = /(?:网站|这些项目|全站).*(?:技术|技术栈)|技术栈|\b(?:tech(?:nology)? stack|what technologies power)\b/iu;
  const summary = /概览|简介|介绍一下|\b(?:overview|introduce|high[- ]level summary)\b|what (?:does|is) .+ (?:do|about)\??$/iu;
  return [profile, navigation, technology, summary].some((pattern) => pattern.test(text));
}

function overviewEntry(citation: AssistantCitation): Pick<CitationIndexEntry, "href" | "title" | "route" | "badge"> | undefined {
  if (PORTFOLIO_SITE_SOURCE.test(citation.sourceId)) return siteEntry(citation.sourceId);
  const parsed = citation.url && GITHUB_BLOB_URL.exec(citation.url);
  if (!parsed) return undefined;
  const [, owner, repo] = parsed;
  if (repo === "portfolio-site") return { ...HOME_ENTRY, badge: { ...BADGE_INDEX } };
  const project = resolveProjectIdentity(repo);
  if (project?.route) return siteEntry(`portfolio-site:projects-${project.id}:`);
  const href = `https://github.com/${owner}/${repo}`;
  return {
    href,
    title: { en: `Explore ${project?.label.en ?? repo}`, zh: `查看「${project?.label.zh ?? repo}」` },
    route: { en: href, zh: href },
    badge: { en: "PROJECT REPOSITORY", zh: "项目仓库" },
  };
}

/**
 * Maps retrieved citations to index entries, in citation order. Citations
 * that resolve to the same destination merge into one entry carrying every
 * citation number, so a run of portfolio-site internals never repeats the
 * same project page.
 */
export function buildCitationIndex(citations: readonly AssistantCitation[], question = ""): CitationIndexEntry[] {
  const entries: CitationIndexEntry[] = [];
  const byKey = new Map<string, CitationIndexEntry>();
  citations.forEach((citation, index) => {
    const ref = index + 1;
    let entry: CitationIndexEntry;
    const overview = isOverviewQuestion(question) && citation.kind !== "private-profile" && citation.url ? overviewEntry(citation) : undefined;
    if (citation.kind === "private-profile" || !citation.url) {
      entry = {
        key: "private",
        refs: [ref],
        kind: "private",
        external: false,
        title: { ...citation.label },
        route: { en: "", zh: "" },
        badge: { ...BADGE_PRIVATE },
      };
    } else if (overview) {
      const external = overview.href?.startsWith("https://") ?? false;
      entry = { key: `${external ? "github" : "site"}:${overview.href}`, refs: [ref], kind: external ? "github" : "site", external, ...overview };
    } else if (PORTFOLIO_SITE_SOURCE.test(citation.sourceId)) {
      const mapped = siteEntry(citation.sourceId, citation.anchor);
      entry = {
        key: `site:${mapped.href}`,
        refs: [ref],
        kind: "site",
        external: false,
        ...mapped,
      };
    } else {
      const mapped = githubEntry(citation);
      entry = {
        key: `github:${mapped.href}`,
        refs: [ref],
        kind: "github",
        external: true,
        badge: { ...BADGE_GITHUB },
        ...mapped,
      };
    }
    const existing = byKey.get(entry.key);
    if (existing) {
      existing.refs.push(ref);
      return;
    }
    byKey.set(entry.key, entry);
    entries.push(entry);
  });
  return entries;
}

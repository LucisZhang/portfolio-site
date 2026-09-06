// Task R9c (B5-c) [CLAUDE]: destination-mapping layer for answer references.
// Owner ruling: the reference block at the end of an answer is a navigation
// index that guides the reader somewhere worth going — technically deep
// GitHub repo files, or this site's own project pages. Never: portfolio-site
// repo file links, raw knowledge-base entry names, or config-file references.
//
// Mapping rules (each entry derives from an actual retrieved citation):
// - external project repo chunk  -> keep the pinned GitHub line-range link,
//   labeled by repo + what the reader will find there (no path dumps);
// - portfolio-site internal chunk (site-config.ts, projects.ts, README...)
//   -> the relevant PROJECT PAGE route on this site, derived from the route
//   key embedded in the chunk id ("portfolio-site:<routeKey>:<path>:Lx-Ly");
//   an unrecognized route key collapses into the home page-level destination
//   rather than surfacing a raw internal ref;
// - private profile chunk -> label only (existing rule, unchanged).
import type { AssistantCitation } from "@/lib/assistant-policy";
import { resolveProjectIdentity } from "./project-identities";

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
const BADGE_SITE = { en: "PROJECT ENTRY", zh: "项目入口" } as const;
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

function zhCitationLabel(project: string, descriptor: string) {
  return /[。！？]$/u.test(project)
    ? `查看“${project}”：${descriptor}`
    : `查看${project}：${descriptor}`;
}

function siteEntry(sourceId: string): Pick<CitationIndexEntry, "href" | "title" | "route"> {
  const routeKey = PORTFOLIO_SITE_SOURCE.exec(sourceId)?.[1] ?? "home";
  if (routeKey !== "home") {
    const separator = routeKey.indexOf("-");
    const track = separator > 0 ? routeKey.slice(0, separator) : "";
    const slug = separator > 0 ? routeKey.slice(separator + 1) : "";
    if (track && slug) {
      const project = resolveProjectIdentity(`/${track}/${slug}`);
      if (project) {
        const href = project.href;
        return {
          href,
          title: {
            en: `Explore ${project.label.en}`,
            zh: `查看「${project.label.zh}」`,
          },
          route: { en: `${href} · project page`, zh: `${href} · 项目页` },
        };
      }
    }
  }
  // Home chunks, and anything that maps to nothing recruiter-worthy,
  // collapse into the page-level destination.
  return HOME_ENTRY;
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

/**
 * Maps retrieved citations to index entries, in citation order. Citations
 * that resolve to the same destination merge into one entry carrying every
 * citation number, so a run of portfolio-site internals never repeats the
 * same project page.
 */
export function buildCitationIndex(citations: readonly AssistantCitation[]): CitationIndexEntry[] {
  const entries: CitationIndexEntry[] = [];
  const byKey = new Map<string, CitationIndexEntry>();
  citations.forEach((citation, index) => {
    const ref = index + 1;
    let entry: CitationIndexEntry;
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
    } else if (PORTFOLIO_SITE_SOURCE.test(citation.sourceId)) {
      const mapped = siteEntry(citation.sourceId);
      entry = {
        key: `site:${mapped.href}`,
        refs: [ref],
        kind: "site",
        external: false,
        badge: { ...BADGE_SITE },
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

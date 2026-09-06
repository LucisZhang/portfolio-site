import { artifactPaths, artifactProjects } from "./artifact-catalog.generated.mjs";
import { artifactLocale, singleArtifactParam } from "./artifact-locale.mjs";
import type { Locale, LocalizedString } from "./i18n";

export type ArtifactKind = "image" | "pdf" | "json" | "csv" | "markdown" | "mermaid" | "text";
type ArtifactQuery = Pick<URLSearchParams, "getAll">;
const kinds: Record<string, ArtifactKind> = {
  png: "image", jpg: "image", jpeg: "image", svg: "image", pdf: "pdf", json: "json",
  csv: "csv", md: "markdown", mmd: "mermaid", txt: "text",
};
const paths = new Set<string>(artifactPaths);
const identities: Record<string, { title: LocalizedString; route: string }> = artifactProjects;
const aliases: Record<string, string> = {
  "/engineering/p1-reliability-lab": "/engineering/exactly-once-drills",
  "/analytics/credit-policy-lab": "/analytics/credit-policy-desk",
  "/ai/privacy-preflight-mac": "/ai/privacy-preflight",
  "/analytics/analytics-tandem": "/#archive",
  "/ai": "/#systems", "/engineering": "/#systems", "/analytics": "/#archive",
};

export function isArtifactPath(href: string) {
  return safeArtifactPath(href) !== null;
}

export function safeArtifactPath(source: string) {
  // URLSearchParams already decoded the outer query once. Never decode again or
  // let URL normalization erase traversal, encoded separators, or control bytes.
  if (/[\u0000-\u0020\u007f\\%]/u.test(source)) return null;
  const pathname = source.split(/[?#]/, 1)[0];
  return paths.has(pathname) ? pathname : null;
}

function returnTarget(requested: string | undefined, projectRoute: string) {
  if (!requested || /[\u0000-\u0020\u007f\\%]/u.test(requested)) return projectRoute;
  const [pathname] = requested.split(/[?#]/, 1);
  if (!/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)?)?\/?$/.test(pathname)) return projectRoute;
  const route = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
  if (route === "/") {
    const hash = new URL(requested, "https://portfolio.local").hash;
    return hash === "#archive" || hash === "#systems" ? `/${hash}` : "/";
  }
  const canonical = aliases[route] ?? route;
  // A caller may return home or to this artifact's project, never to a different
  // project, viewer, API endpoint, or off-site location. Query/hash decorations
  // are discarded; only the known archive/systems redirects retain an anchor.
  return canonical === "/" || canonical === projectRoute || canonical === "/#archive" && route === "/analytics"
    || canonical === "/#systems" ? canonical : projectRoute;
}

export function resolveArtifactContext(query: ArtifactQuery, fallbackLocale: Locale = "en") {
  const requested = singleArtifactParam(query, "src");
  const source = requested ? safeArtifactPath(requested) : null;
  const directory = source?.split("/")[2];
  const project = directory && identities[directory] ? { slug: directory, ...identities[directory] } : null;
  const locale = artifactLocale(query, fallbackLocale);
  const from = project ? returnTarget(singleArtifactParam(query, "from"), project.route) : "/";
  const extension = source?.split(".").pop()?.toLowerCase() ?? "";
  const canonical = new URLSearchParams();
  if (source) canonical.set("src", source);
  if (project) canonical.set("from", from);
  canonical.set("lang", locale);
  return {
    source, project, locale, from, extension,
    name: source?.split("/").pop() ?? "",
    kind: source ? kinds[extension] : null,
    canonicalHref: `/artifact?${canonical.toString()}`,
  };
}

export type ArtifactContext = ReturnType<typeof resolveArtifactContext>;

export function artifactViewerHref(source: string, from?: string) {
  const query = new URLSearchParams({ src: source });
  if (from) query.set("from", from);
  const canonical = new URL(resolveArtifactContext(query).canonicalHref, "https://portfolio.local");
  // LocaleLink supplies the active language. Keep this builder usable in the
  // existing data generators, where URLs have no active browser language.
  canonical.searchParams.delete("lang");
  return `${canonical.pathname}${canonical.search}`;
}

export function artifactContentHref(href: string, source: string) {
  if (href.startsWith("#")) return href;
  if (/^https?:\/\//i.test(href)) return href;
  if (/^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith("//") || /[\u0000-\u0020\u007f\\%]/u.test(href)) return undefined;
  const resolved = new URL(href, `https://portfolio.local${source}`);
  const target = safeArtifactPath(resolved.pathname);
  return target ? artifactViewerHref(target) + resolved.hash : undefined;
}

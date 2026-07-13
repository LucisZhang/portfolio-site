const ARTIFACT_EXTENSION = /\.(?:png|jpe?g|svg|pdf|json|csv|md|mmd)$/i;

export function isArtifactPath(href: string) {
  if (!href.startsWith("/case-studies/")) return false;
  const pathname = href.split(/[?#]/, 1)[0];
  return ARTIFACT_EXTENSION.test(pathname);
}

export function artifactViewerHref(source: string, from?: string) {
  const query = new URLSearchParams({ src: source });
  if (from) query.set("from", from);
  return `/artifact?${query.toString()}`;
}

export function safeArtifactPath(source: string) {
  if (!isArtifactPath(source) || source.includes("..") || source.includes("\\")) return null;
  return source.split(/[?#]/, 1)[0];
}

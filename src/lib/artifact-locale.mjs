/** @param {Pick<URLSearchParams, "getAll">} query @param {string} key */
export function singleArtifactParam(query, key) {
  const values = query.getAll(key);
  return values.length === 1 ? values[0] : undefined;
}

// Explicit but malformed/ambiguous language inputs fail to English. A missing
// input inherits the active language; filenames and nested return URLs never do.
/** @param {Pick<URLSearchParams, "getAll">} query @param {"en" | "zh"} fallback */
export function artifactLocale(query, fallback) {
  if (!query.getAll("lang").length) return fallback;
  return singleArtifactParam(query, "lang") === "zh" ? "zh" : "en";
}

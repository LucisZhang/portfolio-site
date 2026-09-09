# Artifact viewer URL contract

`/artifact` is a statically generated shell. Its client boundary resolves the query
with `resolveArtifactContext` in `src/lib/artifacts.ts` before loading a file.

Example: `/artifact?src=%2Fcase-studies%2Fexactly-once-drills%2FREADME.md&from=%2Fengineering%2Fexactly-once-drills&lang=zh`.

- `src`: exactly one on-site path in `src/lib/artifact-catalog.generated.mjs`.
  The catalog contains tracked, regular files under `public/case-studies` with
  PNG, JPG/JPEG, SVG, PDF, JSON, CSV, Markdown (`.md`), Mermaid (`.mmd`), or plain
  text (`.txt`) extensions. A type is only loadable when an actual file is listed.
  The outer query may use normal percent encoding. Residual percent escapes,
  traversal, backslashes, control characters, unknown files, and URLs are rejected.
  Historical query/fragment decorations inside `src` are discarded before loading.
- `from`: optional owning project route or homepage. A missing, repeated, unsafe,
  or unrelated project target returns to the file's owning project. Old P1,
  Credit Policy Lab, and Privacy Mac route aliases resolve to their canonical
  project routes. Old discipline routes resolve to the known homepage section.
  Only homepage `#archive` and `#systems` fragments survive; project return
  fragments and nested query parameters are discarded. Archived Analytics Tandem
  files default to `/#archive`.
- `lang`: one exact `en` or `zh`. Missing language inherits the active language;
  malformed or repeated language defaults to English. Nested `from`/`src`
  language values cannot override it. Canonical viewer URLs retain an explicit
  language in both locales, including English when the stored preference is Chinese.

The viewer replaces its current history entry with the canonical URL. Invalid
sources show a localized unavailable state and a homepage return, with no artifact
request or download link. File changes remount loading, zoom, paging, search, and
section state. No project rail or remembered project context is mounted.

Project names and canonical routes are generated from the project catalog.
`artifact-provenance.ts` supplies presentation context bounded by the existing
evidence index, immutable claims, and package manifests. Original artifact files
and their evidence claims are unchanged.

Long documents (at least 1,200 characters or 40 lines) receive a section index
when at least two headings exist. Markdown uses rendered headings; plain text
and source views recognize ATX/setext headings and Mermaid heading comments.
Fenced code is excluded from heading extraction. Index links support keyboard
activation and focus their targets. Existing Markdown `heading-slug-N` fragments
remain available; duplicate and Chinese headings get deterministic unique IDs.
Short or unsectioned files have no empty index. Source views preserve literal
text and line endings; original downloads preserve the file bytes.

Markdown relative links resolve against their source file and can open catalog
artifacts. HTTP(S) links remain explicit external links. Embedded images must
resolve to catalog images; arbitrary images, HTML, and unsafe links are not loaded.
The existing CSP, strict Mermaid mode, PDF controls, JSON search, CSV search/sort,
image zoom, and original downloads remain in use. Artifact fetches reject redirects.

When adding an artifact, stage its intended public file, run
`npm run generate:artifacts`, and review the catalog diff. Build/dev checks reject
a stale catalog. `npm run verify:artifacts` checks all catalog entries, both
languages, adversarial queries, link resolution, and section/source invariants.
`tests/e2e/artifact-context.spec.ts` covers the viewer in desktop, tablet, and mobile
Chrome, and `tests/e2e/quality.spec.ts` retains its existing viewer/error regressions.

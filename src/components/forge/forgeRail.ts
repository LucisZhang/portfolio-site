import { navigationCopy, projectRailFooter, type RailSpec } from "@/lib/navigation";
import { getProject } from "@/lib/projects";

// Frontier Forge project-page rail (spec §2.1 "项目页" state, §6.0 template):
// serif vertical project name, an independent zh gloss line (project.glossZh
// — 17 characters, within spec §2.1's <=20-character rail-gloss budget),
// the page's own exhibit directory 01-07 (spec §6.1's table — the hero
// itself is not a numbered exhibit for project pages, unlike the
// homepage's "00 Hero" rail entry), and a single "<- ALL WORK" footer
// link. Points at "/" rather than the soon-to-be-killed "/ai" track index
// (spec §3: track pages die and 308 to home anchors in a later task) so
// this rail does not need to change again when that lands.
const frontierForge = getProject("ai", "frontier-forge");

// Task F2: the rail previously carried only `zh` here, so RailCopy (locale
// purity, task F5) rendered nothing on an English load — the rail's
// positioning line simply disappeared instead of showing an English
// equivalent. copy.en mirrors glossZh's meaning in plain factual voice,
// under RailCopy's own dozen-word budget.
export const forgeRail: RailSpec = {
  // Task W1: the reference demo's rail wordmark pairs a boxed "FF" mark
  // mono-glyph with the "Frontier / Forge" lines (output/design-align-r4/
  // FORGE-DIFF.md §1.7) — this reuses ExhibitShell's existing optional
  // `wordmark.mark` slot (already shipped for Home's "XGZ") rather than
  // touching ExhibitShell/RailSpy internals. The reference's bordered
  // box treatment around the mark was deferred at W1 pending the rail-v3
  // sensor/push-mode integration landing (RAIL-SCOPE.md) — that's this
  // task (W3): `markBoxed: true` opts into the bordered-mono-box CSS added
  // to exhibition.css, a page-scoped exception (every other page's `mark`
  // stays unboxed).
  wordmark: { lines: ["Frontier", "Forge"], mark: "FF", markBoxed: true },
  copy: frontierForge ? { en: "SFT fine-tuning, taken through to a running vLLM release.", zh: frontierForge.glossZh } : undefined,
  nav: [
    { id: "exhibit-01", num: "01", label: { en: "Recorded serving", zh: "历史推理评测" } },
    { id: "exhibit-02", num: "02", label: { en: "Evidence explorer", zh: "证据浏览器" } },
    { id: "exhibit-03", num: "03", label: { en: "Training ladder", zh: "训练阶梯" } },
    { id: "exhibit-04", num: "04", label: { en: "Serving boundary", zh: "服务边界" } },
    { id: "exhibit-05", num: "05", label: { en: "Overload replay", zh: "过载回放" } },
    { id: "exhibit-06", num: "06", label: { en: "Model boundary", zh: "模型边界" } },
    { id: "exhibit-07", num: "07", label: navigationCopy.sourceReceipts },
  ],
  footer: projectRailFooter,
  // The page presents archived evaluations and offline replay.
  stamp: { label: navigationCopy.recordedArtifact, tone: "offline" },
};

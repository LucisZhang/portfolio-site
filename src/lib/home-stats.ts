import homeStatsJson from "@/data/generated/home-stats.json";
import type { Locale } from "@/lib/i18n";

// Typed accessor for the Round-2 homepage data adapter output (task 1.1:
// scripts/generate-home-data.mjs -> src/data/generated/home-stats.json).
// Every homepage exhibit component reads its numbers through this module —
// never a literal — so the "zero hardcoded benchmark numbers in components"
// rule (task 1.2 brief) is mechanically true: change the adapter output,
// the page changes with it.

export interface HeroTile {
  value: string;
  label: string;
  source: string;
  jsonPath: string;
}

export interface FlagshipClaim {
  assert: string;
  value: string;
  n: number | string;
  ci: string;
  command: string;
  sha256: string;
}

export interface NegativeRun {
  conclusion: string;
  n: number | string;
  disposition: string;
  receiptHref: string;
}

export interface StackLayer {
  layer: string;
  projects: string[];
  metric: string;
}

export interface HomeStats {
  heroTiles: HeroTile[];
  flagshipClaims: FlagshipClaim[];
  negativeRuns: NegativeRun[];
  stackDepth: StackLayer[];
}

export const homeStats = homeStatsJson as HomeStats;

// Individual claim/negative-run fields the generator could not source from
// permitted public evidence are emitted as the literal string "MISSING"
// (task 1.1). Binding rule: render the row without that sub-element rather
// than printing the word "MISSING" on screen.
export function isMissing(value: unknown): value is "MISSING" {
  return value === "MISSING";
}

// Pulls the leading integer off a generated metric string (e.g. "10 failure
// classes drilled" -> 10) so a pure-CSS instrument can size itself off the
// adapter's own text instead of a second hardcoded copy of the same count.
export function leadingCount(metric: string): number {
  const match = metric.match(/^(\d+)/);
  return match ? Number(match[1]) : 0;
}

// Fix (audit3 zh de-anglicization, home items): src/data/generated/home-stats.json
// is generated evidence prose (scripts/generate-home-data.mjs), one locale
// only, sourced straight off release.json / manifest.json / exhibits.json —
// touching the generator or the JSON itself would mean hand-authoring
// Chinese into an auditable adapter output, which is exactly what task 1.1's
// "every number/claim through the adapter, never a literal" rule exists to
// prevent. Audit3's approved fix instead keys a display-only Chinese
// rendering off the exact English string the adapter already produced —
// same locale-keyed-pair convention as RailCopy/localize, just keyed by
// content instead of by field. Numbers and slugs stay embedded verbatim so
// leadingCount() and any live-data drift stay visible (an untranslated
// fragment falls back to English rather than silently going stale).
const STAT_TEXT_ZH: Record<string, string> = {
  "failure classes drilled": "已演练故障类别",
  "10 failure classes drilled": "10 个已演练故障类别",
  "0 snapshot diffs across 5 recovery drills": "0 次快照差异，覆盖 5 次恢复演练",
  "132 funded live graph runs": "132 次付费在线图运行",
  "GRPO +0.25 pp in both completed seeds; both CIs contain zero":
    "GRPO 在两个跑完的种子上都是 +0.25 pp；两次置信区间都包含零",
  "The unchanged ten-step reward-variance guard stopped R4 v2; no three-seed aggregate or missing paired delta is fabricated.":
    "同一套十步奖励方差守卫拦停了 R4 v2；三种子汇总没有硬凑，缺失的配对差值也没有补造。",
  "30 of 44 strict all-trials residuals": "44 个场景，30 个没过严格全试验口径",
  "Aggregate gates pass; 30/44 scenarios fail the strict all-trials outcome view. This is not a claim that all scenarios pass.":
    "聚合门禁均已通过；但按严格全试验口径，44 个场景仍有 30 个没过，不能说所有场景都通过。",
  "The Amazon null is scoped to this catalog, temporal split, five-core population, and observed history depths.":
    "Amazon 上「个性化在各个观测深度都未胜过热门榜」这一 null 结果，只适用于这份目录、这种时间切分、five-core 人群和已观测的历史深度。",
  "all original requests; uncovered two-pass rows count as failure; two-pass task success 100%":
    "以全部原始请求为分母；未覆盖的 two-pass 行一律记为失败；two-pass 任务成功率 100%",
  "One-pass structured output: 0% task success":
    "单次输出的结构化任务成功率：0%",
};

// Fix (task review, Important): the above map is a manually-maintained
// lookup keyed by content, not by field -- nothing forced every string
// actually rendered through localizeStatText() to have an entry, so a
// negativeRuns/heroTiles/stackDepth row could silently render untranslated
// English on the zh route (caught live: negativeRuns[4].conclusion, "One-
// pass structured output: 0% task success", had no entry). This module-load
// assertion is the drift guard: every long-enough (translate-worthy) string
// homeStatsJson actually carries for the fields localizeStatText() is
// called on must resolve to a real zh entry, not the English fallback.
// Deliberately excludes: single terms/short status words already ruled
// "keep English" by audit3 (below the LONG_ENOUGH_TO_REQUIRE_ZH threshold,
// same >=3-consecutive-Latin-word heuristic the audit's own extraction
// used) and the six audit3 keep-term phrases, which must NOT get a zh
// entry (translating them would violate the ruling) so they are
// allowlisted by exact string instead of by length.
const KEEP_ENGLISH_STAT_TEXT = new Set<string>([
  "task success",
  "measured spend",
  "upstream 5xx @ 3×",
  "distilled SFT −14.2 pp vs rule SFT",
  "Distilled SFT −14.2 pp vs rule SFT",
  "complete-negative",
  "Amazon arm: null",
  "0 upstream 5xx @ 3× · n=492",
  "GPTQ-int4 p95 0.963 s @ 4 QPS",
]);

function statTextRequiresTranslation(text: string): boolean {
  if (KEEP_ENGLISH_STAT_TEXT.has(text)) return false;
  const latinWordRun = text.match(/(?:[A-Za-z][A-Za-z'-]*[.,;:!?]?\s*){3,}/);
  return latinWordRun !== null;
}

function assertStatTextCoverage() {
  const candidates: string[] = [
    ...homeStats.heroTiles.map((tile) => tile.label),
    ...homeStats.negativeRuns.flatMap((run) => [run.conclusion, isMissing(run.disposition) ? "" : run.disposition]),
    ...homeStats.stackDepth.map((layer) => layer.metric),
  ];
  const missing = [...new Set(candidates)].filter((text) => text && statTextRequiresTranslation(text) && !(text in STAT_TEXT_ZH));
  if (missing.length > 0) {
    throw new Error(
      `localizeStatText: missing zh entry for ${missing.length} home-stats string(s) rendered through localizeStatText -- add to STAT_TEXT_ZH in src/lib/home-stats.ts:\n${missing.map((text) => `  - ${JSON.stringify(text)}`).join("\n")}`,
    );
  }
}

assertStatTextCoverage();

export function localizeStatText(text: string, locale: Locale): string {
  if (locale !== "zh") return text;
  return STAT_TEXT_ZH[text] ?? text;
}

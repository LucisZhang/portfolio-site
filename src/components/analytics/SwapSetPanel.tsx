import type { Locale } from "@/lib/i18n";

export interface SwapSetRow {
  application_id: string;
  calibrated_pd: number;
  challenger_pd: number;
  lgd: number;
  ead: number;
  observed_default?: boolean;
}

const amount = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0, signDisplay: "exceptZero" });

function observedRate(rows: SwapSetRow[]) {
  return rows.length ? rows.filter((row) => row.observed_default).length / rows.length : null;
}

export default function SwapSetPanel({ rows, approveThreshold, locale, sourceLabel, showObservedOutcomes = false }: { rows: SwapSetRow[]; approveThreshold: number; locale: Locale; sourceLabel: string; showObservedOutcomes?: boolean }) {
  const baselineApproved = rows.filter((row) => row.calibrated_pd <= approveThreshold);
  const challengerApproved = rows.filter((row) => row.challenger_pd <= approveThreshold);
  const challengerOnlyRows = rows.filter((row) => row.challenger_pd <= approveThreshold && row.calibrated_pd > approveThreshold);
  const baselineOnlyRows = rows.filter((row) => row.calibrated_pd <= approveThreshold && row.challenger_pd > approveThreshold);
  const challengerOnly = challengerOnlyRows.length;
  const baselineOnly = baselineOnlyRows.length;
  const baselineExpectedLoss = baselineApproved.reduce((sum, row) => sum + row.calibrated_pd * row.lgd * row.ead, 0);
  const challengerExpectedLoss = challengerApproved.reduce((sum, row) => sum + row.challenger_pd * row.lgd * row.ead, 0);
  const expectedLossDelta = challengerExpectedLoss - baselineExpectedLoss;

  const hasObservedOutcomes = showObservedOutcomes && rows.length > 0 && rows.every((row) => typeof row.observed_default === "boolean");
  const challengerOnlyRate = observedRate(challengerOnlyRows);
  const baselineOnlyRate = observedRate(baselineOnlyRows);
  const rateLabel = (rate: number | null, count: number) => rate === null ? (locale === "en" ? `Not estimable · n=${count}` : `不可估计 · n=${count}`) : `${(rate * 100).toFixed(2)}% · n=${count}`;

  return <section className="swap-set-panel" aria-labelledby="swap-set-title"><div className="analytics-pane-heading"><span id="swap-set-title">{locale === "en" ? "Baseline ↔ challenger swap set" : "基准模型 ↔ 挑战模型换入换出集"}</span><code>{sourceLabel}</code></div><div><article><span>{locale === "en" ? "Baseline approvals" : "基准模型批准数"}</span><strong>{baselineApproved.length}</strong></article><article><span>{locale === "en" ? "Challenger approvals" : "挑战模型批准数"}</span><strong>{challengerApproved.length}</strong></article><article><span>{locale === "en" ? "Challenger-only approvals" : "仅挑战模型批准"}</span><strong>{challengerOnly}</strong></article><article><span>{locale === "en" ? "Baseline-only approvals" : "仅基准模型批准"}</span><strong>{baselineOnly}</strong></article><article className={expectedLossDelta > 0 ? "negative" : "positive"}><span>{locale === "en" ? "Expected-loss delta" : "预期损失差值"}</span><strong>{amount.format(expectedLossDelta)}</strong></article></div>{hasObservedOutcomes ? <div className="swap-set-observed" data-testid="swap-set-observed-rates"><span>{locale === "en" ? "Observed default rates in the loaded outcome window" : "已载入结果窗口中的观察违约率"}</span><article><small>{locale === "en" ? "Challenger-only" : "仅挑战模型批准"}</small><strong>{rateLabel(challengerOnlyRate, challengerOnly)}</strong></article><article><small>{locale === "en" ? "Baseline-only" : "仅基准模型批准"}</small><strong>{rateLabel(baselineOnlyRate, baselineOnly)}</strong></article></div> : null}<p>{locale === "en" ? "Counts and expected loss are recomputed at the current approval threshold to make model-driven policy movement immediately visible." : "数量与预期损失按当前批准阈值重算，让模型带来的策略变化一目了然。"}</p></section>;
}

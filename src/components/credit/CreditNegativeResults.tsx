"use client";

import { Finding } from "@/components/exhibition/Finding";
import { useI18n } from "@/lib/i18n";
import { DISCLOSED_LGD_ASSUMPTION, backtestReport } from "./creditData";

function pct(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

function noLeadingZero(value: number, digits: number) {
  return value.toFixed(digits).replace(/^(-?)0\./, "$1.");
}

// Exhibit 03: the honesty exhibit -- spec's "03 negative/limitation
// honesty" ("challenger beats baseline by noise-level margins" framing,
// LGD 45% assumption disclosed). Every number is read from
// backtest-report.json; nothing here is re-typed as a literal. This is
// the same comparison src/lib/projects.ts's credit-policy-desk `fieldNotes`
// entry already states in prose (unchanged, rendered again verbatim in
// this page's Results & negatives report-layer section) -- this exhibit
// derives its own copy independently from the report so the two never
// silently drift out of sync with each other.
export function CreditNegativeResults() {
  const { locale } = useI18n();
  const baseline = backtestReport.models.baseline_isotonic;
  const challenger = backtestReport.models.challenger_isotonic;
  const brierWinner = challenger.brier < baseline.brier ? "challenger" : "baseline";
  const logLossWinner = challenger.log_loss < baseline.log_loss ? "challenger" : "baseline";
  const aucWinner = challenger.roc_auc > baseline.roc_auc ? "challenger" : "baseline";
  const wins = [brierWinner, logLossWinner, aucWinner].filter((winner) => winner === "challenger").length;

  return (
    <section id="exhibit-03" className="exhibit credit-negative" data-exhibit="03" data-bg="white" aria-labelledby="exhibit-03-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">03</span>
        <span className="exhibit-eyebrow">BASELINE ISOTONIC / CHALLENGER ISOTONIC / {backtestReport.splits.backtest.toLocaleString()} BACKTEST ROWS</span>
      </p>
      <h2 id="exhibit-03-title" className="exhibit-title">
        {locale === "en" ? (
          <>The challenger <em>doesn&rsquo;t win.</em></>
        ) : (
          <>挑战者，<em>并没有赢。</em></>
        )}
      </h2>

      <div className="credit-table-scroll">
        <table className="credit-compare-table" data-testid="credit-model-compare">
          <thead>
            <tr>
              <th>{locale === "en" ? "Metric" : "指标"}</th>
              <th>{locale === "en" ? "Baseline (isotonic logistic)" : "基线（保序校准逻辑回归）"}</th>
              <th>{locale === "en" ? "Challenger (isotonic XGBoost)" : "挑战者（保序校准 XGBoost）"}</th>
              <th>{locale === "en" ? "Wins" : "更优"}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Brier</td>
              <td>{noLeadingZero(baseline.brier, 6)}</td>
              <td>{noLeadingZero(challenger.brier, 6)}</td>
              <td data-winner={brierWinner}>{brierWinner === "challenger" ? (locale === "en" ? "challenger" : "挑战者") : (locale === "en" ? "baseline" : "基线")}</td>
            </tr>
            <tr>
              <td>{locale === "en" ? "Log loss" : "对数损失"}</td>
              <td>{noLeadingZero(baseline.log_loss, 6)}</td>
              <td>{noLeadingZero(challenger.log_loss, 6)}</td>
              <td data-winner={logLossWinner}>{logLossWinner === "challenger" ? (locale === "en" ? "challenger" : "挑战者") : (locale === "en" ? "baseline" : "基线")}</td>
            </tr>
            <tr>
              <td>ROC AUC</td>
              <td>{noLeadingZero(baseline.roc_auc, 6)}</td>
              <td>{noLeadingZero(challenger.roc_auc, 6)}</td>
              <td data-winner={aucWinner}>{aucWinner === "challenger" ? (locale === "en" ? "challenger" : "挑战者") : (locale === "en" ? "baseline" : "基线")}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Finding kind="negative">
        {locale === "en"
          ? `The 240-tree XGBoost challenger was expected to pull away from the calibrated logistic baseline on the ${backtestReport.splits.backtest.toLocaleString()} later-backtest rows. It didn't: the challenger wins ${wins} of 3 metrics, and every gap is far too small to act on — Brier ${noLeadingZero(baseline.brier, 6)} vs ${noLeadingZero(challenger.brier, 6)}, log loss ${noLeadingZero(baseline.log_loss, 6)} vs ${noLeadingZero(challenger.log_loss, 6)}, ROC AUC ${noLeadingZero(baseline.roc_auc, 6)} vs ${noLeadingZero(challenger.roc_auc, 6)}. The model race shifts the third decimal; it is not a basis for choosing between them.`
          : `本以为那个 240 棵树的 XGBoost 挑战者模型，会在 ${backtestReport.splits.backtest.toLocaleString()} 条后期回测记录上把校准过的逻辑回归基线甩开。并没有：挑战者在三项指标中赢了 ${wins} 项，且每一项的差距都小到不足以据此做任何决定——Brier ${noLeadingZero(baseline.brier, 6)} 对 ${noLeadingZero(challenger.brier, 6)}，对数损失 ${noLeadingZero(baseline.log_loss, 6)} 对 ${noLeadingZero(challenger.log_loss, 6)}，ROC AUC ${noLeadingZero(baseline.roc_auc, 6)} 对 ${noLeadingZero(challenger.roc_auc, 6)}。模型之争只挪动了小数点后第三位，不足以作为二选一的依据。`}
      </Finding>

      <Finding kind="limitation">
        {locale === "en"
          ? `Expected loss on this page assumes a flat ${pct(DISCLOSED_LGD_ASSUMPTION, 0)} loss-given-default for every approved loan — a disclosed simplification, not a modeled LGD. The backtest default rate itself (${pct(backtestReport.backtest_default_rate)}) describes ${backtestReport.boundaries.toLocaleLowerCase()}`
          : `本页的预期损失，对每一笔已批准贷款都假设了固定 ${pct(DISCLOSED_LGD_ASSUMPTION, 0)} 违约损失率（LGD）——这是明确披露的简化处理，不是模型给出的 LGD。回测违约率本身（${pct(backtestReport.backtest_default_rate)}）所描述的，是一个仅含已授信贷款的离线历史关联，不含被拒申请人，也不构成生产、因果、监管或公平性声明。`}
      </Finding>
    </section>
  );
}

export default CreditNegativeResults;

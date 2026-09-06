"use client";

import { useI18n } from "@/lib/i18n";
import ScrollRegion from "@/components/ScrollRegion";
import { zhGroup, zhWrapDisplay } from "@/lib/zh-wrap";
import { DISCLOSED_LGD_ASSUMPTION, policyContract, policyFrontierReport } from "./creditData";

function pct(value: number, digits = 0) {
  return `${(value * 100).toFixed(digits)}%`;
}

// Exhibit 02: the decision boundary (approve / review / decline, and the
// expected-loss formula each band is judged against) plus the same three
// reference thresholds exhibit 01 plots, now read as a decision table --
// spec §6.7's "02 decision-boundary/expected-loss & threshold content",
// restyled from the pre-rebuild interactive workbench's genuinely
// load-bearing policy rules (public/case-studies/credit-policy-desk/
// policy-contract.json, the same contract src/components/analytics/
// CreditPolicyLab.tsx applied at runtime) rather than a new invention.
export function CreditDecisionBoundary() {
  const { locale } = useI18n();
  const overall = policyFrontierReport.approve_everyone_default_rate_preview;
  const rows: Array<{ key: string; label: string; point: { approval_rate: number; default_rate: number } }> = [
    { key: "pd15", label: "pd ≤ .15", point: policyFrontierReport.reference_points.pd_15 },
    { key: "pd20", label: "pd ≤ .20", point: policyFrontierReport.reference_points.pd_20 },
    { key: "pd30", label: "pd ≤ .30", point: policyFrontierReport.reference_points.pd_30 },
  ];

  return (
    <section id="exhibit-02" className="exhibit credit-boundary" data-exhibit="02" data-bg="paper-alt" aria-labelledby="exhibit-02-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">02</span>
        <span className="exhibit-eyebrow">POLICY-CONTRACT-V{policyContract.schema_version} / {policyContract.policy.decision_order.map((step) => step.replaceAll("_", " ").toUpperCase()).join(" → ")}</span>
      </p>
      <h2 id="exhibit-02-title" className="exhibit-title">
        {locale === "en" ? (
          <>One threshold decides<br /><em>who gets a loan.</em></>
        ) : (
          zhWrapDisplay(<>一道阈值，<br /><em>{zhGroup("决定谁能", "拿到贷款。")}</em></>)
        )}
      </h2>
      <p className="exhibit-intro">
        {locale === "en" ? (
          <>Every scored application falls into exactly one of three bands — approve, manual review, or decline — by comparing its calibrated PD against two published thresholds. Approved exposure is judged on expected loss (<code>{policyContract.policy.expected_loss}</code>), where LGD is a disclosed {pct(DISCLOSED_LGD_ASSUMPTION)} assumption, not a modeled output.</>
        ) : (
          <>每一笔已评分申请，都会通过将其校准 PD 与两个已发布阈值比较，落入批准、人工复核、拒绝三个区间之一。已批准敞口按预期损失<span className="zh-inline-atomic" data-zh-raw>（<code>{policyContract.policy.expected_loss}</code>）</span>评判，其中 LGD 为明确披露的 {pct(DISCLOSED_LGD_ASSUMPTION)} 假设，并非模型输出。</>
        )}
      </p>

      <div className="credit-bands">
        <div className="credit-band" data-band="approve">
          <span className="credit-band-label">{locale === "en" ? "Approve" : "批准"}</span>
          <code>{policyContract.policy.approve_when}</code>
        </div>
        <div className="credit-band" data-band="review">
          <span className="credit-band-label">{locale === "en" ? "Manual review" : "人工复核"}</span>
          <code>{policyContract.policy.review_when}</code>
        </div>
        <div className="credit-band" data-band="decline">
          <span className="credit-band-label">{locale === "en" ? "Decline" : "拒绝"}</span>
          <code>{policyContract.policy.decline_when}</code>
        </div>
      </div>

      <div className="credit-threshold-table">
        <h3 className="credit-threshold-title">{locale === "en" ? "Same 624 backtest rows, three approve-thresholds" : "同样的 624 条回测记录，三个不同的批准阈值"}</h3>
        <ScrollRegion className="credit-table-scroll" label={{ en: "Approve-threshold comparison table", zh: "批准阈值对比表" }}>
          <table className="credit-threshold-table-inner">
            <thead>
              <tr>
                <th>{locale === "en" ? "Approve when" : "批准条件"}</th>
                <th>{locale === "en" ? "Share approved" : "批准比例"}</th>
                <th>{locale === "en" ? "Default rate" : "违约率"}</th>
                <th>{locale === "en" ? "vs. approve everyone" : "相对全部批准"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} data-active={row.key === "pd20" ? "true" : undefined}>
                  <td><code>{row.label}</code></td>
                  <td>{pct(row.point.approval_rate, 1)}</td>
                  <td>{pct(row.point.default_rate, 1)}</td>
                  <td>{(row.point.default_rate / overall).toFixed(2)}×</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
        <p className="credit-threshold-note">
          {locale === "en"
            ? "Tightening the approve threshold trades approval share for a lower default rate among the applications that remain — the frontier in exhibit 01 is this exact same trade, drawn continuously instead of at three points."
            : "收紧批准阈值，是用批准比例去换剩余申请更低的违约率——展品 01 的前沿曲线正是同一笔交易的连续版本，只是这里只取了三个点。"}
        </p>
      </div>
    </section>
  );
}

export default CreditDecisionBoundary;

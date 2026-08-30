"use client";

import { useI18n, type Locale } from "@/lib/i18n";
import knownFailuresJson from "../../../public/case-studies/triage-router/known-failures.json";

type KnownFailure = {
  attribution: string;
  complaintId: number;
  confidence: number;
  narrative: string;
  predicted: string;
  route: string[];
  truth: string;
};

const failures = (knownFailuresJson as { failures: KnownFailure[] }).failures;

// Fix (audit3 zh de-anglicization, triage(12)): `attribution` is a fixed
// English sentence baked into the generated known-failures.json fixture
// (task 3.0's deterministic sample). Same reasoning as home-stats.ts's
// localizeStatText -- rather than hand-editing generated evidence data,
// render a locale-aware sentence from the same fields the fixture already
// carries. English stays the untouched literal (byte-identical to the old
// always-English render); Chinese rebuilds the sentence naturally around
// the tier/slug labels, which stay in English as data per audit3 (e.g.
// tier_b2, deposit_account are recorded routing/label identifiers, not
// prose to translate).
function attributionTier(attribution: string): string {
  return attribution.split(" routed this complaint")[0];
}

function formatAttribution(failure: KnownFailure, locale: Locale): string {
  if (locale === "en") return failure.attribution;
  const tier = attributionTier(failure.attribution);
  return `${tier} 把这条投诉路由到了 ${failure.predicted}，置信度 ${failure.confidence.toFixed(3)}；实际记录的标签是 ${failure.truth}。`;
}

// Exhibit 02: 8 real misroutes (task 3.0's deterministic sample from the
// recorded a_to_b route), server-rendered as a plain <table> so it is part
// of the no-JS static markup for exhibits 01-04 (spec section 6.0's
// template rule).
export function KnownFailures() {
  const { locale } = useI18n();
  return (
    <section id="exhibit-02" className="exhibit" data-exhibit="02" data-bg="paper-alt" aria-labelledby="exhibit-02-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">02</span>
        <span className="exhibit-eyebrow">RECORDED MISROUTES / A_TO_B</span>
      </p>
      <h2 id="exhibit-02-title" className="exhibit-title">
        {locale === "en" ? (
          <>Eight real complaints,<br /><em>the cascade sent the wrong way.</em></>
        ) : (
          <>八条真实工单，<em>级联把它们送错了地方。</em></>
        )}
      </h2>
      <div className="exhibit-body">
        {/* Task F1: the route chain can run to 5-6 hops joined by " → " in
            a <code> cell -- unwrappable mono text was forcing the table
            (and the whole page) past the viewport on mobile. Wrapped in
            the forge-claim-table-scroll pattern (overflow-x: auto on the
            wrapper, a floor min-width on the table) so narrow viewports
            scroll the table horizontally instead of blowing out the page.
            Task F7: at mobile widths this desktop table is replaced (via
            CSS display toggle, see triage.css's "aligned two-column
            ledger" block) by the .triage-pairs markup below -- a real
            horizontal-scroll table is no longer an acceptable mobile
            pattern under direction B, so this wrapper is display:none
            under 768px instead of being asked to scroll. */}
        <div className="triage-table-scroll">
          <table className="triage-known-failures-table" data-known-failures>
            <thead>
              <tr>
                <th>{locale === "en" ? "Complaint" : "工单"}</th>
                <th>{locale === "en" ? "Route" : "路径"}</th>
                <th>{locale === "en" ? "Predicted" : "预测"}</th>
                <th>{locale === "en" ? "Truth" : "实际"}</th>
                <th>{locale === "en" ? "Confidence" : "置信度"}</th>
              </tr>
            </thead>
            <tbody>
              {failures.map((failure) => (
                <tr key={failure.complaintId} data-failure-row>
                  <td>{failure.complaintId}</td>
                  <td><code>{failure.route.join(" → ")}</code></td>
                  <td>{failure.predicted}</td>
                  <td>{failure.truth}</td>
                  <td>{failure.confidence.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Task F7 (direction B, approved mock output/design-align/
            direction-mobile-table-b.html): mobile-only aligned two-column
            ledger. Predicted/truth are the two values every reader
            actually compares, so they stay columnar; complaint id,
            confidence, and the route chain (the unwrappable culprit above)
            are demoted to a quiet meta line per entry. Renders from the
            same `failures` array as the desktop table -- toggled purely by
            CSS media query (see triage.css), never by JS, so it is present
            in the no-JS static markup exactly like the table above. */}
        <div className="triage-pairs" role="table" aria-label={locale === "en" ? "Predicted label vs. recorded truth, per complaint" : "各工单的预测标签与实际标签"} data-known-failures-pairs>
          <div className="triage-pairs-head" role="row">
            <span role="columnheader">{locale === "en" ? "Predicted" : "预测"}</span>
            <span role="columnheader">{locale === "en" ? "Truth" : "实际"}</span>
          </div>
          {failures.map((failure) => (
            <div className="triage-pair-entry" key={failure.complaintId} data-pair-row>
              <p className="triage-pair-meta">
                <b>{failure.complaintId}</b>
                {" "}
                {locale === "en" ? "conf" : "置信度"} {failure.confidence.toFixed(3)}
                {" · "}
                <code>{failure.route.join(" → ")}</code>
              </p>
              <div className="triage-pair-values" role="row">
                <span role="cell" className="triage-pair-read">{failure.predicted}</span>
                <span role="cell" className="triage-pair-truth">{failure.truth}</span>
              </div>
            </div>
          ))}
        </div>
        <ul className="triage-known-failures-attribution">
          {failures.map((failure) => (
            <li key={failure.complaintId}>{formatAttribution(failure, locale)}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default KnownFailures;

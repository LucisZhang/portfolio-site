"use client";

import { Exhibit } from "@/components/exhibition/Exhibit";
import { useI18n } from "@/lib/i18n";
import { homeStats, isMissing, localizeStatText } from "@/lib/home-stats";

export default function NegativeRunsExhibit() {
  const { locale } = useI18n();

  return (
    <Exhibit
      id="exhibit-04"
      num="04"
      eyebrow={locale === "en" ? "5 RUNS THAT DID NOT WORK" : "5 次没有跑通的实验"}
      bg="ink"
      title={
        locale === "en" ? (
          <>Five runs.<br /><em>All of them stayed on the page.</em></>
        ) : (
          <>五次没跑成的实验，<em>一次也没从页面上删掉。</em></>
        )
      }
    >
      <div className="home-negative-table" role="table">
        <div className="home-negative-head" role="row">
          <span role="columnheader">Conclusion</span>
          <span role="columnheader">n</span>
          <span role="columnheader">Disposition</span>
          <span role="columnheader">Receipt</span>
        </div>
        {homeStats.negativeRuns.map((run) => (
          <div className="home-negative-row" role="row" key={run.conclusion}>
            <span role="cell" className="home-negative-conclusion">{localizeStatText(run.conclusion, locale)}</span>
            <span role="cell" className="home-negative-n">{!isMissing(run.n) ? run.n : null}</span>
            <span role="cell" className="home-negative-disposition">{!isMissing(run.disposition) ? localizeStatText(run.disposition, locale) : null}</span>
            <span role="cell" className="home-negative-receipt">
              <a href={run.receiptHref} target="_blank" rel="noreferrer noopener">RECEIPT</a>
            </span>
          </div>
        ))}
      </div>
    </Exhibit>
  );
}

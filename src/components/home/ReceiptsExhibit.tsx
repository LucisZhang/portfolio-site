"use client";

import { Exhibit } from "@/components/exhibition/Exhibit";
import { useI18n } from "@/lib/i18n";
import { homeReceipts } from "@/lib/home-receipts";
import { siteIdentity } from "@/lib/site-config";
import AskPortfolioInline from "./AskPortfolioInline";

export default function ReceiptsExhibit() {
  const { locale } = useI18n();

  return (
    <Exhibit
      id="exhibit-06"
      num="06"
      eyebrow={locale === "en" ? "HOW THIS SITE IS BUILT AND CHECKED" : "这个站是怎么搭、怎么核对的"}
      bg="ink"
      title={
        locale === "en" ? (
          <>Every claim on this site<br /><em>opens the same way this one does.</em></>
        ) : (
          <>这个站上的每个说法，<em>都能这样点开看它的来处。</em></>
        )
      }
    >
      {/* Direct dt/dd children (no wrapper div): .home-receipts-dl puts
          the <dl> itself in a 2-column grid, so dt/dd must be its direct
          children for grid auto-placement to alternate them into the
          label/value columns row by row — a div-per-row would instead
          place whole dt+dd pairs into alternating columns. */}
      <dl className="home-receipts-dl">
        <dt>release.json</dt>
        <dd><code>sha256:{homeReceipts.releaseJson.sha256}</code></dd>
        <dt>EOD manifest</dt>
        <dd><code>sha256:{homeReceipts.eodManifest.sha256}</code></dd>
        <dt>Privacy manifest</dt>
        <dd><code>sha256:{homeReceipts.privacyManifest.sha256}</code></dd>
        <dt>Build date</dt>
        <dd>{homeReceipts.buildDate}</dd>
        <dt>Gate status</dt>
        <dd>{homeReceipts.gateStatus}</dd>
      </dl>
      <AskPortfolioInline variant="compact" />
      <div className="home-receipts-contact">
        <a href={siteIdentity.profiles.github} target="_blank" rel="noreferrer noopener">GitHub</a>
        {/* No resume link: the approved PDFs are owner-private and absent
            from the public repository (see siteIdentity.resume). The row is
            a flex container with `gap`, so dropping the third link leaves no
            stray separator or trailing space. */}
        <a href={`mailto:${siteIdentity.profiles.email}`}>{locale === "en" ? "Email" : "邮箱"}</a>
      </div>
      <p className="home-receipts-updated">
        {locale === "en" ? "Last updated" : "最近更新"} {homeReceipts.buildDate}
      </p>
    </Exhibit>
  );
}

"use client";

import { Exhibit } from "@/components/exhibition/Exhibit";
import { Finding } from "@/components/exhibition/Finding";
import LocaleLink from "@/components/LocaleLink";
import { localize, useI18n } from "@/lib/i18n";
import { homeStats, isMissing } from "@/lib/home-stats";
import type { Project } from "@/lib/projects";
import { zhGroup } from "@/lib/zh-wrap";

// Claim-chain expansion uses a native <details>/<summary> per claim (task
// 1.2 brief: "prefer <details> — zero JS"), so the SHA-256 receipt is in
// the initial HTML and needs no client script to reveal.
function ClaimRow({ claim }: { claim: (typeof homeStats.flagshipClaims)[number] }) {
  return (
    <details className="home-claim-row">
      <summary>
        <span className="home-claim-assert">{claim.assert}</span>
        <span className="home-claim-value">{claim.value}</span>
      </summary>
      <dl className="home-claim-detail">
        {!isMissing(claim.n) || !isMissing(claim.ci) ? (
          <div>
            <dt>n · CI</dt>
            <dd>
              {!isMissing(claim.n) ? claim.n : null}
              {!isMissing(claim.n) && !isMissing(claim.ci) ? " · " : null}
              {!isMissing(claim.ci) ? claim.ci : null}
            </dd>
          </div>
        ) : null}
        {!isMissing(claim.command) ? (
          <div>
            <dt>Command</dt>
            <dd><code>{claim.command}</code></dd>
          </div>
        ) : null}
        <div>
          <dt>SHA-256</dt>
          <dd><code>sha256:{claim.sha256}</code></dd>
        </div>
      </dl>
    </details>
  );
}

export default function FlagshipExhibit({ project: flagship }: {
  project?: Pick<Project, "slug" | "track" | "summary">;
}) {
  const { locale } = useI18n();
  if (!flagship) return null;
  const negative = homeStats.negativeRuns[0];

  return (
    <Exhibit
      id="exhibit-01"
      num="01"
      eyebrow="QWEN3.5-4B · RTX 4090 · $35.68 MEASURED · SHA-256 GATED"
      bg="ink"
      title={
        locale === "en" ? (
          <>I don&apos;t just cite the number.<br /><em>I open the command that made it.</em></>
        ) : (
          <>{zhGroup("页面上的数字", "都能点开——")}<br /><em>{zhGroup("点开就是", "生成它的命令。")}</em></>
        )
      }
    >
      <div className="home-flagship-grid">
        <div className="home-flagship-copy">
          <p>{localize(flagship.summary, locale)}</p>
          {negative ? (
            <Finding kind="negative">
              {negative.conclusion}
              {!isMissing(negative.disposition) ? ` — ${negative.disposition}` : null}
            </Finding>
          ) : null}
          <LocaleLink className="home-cta" href={`/projects/${flagship.slug}`}>
            {locale === "en" ? "OPEN THE RELEASE CONSOLE →" : "打开发布控制台 →"}
          </LocaleLink>
        </div>
        <div className="home-claim-chain" aria-label="Claim chain">
          {homeStats.flagshipClaims.map((claim) => (
            <ClaimRow claim={claim} key={claim.assert} />
          ))}
        </div>
      </div>
    </Exhibit>
  );
}

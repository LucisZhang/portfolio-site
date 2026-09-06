"use client";

import { EvidenceDisclosure } from "@/components/exhibition/EvidenceDisclosure";
import { EvidenceFileLink } from "@/components/exhibition/EvidenceFileLink";

import { Exhibit } from "@/components/exhibition/Exhibit";
import { useI18n } from "@/lib/i18n";
import { homeReceipts } from "@/lib/home-receipts";
import { siteIdentity } from "@/lib/site-config";
import ContactIcon from "@/components/ContactIcon";
import AskPortfolioInline from "./AskPortfolioInline";
import { zhGroup } from "@/lib/zh-wrap";

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
          <>{zhGroup("这个站上的", "每个说法，")}<br /><em>{zhGroup("都能这样点开", "看它的来处。")}</em></>
        )
      }
    >
      <EvidenceDisclosure project="home">
      <dl className="home-receipts-dl">
        <dt><EvidenceFileLink source={homeReceipts.releaseJson.source}>release.json</EvidenceFileLink></dt>
        <dd><code>sha256:{homeReceipts.releaseJson.sha256}</code></dd>
        <dt><EvidenceFileLink source={homeReceipts.eodManifest.source}>{locale === "en" ? "EOD manifest" : "EOD 清单"}</EvidenceFileLink></dt>
        <dd><code>sha256:{homeReceipts.eodManifest.sha256}</code></dd>
        <dt><EvidenceFileLink source={homeReceipts.privacyManifest.source}>{locale === "en" ? "Privacy manifest" : "隐私预检清单"}</EvidenceFileLink></dt>
        <dd><code>sha256:{homeReceipts.privacyManifest.sha256}</code></dd>
        <dt>{locale === "en" ? "Build date" : "构建日期"}</dt>
        <dd>{homeReceipts.buildDate}</dd>
        <dt>{locale === "en" ? "Gate status" : "检查状态"}</dt>
        <dd>{homeReceipts.gateStatus}</dd>
      </dl>
      </EvidenceDisclosure>
      <AskPortfolioInline variant="compact" />
      <div className="home-receipts-contact">
        <a href={siteIdentity.profiles.github} target="_blank" rel="noreferrer noopener"><ContactIcon kind="github" /><span>GitHub</span></a>
        <a href={`mailto:${siteIdentity.profiles.email}`}><ContactIcon kind="email" /><span>{locale === "en" ? "Email" : "邮箱"}</span></a>
      </div>
      <p className="home-receipts-updated">
        {locale === "en" ? "Last updated" : "最近更新"} {homeReceipts.buildDate}
      </p>
    </Exhibit>
  );
}

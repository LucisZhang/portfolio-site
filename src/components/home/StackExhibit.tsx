"use client";

import { Exhibit } from "@/components/exhibition/Exhibit";
import { localize, useI18n } from "@/lib/i18n";
import { homeStats, leadingCount, localizeStatText } from "@/lib/home-stats";
import { tracks } from "@/lib/projects";

const engineeringTrack = tracks.find((track) => track.id === "engineering");

export default function StackExhibit() {
  const { locale } = useI18n();
  const streamLayer = homeStats.stackDepth.find((layer) => layer.layer === "Stream");
  // The ten-cell checkerboard's cell count comes from the Stream layer's own
  // generated metric string ("10 failure classes drilled") rather than a
  // second literal "10" — see lib/home-stats.ts#leadingCount.
  const faultCellCount = streamLayer ? leadingCount(streamLayer.metric) : 0;

  return (
    <Exhibit
      id="exhibit-03"
      num="03"
      eyebrow="C++20 / GO / KAFKA · FLINK / K3S / POSTGRES"
      bg="white"
      title={
        locale === "en" ? (
          <>The agents sit on a stack.<br /><em>The stack has its own receipts.</em></>
        ) : (
          <>Agent 之下是一整套系统，<em>系统自己的账也对得上。</em></>
        )
      }
      intro={engineeringTrack ? localize(engineeringTrack.thesis, locale) : undefined}
    >
      <div className="home-stack-grid">
        {homeStats.stackDepth.map((layer) => (
          <div className="home-stack-layer" key={layer.layer}>
            <p className="home-stack-layer-name">{layer.layer}</p>
            <p className="home-stack-layer-projects">{layer.projects.join(" · ")}</p>
            <p className="home-stack-layer-metric">{localizeStatText(layer.metric, locale)}</p>
          </div>
        ))}
      </div>
      {faultCellCount > 0 ? (
        <div
          className="home-eod-grid"
          role="img"
          aria-label={locale === "en"
            ? `${faultCellCount} exactly-once fault classes, all reconciled with zero diffs`
            : `${faultCellCount} 类精确一次故障，全部对账，零差异`}
        >
          {Array.from({ length: faultCellCount }, (_, index) => (
            <span className="home-eod-cell" key={index}>{String(index + 1).padStart(2, "0")}</span>
          ))}
        </div>
      ) : null}
    </Exhibit>
  );
}

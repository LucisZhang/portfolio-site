"use client";

import { useI18n } from "@/lib/i18n";

/* Static solar-system mark: the sun and three planets stand for Lucis plus the
   portfolio's three disciplines. */
function SolarSystem() {
  return (
    <>
      <span className="lo-sun" />
      <span className="lo-orbit lo-o1" />
      <span className="lo-orbit lo-o2" />
      <span className="lo-orbit lo-o3" />
      <span className="lo-planet lo-p1"><i /></span>
      <span className="lo-planet lo-p2"><i /></span>
      <span className="lo-planet lo-p3"><i /></span>
    </>
  );
}

export default function LucisOrbit() {
  const { locale } = useI18n();
  return (
    <div
      className="lucis-orbit"
      data-testid="lucis-orbit"
      aria-label={locale === "en" ? "Lucis symbol: a small solar system whose three planets stand for AI applications, data engineering, and data analytics" : "Lucis 标记：一个小太阳系，三颗行星分别代表 AI 应用、数据工程与数据分析"}
      role="img"
    >
      <span className="lucis-orbit-emblem" aria-hidden="true"><SolarSystem /></span>
      <span className="lucis-orbit-wordmark" aria-hidden="true">Lucis</span>
    </div>
  );
}

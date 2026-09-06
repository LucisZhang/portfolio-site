"use client";

import PhoneContact from "@/components/PhoneContact";
import WeChatContact from "@/components/WeChatContact";
import ContactIcon from "@/components/ContactIcon";
import { useI18n } from "@/lib/i18n";
import { homeStats, localizeStatText } from "@/lib/home-stats";
import { siteIdentity } from "@/lib/site-config";
import { zhVerse, zhWrapText } from "@/lib/zh-wrap";

export type HeroVariant = "a" | "b" | "c";

// Design authority spec §4 row 00 + task 1.2 brief: three assertion
// candidates for the user's G4 hero comparison, switched by `?hero=`
// (parsed server-side in src/app/page.tsx so the variant is correct even
// without JavaScript). The approved Chinese headline stays fixed across
// those English-only comparison variants.
// Task D05 lineation: two clauses; when a narrow column folds the second,
// it breaks before the verb phrase and before the final verb (zhVerse).
// Rendered text is identical to the sentence these parts concatenate to.
const HERO_ZH_LINES: (string | string[])[] = ["我把整条链路做通，", ["也把它", "会在哪里失效", "讲清楚。"]];

const HERO_VARIANTS: Record<HeroVariant, { en: [string, string] }> = {
  a: {
    en: ["I build the whole path.", "Then show where it breaks."],
  },
  b: {
    en: ["I don't cite benchmarks.", "I pay for them."],
  },
  c: {
    en: ["Agents that act.", "Systems that answer for them."],
  },
};

export default function Hero({ variant }: { variant: HeroVariant }) {
  const { locale } = useI18n();
  const { en } = HERO_VARIANTS[variant];

  return (
    <section id="contact" className="exhibit home-hero" data-exhibit="00" data-bg="paper" aria-labelledby="hero-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">00</span>
        <span className="exhibit-eyebrow">AI AGENTS / LLM APPLICATIONS / MEASURED SYSTEMS</span>
      </p>
      {/* Entrance hairline (task F3): draws in via pure CSS on load —
          globals.css keyframes, <=600ms total, reduced-motion shows the
          settled state instantly. No GSAP on this page (Ruling R8). */}
      <span className="home-hero-hairline" aria-hidden="true" data-hero-hairline />
      {/* lang="en" pins the self-hosted Latin display serif even when the
          site-wide locale toggle sets html[lang="zh-CN"] (globals.css
          switches :lang(zh) h1 to the CJK serif stack, which spec §2.3
          explicitly rules out for this line — the asymmetry is deliberate:
          this title stays English in both locales, while the zh narrative
          paragraph below it is displayed only in zh locale, per task F5's
          locale-purity rule). */}
      <h1 id="hero-title" lang="en" className="exhibit-title home-hero-title">
        <span className="home-hero-line" data-hero-line="0">{en[0]}</span>
        <br />
        <em>
          <span className="home-hero-line" data-hero-line="1">{en[1]}</span>
        </em>
      </h1>
      {/* The stable server node is excluded from English layout and the
          accessibility tree. The parser-time locale bootstrap reveals it
          before the first Chinese paint, so hydration keeps the same tree.
          D05's authored phrase groups preserve the intended poetic turns. */}
      <p className="home-hero-narrative home-hero-zh" lang="zh">
        {zhVerse(HERO_ZH_LINES)}
      </p>
      <div className="exhibit-body home-hero-body">
        <div className="exhibit-stat-grid">
          {homeStats.heroTiles.map((tile) => (
            <div className="exhibit-stat-cell" key={`${tile.label}-${tile.value}`}>
              <strong className="exhibit-stat-value">{tile.value}</strong>
              <span className="exhibit-stat-label home-locale-en">{zhWrapText(tile.label)}</span>
              <span className="exhibit-stat-label home-locale-zh" lang="zh">{zhWrapText(localizeStatText(tile.label, "zh"))}</span>
            </div>
          ))}
        </div>
        <p className="target-roles home-hero-scope">
          <span className="home-locale-en">{siteIdentity.directionLine.en}</span>
          <span className="home-locale-zh" lang="zh">{zhWrapText(siteIdentity.directionLine.zh)}</span>
        </p>
        <div className="home-hero-contact" aria-label={locale === "en" ? "Contact and profiles" : "联系方式与主页"}>
          {/* Task D-01: each control is icon + text label. The label is the
              accessible name (icons are aria-hidden); see ContactIcon.tsx. */}
          <a href={siteIdentity.profiles.github} target="_blank" rel="noreferrer noopener"><ContactIcon kind="github" /><span>GitHub</span></a>
          <a className="home-locale-en" href={siteIdentity.profiles.linkedin} target="_blank" rel="noreferrer noopener"><ContactIcon kind="linkedin" /><span>LinkedIn</span></a>
          <a href={`mailto:${siteIdentity.profiles.email}`}><ContactIcon kind="email" /><span className="home-locale-en">Email</span><span className="home-locale-zh" lang="zh">邮箱</span></a>
          <PhoneContact />
          <WeChatContact />
        </div>
      </div>
    </section>
  );
}

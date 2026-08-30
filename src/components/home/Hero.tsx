"use client";

import { StatGrid } from "@/components/exhibition/StatGrid";
import PhoneContact from "@/components/PhoneContact";
import WeChatContact from "@/components/WeChatContact";
import { localize, useI18n } from "@/lib/i18n";
import { homeStats, localizeStatText } from "@/lib/home-stats";
import { siteIdentity } from "@/lib/site-config";

export type HeroVariant = "a" | "b" | "c";

// Design authority spec §4 row 00 + task 1.2 brief: three assertion
// candidates for the user's G4 hero comparison, switched by `?hero=`
// (parsed server-side in src/app/page.tsx so the variant is correct even
// without JavaScript). The Chinese narrative underneath is an independent
// draft, pending G4 finalization — not a translation of the English line
// (spec §2.3): each zh line uses its own structure and rhetorical stance
// (why/how the person works, not a sentence-parallel rendering of the en
// assertion) and is meant to read as something a Chinese engineer would
// say about themselves, not a rendering of the English copy next to it.
const HERO_VARIANTS: Record<HeroVariant, { en: [string, string]; zh: string }> = {
  a: {
    en: ["I build the whole path.", "Then show where it breaks."],
    // G4 draft: independent stance (an honesty commitment when things
    // break), not a rendering of "build the path / show where it breaks."
    zh: "训练、上线、跑挂了再修——这条链路我一个人从头走到尾，出问题也不含糊。",
  },
  b: {
    en: ["I don't cite benchmarks.", "I pay for them."],
    // G4 draft: leads with skepticism toward others' numbers, not a
    // parallel "don't cite / pay for" structure.
    zh: "别人跑出来的分数我不太信，宁可自己掏钱、在真机器上跑一遍。",
  },
  c: {
    en: ["Agents that act.", "Systems that answer for them."],
    // G4 draft: a contrast-and-commitment stance ("not X, the hard part is
    // Y"), not the English's two parallel noun phrases.
    zh: "会自己动手的 Agent 不难做，难的是出岔子有人兜得住——这条线我没让它空着。",
  },
};

export default function Hero({ variant }: { variant: HeroVariant }) {
  const { locale } = useI18n();
  const { en, zh } = HERO_VARIANTS[variant];

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
          paragraph below it only renders in zh locale, per task F5's
          locale-purity rule). */}
      <h1 id="hero-title" lang="en" className="exhibit-title home-hero-title">
        <span className="home-hero-line" data-hero-line="0">{en[0]}</span>
        <br />
        <em>
          <span className="home-hero-line" data-hero-line="1">{en[1]}</span>
        </em>
      </h1>
      {/* Locale purity (task F5, user's binding rule): the zh narrative
          line is an independent draft, not a translation of the English
          title above, so it renders only in zh locale — the en locale
          shows the English assertion (h1) and nothing else here. */}
      {locale === "zh" ? <p className="home-hero-zh" lang="zh">{zh}</p> : null}
      <div className="exhibit-body home-hero-body">
        <StatGrid
          items={homeStats.heroTiles.map((tile) => ({ value: tile.value, label: localizeStatText(tile.label, locale) }))}
        />
        <p className="target-roles home-hero-scope">{localize(siteIdentity.directionLine, locale)}</p>
        <div className="home-hero-contact" aria-label={locale === "en" ? "Contact and profiles" : "联系方式与主页"}>
          <a href={siteIdentity.profiles.github} target="_blank" rel="noreferrer noopener">GitHub</a>
          {locale === "en" ? (
            <a href={siteIdentity.profiles.linkedin} target="_blank" rel="noreferrer noopener">LinkedIn</a>
          ) : null}
          <a href={`mailto:${siteIdentity.profiles.email}`}>{locale === "en" ? "Email" : "邮箱"}</a>
          <PhoneContact />
          <WeChatContact />
        </div>
      </div>
    </section>
  );
}

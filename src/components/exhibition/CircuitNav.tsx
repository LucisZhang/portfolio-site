"use client";

import { usePathname } from "next/navigation";
import LocaleLink from "@/components/LocaleLink";
import { useI18n } from "@/lib/i18n";
import { siteIdentity } from "@/lib/site-config";
import { circuitEntryForPath, circuitGroups, circuitStops, type CircuitStop } from "@/lib/site-circuit";
import { zhWrapText } from "@/lib/zh-wrap";

// Task R9a (checklist A3, directions b+c): the circuit chain (quiet
// prev/next + home crumb at page top, fuller on-ink block at page bottom)
// and the colophon site index that closes every standalone project page.
// Approved mocks: output/r3-align/mocks/a3-b-circuit-chain.html and
// a3-c-colophon-index.html; ordering/grouping live in src/lib/site-circuit.ts.
//
// ExhibitShell stays a server component (frozen interface, spec §2.1):
// like RailCopy/RailSpy, this is a client island the shell mounts
// unconditionally. It keys off usePathname() and renders null on every
// non-circuit route (home, /artifact, dev fixture), so no page wrapper had
// to grow a prop and no concurrently-owned route file is touched.
//
// Locale purity (design-grammar ruling): every mono UI-fabric label here
// (crumb, PREV/TRACK/HOME keys, CONTINUE THE CIRCUIT, INDEX OF WORK,
// group handles, THIS PAGE, "n of N") stays English in both locales;
// the only localized copy is the per-project one-liner, whose zh side is
// the project's existing glossZh, phrase-wrapped via zh-wrap like other
// display-adjacent zh text. Vermilion appears exactly once per surface:
// the current page's colophon entry (plus the mock's accent-toned NEXT
// kicker / INDEX OF WORK labels, which the approved mocks carry).

function trackLinkLabel(label: string) {
  // Mock copy: "All AI projects →" — sentence case for the word handles.
  return `All ${label === "AI" ? label : label.toLowerCase()} projects →`;
}

function StopBlurb({ stop }: { stop: CircuitStop }) {
  const { locale } = useI18n();
  if (locale === "zh") {
    return (
      <span lang="zh" className="circuit-blurb">
        {zhWrapText(stop.blurb.zh)}
      </span>
    );
  }
  return <span className="circuit-blurb">{stop.blurb.en}</span>;
}

export default function CircuitNav({ slot }: { slot: "top" | "bottom" }) {
  const pathname = usePathname();
  const { locale } = useI18n();
  const entry = circuitEntryForPath(pathname);
  if (!entry) return null;
  const { stop, prev, next } = entry;

  if (slot === "top") {
    return (
      <nav className="circuit-top" data-circuit-top aria-label={locale === "zh" ? "项目环线" : "Project circuit"}>
        <div className="circuit-crumb">
          <LocaleLink href="/" data-circuit-home>
            XGZ
          </LocaleLink>
          <span className="circuit-sep" aria-hidden="true">
            /
          </span>
          <LocaleLink href={stop.group.homeAnchor}>{stop.group.label}</LocaleLink>
          <span className="circuit-sep" aria-hidden="true">
            /
          </span>
          <span className="circuit-cur" aria-current="page">
            {stop.project.title.en}
          </span>
        </div>
        <div className="circuit-steps">
          <LocaleLink href={prev.href} data-circuit-prev rel="prev">
            ← {prev.project.title.en}
          </LocaleLink>
          <span className="circuit-pos">{`${stop.group.label} · ${stop.indexInGroup} of ${stop.group.members.length}`}</span>
          <LocaleLink href={next.href} data-circuit-next rel="next">
            {next.project.title.en} →
          </LocaleLink>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="circuit-bottom" data-circuit-bottom aria-label={locale === "zh" ? "继续环线" : "Continue the circuit"}>
        <p className="circuit-bottom-label">CONTINUE THE CIRCUIT</p>
        <div className="circuit-next-block">
          <p className="circuit-next-kicker">{`NEXT — ${next.group.label} · ${next.indexInGroup} of ${next.group.members.length}`}</p>
          <LocaleLink className="circuit-next-title" href={next.href} data-circuit-next rel="next">
            {next.project.title.en}
          </LocaleLink>
          <p className="circuit-next-desc">
            <StopBlurb stop={next} />
          </p>
        </div>
        <div className="circuit-prevrow">
          <span>
            <span className="circuit-k">PREV</span>
            <LocaleLink href={prev.href} data-circuit-prev rel="prev">
              {prev.project.title.en}
            </LocaleLink>
          </span>
          <span>
            <span className="circuit-k">TRACK</span>
            <LocaleLink href={stop.group.homeAnchor}>{trackLinkLabel(stop.group.label)}</LocaleLink>
          </span>
          <span>
            <span className="circuit-k">HOME</span>
            <LocaleLink href="/">All work →</LocaleLink>
          </span>
        </div>
      </nav>
      <footer className="circuit-colophon" data-colophon aria-label={locale === "zh" ? "作品索引" : "Index of work"}>
        <p className="circuit-colophon-label">INDEX OF WORK</p>
        <div className="circuit-colophon-grid">
          {circuitGroups.map((group) => (
            <div key={group.id}>
              <p className="circuit-colophon-track">{`${group.label} — ${group.members.length}`}</p>
              <ul className="circuit-colophon-list">
                {circuitStops
                  .filter((candidate) => candidate.group.id === group.id)
                  .map((candidate) => {
                    const isHere = candidate.slug === stop.slug;
                    return (
                      <li
                        key={candidate.slug}
                        className={isHere ? "here" : undefined}
                        data-colophon-item={candidate.slug}
                        data-colophon-current={isHere ? "true" : undefined}
                      >
                        <span className="circuit-colophon-num">{candidate.number}</span>
                        <LocaleLink href={candidate.href} aria-current={isHere ? "page" : undefined}>
                          {candidate.project.title.en}
                        </LocaleLink>
                        {isHere ? <span className="circuit-colophon-tag">THIS PAGE</span> : null}
                        <span className="circuit-colophon-desc">
                          <StopBlurb stop={candidate} />
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
        <div className="circuit-colophon-foot">
          <LocaleLink href="/" data-circuit-home>
            ← HOME
          </LocaleLink>
          {/* No RESUME entry: the approved resume PDFs are owner-private and
              are served only from the deployment host (see
              siteIdentity.resume), so the public build has nothing to link.
              This row is a flex container with `gap`, so dropping the entry
              leaves no stray separator or trailing space. */}
          <a href={`mailto:${siteIdentity.profiles.email}`}>CONTACT XIANGGUO</a>
        </div>
      </footer>
    </>
  );
}

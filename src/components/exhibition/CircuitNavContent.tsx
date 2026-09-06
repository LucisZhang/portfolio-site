"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import LocaleLink from "@/components/LocaleLink";
import { useI18n } from "@/lib/i18n";
import { siteIdentity } from "@/lib/site-config";
import {
  circuitEntryForPath,
  circuitGroupIndexLabel,
  circuitGroups,
  circuitIndexAnchor,
  circuitPosition,
  circuitStops,
  type CircuitGroup,
  type CircuitStop,
} from "@/lib/site-circuit";
import { navigationCopy, navigationNumber } from "@/lib/navigation";
import { zhWrapText } from "@/lib/zh-wrap";

// Ordering and group destinations live in site-circuit; navigation vocabulary
// and numbering are shared with the rails. Static project routes can supply
// a bilingual repository entry beside the breadcrumb without changing the
// client-resolved circuit order.
//
// Task D06: the crumb's family segment and the bottom TRACK row are
// same-document fragment links into this page's own index of work
// (#index-<family id>).
//
// The link is a bare <a href="#...">, deliberately not LocaleLink or
// next/link: a hash-only href leaves the pathname and the ?lang= query
// untouched for free, and the browser's own fragment navigation -- not
// router.push -- is what sets :target and scrolls. The jump therefore works
// with JavaScript disabled, which the suite exercises in a scripting-off
// context (tests/e2e/circuit-index-groups.spec.ts).
//
// With JavaScript on, the link adds one focus-only enhancement and nothing
// else: no preventDefault, no routing, no scrolling of its own. Engines
// differ on whether a fragment jump moves real focus to a focusable target
// -- Chromium focuses the tabindex="-1" landing container, WebKit leaves
// focus on the document -- so the handler below first focuses the landing
// group to restore the scroll even when the hash is already current, then
// transfers focus (without another scroll) to that group's first project
// link. This avoids WebKit's tabindex="-1" sequential-focus dead end and
// leaves every keyboard user on an immediately operable target.
//
// The visible link text is the bare family label; the destination is
// stated in a visually hidden span so the accessible name STARTS with the
// visible text (WCAG 2.5.3 label-in-name).

const COLOPHON_HEADING_ID = "index-of-work";

function GroupJumpLink({
  group,
  slot,
  children,
}: {
  group: CircuitGroup;
  slot: "crumb" | "track";
  children: ReactNode;
}) {
  const anchor = circuitIndexAnchor(group.id);
  return (
    <a
      href={`#${anchor}`}
      data-circuit-group-link={slot}
      data-circuit-group={group.id}
      onClick={() => {
        // Deferred to the next task so the browser's own fragment
        // navigation (URL, :target, scroll) has already run -- WebKit
        // clears focus as part of it, so focusing before would be undone.
        // The blur/refocus pair is what makes a second activation of an
        // already-current link scroll the family back into view: focusing
        // an element that is already focused is a no-op.
        window.setTimeout(() => {
          const landing = document.getElementById(anchor);
          if (!landing) return;
          if (document.activeElement === landing) landing.blur();
          landing.focus();
          landing.querySelector<HTMLAnchorElement>(".circuit-colophon-list a")?.focus({ preventScroll: true });
        }, 0);
      }}
    >
      {children}
    </a>
  );
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

export default function CircuitNav({ slot, repositoryEntry }: { slot: "top" | "bottom"; repositoryEntry?: ReactNode }) {
  const pathname = usePathname();
  const { locale } = useI18n();
  const entry = circuitEntryForPath(pathname);
  if (!entry) return slot === "top" ? repositoryEntry ?? null : null;
  const { stop, prev, next } = entry;

  if (slot === "top") {
    return (
      <nav className="circuit-top" data-circuit-top aria-label={navigationCopy.projectCircuit[locale]}>
        <div className="circuit-crumb">
          <LocaleLink href="/" data-circuit-home aria-label={navigationCopy.home[locale]}>
            XGZ
          </LocaleLink>
          <span className="circuit-sep" aria-hidden="true">
            /
          </span>
          <GroupJumpLink group={stop.group} slot="crumb">
            {stop.group.label[locale]}
            <span className="sr-only">{` ${navigationCopy.groupIndexJump[locale]}`}</span>
          </GroupJumpLink>
          <span className="circuit-sep" aria-hidden="true">
            /
          </span>
          <span className="circuit-cur" aria-current="page">
            {stop.project.title[locale]}
          </span>
        </div>
        {repositoryEntry}
        <div className="circuit-steps">
          <LocaleLink href={prev.href} data-circuit-prev rel="prev">
            ← {prev.project.title[locale]}
          </LocaleLink>
          <span className="circuit-pos">{circuitPosition(stop, locale)}</span>
          <LocaleLink href={next.href} data-circuit-next rel="next">
            {next.project.title[locale]} →
          </LocaleLink>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="circuit-bottom" data-circuit-bottom aria-label={navigationCopy.continueCircuit[locale]}>
        <p className="circuit-bottom-label">{navigationCopy.continueCircuit[locale]}</p>
        <div className="circuit-next-block">
          <p className="circuit-next-kicker">{`${navigationCopy.next[locale]} — ${circuitPosition(next, locale)}`}</p>
          <LocaleLink className="circuit-next-title" href={next.href} data-circuit-next rel="next">
            {next.project.title[locale]}
          </LocaleLink>
          <p className="circuit-next-desc">
            <StopBlurb stop={next} />
          </p>
        </div>
        <div className="circuit-prevrow">
          <span>
            <span className="circuit-k">{navigationCopy.previous[locale]}</span>
            <LocaleLink href={prev.href} data-circuit-prev rel="prev">
              {prev.project.title[locale]}
            </LocaleLink>
          </span>
          <span>
            <span className="circuit-k">{navigationCopy.track[locale]}</span>
            <GroupJumpLink group={stop.group} slot="track">
              {circuitGroupIndexLabel(stop.group, locale)}
            </GroupJumpLink>
          </span>
          <span>
            <span className="circuit-k">{navigationCopy.home[locale]}</span>
            <LocaleLink href="/">{navigationCopy.allWork[locale]} →</LocaleLink>
          </span>
        </div>
      </nav>
      {/* The index is a real heading outline: h2 for the index itself
          (project pages put every section heading at h2 under the project's
          h1) and h3 per family, so heading navigation reaches a family
          directly instead of reading through the whole footer. The classes
          carry the visual; exhibition.css resets the UA heading margins and
          weights so the rendering is the same mono strip. */}
      <footer className="circuit-colophon" data-colophon aria-labelledby={COLOPHON_HEADING_ID}>
        <h2 className="circuit-colophon-label" id={COLOPHON_HEADING_ID}>{navigationCopy.indexOfWork[locale]}</h2>
        <div className="circuit-colophon-grid">
          {circuitGroups.map((group) => {
            const anchor = circuitIndexAnchor(group.id);
            const headingId = `${anchor}-label`;
            return (
              // A named group, not a landmark: a named sectioning element
              // per family would add three `region` landmarks to every
              // project page and bury the page's real landmarks under a
              // footer index. role="group" keeps the family
              // programmatically bounded and named without entering the
              // landmark rotor. tabindex="-1" makes the family a real
              // fragment/focus landing point; the click enhancement then
              // transfers focus to its first project link because WebKit
              // does not continue sequential focus from such a container.
              <div
                key={group.id}
                id={anchor}
                tabIndex={-1}
                role="group"
                className="circuit-colophon-group"
                data-colophon-group={group.id}
                data-colophon-group-current={group.id === stop.group.id ? "true" : undefined}
                aria-labelledby={headingId}
              >
                <h3 className="circuit-colophon-track" id={headingId}>{`${group.label[locale]} — ${navigationNumber(group.members.length)}`}</h3>
                <p className="circuit-colophon-gloss">
                  {locale === "zh" ? <span lang="zh">{zhWrapText(group.gloss.zh)}</span> : group.gloss.en}
                </p>
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
                            {candidate.project.title[locale]}
                          </LocaleLink>
                          {isHere ? <span className="circuit-colophon-tag">{navigationCopy.thisPage[locale]}</span> : null}
                          <span className="circuit-colophon-desc">
                            <StopBlurb stop={candidate} />
                          </span>
                        </li>
                      );
                    })}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="circuit-colophon-foot">
          <LocaleLink href="/" data-circuit-home>
            ← {navigationCopy.home[locale]}
          </LocaleLink>
          <a href={`mailto:${siteIdentity.profiles.email}`}>{navigationCopy.contact[locale]}</a>
        </div>
      </footer>
    </>
  );
}

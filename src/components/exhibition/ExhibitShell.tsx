import type { CSSProperties, ReactNode } from "react";
import RailCopy from "./RailCopy";
import RailSpy from "./RailSpy";
import RailAuto from "./RailAuto";
import CircuitNav from "./CircuitNav";
import "./exhibition.css";

// Frozen interface (Round-2 spec §2.1): every page passes its own rail spec
// as a prop into this server component. Rail markup is rendered exactly
// once per page and never lives inside RootLayout, so the shell itself
// never becomes a client boundary — RailSpy/RailAuto/RailCopy/CircuitNav
// are the only "use client" files in this directory.
export type RailSpec = {
  wordmark: {
    lines: [string, string];
    mark?: string;
    // Task W3 (RAIL-SCOPE.md §FORGE-DIFF 1.7): the reference demo's rail
    // wordmark shows the mark glyph in a bordered mono box. User-endorsed
    // reference element, but only Forge opts in (page-scoped exception,
    // see forgeRail.ts) — every other page's `mark` keeps rendering as
    // plain unboxed text, unaffected by this flag's existence.
    markBoxed?: boolean;
  };
  copy?: { en?: string; zh?: string };
  nav: { id: string; num: string; label: string }[];
  footer: { label: string; href: string }[];
  // Task W3: optional bottom-of-rail status slot, ported from the same
  // FORGE-DIFF reference ("绿点 + offline artifact"). RailSpec-driven and
  // opt-in — undefined on every rail except Forge's, which supplies
  // "RECORDED ARTIFACT" / tone "offline" (see forgeRail.ts for why —
  // ground truth is LiveSlot.tsx's own declared live-layer state, not the
  // reference screenshot). The slot takes a caller-supplied label/tone
  // rather than hardcoding either the reference's copy or a fixed tone,
  // so a page's own actual state always wins. The reference's dot glyph
  // is dropped: this codebase's box-grammar ruling (task F8) is "hue x
  // line-weight x label word carry all semantics", zero icons — tone is
  // carried by color on the label
  // text alone.
  stamp?: { label: string; tone: "live" | "offline" };
};

// Nav ids are normally in-page exhibit anchors ("exhibit-00"), but task 0.5's
// temporary legacy re-shelling needs the rail nav to link across real routes
// while every page is still its own top-level document. An id that starts
// with "/" is treated as a route and linked verbatim instead of being
// turned into a same-page fragment; single-page exhibit ids are untouched.
function railNavHref(id: string) {
  return id.startsWith("/") ? id : `#${id}`;
}

// `cascade` threads the auto-rail's per-row reveal-stagger delay (task W3
// choreography spec: nav rows start 96ms after the panel launches, 18ms
// apart) as a CSS custom property rather than hardcoded nth-child rules,
// so the cascade generalizes to any nav length (Forge's rail carries 7
// items, others carry 5-7) instead of only the prototype's fixed 5.
// Undefined/no-op in fixed mode — the property is simply never read.
function RailNavList({ nav, cascade }: { nav: RailSpec["nav"]; cascade?: boolean }) {
  return (
    <ol className="exhibit-rail-nav">
      {nav.map((item, index) => (
        <li
          key={item.id}
          style={cascade ? ({ "--rail-cascade-delay": `${96 + index * 18}ms` } as CSSProperties) : undefined}
        >
          <a href={railNavHref(item.id)}>
            <span className="exhibit-rail-num">{item.num}</span>
            <span className="exhibit-rail-label">{item.label}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

function RailFooterList({ footer, cascadeDelay }: { footer: RailSpec["footer"]; cascadeDelay?: string }) {
  return (
    <div className="exhibit-rail-footer" style={cascadeDelay ? ({ "--rail-cascade-delay": cascadeDelay } as CSSProperties) : undefined}>
      {footer.map((item) => (
        <a key={item.href} href={item.href}>
          {item.label}
        </a>
      ))}
    </div>
  );
}

function RailStamp({ stamp }: { stamp: NonNullable<RailSpec["stamp"]> }) {
  return (
    <div className="exhibit-rail-stamp" data-tone={stamp.tone}>
      {stamp.label}
    </div>
  );
}

export function ExhibitShell({
  rail,
  railTools,
  mode = "fixed",
  children,
}: {
  rail: RailSpec;
  // Optional single-mount slot for interactive utilities re-homed out of the
  // deleted site-header/footer (task 0.5): command palette trigger, language
  // switcher, contact jump-link. Rendered exactly once — unlike the nav/
  // footer lists above, which intentionally render twice for the desktop/
  // mobile split — because these islands own global listeners (e.g.
  // CommandPaletteLauncher's window ⌘K handler) that must not double-fire.
  railTools?: ReactNode;
  // Task W3 (auto-rail v3, RAIL-SCOPE.md): "fixed" (default) is the
  // untouched pre-existing behavior — the sidebar is always visible,
  // nothing here renders, nothing new in exhibition.css matches. "auto"
  // is the entry-open/push/off-rail-intent-retract mechanic (see
  // RailAuto.tsx) — desktop/tablet (>=980px) only; below that breakpoint
  // this prop has no visible effect and the mobile sticky-bar/<details>
  // index is unchanged either way. Callers that never pass this prop
  // (every legacy-re-shelled route, the dev fixture) keep exactly the
  // behavior they had before this task.
  mode?: "fixed" | "auto";
  children: ReactNode;
}) {
  const total = String(rail.nav.length).padStart(2, "0");
  const firstNum = rail.nav[0]?.num ?? "00";
  const isAuto = mode === "auto";
  // Cascade stagger (task W3 choreography table): wordmark leads at 60ms,
  // nav rows follow 96ms + 18ms/row (computed per-row in RailNavList), the
  // footer trails one stagger step after the last nav row — generalizing
  // the prototype's fixed "200ms" (which only ever had to trail a 5-row
  // list) to any nav length.
  const footerCascadeDelay = isAuto ? `${96 + rail.nav.length * 18}ms` : undefined;

  return (
    <div className="exhibit-shell" data-rail-mode={mode}>
      {isAuto ? (
        <>
          {/* Collapsed-state discoverability affordance (task W3 §choreography):
              a quiet hairline + a rotated mono "INDEX · n/total" tab, both
              purely decorative (pointer-events: none — hit-testing is the
              separate hot zone below). Hidden above the collapsed state via
              exhibition.css; hidden outright under 980px so they never sit
              over the unrelated mobile sticky bar. */}
          <div className="exhibit-rail-affordance" aria-hidden="true" />
          <div className="exhibit-rail-tab" aria-hidden="true">
            {`INDEX · ${firstNum}/${total}`}
          </div>
          {/* 24px left-edge hot zone: the actual reveal trigger. Separate
              from the decorative affordance above so hit-testing never
              depends on the hairline's visual width. */}
          <div className="exhibit-rail-hotzone" data-rail-hotzone aria-hidden="true" />
        </>
      ) : null}
      {/* Exactly one of these renders per page (Playwright asserts
          [data-exhibition-rail] has count 1). The fixed sidebar and the
          mobile sticky bar both live in this single <nav>; only CSS decides
          which is visible at a given viewport, so no JavaScript or
          server-side device detection is needed to pick the right one. */}
      <nav className="exhibit-rail" data-exhibition-rail aria-label="Exhibition index">
        <div className="exhibit-rail-fixed">
          <div className="exhibit-rail-wordmark">
            {rail.wordmark.mark ? (
              <span className="exhibit-rail-mark" data-boxed={rail.wordmark.markBoxed ? "true" : undefined}>
                {rail.wordmark.mark}
              </span>
            ) : null}
            <span className="exhibit-rail-lines">
              <span>{rail.wordmark.lines[0]}</span>
              <span>{rail.wordmark.lines[1]}</span>
            </span>
          </div>
          {rail.copy ? (
            <div className="exhibit-rail-copy">
              <RailCopy copy={rail.copy} />
            </div>
          ) : null}
          <RailNavList nav={rail.nav} cascade={isAuto} />
          <RailFooterList footer={rail.footer} cascadeDelay={footerCascadeDelay} />
          {rail.stamp ? <RailStamp stamp={rail.stamp} /> : null}
        </div>

        {/* <980px: the fixed sidebar above is display:none and this
            <details> becomes a 56px sticky text bar. Clicking/tapping the
            summary toggles the panel open via native browser behavior —
            zero JavaScript required. Unchanged by task W3 (spec: mobile
            stays untouched) — no wordmark-mark box, no stamp here. */}
        <details className="exhibit-rail-mobile">
          <summary className="exhibit-rail-mobile-bar">
            <span className="exhibit-rail-mobile-mark">{rail.wordmark.mark ?? rail.wordmark.lines[0]}</span>
            <span className="exhibit-rail-mobile-sep" aria-hidden="true">
              /
            </span>
            <span data-rail-current data-rail-total={total}>
              {firstNum} OF {total}
            </span>
            <span className="exhibit-rail-mobile-sep" aria-hidden="true">
              /
            </span>
            <span className="exhibit-rail-mobile-index-label">INDEX</span>
          </summary>
          <div className="exhibit-rail-mobile-panel">
            <RailNavList nav={rail.nav} />
            <RailFooterList footer={rail.footer} />
          </div>
        </details>

        {railTools ? <div className="exhibit-rail-tools">{railTools}</div> : null}

        <RailSpy />
      </nav>
      {/* Task R9a (checklist A3 b+c): circuit chain + colophon index. The
          shell mounts both slots unconditionally to keep this interface
          frozen (no new prop, no page-wrapper edits); CircuitNav itself is
          pathname-gated and renders null on every non-circuit route (home,
          /artifact, the dev fixture). */}
      <main id="main-content">
        <CircuitNav slot="top" />
        {children}
        <CircuitNav slot="bottom" />
      </main>
      {isAuto ? <RailAuto /> : null}
    </div>
  );
}

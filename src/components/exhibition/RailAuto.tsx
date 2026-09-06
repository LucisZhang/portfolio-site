"use client";

import { useEffect } from "react";

// Auto-rail v3 mechanic (task W3, user-approved prototype: output/design-
// genres/rail-proto/rail-proto-v3.html + .superpowers/sdd/2026-08-22-site-
// revamp-r2/task-rail-proto-report.md). Mounted only when ExhibitShell is
// given `mode="auto"`. Reads the DOM directly (RailSpy's pattern) rather
// than taking props, since it only ever needs to find the one auto-mode
// shell/rail/hot-zone/content set already rendered by ExhibitShell.
//
// State is carried entirely as classes on the `.exhibit-shell` root (never
// on <body>, so it can never collide with locale/theme classes something
// else owns):
//   (default, no class)  — entry-open: rail visible, content pushed. This
//                           is also exactly the no-JS state (ExhibitShell's
//                           static markup), so a page with JS disabled, or
//                           before this effect has run, is never blank.
//   .rail-collapsed       — retracted: rail hidden, content full-bleed.
//   .rail-hint            — pointer is in the 24px hot zone (darkens the
//                           collapsed-state affordance only).
//   .rail-cascade         — added only on a reveal from a *fully settled*
//                           collapsed state; drives the item-stagger
//                           keyframes in exhibition.css. Never on entry,
//                           never on a quick grace-window graze-back.
// (No entry-load animation: the prototype's optional one-shot "entry
// settle" fade was tried and dropped — see exhibition.css's note near the
// cascade rules — it isn't in task W3's choreography table and animating
// `main` on load raced with Playwright's scroll-into-view stability check
// on a real Chrome no-JS test. Entry just renders already-laid-out.)
export default function RailAuto() {
  useEffect(() => {
    const shell = document.querySelector<HTMLElement>('.exhibit-shell[data-rail-mode="auto"]');
    const rail = shell?.querySelector<HTMLElement>("[data-exhibition-rail]");
    const hotzone = shell?.querySelector<HTMLElement>("[data-rail-hotzone]");
    const content = shell?.querySelector<HTMLElement>("main#main-content");
    if (!shell || !rail || !hotzone || !content) return;

    // Mechanic is desktop/tablet only (spec: mobile <980px stays the
    // unchanged sticky bar + <details> index). Below 980px every handler
    // below becomes a no-op via this guard — no class this effect adds is
    // ever added under the mobile breakpoint.
    const desktopMq = window.matchMedia("(min-width: 980px)");
    const isDesktop = () => desktopMq.matches;

    const reduceMotionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduceMotion = reduceMotionMq.matches;

    // Timings (task W3 spec table). Collapse to 0ms under reduced motion so
    // every state change becomes an instant toggle with no lingering timer.
    const graceMs = () => (reduceMotion ? 0 : 300); // hover-out retract grace
    const settleMs = () => (reduceMotion ? 0 : 300); // collapsed-state "fully settled" window
    const dwellMs = () => (reduceMotion ? 0 : 800); // entry-mode content-dwell dismissal
    const wheelThreshold = 24; // entry-mode accumulated-scroll dismissal (px)

    let retractTimer: ReturnType<typeof setTimeout> | undefined;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    let dwellTimer: ReturnType<typeof setTimeout> | undefined;

    // ENTRY MODE: the page loads with the rail open (ExhibitShell's static
    // markup — no class needed). While this is true, ordinary hover-retract
    // is suspended; only a clear off-rail signal (dwell/scroll/click/focus/
    // Esc in content) fires the first retract. Ends permanently after that.
    let entryMode = true;
    // Flips true `settleMs()` after a retract *stays* retracted — a
    // grace-window flicker back to open never sets this, so a graze never
    // triggers the cascade on its way back in.
    let railSettled = false;
    let wheelAccum = 0;

    function reveal() {
      if (!isDesktop()) return;
      clearTimeout(retractTimer);
      clearTimeout(settleTimer);
      if (railSettled && !reduceMotion) shell!.classList.add("rail-cascade");
      railSettled = false;
      shell!.classList.remove("rail-collapsed", "rail-hint");
    }

    function retract() {
      clearTimeout(retractTimer);
      clearTimeout(dwellTimer);
      entryMode = false;
      shell!.classList.remove("rail-cascade");
      // Collapsing reclaims the rail's width for `main`, so every fluid
      // block reflows and content above the reader's position can shrink —
      // an anchor jump that landed just before this mutation (TOC link:
      // fragment navigation focuses the target heading, then the focusin
      // retract fires one rAF later) would otherwise drift ~166px out of
      // the viewport at 1024px. Pin whatever the user is focused on: snap
      // its viewport offset now and give back any reflow drift once the
      // push settles. Wheel/dwell retracts leave focus on <body> and start
      // no pin at all.
      const active = document.activeElement;
      const anchor = active && active !== document.body && content!.contains(active) ? active : null;
      const anchorTop = anchor?.getBoundingClientRect().top;
      shell!.classList.add("rail-collapsed");
      if (anchor && anchorTop !== undefined) {
        let pinned = anchor;
        let pinnedTop = anchorTop;
        // The pinned element must never be frozen for the whole push: a
        // keyboard reader whose focused TOC link started this retract can
        // press Enter *mid-collapse*, and the browser's fragment jump then
        // scrolls to and focuses the target heading. Holding the old link's
        // offset through that would treat the jump as drift and scroll it
        // straight back (the F-05 audit's below-the-viewport heading), so
        // each frame re-reads document.activeElement: a focus handoff to
        // another content element adopts that element at the offset the
        // jump gave it, focus leaving content (rail re-entry starts a
        // reveal) stops steering entirely, and a wheel event cancels too —
        // the pin never fights a scroll the user is driving themselves.
        let frames = 0;
        let cancelled = false;
        const cancel = () => { cancelled = true; };
        window.addEventListener("wheel", cancel, { passive: true, once: true });
        const stop = () => window.removeEventListener("wheel", cancel);
        const pin = () => {
          if (cancelled) return;
          const focused = document.activeElement;
          if (focused !== pinned) {
            if (!focused || focused === document.body || !content!.contains(focused)) return stop();
            pinned = focused;
            pinnedTop = focused.getBoundingClientRect().top;
          }
          if (pinned.isConnected) {
            const delta = pinned.getBoundingClientRect().top - pinnedTop;
            if (Math.abs(delta) > 0.5) window.scrollBy(0, delta);
          }
          // Reduced motion collapses in one synchronous reflow (transition:
          // none); otherwise follow the 240ms margin push frame by frame,
          // with a couple of spare frames beyond the transition's end.
          if (parseFloat(getComputedStyle(content!).marginLeft) > 0 && ++frames < 45) requestAnimationFrame(pin);
          else stop();
        };
        pin();
      }
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        if (shell!.classList.contains("rail-collapsed")) railSettled = true;
      }, settleMs());
    }

    function scheduleRetract() {
      if (entryMode) return; // entry dismissal has its own heuristic below
      clearTimeout(retractTimer);
      retractTimer = setTimeout(retract, graceMs());
    }

    function hint(on: boolean) {
      shell!.classList.toggle("rail-hint", on);
    }

    // --- entry-mode dismissal heuristic ---
    function armDwell() {
      if (!entryMode || !isDesktop()) return;
      clearTimeout(dwellTimer);
      dwellTimer = setTimeout(() => {
        if (entryMode) retract();
      }, dwellMs());
    }
    function disarmDwell() {
      clearTimeout(dwellTimer);
    }
    // Both listeners below can fire *synchronously in the middle of* a
    // click gesture that's still in flight: focusing a summary/button/link
    // happens as part of mousedown's own default action (before mouseup),
    // and `click` itself fires between mouseup and the browser settling.
    // retract()'s classList.add starts the content's margin-left shift
    // (instant under reduced motion, one animation frame later otherwise)
    // -- if that shift lands *before* the browser finishes hit-testing the
    // gesture that triggered it, the click's actual target can end up
    // computed against post-shift geometry while the pointer coordinates
    // are still the pre-shift ones, and the click silently lands on the
    // wrong element (or nothing). Reproduced concretely: clicking a native
    // <details><summary> inside content, on this exact retract path,
    // failed to open the entry at the tablet breakpoint while succeeding
    // at desktop purely because of where each breakpoint's shift amount
    // happened to relocate the point -- a real bug, not a viewport quirk.
    // `retractDeferred` pushes the actual mutation one animation frame out
    // so it always lands after the current gesture's events have already
    // been dispatched and hit-tested, never during.
    function retractDeferred() {
      requestAnimationFrame(() => {
        if (entryMode && isDesktop()) retract();
      });
    }
    function onContentClick() {
      if (entryMode && isDesktop()) retractDeferred();
    }
    function onContentFocusIn() {
      if (entryMode && isDesktop()) retractDeferred();
    }
    function onWheel(event: WheelEvent) {
      if (!entryMode || !isDesktop()) return;
      wheelAccum += Math.abs(event.deltaY);
      if (wheelAccum >= wheelThreshold) retract();
    }
    function onKeydown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (!isDesktop()) return;
      if (!shell!.classList.contains("rail-collapsed")) {
        retract();
        const active = document.activeElement as HTMLElement | null;
        if (active && rail!.contains(active)) active.blur();
      }
    }

    // --- steady-state (post-entry) hover/keyboard behavior ---
    function onHotzoneEnter() {
      if (!isDesktop()) return;
      hint(true);
      reveal();
    }
    function onHotzoneLeave() {
      if (!isDesktop()) return;
      hint(false);
      scheduleRetract();
    }
    function onRailEnter() {
      if (!isDesktop()) return;
      disarmDwell();
      reveal();
    }
    function onRailLeave() {
      if (!isDesktop()) return;
      scheduleRetract();
    }
    function onRailFocusIn() {
      if (!isDesktop()) return;
      disarmDwell();
      reveal();
    }
    function onRailFocusOut(event: FocusEvent) {
      if (!isDesktop()) return;
      const related = event.relatedTarget as Node | null;
      if (!related || !rail!.contains(related)) scheduleRetract();
    }
    function onReduceMotionChange(event: MediaQueryListEvent) {
      reduceMotion = event.matches;
    }
    function onBreakpointChange(event: MediaQueryListEvent) {
      // Crossing below 980px mid-session (resize, not a reload): drop every
      // auto-rail class so the shell falls back cleanly to the CSS default
      // (open) rather than getting stuck retracted under the mobile bar.
      if (!event.matches) {
        clearTimeout(retractTimer);
        clearTimeout(settleTimer);
        clearTimeout(dwellTimer);
        shell!.classList.remove("rail-collapsed", "rail-hint", "rail-cascade");
      }
    }

    content.addEventListener("pointerenter", armDwell);
    content.addEventListener("pointerleave", disarmDwell);
    content.addEventListener("click", onContentClick);
    content.addEventListener("focusin", onContentFocusIn);
    window.addEventListener("wheel", onWheel, { passive: true });
    hotzone.addEventListener("pointerenter", onHotzoneEnter);
    hotzone.addEventListener("pointerleave", onHotzoneLeave);
    rail.addEventListener("pointerenter", onRailEnter);
    rail.addEventListener("pointerleave", onRailLeave);
    rail.addEventListener("focusin", onRailFocusIn);
    rail.addEventListener("focusout", onRailFocusOut);
    document.addEventListener("keydown", onKeydown);
    reduceMotionMq.addEventListener("change", onReduceMotionChange);
    desktopMq.addEventListener("change", onBreakpointChange);

    return () => {
      content.removeEventListener("pointerenter", armDwell);
      content.removeEventListener("pointerleave", disarmDwell);
      content.removeEventListener("click", onContentClick);
      content.removeEventListener("focusin", onContentFocusIn);
      window.removeEventListener("wheel", onWheel);
      hotzone.removeEventListener("pointerenter", onHotzoneEnter);
      hotzone.removeEventListener("pointerleave", onHotzoneLeave);
      rail.removeEventListener("pointerenter", onRailEnter);
      rail.removeEventListener("pointerleave", onRailLeave);
      rail.removeEventListener("focusin", onRailFocusIn);
      rail.removeEventListener("focusout", onRailFocusOut);
      document.removeEventListener("keydown", onKeydown);
      reduceMotionMq.removeEventListener("change", onReduceMotionChange);
      desktopMq.removeEventListener("change", onBreakpointChange);
      clearTimeout(retractTimer);
      clearTimeout(settleTimer);
      clearTimeout(dwellTimer);
    };
  }, []);

  return null;
}

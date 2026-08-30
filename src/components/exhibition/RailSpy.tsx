"use client";

import { useEffect } from "react";

// The only client island inside the exhibition shell (spec §2.1). It reads
// the DOM directly instead of taking props, so any page can drop a single
// <RailSpy /> inside <ExhibitShell> without threading exhibit ids through
// props from every caller. With JavaScript disabled this component never
// mounts and the rail rendered by ExhibitShell stays a plain anchor list —
// no behavior here is load-bearing for navigation, only for the
// aria-current highlight and the mobile "N OF total" readout.
export default function RailSpy() {
  useEffect(() => {
    const rail = document.querySelector<HTMLElement>("[data-exhibition-rail]");
    if (!rail) return;

    const exhibits = Array.from(document.querySelectorAll<HTMLElement>("[data-exhibit][id]"));
    if (exhibits.length === 0) return;

    const anchorsById = new Map<string, HTMLAnchorElement[]>();
    exhibits.forEach((exhibit) => {
      const anchors = Array.from(
        rail.querySelectorAll<HTMLAnchorElement>(`a[href="#${CSS.escape(exhibit.id)}"]`),
      );
      anchorsById.set(exhibit.id, anchors);
    });

    const currentLabels = Array.from(rail.querySelectorAll<HTMLElement>("[data-rail-current]"));

    const setCurrent = (id: string, num: string) => {
      anchorsById.forEach((anchors, exhibitId) => {
        anchors.forEach((anchor) => {
          if (exhibitId === id) anchor.setAttribute("aria-current", "true");
          else anchor.removeAttribute("aria-current");
        });
      });
      currentLabels.forEach((label) => {
        const total = label.getAttribute("data-rail-total");
        label.textContent = total ? `${num} OF ${total}` : num;
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        const topmost = visible.reduce((best, entry) =>
          entry.boundingClientRect.top < best.boundingClientRect.top ? entry : best,
        );
        const target = topmost.target as HTMLElement;
        setCurrent(target.id, target.getAttribute("data-exhibit") ?? "");
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    exhibits.forEach((exhibit) => observer.observe(exhibit));
    return () => observer.disconnect();
  }, []);

  return null;
}

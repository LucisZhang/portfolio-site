import type { ReactNode } from "react";

import { zhWrapDisplay, zhWrapText } from "@/lib/zh-wrap";

export type ExhibitBackground = "paper" | "ink" | "white" | "paper-alt";

// Opening formula fixed by spec §2.1: mono number + uppercase mono eyebrow +
// giant serif assertion title + optional muted intro, full-bleed with a
// hairline bottom border. `data-exhibit`/`data-bg` are the frozen structural
// hooks every future page and test relies on.
export function Exhibit({
  id,
  num,
  eyebrow,
  title,
  bg,
  intro,
  children,
}: {
  id: string;
  num: string;
  eyebrow: string;
  title: ReactNode;
  bg: ExhibitBackground;
  intro?: ReactNode;
  children: ReactNode;
}) {
  const titleId = `${id}-title`;
  return (
    <section id={id} className="exhibit" data-exhibit={num} data-bg={bg} aria-labelledby={titleId}>
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">
          {num}
        </span>
        <span className="exhibit-eyebrow">{zhWrapText(eyebrow)}</span>
      </p>
      <h2 id={titleId} className="exhibit-title">
        {zhWrapDisplay(title)}
      </h2>
      {intro ? <p className="exhibit-intro">{intro}</p> : null}
      <div className="exhibit-body">{children}</div>
    </section>
  );
}

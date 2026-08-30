import type { ReactNode } from "react";

// Shared chrome for the site's "instrumented product" components (spec §5,
// Instrument Ten Commandments). `compact` is the hero-right-column form used
// above the fold; `full` is the same component expanded into its own
// numbered exhibit further down the page. `data-instrument` is the frozen
// structural hook (tests/e2e/selectors.ts: SEL.instrument).
export function InstrumentFrame({
  variant,
  children,
}: {
  variant: "compact" | "full";
  children: ReactNode;
}) {
  return (
    <div className="instrument-frame" data-instrument data-instrument-variant={variant}>
      {children}
    </div>
  );
}

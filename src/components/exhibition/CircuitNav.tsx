"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const CircuitNavContent = dynamic(() => import("./CircuitNavContent"));

// Keep the project circuit out of the homepage's initial scripts. Project
// routes still server-render it, including its links and colophon, before JS.
//
// Task A4 (fix round): this gate is the THIRD structural route parser in the
// codebase, alongside AssistantWidget's contextualCopy and AskPage's
// askQuestionBankRoute, and it was the one that got missed. It used to test
// /^\/(?:ai|engineering|analytics)\/[^/]+\/?$/ -- a two-segment, track-named
// pathname -- which matches nothing once project pages are served flat at
// /projects/<slug>. The failure is silent by construction: an unmatched
// pathname is the legitimate off-circuit case (home, /artifact), so the
// breadcrumb, the prev/next chain and the page-bottom index of work simply
// stopped rendering on all ten project pages with no error anywhere.
// Caught by tests/e2e/rail-tools-r2.spec.ts's ".circuit-pos" assertion.
//
// Neither of amendment R3-CORRECTED's two sweeps can see this line: it names
// the track segments inside a regex character alternation with no slug and no
// `.track` template, so both the slug-level sweep and the structural sweep
// score zero on it.
//
// The gate is only a chunk-loading guard; membership is CircuitNavContent's
// call. It defers to circuitEntryForPath(), which returns null for the
// off-circuit compatibility route /projects/analytics-tandem and renders
// nothing there, so matching every /projects/<slug> here is correct.
export default function CircuitNav({ slot, repositoryEntry }: {
  slot: "top" | "bottom";
  repositoryEntry?: ReactNode;
}) {
  const pathname = usePathname();
  if (!/^\/projects\/[^/]+\/?$/.test(pathname ?? "")) {
    return slot === "top" ? repositoryEntry ?? null : null;
  }
  return <CircuitNavContent slot={slot} repositoryEntry={repositoryEntry} />;
}

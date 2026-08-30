"use client";

import { Finding } from "@/components/exhibition/Finding";
import LocaleDocumentMetadata from "@/components/LocaleDocumentMetadata";
import { useI18n } from "@/lib/i18n";
import type { Project } from "@/lib/projects";
import { siteIdentity } from "@/lib/site-config";
import "./crossover.css";
import { CrossoverCurves } from "./CrossoverCurves";
import { CrossoverSourceReceipts } from "./CrossoverSourceReceipts";
import { SqlWorkbench } from "./SqlWorkbench";

// Crossover Study -- cached-state notebook/workbench (task L6 [CLAUDE],
// spec §6.6, user-approved mock output/design-legacy/legacy-4-crossover-
// study.html). Composition: exhibit 01 (the SQL workbench, folds the hero
// assertion into the first screen per the Margin/Credit/Triage precedent
// of not splitting a separate hero exhibit) -> 02 the two main curves
// (Amazon null vs ML-32M n*=20) -> 03 source & receipts + provenance ->
// report layer (Results & negatives / Limitations).
//
// Report-layer module selection ("crossover actually uses 4 of 8 modules",
// docs/evidence/r2-source-map.md KNOWN-GAPS): outcome, fieldNotes,
// provenance, and boundaries render; `problem`/`audience` are unrendered
// (unchanged precedent -- no rebuilt page renders them) and `role`/
// `architecture` are dropped here specifically because the SQL workbench's
// own six curated queries already narrate the pipeline's Freeze -> Rank ->
// Route -> Measure -> Falsify architecture as runnable queries, so a
// second prose restatement of the same five steps would be redundant with
// exhibit 01 rather than load-bearing. `provenance` moves into exhibit 03
// (CrossoverSourceReceipts.tsx) instead of a separate report section,
// since its two sentences literally name which of the six receipts backs
// which exhibit-02 curve -- a direct pairing, not a generic module.
export default function CrossoverPage({ project, icebergSnapshotId }: { project: Project; icebergSnapshotId: string }) {
  const { locale } = useI18n();

  return (
    <div className="crossover-page" data-testid="crossover-study">
      <LocaleDocumentMetadata
        title={{ en: `${project.title.en} | ${siteIdentity.name}`, zh: `${project.title.zh} | ${siteIdentity.chineseName}` }}
        description={project.summary}
      />

      <SqlWorkbench icebergSnapshotId={icebergSnapshotId} />
      <CrossoverCurves />
      <CrossoverSourceReceipts />

      <section data-project-section="results" className="crossover-report-section">
        <h2>{locale === "en" ? "Results & negatives" : "结果与负结果"}</h2>
        <p className="project-outcome">{locale === "en" ? project.outcome.en : project.outcome.zh}</p>
        {project.fieldNotes?.map((note) => (
          <Finding kind="negative" key={note.en}>
            {locale === "en" ? note.en : note.zh}
          </Finding>
        ))}
      </section>

      <section data-project-section="limitations" className="crossover-report-section">
        <h2>{locale === "en" ? "Limitations" : "局限与边界"}</h2>
        {project.boundaries.map((boundary) => (
          <Finding kind="limitation" key={boundary.en}>
            {locale === "en" ? boundary.en : boundary.zh}
          </Finding>
        ))}
      </section>
    </div>
  );
}

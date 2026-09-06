"use client";

import { ProjectReport, ProjectReportContents } from "@/components/report/ProjectReport";
import LocaleDocumentMetadata from "@/components/LocaleDocumentMetadata";
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
// Architecture is the existing SQL workbench, marked by the shared report
// primitive there. Results and limitations follow in the reading column;
// provenance remains paired with its curve receipts in exhibit 03.
export default function CrossoverPage({ project, icebergSnapshotId }: { project: Project; icebergSnapshotId: string }) {

  return (
    <div className="crossover-page" data-testid="crossover-study">
      <LocaleDocumentMetadata
        title={{ en: `${project.title.en} | ${siteIdentity.name}`, zh: `${project.title.zh} | ${siteIdentity.chineseName}` }}
        description={project.summary}
      />
      <ProjectReportContents />

      <SqlWorkbench icebergSnapshotId={icebergSnapshotId} />
      <CrossoverCurves />
      <CrossoverSourceReceipts />

      <ProjectReport project={project} sections={["results", "limitations"]} />
    </div>
  );
}

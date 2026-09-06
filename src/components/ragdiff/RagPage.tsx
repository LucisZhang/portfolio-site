"use client";

import { ProjectReport, ProjectReportContents } from "@/components/report/ProjectReport";
import LocaleDocumentMetadata from "@/components/LocaleDocumentMetadata";
import type { Project } from "@/lib/projects";
import { siteIdentity } from "@/lib/site-config";
import "./rag.css";
import { RagDiffLab } from "./RagDiffLab";
import { RagEvidenceClaims } from "./RagEvidenceClaims";
import { RagSourceReceipts } from "./RagSourceReceipts";

// Task L3 [CLAUDE]: RAG Quality Lab rebuilt to the user-approved diff/对照
// design (output/design-genres/genre-rag-diff.html + .png). Composition:
// exhibit 01 the drift lab (diff instrument, folds hero content in, per the
// Margin/Triage Router precedent) -> 02 evidence claims (verified-vs-
// blocked registry as typographic content) -> 03 SOURCE/RECEIPTS -> report
// layer (Architecture / Results & negatives / Limitations, read straight
// from projects.ts like every other rebuilt page). The pre-rebuild
// interactive workbench (src/components/rag/RagManifestDriftLab.tsx: JSON
// manifest-drift scenarios, synthetic-document normalization lab) and its
// wrapper (src/components/RagProof.tsx) are unrouted by this task, not
// deleted -- see docs/.superpowers/sdd/.../task-L3-report.md for the full
// old-assertion replacement inventory.
export default function RagPage({ project }: { project: Project }) {

  return (
    <div className="rag-page" data-testid="rag-quality-lab">
      <LocaleDocumentMetadata
        title={{ en: `${project.title.en} | ${siteIdentity.name}`, zh: `${project.title.zh} | ${siteIdentity.chineseName}` }}
        description={project.summary}
      />
      <RagDiffLab />
      <RagEvidenceClaims repository={project.repository} />
      <RagSourceReceipts repository={project.repository} />

      <ProjectReportContents />
      <ProjectReport project={project} />
    </div>
  );
}

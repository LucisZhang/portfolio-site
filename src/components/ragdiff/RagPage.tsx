"use client";

import { Finding } from "@/components/exhibition/Finding";
import LocaleDocumentMetadata from "@/components/LocaleDocumentMetadata";
import { useI18n } from "@/lib/i18n";
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
  const { locale } = useI18n();

  return (
    <div className="rag-page" data-testid="rag-quality-lab">
      <LocaleDocumentMetadata
        title={{ en: `${project.title.en} | ${siteIdentity.name}`, zh: `${project.title.zh} | ${siteIdentity.chineseName}` }}
        description={project.summary}
      />

      <RagDiffLab />
      <RagEvidenceClaims />
      <RagSourceReceipts />

      <section data-project-section="how" className="rag-report-section">
        <h2>{locale === "en" ? "Architecture" : "架构"}</h2>
        <p>{locale === "en" ? project.role.en : project.role.zh}</p>
        <ol className="rag-architecture-flow">
          {project.architecture.map((step, index) => (
            <li key={step.label.en}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{locale === "en" ? step.label.en : step.label.zh}</strong>
                <p>{locale === "en" ? step.detail.en : step.detail.zh}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section data-project-section="results" className="rag-report-section">
        <h2>{locale === "en" ? "Results & negatives" : "结果与负结果"}</h2>
        <p className="project-outcome">{locale === "en" ? project.outcome.en : project.outcome.zh}</p>
        {project.fieldNotes?.map((note) => (
          <Finding kind="negative" key={note.en}>
            {locale === "en" ? note.en : note.zh}
          </Finding>
        ))}
      </section>

      <section data-project-section="limitations" className="rag-report-section">
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

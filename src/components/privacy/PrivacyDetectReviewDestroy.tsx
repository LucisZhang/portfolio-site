import type { Locale } from "@/lib/i18n";
import type { Project } from "@/lib/projects";

// Task 3.2 (spec §6.4 exhibit 02, "Detection proposes. The reviewer
// decides."): a plain server-rendered ordered list built from
// project.architecture (src/lib/projects.ts's privacy-preflight entry,
// previously reviewed content, reused verbatim rather than retyped) — no
// client state, no fetch, real content with JavaScript disabled.
export default function PrivacyDetectReviewDestroy({ project, locale }: { project: Project; locale: Locale }) {
  return (
    <ol className="privacy-architecture-flow">
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
  );
}

import type { ReactNode } from "react";

export default function ProjectProofSection({ title, children, className = "", sectionId }: { title: string; children: ReactNode; className?: string; sectionId?: string }) {
  return (
    <section className={`proof-section ${className}`} data-project-section={sectionId}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

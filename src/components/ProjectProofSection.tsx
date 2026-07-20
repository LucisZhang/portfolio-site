import type { ReactNode } from "react";

export default function ProjectProofSection({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`proof-section ${className}`}>
      <div className="page-shell">
        <h2>{title}</h2>
        {children}
      </div>
    </section>
  );
}

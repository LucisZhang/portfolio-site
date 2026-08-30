"use client";

import CrossoverExhibit from "@/components/crossover/CrossoverExhibit";
import { useI18n } from "@/lib/i18n";
import ProjectProofSection from "./ProjectProofSection";

export default function CrossoverProof() {
  const { locale } = useI18n();
  return (
    <ProjectProofSection title={locale === "en" ? "Recorded exhibits" : "实测展品"} className="tinted-section">
      <CrossoverExhibit />
    </ProjectProofSection>
  );
}

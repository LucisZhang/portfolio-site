"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import { useEvidence } from "./EvidenceContext";
import "./evidence.css";

/** The summary stays in the document; the complete receipt needs no JavaScript to open. */
export function EvidenceDisclosure({ project, children }: {
  project: string;
  children: ReactNode;
}) {
  const { locale } = useI18n();
  const { summary } = useEvidence();
  const labels = locale === "en"
    ? { verified: "What was verified", evidenceClass: "Evidence class", boundary: "Boundary" }
    : { verified: "验证了什么", evidenceClass: "证据类型", boundary: "适用边界" };
  return (
    <div className="evidence-layer" data-evidence={project}>
      <dl className="evidence-overview">
        {(["verified", "evidenceClass", "boundary"] as const).map((key) => (
          <div key={key} data-evidence-summary={key}>
            <dt>{labels[key]}</dt>
            <dd>{summary[key][locale]}</dd>
          </div>
        ))}
      </dl>
      <details className="evidence-details">
        <summary>{locale === "en" ? "Files, hashes and methods" : "文件、哈希与验证方法"}</summary>
        <div className="evidence-technical">{children}</div>
      </details>
    </div>
  );
}

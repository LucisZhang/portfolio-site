"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import { useEvidence } from "./EvidenceContext";

/** Paths identify reviewed entries. They are never interpolated into an arbitrary remote URL. */
export function EvidenceFileLink({ source, children }: { source: string; children?: ReactNode }) {
  const { locale } = useI18n();
  const id = source.startsWith("/case-studies/") ? `public${source}` : source;
  const { files } = useEvidence();
  const file = files[id];
  if (!file) throw new Error(`Unregistered evidence file: ${id}`);
  const label = children ?? <code>{source}</code>;
  if (file.status === "unavailable") {
    return <span>{label}<span className="evidence-file-note">{locale === "en" ? "Served model; no committed GitHub file." : "单独提供的模型；GitHub 中没有已提交文件。"}</span></span>;
  }
  if (file.status === "local") {
    return <span data-evidence-file={id} data-evidence-status="local">{label}
      <span className="evidence-file-note">{locale === "en" ? "Commit-local file · unpublished" : "当前提交文件 · 尚未公开"}</span>
      <span className="evidence-file-note"><code>SHA-256: {file.sha256}</code></span>
    </span>;
  }
  return <span>
    <a className="evidence-file-link" href={file.href} target="_blank" rel="noreferrer noopener"
      data-evidence-file={id} title={`${file.repository} @ ${file.revision}: ${file.path}`}>{label}</a>
    <span className="evidence-file-note">{file.repository} · <code>{file.revision.slice(0, 12)}</code></span>
  </span>;
}

"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { EvidenceSummary } from "@/data/evidence-summaries";

export type EvidenceFile = { status: "public"; repository: string; revision: string; path: string; sha256: string; href: string }
  | { status: "local"; path: string; sha256: string }
  | { status: "unavailable"; reason: string };
export type EvidenceContextValue = { summary: EvidenceSummary; files: Record<string, EvidenceFile> };
const EvidenceContext = createContext<EvidenceContextValue | null>(null);

export function EvidenceProvider({ value, children }: { value: EvidenceContextValue; children: ReactNode }) {
  return <EvidenceContext.Provider value={value}>{children}</EvidenceContext.Provider>;
}

export function useEvidence() {
  const value = useContext(EvidenceContext);
  if (!value) throw new Error("Receipt content requires its route's evidence scope");
  return value;
}

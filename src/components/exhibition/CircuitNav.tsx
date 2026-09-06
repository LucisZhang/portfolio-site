"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const CircuitNavContent = dynamic(() => import("./CircuitNavContent"));

// Keep the project circuit out of the homepage's initial scripts. Project
// routes still server-render it, including its links and colophon, before JS.
export default function CircuitNav({ slot, repositoryEntry }: {
  slot: "top" | "bottom";
  repositoryEntry?: ReactNode;
}) {
  const pathname = usePathname();
  if (!/^\/(?:ai|engineering|analytics)\/[^/]+\/?$/.test(pathname ?? "")) {
    return slot === "top" ? repositoryEntry ?? null : null;
  }
  return <CircuitNavContent slot={slot} repositoryEntry={repositoryEntry} />;
}

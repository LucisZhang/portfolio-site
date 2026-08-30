import type { RailSpec } from "@/components/exhibition/ExhibitShell";
import { getProject } from "@/lib/projects";

// Exactly-Once Drills project-page rail (spec §2.1 "项目页" state, §6.0
// template) — follows the exact precedent of src/components/forge/forgeRail.ts.
const eodProject = getProject("engineering", "exactly-once-drills");

// Task F2: same fix as forgeRail.ts — copy.en mirrors glossZh's meaning in
// plain factual voice so the rail's positioning line renders on an English
// load too, instead of RailCopy (task F5) rendering nothing.
export const eodRail: RailSpec = {
  wordmark: { lines: ["Exactly-Once", "Drills"] },
  copy: eodProject ? { en: "Fault-recovery verification for message-queue and stream-processing pipelines.", zh: eodProject.glossZh } : undefined,
  nav: [
    { id: "exhibit-01", num: "01", label: "Duty logbook" },
    { id: "exhibit-02", num: "02", label: "Verification proposition" },
    { id: "exhibit-03", num: "03", label: "Dual-path parity" },
    { id: "exhibit-04", num: "04", label: "Checkpoint pressure" },
    { id: "exhibit-05", num: "05", label: "Source & receipts" },
  ],
  footer: [{ label: "← ALL WORK", href: "/" }],
};

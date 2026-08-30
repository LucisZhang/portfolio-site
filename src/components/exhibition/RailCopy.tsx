"use client";

import { useI18n } from "@/lib/i18n";
import type { RailSpec } from "./ExhibitShell";

// Locale purity (task F5, user's binding rule): the rail's positioning line
// is narrative copy, not UI fabric, so it must follow the active locale
// rather than rendering both languages side by side. ExhibitShell itself
// stays a server component (spec §2.1) — this is the one client island that
// reads useI18n() for it, mirroring RailSpy's role as the shell's only
// other "use client" file. Server-rendered/no-JS output defaults to the en
// snapshot (src/lib/i18n.ts's getServerLocaleSnapshot), so a project rail
// whose `copy` only carries `zh` (forgeRail/eodRail) renders nothing until
// the client locale is known — never a stray Chinese line on an English
// load.
export default function RailCopy({ copy }: { copy: NonNullable<RailSpec["copy"]> }) {
  const { locale } = useI18n();
  if (locale === "zh") {
    return copy.zh ? (
      <p className="exhibit-rail-copy-zh" lang="zh">
        {copy.zh}
      </p>
    ) : null;
  }
  return copy.en ? <p className="exhibit-rail-copy-en">{copy.en}</p> : null;
}

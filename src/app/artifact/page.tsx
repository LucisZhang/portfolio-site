import type { Metadata } from "next";
import ArtifactViewer from "@/components/artifacts/ArtifactViewer";
import { ExhibitShell } from "@/components/exhibition/ExhibitShell";
import LegacyRailTools from "@/components/exhibition/LegacyRailTools";
import { legacyRail } from "@/components/exhibition/legacyRail";
import { safeArtifactPath } from "@/lib/artifacts";

export const metadata: Metadata = {
  title: "Project file | Xiangguo Zhang",
  description: "View a project file with context, search, and download controls.",
};

export default async function ArtifactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requested = Array.isArray(params.src) ? params.src[0] : params.src;
  const from = Array.isArray(params.from) ? params.from[0] : params.from;
  const safeSource = requested ? safeArtifactPath(requested) : null;
  return (
    <ExhibitShell rail={legacyRail} railTools={<LegacyRailTools />}>
      <ArtifactViewer key={safeSource ?? "none"} source={safeSource} from={from?.startsWith("/") ? from : "/"} />
    </ExhibitShell>
  );
}

import type { Metadata } from "next";
import ArtifactViewer from "@/components/artifacts/ArtifactViewer";
import { safeArtifactPath } from "@/lib/artifacts";

export const metadata: Metadata = {
  title: "Project file | Hsiang Kuo Chang",
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
  return <ArtifactViewer source={requested ? safeArtifactPath(requested) : null} from={from?.startsWith("/") ? from : "/"} />;
}

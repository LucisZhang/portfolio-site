"use client";

import type { ComponentProps } from "react";
import { usePathname } from "next/navigation";
import LocaleLink from "@/components/LocaleLink";
import { artifactViewerHref } from "@/lib/artifacts";

export default function ArtifactLink({ href, ...props }: ComponentProps<typeof LocaleLink>) {
  const pathname = usePathname();
  const source = typeof href === "string" ? href : href.pathname || "";
  return <LocaleLink href={artifactViewerHref(source, pathname)} {...props} />;
}

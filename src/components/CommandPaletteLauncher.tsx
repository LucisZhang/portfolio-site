"use client";

import { Search } from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import { useI18n } from "@/lib/i18n";
import type { Project, Track } from "@/lib/projects";

type PaletteProps = {
  tracks: Track[];
  projects: Project[];
  initiallyOpen?: boolean;
};

export default function CommandPaletteLauncher({ tracks, projects }: Omit<PaletteProps, "initiallyOpen">) {
  const [Palette, setPalette] = useState<ComponentType<PaletteProps> | null>(null);
  const { dict } = useI18n();

  function loadPalette() {
    void import("./CommandPalette").then((module) => setPalette(() => module.default));
  }

  useEffect(() => {
    if (Palette) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        loadPalette();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [Palette]);

  if (Palette) return <Palette tracks={tracks} projects={projects} initiallyOpen />;

  return (
    <button
      type="button"
      onClick={loadPalette}
      className="search-button"
      title={`${dict.paletteOpen} (Cmd/Ctrl K)`}
    >
      <Search className="size-4" aria-hidden="true" />
      <span>{dict.paletteOpen}</span><kbd>⌘K</kbd>
    </button>
  );
}

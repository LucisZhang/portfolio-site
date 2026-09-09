"use client";

import { Search } from "lucide-react";
import { useCallback, useEffect, useState, type ComponentType } from "react";
import { useI18n } from "@/lib/i18n";
import type { Project, Track } from "@/lib/projects";

type PaletteProps = {
  tracks: Track[];
  projects: Project[];
  initiallyOpen?: boolean;
};

type PaletteData = Omit<PaletteProps, "initiallyOpen">;
type LauncherProps = PaletteData | { tracks?: never; projects?: never };

export default function CommandPaletteLauncher({ tracks, projects }: LauncherProps) {
  const [loaded, setLoaded] = useState<{ Palette: ComponentType<PaletteProps>; data: PaletteData } | null>(null);
  const { dict } = useI18n();

  const loadPalette = useCallback(() => {
    void Promise.all([
      import("./CommandPalette"),
      tracks && projects ? Promise.resolve({ tracks, projects })
        : import("@/lib/projects").then(({ tracks, featuredProjects }) => ({ tracks, projects: featuredProjects })),
    ]).then(([module, data]) => setLoaded({ Palette: module.default, data }));
  }, [projects, tracks]);

  useEffect(() => {
    if (loaded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        loadPalette();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [loaded, loadPalette]);

  if (loaded) return <loaded.Palette {...loaded.data} initiallyOpen />;

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

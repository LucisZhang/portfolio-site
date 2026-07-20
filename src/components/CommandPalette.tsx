"use client";

import { Command } from "cmdk";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { localeHref, localize, useI18n } from "@/lib/i18n";
import type { Project, Track } from "@/lib/projects";

export default function CommandPalette({
  tracks,
  projects,
}: {
  tracks: Track[];
  projects: Project[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { locale, dict } = useI18n();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const trackItems = useMemo(
    () =>
      tracks.map((track) => ({
        id: track.id,
        label: localize(track.label, locale),
        href: `/${track.id}`,
      })),
    [locale, tracks],
  );

  const projectItems = useMemo(
    () =>
      projects.map((project) => ({
        id: project.slug,
        label: localize(project.title, locale),
        href: `/${project.track}/${project.slug}`,
        tags: project.stack.map((item) => localize(item, locale)).join(" "),
      })),
    [locale, projects],
  );

  function go(href: string) {
    setOpen(false);
    router.push(localeHref(href, locale));
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="search-button"
        title={`${dict.paletteOpen} (Cmd/Ctrl K)`}
      >
        <Search className="size-4" aria-hidden="true" />
        <span>{dict.paletteOpen}</span><kbd>⌘K</kbd>
      </button>

      <Command.Dialog open={open} onOpenChange={setOpen} label={dict.paletteOpen}>
        <div className="command-overlay" />
        <div className="command-dialog">
          <button className="command-close" type="button" onClick={() => setOpen(false)} aria-label={dict.paletteClose} title={dict.paletteClose}><X aria-hidden="true" /></button>
          <Command.Input
            placeholder={dict.palettePlaceholder}
            className="command-input"
          />
          <Command.List className="command-list">
            <Command.Empty className="command-empty">
              {dict.paletteEmpty}
            </Command.Empty>

            <Command.Group heading={dict.paletteTracks} className="command-group">
              {trackItems.map((item) => (
                <Command.Item
                  key={item.id}
                  value={`${item.label} ${item.id}`}
                  onSelect={() => go(item.href)}
                  className="command-item"
                >
                  {item.label}
                  <span>/{item.id}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading={dict.paletteProjects} className="command-group">
              {projectItems.map((item) => (
                <Command.Item
                  key={item.id}
                  value={`${item.label} ${item.tags}`}
                  onSelect={() => go(item.href)}
                  className="command-item"
                >
                  {item.label}
                  <span>{item.id}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </div>
      </Command.Dialog>
    </>
  );
}

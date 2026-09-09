"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ArtifactViewer from "./ArtifactViewer";
import { resolveArtifactContext } from "@/lib/artifacts";
import { useI18n } from "@/lib/i18n";

export default function ArtifactRoute() {
  const query = useSearchParams();
  const requestedQuery = query.toString();
  const { locale, setLocale } = useI18n();
  const context = resolveArtifactContext(query, locale);

  useEffect(() => {
    let active = true;
    // The language provider's hydration effect runs after its children. Reconcile
    // once those effects finish, so its initial English snapshot cannot mask an
    // incoming Chinese URL. Cancel work from superseded renders/navigation.
    queueMicrotask(() => {
      if (!active) return;
      // LanguageSwitcher updates browser history and the locale store together;
      // Next's query snapshot may trail that update by a render. Do not let an
      // old query undo the user's new language (or a newer history navigation).
      const liveContext = resolveArtifactContext(new URLSearchParams(window.location.search), locale);
      if (liveContext.canonicalHref !== context.canonicalHref) return;
      if (context.locale !== locale) {
        setLocale(context.locale);
        return;
      }
      // Preserve only a plain section fragment. Source/from/lang are resolved in
      // one place, and Back/Forward uses the same context as a fresh shared URL.
      let hash = "";
      try {
        if (/^#[\p{L}\p{N}_-]+$/u.test(decodeURIComponent(window.location.hash))) hash = window.location.hash;
      } catch { /* Malformed fragments are discarded along with malformed queries. */ }
      const href = context.canonicalHref + hash;
      if (window.location.pathname + window.location.search + window.location.hash !== href) {
        // Next preserves its router state for native history calls. Passing its
        // internal state back would bypass query subscribers and leave stale URLs.
        window.history.replaceState(null, "", href);
      }
    });
    return () => { active = false; };
  }, [requestedQuery, context.canonicalHref, context.locale, locale, setLocale]);

  // Every file owns its loading, search, paging, zoom, and section state.
  return <ArtifactViewer key={context.source ?? "none"} context={context} />;
}

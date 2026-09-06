import type { Metadata } from "next";
import localFont from "next/font/local";
import AssistantLauncher from "@/components/assistant/AssistantLauncher";
import SkipLink from "@/components/SkipLink";
import { LanguageProvider } from "@/lib/i18n";
import { siteMetadata } from "@/lib/site-config";
import "./globals.css";

// Latin text is self-hosted IBM Plex; Chinese stays on system faces so no CJK
// webfont ships. Arial survives only as the metric reference for the synthesized
// fallback face (adjustFontFallback), which is what keeps CLS near zero.
const plexSans = localFont({
  src: "./fonts/IBMPlexSansVar-Latin.woff2",
  variable: "--font-geist-sans",
  weight: "100 700",
  style: "normal",
  display: "swap",
  preload: true,
  fallback: ["PingFang SC", "Microsoft YaHei", "Arial", "sans-serif"],
  adjustFontFallback: "Arial",
});

// Plex Mono has no variable release, so two static cuts cover the whole range
// without the browser synthesizing a fake bold.
const plexMono = localFont({
  src: [
    { path: "./fonts/IBMPlexMono-Latin-400.woff2", weight: "100 500", style: "normal" },
    { path: "./fonts/IBMPlexMono-Latin-600.woff2", weight: "501 900", style: "normal" },
  ],
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
  fallback: ["SFMono-Regular", "Consolas", "Liberation Mono", "PingFang SC", "Microsoft YaHei", "monospace"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: siteMetadata.title.en,
  description: siteMetadata.description.en,
};

// The homepage locale is available to the browser before React is. This
// blocking head snippet sets the root language before the first body paint;
// when that locale is Chinese it also discovers the 5KB hero-only serif
// before CSS would otherwise request the 253KB site-wide subset. English
// creates no Chinese-font preload and retains its zero-request contract.
// LanguageProvider remains the owner of persistence, URL canonicalization,
// and later language switches. Artifact Viewer keeps its stricter resolver.
const HOME_LOCALE_BOOTSTRAP = `(()=>{if(location.pathname!=="/")return;const p=new URLSearchParams(location.search);let l=p.get("lang");if(l!=="en"&&l!=="zh"){try{l=localStorage.getItem("portfolio-locale")}catch{}if(l!=="en"&&l!=="zh")l=navigator.language.toLowerCase().startsWith("zh")?"zh":"en"}document.documentElement.lang=l==="zh"?"zh-CN":"en";if(l==="zh"){const f=document.createElement("link");f.rel="preload";f.as="font";f.type="font/woff2";f.href="/fonts/display-serif-zh-home.woff2";f.crossOrigin="anonymous";document.head.appendChild(f)}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: HOME_LOCALE_BOOTSTRAP }} />
        {/* Self-hosted display serif hero preload (spec 2.3): every route
            currently shares this one shell, so the preload lives here for
            now. Once pages are rebuilt per-route, narrow this to only the
            routes that render a serif hero (see globals.css @font-face and
            public/fonts/README.md for licensing / subsetting details). */}
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/fonts/display-serif-latin.woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <LanguageProvider>
          <SkipLink />
          {children}
          <AssistantLauncher />
        </LanguageProvider>
      </body>
    </html>
  );
}

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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`}>
      <head>
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

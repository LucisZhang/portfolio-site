import type { Metadata } from "next";
import localFont from "next/font/local";
import AssistantLauncher from "@/components/assistant/AssistantLauncher";
import CommandPaletteLauncher from "@/components/CommandPaletteLauncher";
import FooterContactLink from "@/components/FooterContactLink";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LocaleLink from "@/components/LocaleLink";
import { LanguageProvider, LocalizedText, type LocalizedString } from "@/lib/i18n";
import { featuredProjects, tracks } from "@/lib/projects";
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

const navItems: { href: string; label: LocalizedString }[] = [
  { href: "/ai", label: { en: "AI applications", zh: "AI 应用" } },
  { href: "/engineering", label: { en: "Engineering", zh: "数据工程" } },
  { href: "/analytics", label: { en: "Analytics", zh: "数据分析" } },
];

function FooterCopy() {
  return <span className="footer-pitch"><LocalizedText text={{ en: "Applied AI, data engineering, and analytics — built to turn ambiguous work into operable systems.", zh: "面向 AI 应用、数据工程与数据分析岗位——把模糊问题转化为可运行的系统。" }} /><FooterContactLink /></span>;
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body>
        <LanguageProvider>
          <header className="site-header">
            <div className="page-shell header-inner">
              <LocaleLink href="/" className="brand"><span className="brand-mark">XGZ</span><LocalizedText className="brand-name" text={{ en: "Xiangguo Zhang", zh: "章向国" }} /></LocaleLink>
              <nav aria-labelledby="primary-navigation-label">
                <span id="primary-navigation-label" className="sr-only"><LocalizedText text={{ en: "Primary navigation", zh: "主要导航" }} /></span>
                {navItems.map((item) => <LocaleLink key={item.href} href={item.href}><LocalizedText text={item.label} /></LocaleLink>)}
              </nav>
              <div className="header-tools">
                <CommandPaletteLauncher tracks={tracks} projects={featuredProjects} />
                <LanguageSwitcher />
              </div>
            </div>
          </header>
          {children}
          <footer><div className="page-shell"><FooterCopy /><span>EN / 中文</span></div></footer>
          <AssistantLauncher />
        </LanguageProvider>
      </body>
    </html>
  );
}

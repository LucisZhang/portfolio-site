import type { Metadata } from "next";
import localFont from "next/font/local";
import AssistantLauncher from "@/components/assistant/AssistantLauncher";
import CommandPalette from "@/components/CommandPalette";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LocaleLink from "@/components/LocaleLink";
import { LanguageProvider, LocalizedText, type LocalizedString } from "@/lib/i18n";
import { featuredProjects, tracks } from "@/lib/projects";
import { siteMetadata } from "@/lib/site-config";
import "./globals.css";

const flourishLatin = localFont({
  src: "./fonts/InterVariable-Latin.woff2",
  variable: "--font-flourish-latin",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: false,
  fallback: ["Arial"],
  adjustFontFallback: "Arial",
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
  return <span className="footer-pitch"><LocalizedText text={{ en: "Applied AI, data engineering, and analytics — built to turn ambiguous work into operable systems.", zh: "面向 AI 应用、数据工程与数据分析岗位——把模糊问题转化为可运行的系统。" }} /><LocaleLink href="/#contact"><LocalizedText text={{ en: "Contact Xiangguo", zh: "联系章向国" }} /></LocaleLink></span>;
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={flourishLatin.variable}>
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
                <CommandPalette tracks={tracks} projects={featuredProjects} />
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

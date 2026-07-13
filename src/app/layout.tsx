import type { Metadata } from "next";
import CommandPalette from "@/components/CommandPalette";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LocaleLink from "@/components/LocaleLink";
import { LanguageProvider, LocalizedText, type LocalizedString } from "@/lib/i18n";
import { featuredProjects, tracks } from "@/lib/projects";
import "@xyflow/react/dist/style.css";
import "./globals.css";


export const metadata: Metadata = {
  title: "Hsiang Kuo Chang | Systems portfolio",
  description: "Data engineering, decision analytics, and applied-AI projects with interactive demos and clear test boundaries.",
};

const navItems: { href: string; label: LocalizedString }[] = [
  { href: "/engineering", label: { en: "Engineering", zh: "数据工程" } },
  { href: "/analytics", label: { en: "Analytics", zh: "数据分析" } },
  { href: "/ai", label: { en: "AI applications", zh: "AI 应用" } },
];

function FooterCopy() {
  return <LocalizedText text={{ en: "Public v1 portfolio. Every project explains what ran and what the result does not establish.", zh: "公开 v1 作品集。每个项目的证据范围以页面所列产物为准。" }} />;
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <header className="site-header">
            <div className="page-shell header-inner">
              <LocaleLink href="/" className="brand"><span className="brand-mark">HKC</span><LocalizedText className="brand-name" text={{ en: "Hsiang Kuo Chang", zh: "章向国" }} /></LocaleLink>
              <nav aria-label="Primary navigation">
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
        </LanguageProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import AssistantLauncher from "@/components/assistant/AssistantLauncher";
import CommandPalette from "@/components/CommandPalette";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LocaleLink from "@/components/LocaleLink";
import { LanguageProvider, LocalizedText, type LocalizedString } from "@/lib/i18n";
import { featuredProjects, tracks } from "@/lib/projects";
import { siteMetadata } from "@/lib/site-config";
import "./globals.css";


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
  return <LocalizedText text={{ en: "Public v1 portfolio. Every project says what actually ran — and what the results don't prove.", zh: "公开 v1 作品集。每个项目说明实际运行了什么，以及结果不能证明什么。" }} />;
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
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

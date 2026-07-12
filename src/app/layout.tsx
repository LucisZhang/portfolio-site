import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import CommandPalette from "@/components/CommandPalette";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { LanguageProvider, LocalizedText, type LocalizedString } from "@/lib/i18n";
import { featuredProjects, tracks } from "@/lib/projects";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hsiang Kuo Chang | Systems portfolio",
  description: "Evidence-backed data engineering, analytics, and AI application case studies.",
};

const navItems: { href: string; label: LocalizedString }[] = [
  { href: "/engineering", label: { en: "Engineering", zh: "数据工程" } },
  { href: "/analytics", label: { en: "Analytics", zh: "数据分析" } },
  { href: "/ai", label: { en: "AI applications", zh: "AI 应用" } },
];

function FooterCopy() {
  return <LocalizedText text={{ en: "Public v1 portfolio. Evidence is scoped to the artifacts named on each project page.", zh: "公开 v1 作品集。每个项目的证据范围以页面所列产物为准。" }} />;
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <LanguageProvider>
          <header className="site-header">
            <div className="page-shell header-inner">
              <Link href="/" className="brand" aria-label="HKC - Hsiang Kuo Chang portfolio home"><span className="brand-mark">HKC</span><LocalizedText className="brand-name" text={{ en: "Hsiang Kuo Chang", zh: "章向国" }} /></Link>
              <nav aria-label="Primary navigation">
                {navItems.map((item) => <Link key={item.href} href={item.href}><LocalizedText text={item.label} /></Link>)}
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

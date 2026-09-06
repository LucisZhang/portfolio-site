import type { Metadata } from "next";
import { Suspense } from "react";
import ArtifactRoute from "@/components/artifacts/ArtifactRoute";
import CommandPaletteLauncher from "@/components/CommandPaletteLauncher";
import FooterContactLink from "@/components/FooterContactLink";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LocaleLink from "@/components/LocaleLink";
import { LocalizedText } from "@/lib/i18n";
import { featuredProjects, tracks } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Project file | Xiangguo Zhang",
  description: "View a project file with context, search, and download controls.",
};

export default function ArtifactPage() {
  return (
    <div className="artifact-document">
      <header className="artifact-site-tools">
        <LocaleLink href="/"><LocalizedText text={{ en: "All projects", zh: "全部项目" }} /></LocaleLink>
        <div className="artifact-tools-actions">
          <CommandPaletteLauncher tracks={tracks} projects={featuredProjects} />
          <LanguageSwitcher />
          <FooterContactLink />
        </div>
      </header>
      <main id="main-content">
        <Suspense fallback={<p role="status"><LocalizedText text={{ en: "Opening project file…", zh: "正在打开项目文件……" }} /></p>}>
          <ArtifactRoute />
        </Suspense>
        <noscript><p>This file viewer needs JavaScript. / 文件查看器需要启用 JavaScript。</p></noscript>
      </main>
    </div>
  );
}

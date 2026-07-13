"use client";

import { FileImage, FileText, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import PrivacyImageLab from "./PrivacyImageLab";
import PrivacyPdfLab from "./PrivacyPdfLab";
import PrivacyTextLab from "./PrivacyTextLab";

type Workspace = "text" | "image" | "pdf";

export default function PrivacyPreflightLab() {
  const { locale } = useI18n();
  const [workspace, setWorkspace] = useState<Workspace>("text");
  const labels = locale === "en"
    ? { title: "Privacy Preflight Web", mode: "Synthetic Sandbox + Deterministic Verifier", local: "Local processing", note: "Your content is processed in this browser. This workspace does not upload files or text.", text: "Text", image: "Image", pdf: "PDF", steps: ["Add", "Scan", "Review", "Preview", "Download"] }
    : { title: "Privacy Preflight Web", mode: "本地脱敏工作区", local: "本地处理", note: "内容仅在当前浏览器中处理；此工作区不会上传文件或文本。", text: "文本", image: "图片", pdf: "PDF", steps: ["添加", "扫描", "复核", "预览", "下载"] };

  const tabs: { id: Workspace; label: string; icon: typeof FileText }[] = [
    { id: "text", label: labels.text, icon: FileText },
    { id: "image", label: labels.image, icon: FileImage },
    { id: "pdf", label: labels.pdf, icon: FileText },
  ];

  return (
    <div className="privacy-lab" id="privacy-web-app" data-testid="privacy-preflight-lab">
      <header className="privacy-lab-header">
        <div>
          <p className="eyebrow">{labels.mode}</p>
          <h3>{labels.title}</h3>
        </div>
        <div className="privacy-local-badge"><ShieldCheck aria-hidden="true" /><span><strong>{labels.local}</strong>{labels.note}</span></div>
      </header>
      <ol className="privacy-mobile-steps" aria-label={locale === "en" ? "Privacy workflow" : "脱敏步骤"}>{labels.steps.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol>
      <div className="privacy-workspace-tabs" role="tablist" aria-label={locale === "en" ? "Redaction workspace" : "脱敏工作区"}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={workspace === id} onClick={() => setWorkspace(id)}>
            <Icon aria-hidden="true" />{label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {workspace === "text" ? <PrivacyTextLab locale={locale} /> : null}
        {workspace === "image" ? <PrivacyImageLab locale={locale} /> : null}
        {workspace === "pdf" ? <PrivacyPdfLab locale={locale} /> : null}
      </div>
    </div>
  );
}

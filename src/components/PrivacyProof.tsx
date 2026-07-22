"use client";

import { Check, ShieldCheck } from "lucide-react";
import dynamic from "next/dynamic";
import ArtifactLink from "@/components/ArtifactLink";
import { useI18n } from "@/lib/i18n";
import OptionalMedia from "./OptionalMedia";
import ProjectProofSection from "./ProjectProofSection";

function PrivacyLabLoading() {
  const { locale } = useI18n();
  return <div className="privacy-lab-loading" aria-live="polite">{locale === "en" ? "Loading local workspace..." : "正在载入本地工作区……"}</div>;
}

const PrivacyPreflightLab = dynamic(() => import("./privacy/PrivacyPreflightLab"), {
  loading: () => <PrivacyLabLoading />,
});
const PrivacyOcrBenchmark = dynamic(() => import("./privacy/PrivacyOcrBenchmark"));

export default function PrivacyProof() {
  const { locale, dict } = useI18n();
  const paths = locale === "en" ? [
    ["Text", "Deterministic entity replacement with review"],
    ["PNG / JPEG", "OCR-guided raster redaction"],
    ["Image-only PDF", "Destructive rendering and validation"],
  ] : [
    ["文本", "可审查的确定性实体替换"],
    ["PNG / JPEG", "OCR 引导的栅格脱敏"],
    ["纯图像 PDF", "破坏式渲染与校验"],
  ];
  return (
    <ProjectProofSection title={dict.evidence} className="tinted-section">
      <PrivacyPreflightLab />
      <PrivacyOcrBenchmark locale={locale} />
      <div className="privacy-paths">{paths.map(([label, detail], index) => <div key={label}><span>{String(index + 1).padStart(2, "0")}</span><strong>{label}</strong><p>{detail}</p></div>)}</div>
      <div className="text-redaction-proof">
        <div><span>{locale === "en" ? "Synthetic input" : "合成输入"}</span><code>{locale === "en" ? "Synthetic demo record for Ada Example. Contact ada@example.com or 415-555-0188. Draft: /Users/demo/Private/brief.txt" : "Ada Example 的合成演示记录。联系方式：ada@example.com 或 415-555-0188。草稿路径：/Users/demo/Private/brief.txt"}</code></div>
        <div><span>{locale === "en" ? "Redacted output" : "脱敏输出"}</span><code>{locale === "en" ? "Synthetic demo record for Ada Example. Contact [EMAIL] or [PHONE]. Draft: [LOCAL_PATH]" : "Ada Example 的合成演示记录。联系方式：[EMAIL] 或 [PHONE]。草稿路径：[LOCAL_PATH]"}</code></div>
      </div>
      <div className="verification-strip"><ShieldCheck aria-hidden="true" /><p><strong>{locale === "en" ? "Tested browser workflow" : "经测试的浏览器流程"}</strong><span>{locale === "en" ? "The worker suite and full browser cases exercise text, image, OCR, PDF, review, and export behavior." : "Worker 套件与完整浏览器用例覆盖文本、图片、OCR、PDF、人工复核与导出流程。"}</span><ArtifactLink href="/case-studies/privacy-preflight/worker-tests-goal-candidate.json">{locale === "en" ? "Open worker results" : "查看 worker 结果"}</ArtifactLink><ArtifactLink href="/case-studies/privacy-preflight/goal-candidate-e2e.json">{locale === "en" ? "Open browser results" : "查看浏览器结果"}</ArtifactLink></p><div className="privacy-verification-metrics release-funded-stats"><div><strong>96</strong><span>{locale === "en" ? "embedded-worker tests passed" : "项嵌入式 worker 测试通过"}</span></div><div><strong>67</strong><span>{locale === "en" ? "recorded end-to-end browser cases" : "个已记录端到端浏览器案例"}</span></div></div></div>
      <div className="redline-grid">
        <span><Check aria-hidden="true" /><strong>{locale === "en" ? "Text" : "文本"}</strong>{locale === "en" ? "Email, phone, and local path replaced in the synthetic fixture." : "合成夹具中的邮箱、电话与本地路径均被替换。"}</span>
        <span><Check aria-hidden="true" /><strong>{locale === "en" ? "Raster" : "栅格图"}</strong>{locale === "en" ? "Detected regions and manual rectangles were burned into a fresh PNG export." : "检测区域与手动矩形被烧录进全新 PNG 导出。"}</span>
        <span><Check aria-hidden="true" /><strong>PDF</strong>{locale === "en" ? "Three known terms absent, text layer empty, and no unapplied redaction annotation." : "三个已知词项均不存在、文本层为空，且无未应用脱敏标注。"}</span>
      </div>
      <OptionalMedia layout="privacy-comparison" candidates={[
        { src: { en: "/case-studies/privacy-preflight/image-synthetic-input.png", zh: "/case-studies/privacy-preflight/image-synthetic-input-zh.svg" }, alt: { en: "Fictional image input before redaction", zh: "脱敏前的虚构图片输入" }, caption: { en: "The input view places email, phone, and local-path fields in a layout suited to OCR review.", zh: "输入视图把邮箱、电话和本地路径放在清晰版式中，便于逐项 OCR 复核。" } },
        { src: { en: "/case-studies/privacy-preflight/image-synthetic-redacted.png", zh: "/case-studies/privacy-preflight/image-synthetic-redacted-zh.svg" }, alt: { en: "Fictional image output after redaction", zh: "脱敏后的虚构图片输出" }, caption: { en: "The result burns the three reviewed regions into a newly generated PNG.", zh: "结果将三个已复核区域直接烧录进新生成的 PNG。" }, zhPresentationDerivative: true },
        { src: { en: "/case-studies/privacy-preflight/pdf-synthetic-input-preview.png", zh: "/case-studies/privacy-preflight/pdf-synthetic-input-preview-zh.svg" }, alt: { en: "Fictional PDF input preview", zh: "虚构 PDF 输入预览" }, caption: { en: "The PDF review view aligns detected fields with their page positions before export.", zh: "PDF 复核视图把检测字段与页面位置对齐，导出前可逐项检查。" } },
        { src: { en: "/case-studies/privacy-preflight/pdf-synthetic-redacted-preview.png", zh: "/case-studies/privacy-preflight/pdf-synthetic-redacted-preview-zh.svg" }, alt: { en: "Destructive PDF redaction preview", zh: "破坏式 PDF 脱敏预览" }, caption: { en: "The image-only result shows the reviewed regions flattened into the rebuilt PDF pages.", zh: "纯图像结果展示已复核区域被扁平化写入重建后的 PDF 页面。" }, zhPresentationDerivative: true },
      ]} />
    </ProjectProofSection>
  );
}

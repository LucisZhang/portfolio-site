"use client";

import { Check, Download, ShieldCheck } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
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
      <div className="verification-strip"><ShieldCheck aria-hidden="true" /><p><strong>{locale === "en" ? "Documented local verification" : "已记录的本地验证"}</strong><span>{locale === "en" ? "Embedded-worker verification and browser workflow verification remain separate evidence sets." : "嵌入式 worker 验证与浏览器流程验证保持为两组独立证据。"}</span><ArtifactLink href="/case-studies/privacy-preflight/worker-tests-goal-candidate.json">{locale === "en" ? "Open current worker verification" : "查看当前 worker 验证"}</ArtifactLink><ArtifactLink href="/case-studies/privacy-preflight/goal-candidate-e2e.json">{locale === "en" ? "Open current browser verification" : "查看当前浏览器验证"}</ArtifactLink><ArtifactLink href="/case-studies/privacy-preflight/browser-e2e-checkpoint.json">{locale === "en" ? "Open historical browser checkpoint" : "查看历史浏览器检查点"}</ArtifactLink></p><div className="privacy-verification-metrics release-funded-stats"><div><strong>96</strong><span>{locale === "en" ? "embedded-worker tests passed" : "项嵌入式 worker 测试通过"}</span></div><div><strong>67</strong><span>{locale === "en" ? "recorded end-to-end browser cases · 2026-07-13 checkpoint" : "个已记录端到端浏览器案例 · 2026-07-13 检查点"}</span></div></div></div>
      <div className="privacy-macos-status" id="privacy-macos-status">
        <div className="privacy-macos-download-hero">
          <Image className="privacy-macos-app-icon" src="/case-studies/privacy-preflight/app-icon.svg" width={176} height={176} alt={locale === "en" ? "Privacy Preflight app icon" : "Privacy Preflight 应用图标"} />
          <div>
            <p className="eyebrow">{locale === "en" ? "Apple-silicon preview · arm64 only · ad-hoc signed only · not notarized" : "Apple 芯片预览版 · 仅 arm64 · 仅 ad-hoc 签名 · 未公证"}</p>
            <h3>Privacy Preflight</h3>
            <p className="privacy-macos-product-line">{locale === "en" ? "Standalone local review app for macOS 14 or later" : "适用于 macOS 14 及以上版本的本地独立复核应用"}</p>
            <a className="privacy-macos-download-button" href="/case-studies/privacy-preflight/downloads/Privacy-Preflight-0.1.0-macOS-arm64-unnotarized.zip" download><Download aria-hidden="true" />{locale === "en" ? "Download macOS arm64 preview (unnotarized)" : "下载 macOS arm64 预览版（未公证）"}</a>
            <dl className="privacy-macos-artifact-meta">
              <div><dt>{locale === "en" ? "Version" : "版本"}</dt><dd>0.1.0</dd></div>
              <div><dt>{locale === "en" ? "Size" : "大小"}</dt><dd>{locale === "en" ? "33,930,369 bytes" : "33,930,369 字节"}</dd></div>
              <div><dt>SHA-256</dt><dd><code>360083a7fab6b60600f597b28a32c533a9df932766c21b80cba80e6c56350911</code></dd></div>
            </dl>
            <small>{locale === "en" ? "Icon sourced from the runtime-matching app source archive." : "图标取自与运行时匹配的应用源码归档。"}</small>
          </div>
        </div>
        <div className="privacy-macos-first-open">
          <h4>{locale === "en" ? "First open with Gatekeeper" : "首次打开与 Gatekeeper"}</h4>
          <p>{locale === "en" ? "Move the app to Applications. Control-click it, choose Open, then confirm Open. On macOS Sequoia, if it is still blocked, open System Settings > Privacy & Security, scroll to Security, choose Open Anyway, and confirm. Do not disable Gatekeeper globally." : "将应用移到“应用程序”。按住 Control 键点按应用，选择“打开”，再确认“打开”。若在 macOS Sequoia 中仍被拦截，请进入“系统设置 > 隐私与安全性”，滚动到“安全性”，选择“仍要打开”并确认。请勿全局关闭 Gatekeeper。"}</p>
          <p>{locale === "en" ? "Verified on the build Mac only. This preview has no Developer ID signature or notarization ticket, and Gatekeeper acceptance was not established. Clean-Mac compatibility and Apple approval are not claimed." : "本预览版仅在构建所用 Mac 上完成验证。它没有 Developer ID 签名或公证票据，且尚未证明可通过 Gatekeeper；不声称已验证全新 Mac 兼容性或获得 Apple 批准。"}</p>
        </div>
      </div>
      <div className="redline-grid">
        <span><Check aria-hidden="true" /><strong>{locale === "en" ? "Text" : "文本"}</strong>{locale === "en" ? "Email, phone, and local path replaced in the synthetic fixture." : "合成夹具中的邮箱、电话与本地路径均被替换。"}</span>
        <span><Check aria-hidden="true" /><strong>{locale === "en" ? "Raster" : "栅格图"}</strong>{locale === "en" ? "Detected regions and manual rectangles were burned into a fresh PNG export." : "检测区域与手动矩形被烧录进全新 PNG 导出。"}</span>
        <span><Check aria-hidden="true" /><strong>PDF</strong>{locale === "en" ? "Three known terms absent, text layer empty, and no unapplied redaction annotation." : "三个已知词项均不存在、文本层为空，且无未应用脱敏标注。"}</span>
      </div>
      <OptionalMedia layout="privacy-comparison" candidates={[
        { src: "/case-studies/privacy-preflight/swiftui-app.png", alt: { en: "Historical Privacy Preflight SwiftUI development-app capture", zh: "Privacy Preflight SwiftUI 开发应用历史截图" }, caption: { en: "Historical development-app capture; separate from the current arm64 preview. The downloadable preview is ad-hoc signed only and not notarized.", zh: "历史开发应用截图；与当前 arm64 预览版分开。可下载预览版仅使用 ad-hoc 签名，未经公证。截图为英文界面的已记录开发画面；中文界面需从 SwiftUI 开发应用重新捕获。" } },
        { src: { en: "/case-studies/privacy-preflight/image-synthetic-input.png", zh: "/case-studies/privacy-preflight/image-synthetic-input-zh.svg" }, alt: { en: "Fictional image input before redaction", zh: "脱敏前的虚构图片输入" }, caption: { en: "Synthetic PNG input; all identity data is fictional.", zh: "中文合成输入；所有身份数据均为虚构，并与英文夹具使用相同的虚构值。" } },
        { src: { en: "/case-studies/privacy-preflight/image-synthetic-redacted.png", zh: "/case-studies/privacy-preflight/image-synthetic-redacted-zh.svg" }, alt: { en: "Fictional image output after redaction", zh: "脱敏后的虚构图片输出" }, caption: { en: "Fresh PNG export after OCR-guided redaction.", zh: "OCR 引导脱敏后的全新 PNG 导出。" }, zhPresentationDerivative: true },
        { src: { en: "/case-studies/privacy-preflight/pdf-synthetic-input-preview.png", zh: "/case-studies/privacy-preflight/pdf-synthetic-input-preview-zh.svg" }, alt: { en: "Fictional PDF input preview", zh: "虚构 PDF 输入预览" }, caption: { en: "Synthetic PDF input preview.", zh: "中文合成 PDF 输入预览；虚构值与英文夹具一致。" } },
        { src: { en: "/case-studies/privacy-preflight/pdf-synthetic-redacted-preview.png", zh: "/case-studies/privacy-preflight/pdf-synthetic-redacted-preview-zh.svg" }, alt: { en: "Destructive PDF redaction preview", zh: "破坏式 PDF 脱敏预览" }, caption: { en: "Image-only PDF output; the validation record reports an empty extractable text layer.", zh: "纯图像 PDF 输出；验证记录显示可提取文本层为空。" }, zhPresentationDerivative: true },
      ]} />
    </ProjectProofSection>
  );
}

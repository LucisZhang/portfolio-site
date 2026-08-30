import type { Locale } from "@/lib/i18n";
import ocrBenchmark from "../../../public/case-studies/privacy-preflight/ocr-fixture-benchmark.json";

// Task 3.2 (spec §6.0 template: "hero two-col: right = compact
// instrument", same component grammar as compact/full elsewhere on the
// site). The real interactive workbench (PrivacyPreflightLab) is heavy —
// three tabs, canvas/PDF review panes — and mounting a second live copy of
// it in the hero would duplicate every button's accessible name on the
// page (two "SCAN" buttons, two Text/Image/PDF tab groups), which breaks
// role-based selectors sitewide. This compact preview is a read-only,
// same-visual-language snapshot instead: the same mono readout grammar as
// InstrumentFrame's other compact variants, showing one real, sourced
// number (the OCR fixture benchmark) rather than a second interactive
// control surface. It is a plain server component, so it renders with
// JavaScript disabled too.
export default function PrivacyCompactPreview({ locale }: { locale: Locale }) {
  const summary = ocrBenchmark.summary;
  return (
    <div className="privacy-compact-preview" data-testid="privacy-compact-preview">
      <p className="privacy-compact-preview-line">
        <code>ada@example.com</code>
        <span aria-hidden="true">→</span>
        <code>[EMAIL]</code>
      </p>
      <p className="privacy-compact-preview-status">
        {locale === "en"
          ? `OCR fixture recall ${summary.hitCount}/${summary.expectedCount} · ${summary.falsePositiveCount} false positives`
          : `OCR 夹具召回 ${summary.hitCount}/${summary.expectedCount} · 误报 ${summary.falsePositiveCount} 项`}
      </p>
    </div>
  );
}

import { Check, X } from "lucide-react";
import { applyRedactions, validateRedaction, type SensitiveEntity } from "@/lib/privacy-redaction";
import type { Locale } from "@/lib/i18n";

// Task 3.2 (spec §6.4 exhibit 04, "Export is earned by a second read."):
// drives the SAME validateRedaction/applyRedactions functions the real
// workbench uses (src/lib/privacy-redaction.ts) against a crafted, fixed
// input, so the failure is deterministic and reproducible rather than
// randomly triggerable. A pure server component (no "use client", no
// browser API) -- it renders with JavaScript disabled exactly like it does
// with JavaScript on (spec §6.0's no-JS requirement for exhibits 01-04).
//
// The craft: the same email string appears twice in the input, but only
// the FIRST occurrence is accepted for redaction. applyRedactions replaces
// only that one match, so the produced "safe preview" still contains the
// second, unredacted copy -- validateRedaction's residual-value check
// catches this and reports safe: false. This is the exact same fail-closed
// gate a reviewer triggers for real in exhibit 01 by rejecting one
// accepted detection (see privacy-r2.spec.ts's "reviewer-driven
// fail-closed gate" test) -- never a silent pass.
const EMAIL = "ada@example.com";
const CRAFTED_INPUT = `Synthetic escalation note. Contact ${EMAIL} immediately; if unreachable, the backup contact is also ${EMAIL}.`;
const firstStart = CRAFTED_INPUT.indexOf(EMAIL);
const firstEnd = firstStart + EMAIL.length;
const secondStart = CRAFTED_INPUT.indexOf(EMAIL, firstEnd);
const secondEnd = secondStart + EMAIL.length;

const CRAFTED_ENTITY: SensitiveEntity = {
  id: "exhibit-04-crafted-email",
  type: "EMAIL",
  start: firstStart,
  end: firstEnd,
  text: EMAIL,
  reason: "Matched by the same deterministic text rule exhibit 01 uses.",
  replacement: "[EMAIL]",
  action: "replace",
  accepted: true,
  source: "manual",
};

const craftedOutput = applyRedactions(CRAFTED_INPUT, [CRAFTED_ENTITY]);
const craftedValidation = validateRedaction(CRAFTED_INPUT, craftedOutput, [CRAFTED_ENTITY]);

export default function PrivacyFailClosedExhibit({ locale }: { locale: Locale }) {
  const copy = locale === "en" ? {
    intro: "This demonstration accepts only the first of two identical values in the crafted copy below, leaving the second one un-reviewed on purpose. The same residual-value check runs on every real review — reject an accepted detection in exhibit 01 and you will see the same gate trigger live.",
    workingCopy: "Crafted working copy",
    notes: "Editor's notes",
    entityFate: "manual — destroy",
    residualLabel: "residual — never reviewed, still present",
    export: "Export",
    blocked: "blocked — the safe preview is never released while a residual value remains.",
    safeStatus: "SAFE TO EXPORT",
    unsafeStatus: "UNSAFE TO EXPORT",
  } : {
    intro: "下面这段构造副本故意只接受了两处相同值中的第一处，另一处始终未经复核——这与真实复核用的是同一条残留值校验：在展区 01 拒绝一次已接受的检测，就能亲手触发同一道关卡。",
    workingCopy: "构造工作副本",
    notes: "编者按语",
    entityFate: "手动 — 销毁",
    residualLabel: "残留——从未复核，仍然存在",
    export: "导出",
    blocked: "被拦下——只要还残留原始值，安全预览就绝不会放行。",
    safeStatus: "可以导出",
    unsafeStatus: "禁止导出",
  };

  return (
    <div className="privacy-fail-closed-exhibit" data-testid="privacy-fail-closed-exhibit">
      <p className="privacy-fail-closed-intro">{copy.intro}</p>
      <div className="privacy-galley-grid">
        <section>
          <p className="galley-label">{copy.workingCopy}</p>
          <p className="doc">
            {CRAFTED_INPUT.slice(0, firstStart)}
            <span className="doc-strike">
              <s>{EMAIL}</s>
              <sup>1</sup> <span className="tok">[EMAIL]</span>
            </span>
            {CRAFTED_INPUT.slice(firstEnd, secondStart)}
            <span className="doc-residual">{EMAIL}</span>
            {CRAFTED_INPUT.slice(secondEnd)}
          </p>
        </section>
        <aside className="privacy-notes" aria-label={copy.notes}>
          <p className="galley-label">{copy.notes}</p>
          <div className="privacy-note">
            <b>1</b>
            <i>EMAIL</i> · {copy.entityFate}
          </div>
          <p className="privacy-fail-closed-residual-note">{copy.residualLabel}</p>
        </aside>
      </div>
      {/* Fix (reviewer finding, Critical): this used to reuse
          .privacy-validation, the same GLOBAL class the live workbench's
          own pass/fail state uses (globals.css, shared by
          PrivacyTextLab/ImageLab/PdfLab). Since this exhibit is
          deliberately always-failing and sits on the same page as the live
          workbench, tests/e2e/portfolio.spec.ts's legacy "Privacy Preflight
          Web" suite -- which selects `.privacy-validation` /
          `.privacy-validation.fail` globally, not scoped to exhibit 01 --
          started matching this exhibit's element too (a strict-mode
          violation on the "2+ matches" tests, a false non-zero count on the
          "expects 0" tests). A distinct class with its own --danger styling
          fixes the collision without touching the live workbench's markup.
          Task F6 keeps this block byte-for-byte the same treatment. */}
      <div className={`privacy-fail-closed-status ${craftedValidation.safe ? "pass" : "fail"}`} aria-live="polite">
        <div>{craftedValidation.safe ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}<strong>{craftedValidation.safe ? copy.safeStatus : copy.unsafeStatus}</strong></div>
        <p>{copy.export} {copy.blocked}</p>
      </div>
    </div>
  );
}

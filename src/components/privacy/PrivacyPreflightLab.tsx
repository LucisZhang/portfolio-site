"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { ActionLineRow, workspaceLinkItems, type PrivacyWorkspace } from "./PrivacyActionLine";
import PrivacyImageLab from "./PrivacyImageLab";
import PrivacyPdfLab from "./PrivacyPdfLab";
import PrivacyTextLab from "./PrivacyTextLab";

// Task F6 (direction B, "the document is the interface"): the old boxed
// .privacy-lab shell (border + background), .privacy-lab-status "Local
// processing" callout, and the .privacy-workspace-bar (boxed tab buttons +
// a boxed "USE A SAMPLE FILE" CTA) are gone. PrivacyTextLab now renders the
// exhibit's single mono action line itself (it owns SCAN and the strike
// hint); this wrapper renders the shorter mode-switch line only while the
// Image or PDF workspace is active -- the Text workspace's own line already
// carries the TEXT/IMAGE/PDF words (see PrivacyActionLine.tsx). USE A
// SAMPLE FILE / TEXT / IMAGE / PDF stay `role="tab"`-compatible (an accepted
// deviation from the literal mock, which omits the active mode's own word --
// keeping it present with `aria-selected` is what lets the existing
// keyboard/axe audit in quality.spec.ts keep working) even though their
// chrome is now plain mono text, not a boxed tab bar.
export default function PrivacyPreflightLab() {
  const { locale } = useI18n();
  const [workspace, setWorkspace] = useState<PrivacyWorkspace>("text");
  const [imageSampleTrigger, setImageSampleTrigger] = useState(0);
  const [pdfSampleTrigger, setPdfSampleTrigger] = useState(0);

  // Recruiters land on this page with no file of their own -- one action,
  // always reachable regardless of the active workspace, loads a real
  // sample into whichever workspace makes sense: the PDF workspace keeps
  // its own sample, every other workspace jumps to Image (the Text
  // workspace is already prefilled, so it has nothing to sample into).
  function useSampleFile() {
    if (workspace === "pdf") {
      setPdfSampleTrigger((count) => count + 1);
      return;
    }
    setWorkspace("image");
    setImageSampleTrigger((count) => count + 1);
  }

  return (
    <div className="privacy-lab" id="privacy-web-app" data-testid="privacy-preflight-lab">
      {workspace === "text" ? (
        <PrivacyTextLab locale={locale} onSwitch={setWorkspace} onSample={useSampleFile} />
      ) : (
        <>
          <ActionLineRow
            items={[
              {
                key: "sample",
                node: (
                  <button type="button" className="privacy-action-link privacy-sample-link" onClick={useSampleFile}>
                    {locale === "en" ? "USE A SAMPLE FILE" : "使用示例文件"}
                  </button>
                ),
              },
              ...workspaceLinkItems(workspace, setWorkspace, locale === "en" ? "Redaction workspace" : "脱敏工作区"),
            ]}
          />
          <div role="tabpanel">
            {workspace === "image" ? <PrivacyImageLab locale={locale} sampleTrigger={imageSampleTrigger} /> : null}
            {workspace === "pdf" ? <PrivacyPdfLab locale={locale} sampleTrigger={pdfSampleTrigger} /> : null}
          </div>
        </>
      )}
    </div>
  );
}

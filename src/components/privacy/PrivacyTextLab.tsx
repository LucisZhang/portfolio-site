"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  applyRedactions,
  normalizeEntity,
  scanSensitiveText,
  validateRedaction,
  type SensitiveEntity,
} from "@/lib/privacy-redaction";
import { privacySourceLabel } from "@/lib/privacy-localization";
import type { Locale } from "@/lib/i18n";
import { ActionLineRow, workspaceLinkItems, type PrivacyWorkspace } from "./PrivacyActionLine";

// Task F12 (user-ordered sample enrichment, verbatim: "右侧的示例可以多一点... 建议
// 多加几个这种示例"): the original sample only produced 3-4 real detections
// (EMAIL/PHONE/LOCAL_PATH, plus SCHOOL on zh), leaving "Editor's notes" and
// "What leaves the browser" looking sparse. Both strings below are extended
// -- independently written, not translations of each other -- to exercise 7
// of the 7 entity types src/lib/privacy-redaction.ts actually detects
// (EMAIL, PHONE, LOCAL_PATH, IP_ADDRESS, URL, the SCHOOL dictionary, and the
// long-mixed-alphanumeric ID rule), while staying obviously synthetic
// (fictional "Ada Example", RFC 5737/documentation-style values). PERSON and
// ADDRESS entity types have no detector in privacy-redaction.ts (no NER) and
// a bank-card-style all-digit number does not satisfy the ID rule's
// letter+digit lookahead; adding either is a new detector class, not a
// trivial regex extension, so those stay out of scope here (see
// task-F12-report.md).
// Numeric literals (phone digits, IP, tracking id) are kept byte-identical
// across both locale strings on purpose -- scripts/check-localization.mjs's
// numeric-parity gate diffs every visible numeric token between the en and
// zh render of this route, so a fictional phone/IP/id must read the same in
// both rather than being independently localized like the surrounding prose.
const examples: Record<Locale, string> = {
  en: "Synthetic demo record for Ada Example. Contact ada@example.com or 415-555-0188. Draft saved to /Users/demo/Private/brief.txt, mirrored at 10.0.2.15 and posted at https://example.com/ada-example/brief. Ada studied at Beijing Institute of Technology; tracking id 3f9a7c1e2b6d4859a0c7e3f1b2d4a6c8.",
  zh: "这是虚构记录，仅用于演示。邮箱 ada@example.com，电话 415-555-0188。草稿位于 /Users/demo/Private/brief.txt，备份地址 10.0.2.15，详情见 https://example.com/ada-example/brief 页面。教育经历：北京理工大学；追踪编号 3f9a7c1e2b6d4859a0c7e3f1b2d4a6c8。",
};

// Task F6 (direction B, "the document is the interface"): the reviewer's
// only two moves are SCAN (re-run detection, restoring every toggle to its
// default "flagged for destruction" state) and clicking a strike (toggle
// that one detection between destroy and keep). There is no separate raw
// textarea, undo/redo, per-entity boundary editing, mask/remove action, or
// confirm-review gate -- the working copy IS the review surface, and "what
// leaves the browser" reflects every toggle live. This trades the Round-1
// panel's fine-grained editing controls for the approved direction's zero-
// button grammar; src/lib/privacy-redaction.ts (scanSensitiveText /
// applyRedactions / validateRedaction) is unchanged and still drives every
// number and string shown here -- see task-F6-report.md for the full
// before/after parity inventory. Entity type names (EMAIL/PHONE/SCHOOL/...)
// stay English in both locales -- the same precedent the pre-existing zh
// fixture test already relies on (a rejected "SCHOOL" detection is asserted
// by that literal English word even on the zh route).
export default function PrivacyTextLab({
  locale,
  onSwitch,
  onSample,
}: {
  locale: Locale;
  onSwitch: (next: PrivacyWorkspace) => void;
  onSample: () => void;
}) {
  const copy = locale === "en" ? {
    scan: "Scan for sensitive information",
    hint: "CLICK A STRIKE TO KEEP IT",
    workingCopy: "Working copy — marked like a proof",
    editorsNotes: "Editor's notes",
    whatLeaves: "What leaves the browser",
    destroy: "destroy",
    keep: "keep",
    verdictPrefix: "re-scan of the clean copy:",
    match: (count: number) => `${count} ${count === 1 ? "match" : "matches"}.`,
    exportAllowed: "export allowed.",
    exportBlocked: "export blocked.",
    strikeAria: (type: string, index: number, kept: boolean) =>
      `${type} detection ${index}, ${kept ? "kept — click to flag for destruction" : "flagged for destruction — click to keep it"}`,
    scanAria: "Re-scan the working copy and reset every detection to its default fate",
  } : {
    scan: "扫描并查找敏感信息",
    hint: "点击删除线即可保留",
    workingCopy: "工作副本——按校样标记",
    editorsNotes: "编者按语",
    whatLeaves: "离开浏览器的内容",
    destroy: "销毁",
    keep: "保留",
    verdictPrefix: "对洁净副本重新扫描：",
    match: (count: number) => `${count} 处匹配。`,
    exportAllowed: "允许导出。",
    exportBlocked: "导出被拦截。",
    strikeAria: (type: string, index: number, kept: boolean) =>
      `第 ${index} 处 ${type} 检测，${kept ? "已保留——点击改为销毁" : "已标记销毁——点击改为保留"}`,
    scanAria: "重新扫描工作副本，将每处检测重置为默认结果",
  };

  const input = useMemo(() => examples[locale], [locale]);
  const [entities, setEntities] = useState<SensitiveEntity[]>(() => scanSensitiveText(examples[locale], "balanced"));

  // Fix: useI18n() resolves the persisted locale from localStorage after
  // hydration -- the very first client render (and every no-JS/SSR render)
  // sees whatever default locale the page opened with. The useState
  // initializer above only ever runs once, against THAT first-render
  // locale, so a locale flip shortly after mount (e.g. a saved "zh"
  // preference) left `entities` scanned against the wrong-language string
  // while `input` (recomputed every render via the memo above) had already
  // moved on -- a real reviewer visiting with a saved zh preference would
  // see a working copy whose strikes did not line up with the text. Only
  // re-scan when the locale genuinely changes after mount, not on every
  // render, so in-progress keep/destroy toggles survive normal re-renders.
  const previousLocale = useRef(locale);
  useEffect(() => {
    if (previousLocale.current === locale) return;
    previousLocale.current = locale;
    setEntities(scanSensitiveText(examples[locale], "balanced"));
  }, [locale]);

  const sortedEntities = useMemo(
    () => entities.map((entity) => normalizeEntity(entity, input)).sort((a, b) => a.start - b.start || a.end - b.end),
    [entities, input],
  );
  const output = useMemo(() => applyRedactions(input, entities), [input, entities]);
  const validation = useMemo(() => validateRedaction(input, output, entities), [input, output, entities]);
  const rescanMatches = useMemo(() => scanSensitiveText(output, "strict").length, [output]);

  function rescan() {
    setEntities(scanSensitiveText(input, "balanced"));
  }

  function toggleEntity(id: string) {
    setEntities((current) => current.map((entity) => (entity.id === id ? { ...entity, accepted: !entity.accepted } : entity)));
  }

  function renderGalley() {
    const parts: React.ReactNode[] = [];
    let cursor = 0;
    sortedEntities.forEach((entity, index) => {
      if (entity.start < cursor || entity.end <= entity.start) return;
      parts.push(<span key={`text-${entity.id}`}>{input.slice(cursor, entity.start)}</span>);
      const number = index + 1;
      const kept = !entity.accepted;
      parts.push(
        <button
          key={entity.id}
          type="button"
          className={`doc-strike${kept ? " kept" : ""}`}
          aria-pressed={kept}
          aria-label={copy.strikeAria(entity.type, number, kept)}
          onClick={() => toggleEntity(entity.id)}
        >
          {kept ? (
            <>
              {entity.text}
              <sup>{number}</sup>
            </>
          ) : (
            <>
              <s>{entity.text}</s>
              <sup>{number}</sup> <span className="tok">{entity.replacement || `[${entity.type}]`}</span>
            </>
          )}
        </button>,
      );
      cursor = entity.end;
    });
    parts.push(<span key="tail">{input.slice(cursor)}</span>);
    return parts;
  }

  function renderCleanOutput() {
    const applicable = sortedEntities.filter((entity) => entity.accepted && entity.end > entity.start);
    const nonOverlapping: SensitiveEntity[] = [];
    for (const entity of applicable) {
      if (!nonOverlapping.some((item) => item.start < entity.end && entity.start < item.end)) nonOverlapping.push(entity);
    }
    const parts: React.ReactNode[] = [];
    let cursor = 0;
    nonOverlapping.forEach((entity) => {
      parts.push(<span key={`out-text-${entity.id}`}>{input.slice(cursor, entity.start)}</span>);
      parts.push(
        <span className="tok" key={`out-tok-${entity.id}`}>
          {entity.replacement || `[${entity.type}]`}
        </span>,
      );
      cursor = entity.end;
    });
    parts.push(<span key="out-tail">{input.slice(cursor)}</span>);
    return parts;
  }

  return (
    <div className="privacy-text-workspace privacy-galley">
      <ActionLineRow
        ariaLabel={locale === "en" ? "Workbench actions" : "工作台操作"}
        items={[
          {
            key: "scan",
            node: (
              <button type="button" className="privacy-action-link privacy-scan-link current" aria-label={copy.scanAria} onClick={rescan}>
                SCAN
              </button>
            ),
          },
          {
            key: "sample",
            node: (
              <button type="button" className="privacy-action-link privacy-sample-link" onClick={onSample}>
                {locale === "en" ? "USE A SAMPLE FILE" : "使用示例文件"}
              </button>
            ),
          },
          ...workspaceLinkItems("text", onSwitch, locale === "en" ? "Redaction workspace" : "脱敏工作区"),
          { key: "hint", node: <span className="privacy-action-hint">{copy.hint}</span> },
        ]}
      />

      <div className="privacy-galley-grid">
        <section>
          <p className="galley-label">{copy.workingCopy}</p>
          <p className="doc" data-testid="privacy-galley-doc">
            {renderGalley()}
          </p>
        </section>
        <aside className="privacy-notes" aria-label={copy.editorsNotes}>
          <p className="galley-label">{copy.editorsNotes}</p>
          {sortedEntities.map((entity, index) => (
            <div className="privacy-note" data-testid="privacy-note" key={entity.id}>
              <b>{index + 1}</b>
              <i>{entity.type}</i> · {privacySourceLabel(locale, entity.source)} —{" "}
              {entity.accepted ? copy.destroy : copy.keep}
            </div>
          ))}
          <div
            className={`privacy-verdict ${validation.safe ? "pass" : "fail"}`}
            aria-live="polite"
            data-testid="privacy-verdict"
          >
            {copy.verdictPrefix} {copy.match(rescanMatches)} <u>{validation.safe ? copy.exportAllowed : copy.exportBlocked}</u>
          </div>
        </aside>
      </div>

      <div className="privacy-after">
        <p className="galley-label">{copy.whatLeaves}</p>
        <p data-testid="privacy-safe-output">{renderCleanOutput()}</p>
      </div>
    </div>
  );
}

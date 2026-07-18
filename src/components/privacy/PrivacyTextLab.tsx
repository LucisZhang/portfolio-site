"use client";

import { Check, Clipboard, Download, Plus, Redo2, RotateCcw, ScanSearch, Trash2, Undo2, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import {
  applyRedactions,
  normalizeEntity,
  scanSensitiveText,
  validateRedaction,
  type RedactionAction,
  type ScanMode,
  type SensitiveEntity,
} from "@/lib/privacy-redaction";
import type { Locale } from "@/lib/i18n";

interface Snapshot {
  input: string;
  entities: SensitiveEntity[];
  mode: ScanMode;
}

const examples: Record<Locale, string> = {
  en: "Synthetic record for Ada Example. Email ada@example.com, phone 415-555-0188, draft /Users/demo/Private/brief.txt, and service URL https://internal.example.test/review.",
  zh: "这是虚构记录。邮箱 ada@example.com，电话 415-555-0188，草稿位于 /Users/demo/Private/brief.txt。\n教育经历：北京理工大学。",
};

const reasonZh: Record<string, string> = {
  "Matched a standard email address pattern.": "匹配标准邮箱地址模式。",
  "Matched a phone-like pattern containing 10 to 15 digits.": "匹配包含 10 至 15 位数字的电话模式。",
  "Matched a web URL pattern.": "匹配网页 URL 模式。",
  "Matched an IPv4 address pattern.": "匹配 IPv4 地址模式。",
  "Matched a local filesystem path.": "匹配本地文件系统路径。",
  "Matched a known credential prefix and structure.": "匹配已知凭证前缀与结构。",
  "Matched a long mixed alphanumeric identifier.": "匹配较长的字母数字混合标识符。",
  "Matched the local public dictionary for SCHOOL.": "匹配本地公开字典中的学校条目。",
};

function cloneEntities(entities: SensitiveEntity[]) {
  return entities.map((entity) => ({ ...entity }));
}

export default function PrivacyTextLab({ locale }: { locale: Locale }) {
  const copy = locale === "en" ? {
    load: "Load synthetic example", scan: "Scan", undo: "Undo", reset: "Reset", balanced: "Balanced", strict: "Strict",
    input: "Input", inputHint: "Paste text here. It remains in this browser tab.", highlighted: "Highlighted source", detections: "Review detections",
    output: "Safe preview", copy: "Copy", download: "Download .txt", add: "Add selected text", empty: "No detections yet.",
    accept: "Accept", reject: "Reject", removeHit: "Delete detection", start: "Start", end: "End", replacement: "Replacement", action: "Action",
    mask: "Mask", replace: "Replace", remove: "Remove", all: "Set all", reason: "Reason", validation: "Local verification",
    pass: "Pass: accepted source values and detectable patterns are absent.", fail: "Not safe to export yet.", none: "Run a scan and accept at least one detection.",
    original: "Residual original values", types: "Remaining detectable types", manualHelp: "Select text in the input, then add a manual detection.",
    copied: "Copied", downloaded: "Downloaded", noSelection: "Select a non-empty range in the input first.",
  } : {
    load: "载入合成示例", scan: "重新扫描", undo: "撤销", reset: "重置", balanced: "平衡", strict: "严格",
    input: "输入", inputHint: "在此粘贴文本，内容仅保留在当前浏览器标签页。", highlighted: "高亮原文", detections: "逐项复核",
    output: "安全预览", copy: "复制", download: "下载 .txt", add: "新增所选文本", empty: "尚无检测结果。",
    accept: "接受", reject: "拒绝", removeHit: "删除命中", start: "起点", end: "终点", replacement: "替换值", action: "动作",
    mask: "遮罩", replace: "替换", remove: "移除", all: "全部设置", reason: "原因", validation: "本地验证",
    pass: "通过：已接受的原始值和可检测模式均未残留。", fail: "尚不适合安全导出。", none: "请先扫描并至少接受一个命中。",
    original: "残留原始值", types: "仍可检测类型", manualHelp: "先在输入框选择文本，再新增手动命中。",
    copied: "已复制", downloaded: "已下载", noSelection: "请先在输入框选择非空文本。",
  };

  const [input, setInput] = useState("");
  const [entities, setEntities] = useState<SensitiveEntity[]>([]);
  const [mode, setMode] = useState<ScanMode>("balanced");
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const output = useMemo(() => applyRedactions(input, entities), [input, entities]);
  const validation = useMemo(() => validateRedaction(input, output, entities), [input, output, entities]);

  function remember() {
    setHistory((current) => [...current.slice(-19), { input, entities: cloneEntities(entities), mode }]);
  }

  function replaceEntities(next: SensitiveEntity[] | ((current: SensitiveEntity[]) => SensitiveEntity[])) {
    remember();
    setEntities((current) => typeof next === "function" ? next(current) : next);
    setNotice("");
  }

  function loadExample() {
    remember();
    const next = examples[locale];
    setInput(next);
    setEntities(scanSensitiveText(next, mode));
    setNotice("");
  }

  function rescan() {
    remember();
    setEntities(scanSensitiveText(input, mode));
    setNotice("");
  }

  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    setInput(previous.input);
    setEntities(cloneEntities(previous.entities));
    setMode(previous.mode);
    setHistory((current) => current.slice(0, -1));
    setNotice("");
  }

  function reset() {
    remember();
    setInput("");
    setEntities([]);
    setMode("balanced");
    setNotice("");
  }

  function addManual() {
    const textarea = inputRef.current;
    if (!textarea || textarea.selectionEnd <= textarea.selectionStart) {
      setNotice(copy.noSelection);
      textarea?.focus();
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const manual: SensitiveEntity = {
      id: `manual-${history.length}-${start}-${end}`,
      type: "CUSTOM",
      start,
      end,
      text: input.slice(start, end),
      reason: locale === "en" ? "Added manually by the reviewer." : "由复核者手动新增。",
      replacement: "[CUSTOM]",
      action: "replace",
      accepted: true,
      source: "manual",
    };
    replaceEntities((current) => [...current, manual]);
  }

  function updateEntity(id: string, patch: Partial<SensitiveEntity>) {
    replaceEntities((current) => current.map((entity) => entity.id === id ? normalizeEntity({ ...entity, ...patch }, input) : entity));
  }

  function setAllActions(action: RedactionAction) {
    replaceEntities((current) => current.map((entity) => ({ ...entity, action })));
  }

  async function copyOutput() {
    await navigator.clipboard.writeText(output);
    setNotice(copy.copied);
  }

  function downloadOutput() {
    const url = URL.createObjectURL(new Blob([output], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "privacy-preflight-safe.txt";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
    setNotice(copy.downloaded);
  }

  function highlightedSource() {
    const sorted = cloneEntities(entities).map((entity) => normalizeEntity(entity, input)).sort((a, b) => a.start - b.start || a.end - b.end);
    const parts: React.ReactNode[] = [];
    let cursor = 0;
    for (const entity of sorted) {
      if (entity.start < cursor || entity.end <= entity.start) continue;
      parts.push(input.slice(cursor, entity.start));
      parts.push(<mark key={entity.id} className={entity.accepted ? "accepted" : "rejected"} title={`${entity.type}: ${localizedReason(entity.reason)}`}>{input.slice(entity.start, entity.end)}</mark>);
      cursor = entity.end;
    }
    parts.push(input.slice(cursor));
    return parts;
  }

  function localizedReason(reason: string) {
    return locale === "zh" ? reasonZh[reason] ?? reason : reason;
  }

  return (
    <div className="privacy-text-workspace">
      <div className="privacy-actionbar">
        <button type="button" onClick={loadExample}><Redo2 aria-hidden="true" />{copy.load}</button>
        <div className="privacy-segmented" aria-label={locale === "en" ? "Scan mode" : "扫描模式"}>
          {(["balanced", "strict"] as ScanMode[]).map((value) => <button key={value} type="button" className={mode === value ? "active" : ""} onClick={() => { remember(); setMode(value); }}>{value === "balanced" ? copy.balanced : copy.strict}</button>)}
        </div>
        <button type="button" className="primary" onClick={rescan} disabled={!input.trim()}><ScanSearch aria-hidden="true" />{copy.scan}</button>
        <button type="button" onClick={undo} disabled={!history.length} title={copy.undo}><Undo2 aria-hidden="true" /><span>{copy.undo}</span></button>
        <button type="button" onClick={reset} disabled={!input && !entities.length} title={copy.reset}><RotateCcw aria-hidden="true" /><span>{copy.reset}</span></button>
      </div>

      <div className="privacy-text-grid">
        <section className="privacy-pane">
          <div className="privacy-pane-heading"><h4>{copy.input}</h4><button type="button" onClick={addManual} title={copy.manualHelp}><Plus aria-hidden="true" />{copy.add}</button></div>
          <textarea ref={inputRef} value={input} onChange={(event) => { remember(); setInput(event.target.value); setEntities([]); }} placeholder={copy.inputHint} aria-label={copy.input} spellCheck="false" />
          <div className="privacy-highlight" aria-label={copy.highlighted}>{input ? highlightedSource() : <span className="muted">{copy.inputHint}</span>}</div>
        </section>

        <section className="privacy-pane privacy-review-pane">
          <div className="privacy-pane-heading"><h4>{copy.detections} <span>{entities.length}</span></h4><div className="privacy-all-actions"><span>{copy.all}</span>{(["mask", "replace", "remove"] as RedactionAction[]).map((action) => <button key={action} type="button" onClick={() => setAllActions(action)}>{copy[action]}</button>)}</div></div>
          <div className="privacy-entity-list">
            {!entities.length ? <p className="privacy-empty">{copy.empty}</p> : entities.map((entity) => (
              <article className={`privacy-entity ${entity.accepted ? "accepted" : "rejected"}`} key={entity.id}>
                <div className="privacy-entity-top">
                  <div><strong>{entity.type}</strong><code>{entity.source}</code></div>
                  <button type="button" className="privacy-accept" aria-pressed={entity.accepted} onClick={() => updateEntity(entity.id, { accepted: !entity.accepted })}>{entity.accepted ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}{entity.accepted ? copy.accept : copy.reject}</button>
                  <button type="button" className="icon-only" onClick={() => replaceEntities((current) => current.filter((item) => item.id !== entity.id))} title={copy.removeHit}><Trash2 aria-hidden="true" /></button>
                </div>
                <p><span>{copy.reason}</span>{localizedReason(entity.reason)}</p>
                <div className="privacy-entity-fields">
                  <label>{copy.start}<input type="number" min="0" max={input.length} value={entity.start} onChange={(event) => updateEntity(entity.id, { start: Number(event.target.value) })} /></label>
                  <label>{copy.end}<input type="number" min="0" max={input.length} value={entity.end} onChange={(event) => updateEntity(entity.id, { end: Number(event.target.value) })} /></label>
                  <label className="wide">{copy.replacement}<input value={entity.replacement} disabled={entity.action !== "replace"} onChange={(event) => updateEntity(entity.id, { replacement: event.target.value })} /></label>
                </div>
                <div className="privacy-entity-actions" aria-label={copy.action}>{(["mask", "replace", "remove"] as RedactionAction[]).map((action) => <button key={action} type="button" className={entity.action === action ? "active" : ""} onClick={() => updateEntity(entity.id, { action })}>{copy[action]}</button>)}</div>
              </article>
            ))}
          </div>
        </section>

        <section className="privacy-pane privacy-output-pane">
          <div className="privacy-pane-heading"><h4>{copy.output}</h4><div><button type="button" onClick={copyOutput} disabled={!output}><Clipboard aria-hidden="true" />{copy.copy}</button><button type="button" onClick={downloadOutput} disabled={!validation.safe}><Download aria-hidden="true" />{copy.download}</button></div></div>
          <pre data-testid="privacy-safe-output">{output || copy.inputHint}</pre>
          <div className={`privacy-validation ${validation.safe ? "pass" : "fail"}`} aria-live="polite">
            <div>{validation.safe ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}<strong>{copy.validation}</strong></div>
            <p>{validation.appliedCount === 0 ? copy.none : validation.safe ? copy.pass : copy.fail}</p>
            {validation.residualOriginalValues.length ? <p><span>{copy.original}:</span> {validation.residualOriginalValues.join(", ")}</p> : null}
            {validation.remainingTypes.length ? <p><span>{copy.types}:</span> {validation.remainingTypes.join(", ")}</p> : null}
          </div>
          {notice ? <p className="privacy-notice" role="status">{notice}</p> : null}
        </section>
      </div>
    </div>
  );
}

"use client";

import { Check, Columns2, Download, Eye, FileImage, RotateCcw, ScanSearch, Trash2, X, ZoomIn } from "lucide-react";
import NextImage from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { privacyOcrProgressStatus, privacySourceLabel } from "@/lib/privacy-localization";
import { mapSensitiveOcrLine } from "@/lib/privacy-redaction";

interface RedactionBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  source?: "manual" | "ocr";
  accepted?: boolean;
  type?: string;
  text?: string;
  reason?: string;
}

interface ImageVerification {
  safe: boolean;
  dimensions: string;
  originalHash: string;
  outputHash: string;
  message: string;
}

interface ImageOutput {
  url: string;
  name: string;
  size: number;
  type: string;
}

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_EDGE = 8000;

async function sha256(blob: Blob) {
  const buffer = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function clampBox(box: RedactionBox, width: number, height: number): RedactionBox {
  const x = Math.max(0, Math.min(width, Math.round(box.x)));
  const y = Math.max(0, Math.min(height, Math.round(box.y)));
  return {
    ...box,
    x,
    y,
    width: Math.max(1, Math.min(width - x, Math.round(box.width))),
    height: Math.max(1, Math.min(height - y, Math.round(box.height))),
  };
}

function localizedOcrReason(locale: Locale, type: string, confidence: number, mode: "contrast" | "threshold", rotated: boolean) {
  if (locale === "en") {
    return `${type} matched by local OCR; ${mode}${rotated ? ", auto-rotated" : ""}; OCR confidence ${Math.round(confidence)}%.`;
  }
  const modeLabel = mode === "contrast" ? "对比度增强" : "阈值处理";
  return `本地 OCR 规则匹配 ${type}；${modeLabel}${rotated ? "，已自动旋转" : ""}；OCR 置信度 ${Math.round(confidence)}%。`;
}

function drawPreview(canvas: HTMLCanvasElement, image: HTMLImageElement, boxes: RedactionBox[], draft: RedactionBox | null) {
  const context = canvas.getContext("2d");
  if (!context) return;
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  context.drawImage(image, 0, 0);
  context.save();
  context.lineWidth = Math.max(2, image.naturalWidth / 600);
  context.setLineDash([context.lineWidth * 3, context.lineWidth * 2]);
  for (const box of [...boxes, ...(draft ? [draft] : [])]) {
    const active = box.accepted !== false;
    context.fillStyle = active ? "rgba(138, 47, 47, .2)" : "rgba(93, 101, 97, .12)";
    context.strokeStyle = active ? "#8a2f2f" : "#5d6561";
    context.fillRect(box.x, box.y, box.width, box.height);
    context.strokeRect(box.x, box.y, box.width, box.height);
    const handle = context.lineWidth * 4;
    context.fillStyle = active ? "#8a2f2f" : "#5d6561";
    context.fillRect(box.x + box.width - handle / 2, box.y + box.height - handle / 2, handle, handle);
  }
  context.restore();
}

export default function PrivacyImageLab({ locale }: { locale: Locale }) {
  const copy = locale === "en" ? {
    choose: "Choose image", drop: "or drop PNG/JPEG here", manual: "Local OCR + burn-in review", note: "OCR runs from same-origin worker, WASM, and language assets. Review every detected or manual region before export.",
    boxes: "Redaction regions", none: "Draw a rectangle over sensitive pixels.", preview: "Confirm review and show result", download: "Download redacted file", reset: "Reset", zoom: "Zoom", blackout: "Blackout", pixelate: "Pixelate",
    invalid: "Choose a PNG or JPEG up to 15 MB and 8,000 px per side.", verify: "Export verification", pass: "Pass: a fresh PNG was decoded after burn-in; dimensions match and its SHA-256 differs from the source.",
    fail: "Verification failed. No safe export is available.", ocrError: "Local OCR could not finish. Try again or draw the regions manually.", exportError: "The safe image export could not be completed. No download was created.", metadata: "Canvas export rebuilds pixels into a new PNG and does not preserve source metadata.", local: "Text recognition runs locally in your browser. Your file is not uploaded.", region: "Region", delete: "Delete region", source: "source", output: "output", ocr: "Scan for sensitive information", english: "English", bilingual: "English + 简体中文", ocrIdle: "OCR not run", ocrNone: "OCR finished; no rule-matched sensitive token was found. Add regions manually if needed.", accept: "Accept", reject: "Reject", exampleEnglish: "Load English image example", exampleChinese: "Load Chinese image example", before: "Before", detected: "Detected", redacted: "Redacted", processing: "Orientation candidates, grayscale, contrast, threshold, and multi-pass OCR", compare: "Before / after", originalView: "Original image", redactedView: "Redacted image",
  } : {
    choose: "选择图片", drop: "或将 PNG/JPEG 拖到此处", manual: "本地 OCR + 像素烧录复核", note: "OCR 使用同源 worker、WASM 和语言包运行。导出前请复核每个自动或手动区域。",
    boxes: "脱敏区域", none: "请在敏感像素上拖动绘制矩形。", preview: "确认复核并显示结果", download: "下载脱敏文件", reset: "重置", zoom: "缩放", blackout: "黑色遮盖", pixelate: "像素化",
    invalid: "请选择不超过 15 MB、单边不超过 8,000 px 的 PNG 或 JPEG。", verify: "导出验证", pass: "通过：烧录后重新解码了全新 PNG；尺寸一致且 SHA-256 与原文件不同。",
    fail: "验证失败，暂无可用的安全导出。", ocrError: "本地文字识别未能完成，请重试或手动框选区域。", exportError: "无法完成安全图片导出，因此没有生成下载文件。", metadata: "Canvas 会将像素重建为新 PNG，不保留源文件元数据。", local: "文字识别在本机浏览器中完成，文件不会上传。", region: "区域", delete: "删除区域", source: "源文件", output: "输出文件", ocr: "扫描并查找敏感信息", english: "英语", bilingual: "英语 + 简体中文", ocrIdle: "尚未运行 OCR", ocrNone: "OCR 已完成，但规则未匹配到敏感内容；如有需要请手动新增区域。", accept: "接受", reject: "拒绝", exampleEnglish: "加载英文图片示例", exampleChinese: "加载中文图片示例", before: "原始文件", detected: "检测结果", redacted: "脱敏结果", processing: "方向候选、灰度、对比度、阈值与多轮文字识别", compare: "前后对照", originalView: "原始图片", redactedView: "脱敏图片",
  };
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState("");
  const [originalHash, setOriginalHash] = useState("");
  const [boxes, setBoxes] = useState<RedactionBox[]>([]);
  const [draft, setDraft] = useState<RedactionBox | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const boxInteraction = useRef<{ kind: "move" | "resize"; id: string; start: { x: number; y: number }; original: RedactionBox } | null>(null);
  const [style, setStyle] = useState<"blackout" | "pixelate">("blackout");
  const [zoom, setZoom] = useState(100);
  const [error, setError] = useState("");
  const [verification, setVerification] = useState<ImageVerification | null>(null);
  const [output, setOutput] = useState<ImageOutput | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [ocrLanguage, setOcrLanguage] = useState<"eng" | "eng+chi_sim">("eng");
  const [ocrStatus, setOcrStatus] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (image && canvasRef.current) drawPreview(canvasRef.current, image, output ? [] : boxes, output ? null : draft);
  }, [image, boxes, draft, output, showOriginal]);

  function clearOutput() {
    setOutput((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
    setVerification(null);
    setShowOriginal(false);
  }

  async function loadExample(path: string, name: string, language: "eng" | "eng+chi_sim") {
    setError("");
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error("Example image unavailable");
      setOcrLanguage(language);
      await loadFile(new File([await response.blob()], name, { type: "image/png" }));
    } catch (cause) {
      console.error("Privacy image example could not load.", cause);
      setError(copy.invalid);
    }
  }

  async function loadFile(file: File) {
    setError("");
    clearOutput();
    if (!(["image/png", "image/jpeg"].includes(file.type)) || file.size > MAX_IMAGE_BYTES) {
      setError(copy.invalid);
      return;
    }
    const url = URL.createObjectURL(file);
    const nextImage = new Image();
    nextImage.decoding = "async";
    nextImage.onload = async () => {
      URL.revokeObjectURL(url);
      if (nextImage.naturalWidth > MAX_IMAGE_EDGE || nextImage.naturalHeight > MAX_IMAGE_EDGE) {
        setError(copy.invalid);
        return;
      }
      const hash = await sha256(file);
      setImage(nextImage);
      setFileName(file.name);
      setOriginalHash(hash);
      setBoxes([]);
      setDraft(null);
      setOcrStatus("");
      setOcrProgress(0);
    };
    nextImage.onerror = () => {
      URL.revokeObjectURL(url);
      setError(copy.invalid);
    };
    nextImage.src = url;
  }

  function pointFromEvent(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * canvas.width / bounds.width,
      y: (event.clientY - bounds.top) * canvas.height / bounds.height,
    };
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!image || output) return;
    clearOutput();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);
    const bounds = event.currentTarget.getBoundingClientRect();
    const tolerance = 14 * event.currentTarget.width / bounds.width;
    const hit = [...boxes].reverse().find((box) => point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height);
    if (hit) {
      const resize = Math.abs(point.x - (hit.x + hit.width)) <= tolerance && Math.abs(point.y - (hit.y + hit.height)) <= tolerance;
      boxInteraction.current = { kind: resize ? "resize" : "move", id: hit.id, start: point, original: { ...hit } };
      return;
    }
    setDragStart(point);
    setDraft({ id: `draft-${boxes.length}`, x: point.x, y: point.y, width: 1, height: 1 });
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!image) return;
    const point = pointFromEvent(event);
    if (boxInteraction.current) {
      const interaction = boxInteraction.current;
      const deltaX = point.x - interaction.start.x;
      const deltaY = point.y - interaction.start.y;
      setBoxes((current) => current.map((box) => {
        if (box.id !== interaction.id) return box;
        return clampBox(interaction.kind === "move"
          ? { ...interaction.original, x: interaction.original.x + deltaX, y: interaction.original.y + deltaY }
          : { ...interaction.original, width: interaction.original.width + deltaX, height: interaction.original.height + deltaY }, image.naturalWidth, image.naturalHeight);
      }));
      return;
    }
    if (!dragStart) return;
    setDraft(clampBox({
      id: `draft-${boxes.length}`,
      x: Math.min(dragStart.x, point.x),
      y: Math.min(dragStart.y, point.y),
      width: Math.abs(point.x - dragStart.x),
      height: Math.abs(point.y - dragStart.y),
    }, image.naturalWidth, image.naturalHeight));
  }

  function onPointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    if (draft && draft.width >= 4 && draft.height >= 4) setBoxes((current) => [...current, { ...draft, id: `region-${current.length + 1}`, source: "manual", accepted: true, type: "CUSTOM", reason: locale === "en" ? "Added manually by the reviewer." : "由复核者手动新增。" }]);
    setDraft(null);
    setDragStart(null);
    boxInteraction.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function updateBox(id: string, patch: Partial<RedactionBox>) {
    if (!image) return;
    setBoxes((current) => current.map((box) => box.id === id ? clampBox({ ...box, ...patch }, image.naturalWidth, image.naturalHeight) : box));
    clearOutput();
  }

  async function runOcr() {
    if (!image || isOcrRunning) return;
    setIsOcrRunning(true);
    setError("");
    clearOutput();
    setOcrProgress(0);
    setOcrStatus(locale === "en" ? "Loading local OCR runtime" : "正在载入本地 OCR 运行时");
    try {
      const { createWorker, OEM } = await import("tesseract.js");
      const languages = ocrLanguage === "eng" ? "eng" : ["eng", "chi_sim"];
      const worker = await createWorker(languages, OEM.LSTM_ONLY, {
        workerPath: "/generated/privacy-ocr/worker.min.js",
        corePath: "/generated/privacy-ocr/core",
        langPath: "/generated/privacy-ocr/lang",
        cacheMethod: "none",
        logger: (message) => {
          const progress = Math.round(message.progress * 100);
          setOcrStatus(privacyOcrProgressStatus(locale, message.status, progress, copy.processing));
          setOcrProgress(progress);
        },
      });
      try {
        const passes: { mode: "contrast" | "threshold"; rotated: boolean }[] = [
          { mode: "contrast", rotated: false },
          { mode: "threshold", rotated: false },
          ...(image.naturalHeight > image.naturalWidth ? [{ mode: "contrast" as const, rotated: true }, { mode: "threshold" as const, rotated: true }] : []),
        ];
        const found = new Map<string, RedactionBox>();
        for (let passIndex = 0; passIndex < passes.length; passIndex += 1) {
          const pass = passes[passIndex];
          const canvas = document.createElement("canvas");
          canvas.width = pass.rotated ? image.naturalHeight : image.naturalWidth;
          canvas.height = pass.rotated ? image.naturalWidth : image.naturalHeight;
          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (!context) continue;
          context.filter = pass.mode === "contrast" ? "grayscale(1) contrast(1.55)" : "grayscale(1) contrast(2)";
          if (pass.rotated) {
            context.translate(0, image.naturalWidth);
            context.rotate(-Math.PI / 2);
          }
          context.drawImage(image, 0, 0);
          context.setTransform(1, 0, 0, 1, 0, 0);
          if (pass.mode === "threshold") {
            const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
            for (let offset = 0; offset < pixels.data.length; offset += 4) {
              const value = pixels.data[offset] < 178 ? 0 : 255;
              pixels.data[offset] = value;
              pixels.data[offset + 1] = value;
              pixels.data[offset + 2] = value;
            }
            context.putImageData(pixels, 0, 0);
          }
          const result = await worker.recognize(canvas, {}, { blocks: true });
          const lines = result.data.blocks?.flatMap((block) => block.paragraphs.flatMap((paragraph) => paragraph.lines)) ?? [];
          for (const line of lines) {
            for (const mapped of mapSensitiveOcrLine(line)) {
              const { entity: match, bbox } = mapped;
              const transformed = pass.rotated
                ? { x: image.naturalWidth - bbox.y1, y: bbox.x0, width: bbox.y1 - bbox.y0, height: bbox.x1 - bbox.x0 }
                : { x: bbox.x0, y: bbox.y0, width: bbox.x1 - bbox.x0, height: bbox.y1 - bbox.y0 };
              const box = clampBox({
                id: `ocr-${passIndex}-${found.size + 1}`,
                ...transformed,
                source: "ocr",
                accepted: true,
                type: match.type,
                text: match.text,
                reason: localizedOcrReason(locale, match.type, mapped.confidence, pass.mode, pass.rotated),
              }, image.naturalWidth, image.naturalHeight);
              const key = `${box.type}-${box.text?.replace(/\s/g, "").toLocaleLowerCase()}-${Math.round(box.x / 16)}-${Math.round(box.y / 16)}`;
              if (!found.has(key)) found.set(key, box);
            }
          }
          canvas.width = 0;
          canvas.height = 0;
        }
        const ocrBoxes = [...found.values()];
        setBoxes((current) => [...current.filter((box) => box.source !== "ocr"), ...ocrBoxes]);
        setOcrStatus(ocrBoxes.length ? `${ocrBoxes.length} ${locale === "en" ? "rule-matched OCR regions" : "个规则匹配 OCR 区域"}` : copy.ocrNone);
        setOcrProgress(100);
      } finally {
        await worker.terminate();
      }
    } catch (cause) {
      console.error("Privacy image OCR could not finish.", cause);
      setOcrStatus(copy.ocrError);
      setError(copy.ocrError);
    } finally {
      setIsOcrRunning(false);
    }
  }

  function burnIn(context: CanvasRenderingContext2D, box: RedactionBox) {
    if (style === "blackout") {
      context.fillStyle = "#000";
      context.fillRect(box.x, box.y, box.width, box.height);
      return;
    }
    const sample = document.createElement("canvas");
    const sampleWidth = Math.max(1, Math.round(box.width / 14));
    const sampleHeight = Math.max(1, Math.round(box.height / 14));
    sample.width = sampleWidth;
    sample.height = sampleHeight;
    const sampleContext = sample.getContext("2d");
    if (!sampleContext) throw new Error("Canvas unavailable");
    sampleContext.drawImage(context.canvas, box.x, box.y, box.width, box.height, 0, 0, sampleWidth, sampleHeight);
    context.save();
    context.imageSmoothingEnabled = false;
    context.drawImage(sample, 0, 0, sampleWidth, sampleHeight, box.x, box.y, box.width, box.height);
    context.restore();
  }

  async function exportImage() {
    if (!image || !boxes.length) return;
    setError("");
    try {
      const output = document.createElement("canvas");
      output.width = image.naturalWidth;
      output.height = image.naturalHeight;
      const context = output.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Canvas unavailable");
      context.drawImage(image, 0, 0);
      boxes.filter((box) => box.accepted !== false).forEach((box) => burnIn(context, box));
      const blob = await new Promise<Blob | null>((resolve) => output.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("PNG export unavailable");
      const decoded = await createImageBitmap(blob);
      const outputHash = await sha256(blob);
      const safe = decoded.width === image.naturalWidth && decoded.height === image.naturalHeight && outputHash !== originalHash;
      const result: ImageVerification = {
        safe,
        dimensions: `${decoded.width}x${decoded.height}`,
        originalHash,
        outputHash,
        message: safe ? copy.pass : copy.fail,
      };
      decoded.close();
      setVerification(result);
      if (!safe) return;
      const name = `${fileName.replace(/\.[^.]+$/, "") || "image"}-redacted.png`;
      const url = URL.createObjectURL(blob);
      setOutput((current) => {
        if (current) URL.revokeObjectURL(current.url);
        return { url, name, size: blob.size, type: blob.type };
      });
      setShowOriginal(false);
    } catch (cause) {
      console.error("Privacy image safe export could not finish.", cause);
      setVerification({ safe: false, dimensions: "-", originalHash, outputHash: "-", message: copy.fail });
      setError(copy.exportError);
    }
  }

  function reset() {
    setImage(null);
    setFileName("");
    setOriginalHash("");
    setBoxes([]);
    setDraft(null);
    clearOutput();
    setOcrStatus("");
    setOcrProgress(0);
    setIsOcrRunning(false);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="privacy-image-workspace">
      <div className="privacy-actionbar">
        <input ref={inputRef} className="sr-only" type="file" accept="image/png,image/jpeg" onChange={(event) => { const file = event.target.files?.[0]; if (file) void loadFile(file); }} />
        <button type="button" onClick={() => inputRef.current?.click()}><FileImage aria-hidden="true" />{copy.choose}</button>
        <button type="button" onClick={() => void loadExample("/case-studies/privacy-preflight/image-example-english.png", "privacy-english-example.png", "eng")}><FileImage aria-hidden="true" />{copy.exampleEnglish}</button>
        <button type="button" onClick={() => void loadExample("/case-studies/privacy-preflight/image-example-chinese.png", "privacy-chinese-example.png", "eng+chi_sim")}><FileImage aria-hidden="true" />{copy.exampleChinese}</button>
        <span className="privacy-file-name">{fileName || copy.drop}</span>
        <select value={ocrLanguage} onChange={(event) => setOcrLanguage(event.target.value as "eng" | "eng+chi_sim")} aria-label={locale === "en" ? "OCR language" : "OCR 语言"}><option value="eng">{copy.english}</option><option value="eng+chi_sim">{copy.bilingual}</option></select>
        <button type="button" className="privacy-scan-primary" onClick={() => void runOcr()} disabled={!image || isOcrRunning}><ScanSearch aria-hidden="true" />{copy.ocr}</button>
        <div className="privacy-segmented">{(["blackout", "pixelate"] as const).map((value) => <button key={value} type="button" className={style === value ? "active" : ""} onClick={() => { setStyle(value); clearOutput(); }}>{value === "blackout" ? copy.blackout : copy.pixelate}</button>)}</div>
        <label className="privacy-zoom"><ZoomIn aria-hidden="true" /><span>{copy.zoom}</span><input type="range" min="70" max="200" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label>
        <button type="button" onClick={reset} disabled={!image}><RotateCcw aria-hidden="true" />{copy.reset}</button>
      </div>
      <div className="privacy-image-grid">
        <div className="privacy-canvas-wrap privacy-main-result-area" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) void loadFile(file); }}>
          {image ? (output && verification?.safe && !showOriginal
            ? <NextImage data-testid="privacy-image-redacted-view" className="privacy-inplace-image" unoptimized width={image.naturalWidth} height={image.naturalHeight} style={{ width: `${zoom}%` }} src={output.url} alt={locale === "en" ? "Generated redacted PNG result" : "实时生成的脱敏 PNG 结果"} />
            : <canvas ref={canvasRef} data-testid="privacy-image-original-view" style={{ width: `${zoom}%` }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} aria-label={output ? copy.originalView : copy.manual} />)
            : <button type="button" className="privacy-drop-target" onClick={() => inputRef.current?.click()}><FileImage aria-hidden="true" /><strong>{copy.choose}</strong><span>{copy.drop}</span></button>}
          {output && verification?.safe ? <div className="privacy-inplace-result-toolbar" data-testid="privacy-image-output"><button type="button" className="privacy-before-after-toggle" aria-pressed={showOriginal} onClick={() => setShowOriginal((current) => !current)}><Columns2 aria-hidden="true" />{copy.compare}</button><span role="status">{showOriginal ? copy.originalView : copy.redactedView}</span><a className="button-link primary" href={output.url} download={output.name}><Download aria-hidden="true" />{copy.download}</a></div> : null}
        </div>
        <aside className="privacy-image-review">
          <div><p className="eyebrow">{copy.local}</p><h4>{copy.manual}</h4><p>{copy.note}</p><small>{copy.processing}</small></div>
          <div className="privacy-output-steps" aria-label={locale === "en" ? "Redaction progress" : "脱敏进度"}><span className={image ? "done" : ""}>{copy.before}</span><span className={boxes.length ? "done" : ""}>{copy.detected}</span><span className={output ? "done" : ""}>{copy.redacted}</span></div>
          <div className="privacy-ocr-status" aria-live="polite"><span>{ocrStatus ? privacyOcrProgressStatus(locale, ocrStatus, ocrProgress, copy.processing) : copy.ocrIdle}</span><progress max="100" value={ocrProgress} /></div>
          <div className="privacy-box-list"><h5>{copy.boxes} <span>{boxes.length}</span></h5>{!boxes.length ? <p>{copy.none}</p> : boxes.map((box, index) => <article className={box.accepted === false ? "rejected" : ""} key={box.id}><div><strong>{box.type || copy.region} {index + 1}</strong><div><code>{privacySourceLabel(locale, box.source || "manual")}</code><button type="button" className="privacy-box-accept" aria-pressed={box.accepted !== false} onClick={() => updateBox(box.id, { accepted: box.accepted === false })}>{box.accepted === false ? <X aria-hidden="true" /> : <Check aria-hidden="true" />}{box.accepted === false ? copy.reject : copy.accept}</button><button type="button" className="icon-only" title={copy.delete} onClick={() => { setBoxes((current) => current.filter((item) => item.id !== box.id)); clearOutput(); }}><Trash2 aria-hidden="true" /></button></div></div>{box.text ? <p><code>{box.text}</code>{box.reason}</p> : null}<div className="privacy-box-fields">{(["x", "y", "width", "height"] as const).map((field) => <label key={field}>{field}<input type="number" value={box[field]} onChange={(event) => updateBox(box.id, { [field]: Number(event.target.value) })} /></label>)}</div></article>)}</div>
          <p className="privacy-metadata-note">{copy.metadata}</p>
          <button type="button" className="privacy-export-button" onClick={() => void exportImage()} disabled={!image || !boxes.some((box) => box.accepted !== false)}><Eye aria-hidden="true" />{copy.preview}</button>
          {output && verification?.safe ? <dl className="privacy-result-meta"><div><dt>{locale === "en" ? "File" : "文件"}</dt><dd>{output.name}</dd></div><div><dt>{locale === "en" ? "Type" : "类型"}</dt><dd>{output.type}</dd></div><div><dt>{locale === "en" ? "Size" : "大小"}</dt><dd>{(output.size / 1024).toFixed(1)} KB</dd></div></dl> : null}
          {verification ? <div className={`privacy-validation ${verification.safe ? "pass" : "fail"}`}><div>{verification.safe ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}<strong>{copy.verify}</strong></div><p>{verification.message}</p><code>{verification.dimensions}</code><code>{copy.source} {verification.originalHash.slice(0, 16)}...</code><code>{copy.output} {verification.outputHash.slice(0, 16)}...</code></div> : null}
          {error ? <p className="privacy-error" role="alert">{error}</p> : null}
        </aside>
      </div>
    </div>
  );
}

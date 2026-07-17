"use client";

import { Check, ChevronLeft, ChevronRight, Download, Eye, FileText, RotateCcw, ScanSearch, ShieldX, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist";
import type { Locale } from "@/lib/i18n";
import { mapSensitiveOcrLine, scanSensitiveText } from "@/lib/privacy-redaction";
import PrivacyPdfResultPreview from "./PrivacyPdfResultPreview";

interface PdfRegion {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  source: "manual" | "ocr" | "text-layer" | "text-layer+ocr";
  accepted: boolean;
  type: string;
  text?: string;
  reason: string;
}

interface PdfValidation {
  safe: boolean;
  pageCount: boolean;
  dimensions: boolean;
  textLayerEmpty: boolean;
  annotationsEmpty: boolean;
  knownTermsAbsent: boolean;
  metadataClean: boolean;
  burnInVerified: boolean;
  outputHash: string;
}

interface PdfOutput {
  url: string;
  name: string;
  size: number;
  type: string;
  bytes: Uint8Array;
}

const MAX_PDF_BYTES = 20 * 1024 * 1024;
const MAX_PDF_PAGES = 20;
const MAX_RENDER_PIXELS = 18_000_000;
const PREVIEW_SCALE = 1.45;
const EXPORT_SCALE = 2;

async function sha256(blob: Blob) {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.max(minimum, Math.min(maximum, value));
}

function normalizeRegion(region: PdfRegion): PdfRegion {
  const x = clamp(region.x);
  const y = clamp(region.y);
  return { ...region, x, y, width: clamp(region.width, .001, 1 - x), height: clamp(region.height, .001, 1 - y) };
}

function pixelRect(region: PdfRegion, width: number, height: number) {
  const normalized = normalizeRegion(region);
  const x = Math.floor(normalized.x * width);
  const y = Math.floor(normalized.y * height);
  const right = Math.ceil((normalized.x + normalized.width) * width);
  const bottom = Math.ceil((normalized.y + normalized.height) * height);
  return { x, y, width: Math.max(1, right - x), height: Math.max(1, bottom - y) };
}

function automaticSource(region: PdfRegion) {
  return region.source !== "manual";
}

function overlapRatio(left: PdfRegion, right: PdfRegion) {
  const x0 = Math.max(left.x, right.x);
  const y0 = Math.max(left.y, right.y);
  const x1 = Math.min(left.x + left.width, right.x + right.width);
  const y1 = Math.min(left.y + left.height, right.y + right.height);
  if (x1 <= x0 || y1 <= y0) return 0;
  const intersection = (x1 - x0) * (y1 - y0);
  return intersection / Math.max(.000001, Math.min(left.width * left.height, right.width * right.height));
}

function comparableText(value?: string) {
  return value?.toLocaleLowerCase().replace(/[\s‐‑‒–—-]+/g, "") ?? "";
}

function shouldMergeRegions(left: PdfRegion, right: PdfRegion) {
  if (left.pageIndex !== right.pageIndex || !automaticSource(left) || !automaticSource(right)) return false;
  const sameType = left.type === right.type;
  const leftText = comparableText(left.text);
  const rightText = comparableText(right.text);
  const sameText = Boolean(leftText && rightText && leftText === rightText);
  return (sameType || sameText) && overlapRatio(left, right) >= .35;
}

function mergePdfRegions(input: PdfRegion[]) {
  const merged: PdfRegion[] = [];
  for (const candidate of input.map(normalizeRegion)) {
    const matchIndex = merged.findIndex((existing) => shouldMergeRegions(existing, candidate));
    if (matchIndex < 0) {
      merged.push(candidate);
      continue;
    }
    const existing = merged[matchIndex];
    const x = Math.min(existing.x, candidate.x);
    const y = Math.min(existing.y, candidate.y);
    const right = Math.max(existing.x + existing.width, candidate.x + candidate.width);
    const bottom = Math.max(existing.y + existing.height, candidate.y + candidate.height);
    merged[matchIndex] = normalizeRegion({
      ...existing,
      x,
      y,
      width: right - x,
      height: bottom - y,
      source: existing.source === candidate.source ? existing.source : "text-layer+ocr",
      accepted: existing.accepted,
      text: existing.text || candidate.text,
      reason: existing.reason,
    });
  }
  return merged;
}

function localizedPdfOcrReason(locale: Locale, type: string, confidence: number) {
  return locale === "en"
    ? `${type} matched by local OCR; OCR confidence ${Math.round(confidence)}%.`
    : `本地 OCR 规则匹配 ${type}；OCR 置信度 ${Math.round(confidence)}%。`;
}

export default function PrivacyPdfLab({ locale }: { locale: Locale }) {
  const copy = locale === "en" ? {
    choose: "Choose PDF", reset: "Reset", local: "Text recognition runs locally in your browser. Your file is not uploaded.", page: "Page", previous: "Previous page", next: "Next page", reviewed: "Page reviewed", unreviewed: "Mark page reviewed",
    ocr: "Scan for sensitive information", english: "English", bilingual: "English + 简体中文", review: "Per-page redaction review", note: "Text-layer pages are scanned first. Use local OCR for scanned pages, then review every page.",
    regions: "Page regions", none: "No regions on this page. Draw a rectangle or run local OCR.", accept: "Accept", reject: "Reject", delete: "Delete region", preview: "Preview redacted result", download: "Download redacted file",
    invalid: "Choose a readable PDF up to 20 MB and 20 pages.", loading: "Loading local PDF", render: "Rendering page", renderError: "This PDF page could not be rendered locally. Try a smaller or simpler PDF.", loadError: "This PDF could not be opened locally. Choose another readable PDF.", ocrError: "Local OCR could not finish on this page. Try again or draw the regions manually.", exportError: "The safe PDF export could not be completed. No download was created.", ocrIdle: "OCR not run on this page", ocrNone: "OCR finished; no rule-matched token was found.",
    gate: "Fail-closed export gate", gateBody: "The original PDF is never modified. Accepted regions are burned into newly rendered page pixels, then a new image-only PDF is built and reopened for verification.",
    needReview: "Review every page and accept at least one redaction region.", verification: "Post-export verification", safe: "Safe image-only PDF is ready to preview and download.", unsafe: "Verification failed; no safe PDF is available.", exampleText: "Load text-layer PDF", exampleScan: "Load scanned PDF", exampleMulti: "Load multi-page PDF", method: "Page method", textLayer: "Text layer", ocrRequired: "OCR required", ocrMethod: "Local OCR", before: "Before", detected: "Detected", redacted: "Redacted",
    checks: { pageCount: "Page count", dimensions: "Page dimensions", textLayerEmpty: "Extractable text empty", annotationsEmpty: "No annotations", knownTermsAbsent: "Known terms absent", metadataClean: "Original metadata absent", burnInVerified: "Black pixels burned in" },
  } : {
    choose: "选择 PDF", reset: "重置", local: "文字识别在本机浏览器中完成，文件不会上传。", page: "页", previous: "上一页", next: "下一页", reviewed: "本页已复核", unreviewed: "标记本页已复核",
    ocr: "扫描并查找敏感信息", english: "英语", bilingual: "英语 + 简体中文", review: "逐页脱敏复核", note: "优先扫描文字层；扫描页再使用本地 OCR，最后逐页人工复核。",
    regions: "本页区域", none: "本页尚无区域，请框选或运行本地文字识别。", accept: "接受", reject: "拒绝", delete: "删除区域", preview: "预览脱敏结果", download: "下载脱敏文件",
    invalid: "请选择可读取、不超过 20 MB 且不超过 20 页的 PDF。", loading: "正在本地载入 PDF", render: "正在渲染页面", renderError: "无法在本地渲染此 PDF 页面，请尝试更小或结构更简单的 PDF。", loadError: "无法在本地打开此 PDF，请选择其他可读取的 PDF。", ocrError: "本页的本地文字识别未能完成，请重试或手动框选区域。", exportError: "无法完成安全 PDF 导出，因此没有生成下载文件。", ocrIdle: "本页尚未运行 OCR", ocrNone: "OCR 已完成，但没有规则匹配 token。",
    gate: "Fail-closed 导出门禁", gateBody: "原 PDF 不会被修改。已接受区域会烧录进重新渲染的页面像素，再重建纯图像 PDF 并重新打开验证。",
    needReview: "请复核所有页面，并至少接受一个脱敏区域。", verification: "导出后验证", safe: "安全的纯图像 PDF 已可预览和下载。", unsafe: "验证失败，暂无可用的安全 PDF。", exampleText: "加载文字层 PDF", exampleScan: "加载扫描版 PDF", exampleMulti: "加载多页 PDF", method: "本页方法", textLayer: "文字层", ocrRequired: "需要文字识别", ocrMethod: "本地文字识别", before: "原始文件", detected: "检测结果", redacted: "脱敏结果",
    checks: { pageCount: "页数", dimensions: "页面尺寸", textLayerEmpty: "可提取文本为空", annotationsEmpty: "无 annotation", knownTermsAbsent: "已知词项不存在", metadataClean: "原 metadata 不存在", burnInVerified: "黑色像素已烧录" },
  };

  const documentRef = useRef<PDFDocumentProxy | null>(null);
  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const originalFileNameRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);
  const pageCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const renderSequence = useRef(0);
  const [fileName, setFileName] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [regions, setRegions] = useState<PdfRegion[]>([]);
  const [reviewedPages, setReviewedPages] = useState<number[]>([]);
  const [draft, setDraft] = useState<PdfRegion | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const regionInteraction = useRef<{ kind: "move" | "resize"; id: string; start: { x: number; y: number }; original: PdfRegion } | null>(null);
  const [ocrLanguage, setOcrLanguage] = useState<"eng" | "eng+chi_sim">("eng");
  const [ocrStatus, setOcrStatus] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");
  const [validation, setValidation] = useState<PdfValidation | null>(null);
  const [output, setOutput] = useState<PdfOutput | null>(null);
  const [pageMethods, setPageMethods] = useState<("text-layer" | "ocr-required" | "ocr")[]>([]);

  const currentRegions = regions.filter((region) => region.pageIndex === pageIndex);
  const acceptedRegions = regions.filter((region) => region.accepted);
  const allPagesReviewed = pageCount > 0 && reviewedPages.length === pageCount;
  const canExport = allPagesReviewed && acceptedRegions.length > 0 && !isLoading && !isOcrRunning && !isExporting;

  useEffect(() => {
    const document = documentRef.current;
    const canvas = pageCanvasRef.current;
    if (!document || !canvas || !pageCount) return;
    const sequence = ++renderSequence.current;
    setIsLoading(true);
    setError("");
    void (async () => {
      try {
        const page = await document.getPage(pageIndex + 1);
        const viewport = page.getViewport({ scale: PREVIEW_SCALE });
        if (viewport.width * viewport.height > MAX_RENDER_PIXELS) throw new Error("Page exceeds the local render limit.");
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas unavailable.");
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        if (sequence === renderSequence.current) setPageSize({ width: canvas.width, height: canvas.height });
        page.cleanup();
      } catch (cause) {
        console.error("Privacy PDF source page could not render.", cause);
        if (sequence === renderSequence.current) setError(copy.renderError);
      } finally {
        if (sequence === renderSequence.current) setIsLoading(false);
      }
    })();
  }, [copy.renderError, pageCount, pageIndex]);

  useEffect(() => {
    const overlay = overlayCanvasRef.current;
    if (!overlay || !pageSize.width || !pageSize.height) return;
    overlay.width = pageSize.width;
    overlay.height = pageSize.height;
    const context = overlay.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, overlay.width, overlay.height);
    context.lineWidth = Math.max(2, overlay.width / 600);
    context.setLineDash([context.lineWidth * 3, context.lineWidth * 2]);
    for (const region of [...currentRegions, ...(draft ? [draft] : [])]) {
      const rect = pixelRect(region, overlay.width, overlay.height);
      context.fillStyle = region.accepted ? "rgba(138, 47, 47, .2)" : "rgba(93, 101, 97, .12)";
      context.strokeStyle = region.accepted ? "#8a2f2f" : "#5d6561";
      context.fillRect(rect.x, rect.y, rect.width, rect.height);
      context.strokeRect(rect.x, rect.y, rect.width, rect.height);
      const handle = context.lineWidth * 4;
      context.fillStyle = region.accepted ? "#8a2f2f" : "#5d6561";
      context.fillRect(rect.x + rect.width - handle / 2, rect.y + rect.height - handle / 2, handle, handle);
    }
  }, [currentRegions, draft, pageSize]);

  useEffect(() => () => {
    renderSequence.current += 1;
    void loadingTaskRef.current?.destroy();
    loadingTaskRef.current = null;
    documentRef.current = null;
    setOutput((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  }, []);

  function clearOutput() {
    setOutput((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
    setValidation(null);
  }

  async function loadExample(path: string, name: string, language: "eng" | "eng+chi_sim" = "eng") {
    setError("");
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error("Example PDF unavailable");
      setOcrLanguage(language);
      await loadFile(new File([await response.blob()], name, { type: "application/pdf" }));
    } catch (cause) {
      console.error("Privacy PDF example could not load.", cause);
      setError(copy.loadError);
    }
  }

  async function loadFile(file: File) {
    setError("");
    clearOutput();
    if (file.type !== "application/pdf" || file.size > MAX_PDF_BYTES) {
      setError(copy.invalid);
      return;
    }
    setIsLoading(true);
    try {
      await loadingTaskRef.current?.destroy();
      loadingTaskRef.current = null;
      const bytes = new Uint8Array(await file.arrayBuffer());
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/generated/privacy-pdf/pdf.worker.min.mjs";
      const loadingTask = pdfjs.getDocument({ data: bytes.slice() });
      loadingTaskRef.current = loadingTask;
      const document = await loadingTask.promise;
      if (document.numPages < 1 || document.numPages > MAX_PDF_PAGES) {
        await loadingTask.destroy();
        loadingTaskRef.current = null;
        throw new Error(copy.invalid);
      }
      documentRef.current = document;
      originalFileNameRef.current = file.name;
      setFileName(file.name);
      setPageCount(document.numPages);
      setPageIndex(0);
      const textLayerRegions: PdfRegion[] = [];
      const methods: ("text-layer" | "ocr-required")[] = [];
      for (let index = 0; index < document.numPages; index += 1) {
        const page = await document.getPage(index + 1);
        const viewport = page.getViewport({ scale: 1 });
        const content = await page.getTextContent();
        let hasText = false;
        for (const item of content.items) {
          if (!("str" in item) || !item.str.trim()) continue;
          hasText = true;
          const matches = scanSensitiveText(item.str, "strict");
          for (const match of matches) {
            const transform = pdfjs.Util.transform(viewport.transform, item.transform);
            const ratioStart = match.start / Math.max(item.str.length, 1);
            const ratioWidth = (match.end - match.start) / Math.max(item.str.length, 1);
            const directionLength = Math.max(.001, Math.hypot(transform[0], transform[1]));
            const direction = { x: transform[0] / directionLength, y: transform[1] / directionLength };
            const textWidth = item.width * viewport.scale;
            const itemHeight = Math.max(Math.hypot(transform[2], transform[3]), item.height * viewport.scale, 10);
            const verticalLength = Math.max(.001, Math.hypot(transform[2], transform[3]));
            const vertical = { x: transform[2] / verticalLength * itemHeight * 1.25, y: transform[3] / verticalLength * itemHeight * 1.25 };
            const start = { x: transform[4] + direction.x * textWidth * ratioStart, y: transform[5] + direction.y * textWidth * ratioStart };
            const end = { x: start.x + direction.x * textWidth * ratioWidth, y: start.y + direction.y * textWidth * ratioWidth };
            const corners = [start, end, { x: start.x + vertical.x, y: start.y + vertical.y }, { x: end.x + vertical.x, y: end.y + vertical.y }];
            const x0 = Math.min(...corners.map((corner) => corner.x));
            const y0 = Math.min(...corners.map((corner) => corner.y));
            const x1 = Math.max(...corners.map((corner) => corner.x));
            const y1 = Math.max(...corners.map((corner) => corner.y));
            textLayerRegions.push(normalizeRegion({
              id: `p${index + 1}-text-${textLayerRegions.length + 1}`,
              pageIndex: index,
              x: x0 / viewport.width,
              y: y0 / viewport.height,
              width: (x1 - x0) / viewport.width,
              height: (y1 - y0) / viewport.height,
              source: "text-layer",
              accepted: true,
              type: match.type,
              text: match.text,
              reason: locale === "en" ? "Matched in the PDF text layer before OCR." : "在 PDF 文字层中优先匹配。",
            }));
          }
        }
        methods.push(hasText ? "text-layer" : "ocr-required");
      }
      setRegions(mergePdfRegions(textLayerRegions));
      setPageMethods(methods);
      setReviewedPages([]);
      setOcrStatus("");
      setOcrProgress(0);
    } catch (cause) {
      console.error("Privacy PDF could not load.", cause);
      await loadingTaskRef.current?.destroy();
      loadingTaskRef.current = null;
      documentRef.current = null;
      setPageCount(0);
      setError(copy.loadError);
    } finally {
      setIsLoading(false);
    }
  }

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: clamp((event.clientX - bounds.left) / bounds.width), y: clamp((event.clientY - bounds.top) / bounds.height) };
  }

  function pointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!pageCount) return;
    clearOutput();
    event.currentTarget.setPointerCapture(event.pointerId);
    const start = point(event);
    const bounds = event.currentTarget.getBoundingClientRect();
    const toleranceX = 14 / bounds.width;
    const toleranceY = 14 / bounds.height;
    const hit = [...currentRegions].reverse().find((region) => start.x >= region.x && start.x <= region.x + region.width && start.y >= region.y && start.y <= region.y + region.height);
    if (hit) {
      const resize = Math.abs(start.x - (hit.x + hit.width)) <= toleranceX && Math.abs(start.y - (hit.y + hit.height)) <= toleranceY;
      regionInteraction.current = { kind: resize ? "resize" : "move", id: hit.id, start, original: { ...hit } };
      return;
    }
    setDragStart(start);
    setDraft({ id: "draft", pageIndex, x: start.x, y: start.y, width: .001, height: .001, source: "manual", accepted: true, type: "CUSTOM", reason: locale === "en" ? "Added manually by the reviewer." : "由复核者手动新增。" });
  }

  function pointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const end = point(event);
    if (regionInteraction.current) {
      const interaction = regionInteraction.current;
      const deltaX = end.x - interaction.start.x;
      const deltaY = end.y - interaction.start.y;
      setRegions((current) => current.map((region) => {
        if (region.id !== interaction.id) return region;
        return normalizeRegion(interaction.kind === "move"
          ? { ...interaction.original, x: interaction.original.x + deltaX, y: interaction.original.y + deltaY }
          : { ...interaction.original, width: interaction.original.width + deltaX, height: interaction.original.height + deltaY });
      }));
      return;
    }
    if (!dragStart) return;
    setDraft(normalizeRegion({ id: "draft", pageIndex, x: Math.min(dragStart.x, end.x), y: Math.min(dragStart.y, end.y), width: Math.abs(end.x - dragStart.x), height: Math.abs(end.y - dragStart.y), source: "manual", accepted: true, type: "CUSTOM", reason: locale === "en" ? "Added manually by the reviewer." : "由复核者手动新增。" }));
  }

  function pointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    if (draft && draft.width > .005 && draft.height > .005) setRegions((current) => [...current, { ...draft, id: `p${pageIndex + 1}-manual-${current.length + 1}` }]);
    setDraft(null);
    setDragStart(null);
    regionInteraction.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function updateRegion(id: string, patch: Partial<PdfRegion>) {
    setRegions((current) => current.map((region) => region.id === id ? normalizeRegion({ ...region, ...patch }) : region));
    clearOutput();
  }

  function togglePageReviewed() {
    setReviewedPages((current) => current.includes(pageIndex) ? current.filter((value) => value !== pageIndex) : [...current, pageIndex].sort((a, b) => a - b));
    clearOutput();
  }

  async function runOcr() {
    const sourceDocument = documentRef.current;
    if (!sourceDocument || isOcrRunning) return;
    clearOutput();
    setIsOcrRunning(true);
    setError("");
    setOcrProgress(0);
    setOcrStatus(locale === "en" ? "Loading local OCR runtime" : "正在载入本地 OCR 运行时");
    const canvas = window.document.createElement("canvas");
    try {
      const page = await sourceDocument.getPage(pageIndex + 1);
      const viewport = page.getViewport({ scale: PREVIEW_SCALE });
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable.");
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      page.cleanup();
      const { createWorker, OEM } = await import("tesseract.js");
      const languages = ocrLanguage === "eng" ? "eng" : ["eng", "chi_sim"];
      const worker = await createWorker(languages, OEM.LSTM_ONLY, {
        workerPath: "/generated/privacy-ocr/worker.min.js",
        corePath: "/generated/privacy-ocr/core",
        langPath: "/generated/privacy-ocr/lang",
        cacheMethod: "none",
        logger: (message) => { setOcrStatus(message.status); setOcrProgress(Math.round(message.progress * 100)); },
      });
      try {
        const result = await worker.recognize(canvas, {}, { blocks: true });
        const lines = result.data.blocks?.flatMap((block) => block.paragraphs.flatMap((paragraph) => paragraph.lines)) ?? [];
        const detected: PdfRegion[] = [];
        for (const line of lines) {
          for (const mapped of mapSensitiveOcrLine(line)) {
            if (mapped.confidence < 35) continue;
            const { entity: match, bbox } = mapped;
            detected.push(normalizeRegion({
              id: `p${pageIndex + 1}-ocr-${detected.length + 1}`,
              pageIndex,
              x: bbox.x0 / canvas.width,
              y: bbox.y0 / canvas.height,
              width: (bbox.x1 - bbox.x0) / canvas.width,
              height: (bbox.y1 - bbox.y0) / canvas.height,
              source: "ocr",
              accepted: true,
              type: match.type,
              text: match.text,
              reason: localizedPdfOcrReason(locale, match.type, mapped.confidence),
            }));
          }
        }
        setRegions((current) => mergePdfRegions([...current.filter((region) => !(region.pageIndex === pageIndex && region.source === "ocr")), ...detected]));
        setPageMethods((current) => current.map((method, index) => index === pageIndex ? "ocr" : method));
        setOcrStatus(detected.length ? `${detected.length} ${locale === "en" ? "rule-matched OCR regions" : "个规则匹配 OCR 区域"}` : copy.ocrNone);
        setOcrProgress(100);
      } finally {
        await worker.terminate();
      }
    } catch (cause) {
      console.error("Privacy PDF OCR could not finish.", cause);
      setOcrStatus(copy.ocrError);
      setError(copy.ocrError);
    } finally {
      canvas.width = 0;
      canvas.height = 0;
      setIsOcrRunning(false);
    }
  }

  async function exportPdf() {
    const source = documentRef.current;
    if (!source || !canExport) return;
    setIsExporting(true);
    setError("");
    setValidation(null);
    let burnInVerified = true;
    try {
      const { PDFDocument } = await import("pdf-lib");
      const output = await PDFDocument.create();
      output.setTitle("Redacted image-only PDF");
      output.setAuthor("Privacy Preflight Web");
      output.setCreator("Privacy Preflight Web");
      output.setProducer("Privacy Preflight Web");
      const originalDimensions: { width: number; height: number }[] = [];

      for (let index = 0; index < source.numPages; index += 1) {
        const page = await source.getPage(index + 1);
        const baseViewport = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: EXPORT_SCALE });
        if (viewport.width * viewport.height > MAX_RENDER_PIXELS) throw new Error("Page exceeds the safe export render limit.");
        originalDimensions.push({ width: baseViewport.width, height: baseViewport.height });
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("Canvas unavailable.");
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        const pageRegions = mergePdfRegions(regions.filter((region) => region.pageIndex === index && region.accepted));
        context.fillStyle = "#000";
        for (const region of pageRegions) {
          const { x, y, width, height } = pixelRect(region, canvas.width, canvas.height);
          context.fillRect(x, y, width, height);
          const sample = context.getImageData(x + Math.floor(width / 2), y + Math.floor(height / 2), 1, 1).data;
          burnInVerified = burnInVerified && sample[0] < 8 && sample[1] < 8 && sample[2] < 8 && sample[3] > 245;
        }
        const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
        if (!pngBlob) throw new Error("Page raster export failed.");
        const embedded = await output.embedPng(await pngBlob.arrayBuffer());
        const outputPage = output.addPage([baseViewport.width, baseViewport.height]);
        outputPage.drawImage(embedded, { x: 0, y: 0, width: baseViewport.width, height: baseViewport.height });
        canvas.width = 0;
        canvas.height = 0;
        page.cleanup();
      }

      const outputBytes = await output.save();
      const blob = new Blob([new Uint8Array(outputBytes)], { type: "application/pdf" });
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/generated/privacy-pdf/pdf.worker.min.mjs";
      const verificationTask = pdfjs.getDocument({ data: outputBytes.slice() });
      const verificationDocument = await verificationTask.promise;
      let text = "";
      let annotationsEmpty = true;
      let dimensions = true;
      for (let index = 0; index < verificationDocument.numPages; index += 1) {
        const page = await verificationDocument.getPage(index + 1);
        const content = await page.getTextContent();
        text += content.items.map((item) => "str" in item ? item.str : "").join("");
        annotationsEmpty = annotationsEmpty && (await page.getAnnotations()).length === 0;
        const viewport = page.getViewport({ scale: 1 });
        dimensions = dimensions && Math.abs(viewport.width - originalDimensions[index].width) < .5 && Math.abs(viewport.height - originalDimensions[index].height) < .5;
      }
      const metadata = await verificationDocument.getMetadata();
      const metadataText = JSON.stringify(metadata.info).toLowerCase();
      const knownTerms = acceptedRegions.map((region) => region.text?.trim()).filter((value): value is string => Boolean(value));
      const knownTermsAbsent = knownTerms.every((term) => !text.includes(term));
      const metadataClean = !metadataText.includes(originalFileNameRef.current.toLowerCase()) && knownTerms.every((term) => !metadataText.includes(term.toLowerCase()));
      const result: PdfValidation = {
        safe: verificationDocument.numPages === source.numPages && dimensions && text.trim() === "" && annotationsEmpty && knownTermsAbsent && metadataClean && burnInVerified,
        pageCount: verificationDocument.numPages === source.numPages,
        dimensions,
        textLayerEmpty: text.trim() === "",
        annotationsEmpty,
        knownTermsAbsent,
        metadataClean,
        burnInVerified,
        outputHash: await sha256(blob),
      };
      await verificationTask.destroy();
      setValidation(result);
      if (!result.safe) return;
      const name = `${fileName.replace(/\.pdf$/i, "") || "document"}-redacted.pdf`;
      const url = URL.createObjectURL(blob);
      setOutput((current) => {
        if (current) URL.revokeObjectURL(current.url);
        return { url, name, size: blob.size, type: blob.type, bytes: new Uint8Array(outputBytes) };
      });
    } catch (cause) {
      console.error("Privacy PDF safe export could not finish.", cause);
      setError(copy.exportError);
    } finally {
      setIsExporting(false);
    }
  }

  async function reset() {
    renderSequence.current += 1;
    await loadingTaskRef.current?.destroy();
    loadingTaskRef.current = null;
    documentRef.current = null;
    originalFileNameRef.current = "";
    setFileName("");
    setPageCount(0);
    setPageIndex(0);
    setPageSize({ width: 0, height: 0 });
    setRegions([]);
    setReviewedPages([]);
    setDraft(null);
    setOcrStatus("");
    setOcrProgress(0);
    setError("");
    setValidation(null);
    setOutput((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
    setPageMethods([]);
    if (inputRef.current) inputRef.current.value = "";
  }

  const validationChecks = validation ? (Object.keys(copy.checks) as (keyof typeof copy.checks)[]) : [];

  return (
    <div className="privacy-pdf-workspace">
      <div className="privacy-actionbar">
        <input ref={inputRef} className="sr-only" type="file" accept="application/pdf" onChange={(event) => { const file = event.target.files?.[0]; if (file) void loadFile(file); }} />
        <button type="button" className="primary" onClick={() => inputRef.current?.click()}><FileText aria-hidden="true" />{copy.choose}</button>
        <button type="button" onClick={() => void loadExample("/case-studies/privacy-preflight/pdf-example-text-layer.pdf", "privacy-text-layer-example.pdf")}><FileText aria-hidden="true" />{copy.exampleText}</button>
        <button type="button" onClick={() => void loadExample("/case-studies/privacy-preflight/pdf-example-scanned.pdf", "privacy-scanned-example.pdf")}><FileText aria-hidden="true" />{copy.exampleScan}</button>
        <button type="button" onClick={() => void loadExample("/case-studies/privacy-preflight/pdf-example-multipage.pdf", "privacy-multipage-example.pdf", "eng+chi_sim")}><FileText aria-hidden="true" />{copy.exampleMulti}</button>
        <span className="privacy-file-name">{fileName || copy.local}</span>
        <button type="button" title={copy.previous} onClick={() => setPageIndex((current) => Math.max(0, current - 1))} disabled={!pageCount || pageIndex === 0}><ChevronLeft aria-hidden="true" /></button>
        <strong className="privacy-page-counter">{copy.page} {pageCount ? `${pageIndex + 1} / ${pageCount}` : "-"}</strong>
        <button type="button" title={copy.next} onClick={() => setPageIndex((current) => Math.min(pageCount - 1, current + 1))} disabled={!pageCount || pageIndex >= pageCount - 1}><ChevronRight aria-hidden="true" /></button>
        <select value={ocrLanguage} onChange={(event) => setOcrLanguage(event.target.value as "eng" | "eng+chi_sim")} aria-label={locale === "en" ? "OCR language" : "OCR 语言"}><option value="eng">{copy.english}</option><option value="eng+chi_sim">{copy.bilingual}</option></select>
        <button type="button" onClick={() => void runOcr()} disabled={!pageCount || isOcrRunning || isLoading}><ScanSearch aria-hidden="true" />{copy.ocr}</button>
        <button type="button" onClick={() => void reset()} disabled={!pageCount && !fileName}><RotateCcw aria-hidden="true" />{copy.reset}</button>
      </div>
      <div className="privacy-pdf-grid">
        <div className="privacy-pdf-canvas-wrap" aria-busy={isLoading}>
          {pageCount ? <div className="privacy-pdf-canvas-stack"><canvas ref={pageCanvasRef} /><canvas ref={overlayCanvasRef} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} aria-label={copy.review} /></div> : <button type="button" className="privacy-drop-target" onClick={() => inputRef.current?.click()}><FileText aria-hidden="true" /><strong>{copy.choose}</strong><span>{copy.local}</span></button>}
        </div>
        <aside className="privacy-pdf-gate">
          <ShieldX aria-hidden="true" />
          <p className="eyebrow">{copy.gate}</p>
          <h4>{copy.review}</h4>
          <p>{copy.note}</p>
          <div className="privacy-output-steps" aria-label={locale === "en" ? "Redaction progress" : "脱敏进度"}><span className={pageCount ? "done" : ""}>{copy.before}</span><span className={regions.length ? "done" : ""}>{copy.detected}</span><span className={output ? "done" : ""}>{copy.redacted}</span></div>
          <p className="privacy-page-method"><strong>{copy.method}:</strong> {pageMethods[pageIndex] === "text-layer" ? copy.textLayer : pageMethods[pageIndex] === "ocr" ? copy.ocrMethod : copy.ocrRequired}</p>
          <button type="button" className={`privacy-page-review ${reviewedPages.includes(pageIndex) ? "reviewed" : ""}`} onClick={togglePageReviewed} disabled={!pageCount}>{reviewedPages.includes(pageIndex) ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}{reviewedPages.includes(pageIndex) ? copy.reviewed : copy.unreviewed}</button>
          <div className="privacy-ocr-status" aria-live="polite"><span>{ocrStatus || copy.ocrIdle}</span><progress max="100" value={ocrProgress} /></div>
          <div className="privacy-box-list"><h5>{copy.regions} <span>{currentRegions.length}</span></h5>{!currentRegions.length ? <p>{copy.none}</p> : currentRegions.map((region, index) => <article className={region.accepted ? "" : "rejected"} key={region.id}><div><strong>{region.type} {index + 1}</strong><div><code>{region.source}</code><button type="button" className="privacy-box-accept" aria-pressed={region.accepted} onClick={() => updateRegion(region.id, { accepted: !region.accepted })}>{region.accepted ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}{region.accepted ? copy.accept : copy.reject}</button><button type="button" className="icon-only" title={copy.delete} onClick={() => { setRegions((current) => current.filter((item) => item.id !== region.id)); clearOutput(); }}><Trash2 aria-hidden="true" /></button></div></div>{region.text ? <p><code>{region.text}</code>{region.reason}</p> : null}<div className="privacy-box-fields">{(["x", "y", "width", "height"] as const).map((field) => <label key={field}>{field} %<input type="number" min="0" max="100" step="0.1" value={Number((region[field] * 100).toFixed(1))} onChange={(event) => updateRegion(region.id, { [field]: Number(event.target.value) / 100 })} /></label>)}</div></article>)}</div>
          <div className="privacy-pdf-explanation"><strong>{copy.gate}</strong><p>{copy.gateBody}</p>{!canExport ? <p>{copy.needReview}</p> : null}</div>
          <button type="button" className="privacy-export-button" onClick={() => void exportPdf()} disabled={!canExport}><Eye aria-hidden="true" />{copy.preview}</button>
          {output && validation?.safe ? <div className="privacy-generated-output" data-testid="privacy-pdf-output"><PrivacyPdfResultPreview key={output.url} bytes={output.bytes} locale={locale} /><dl><div><dt>{locale === "en" ? "File" : "文件"}</dt><dd>{output.name}</dd></div><div><dt>{locale === "en" ? "Type" : "类型"}</dt><dd>{output.type}</dd></div><div><dt>{locale === "en" ? "Size" : "大小"}</dt><dd>{(output.size / 1024).toFixed(1)} KB</dd></div></dl><a className="button-link primary" href={output.url} download={output.name}><Download aria-hidden="true" />{copy.download}</a></div> : null}
          {validation ? <div className={`privacy-validation ${validation.safe ? "pass" : "fail"}`}><div>{validation.safe ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}<strong>{copy.verification}</strong></div><p>{validation.safe ? copy.safe : copy.unsafe}</p><div className="privacy-pdf-checks">{validationChecks.map((key) => <span key={key}>{validation[key] ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}{copy.checks[key]}</span>)}</div><code>SHA-256 {validation.outputHash}</code></div> : null}
          {error ? <p className="privacy-error" role="alert">{error}</p> : null}
        </aside>
      </div>
    </div>
  );
}

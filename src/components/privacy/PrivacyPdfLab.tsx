"use client";

import { Check, Columns2, Download, Eye, FileText, RotateCcw, ScanSearch, ShieldX, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask } from "pdfjs-dist";
import type { Worker } from "tesseract.js";
import type { Locale } from "@/lib/i18n";
import { privacySourceLabel } from "@/lib/privacy-localization";
import { mapSensitiveOcrLine, scanSensitiveText } from "@/lib/privacy-redaction";
import PrivacyPdfPage from "./PrivacyPdfPage";
import PrivacyPdfResultPreview from "./PrivacyPdfResultPreview";
import type { ActivePdfDocument, PdfRegion } from "./privacy-pdf-types";

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
  documentId: number;
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
    choose: "Choose PDF", reset: "Reset", local: "Text recognition runs locally in your browser. Your file is not uploaded.", page: "Page", previous: "Previous page", next: "Next page",
    ocr: "Scan entire PDF", english: "English", bilingual: "English + 简体中文", review: "Per-page redaction review", note: "One document-level scan checks text layers first, runs local OCR where required, and preserves page-scoped review regions.",
    regions: "Page regions", none: "No regions on this page. Draw a rectangle or run local OCR.", accept: "Accept", reject: "Reject", delete: "Delete region", preview: "Preview redacted result", download: "Download redacted file",
    invalid: "Choose a readable PDF up to 20 MB and 20 pages.", loading: "Loading local PDF", render: "Rendering page", renderError: "This PDF page could not be rendered locally. Try a smaller or simpler PDF.", loadError: "This PDF could not be opened locally. Choose another readable PDF.", ocrError: "Local OCR could not finish on this page. Try again or draw the regions manually.", exportError: "The safe PDF export could not be completed. No download was created.", ocrIdle: "OCR not run on this page", ocrNone: "OCR finished; no rule-matched token was found.",
    gate: "Fail-closed export gate", gateBody: "The original PDF is never modified. Accepted regions are burned into newly rendered page pixels, then a new image-only PDF is built and reopened for verification.",
    needReview: "Scan the entire PDF and accept at least one redaction region before confirming the review.", verification: "Post-export verification", safe: "Safe image-only PDF is ready to preview and download.", unsafe: "Verification failed; no safe PDF is available.", exampleText: "Load text-layer PDF", exampleScan: "Load scanned PDF", exampleMulti: "Load multi-page PDF", method: "Page method", textLayer: "Text layer", ocrRequired: "OCR required", ocrMethod: "Local OCR", before: "Before", detected: "Detected", redacted: "Redacted", scanNext: "Clean preview loaded. Scan the entire PDF next; detection regions stay hidden until scanning finishes.", compare: "Before / after", originalView: "Original PDF", redactedView: "Redacted PDF", confirm: "Confirm review and show result",
    checks: { pageCount: "Page count", dimensions: "Page dimensions", textLayerEmpty: "Extractable text empty", annotationsEmpty: "No annotations", knownTermsAbsent: "Known terms absent", metadataClean: "Original metadata absent", burnInVerified: "Black pixels burned in" },
  } : {
    choose: "选择 PDF", reset: "重置", local: "文字识别在本机浏览器中完成，文件不会上传。", page: "页", previous: "上一页", next: "下一页",
    ocr: "扫描整份 PDF", english: "英语", bilingual: "英语 + 简体中文", review: "逐页脱敏复核", note: "一次文档级扫描会先检查文字层，仅在需要时运行本地 OCR，并按页保留复核区域。",
    regions: "本页区域", none: "本页尚无区域，请框选或运行本地文字识别。", accept: "接受", reject: "拒绝", delete: "删除区域", preview: "预览脱敏结果", download: "下载脱敏文件",
    invalid: "请选择可读取、不超过 20 MB 且不超过 20 页的 PDF。", loading: "正在本地载入 PDF", render: "正在渲染页面", renderError: "无法在本地渲染此 PDF 页面，请尝试更小或结构更简单的 PDF。", loadError: "无法在本地打开此 PDF，请选择其他可读取的 PDF。", ocrError: "本页的本地文字识别未能完成，请重试或手动框选区域。", exportError: "无法完成安全 PDF 导出，因此没有生成下载文件。", ocrIdle: "本页尚未运行 OCR", ocrNone: "OCR 已完成，但没有匹配规则的敏感词项。",
    gate: "fail-closed（失败即拦截）导出门禁", gateBody: "原 PDF 不会被修改。已接受区域会烧录进重新渲染的页面像素，再重建纯图像 PDF 并重新打开验证。",
    needReview: "确认复核前，请扫描整份 PDF 并至少接受一个脱敏区域。", verification: "导出后验证", safe: "安全的纯图像 PDF 已可预览和下载。", unsafe: "验证失败，暂无可用的安全 PDF。", exampleText: "加载文字层 PDF", exampleScan: "加载扫描版 PDF", exampleMulti: "加载多页 PDF", method: "本页方法", textLayer: "文字层", ocrRequired: "需要文字识别", ocrMethod: "本地文字识别", before: "原始文件", detected: "检测结果", redacted: "脱敏结果", scanNext: "已载入干净预览。下一步请扫描整份 PDF；扫描完成前不会显示检测框。", compare: "前后对照", originalView: "原始 PDF", redactedView: "脱敏 PDF", confirm: "确认复核并显示结果",
    checks: { pageCount: "页数", dimensions: "页面尺寸", textLayerEmpty: "可提取文本为空", annotationsEmpty: "无注释", knownTermsAbsent: "已知词项不存在", metadataClean: "不含原始元数据", burnInVerified: "黑色像素已烧录" },
  };

  const activeDocumentRef = useRef<ActivePdfDocument | null>(null);
  const loadSequence = useRef(0);
  const selectionSequence = useRef(0);
  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const originalFileNameRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [activeDocumentId, setActiveDocumentId] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [regions, setRegions] = useState<PdfRegion[]>([]);
  const [ocrLanguage, setOcrLanguage] = useState<"eng" | "eng+chi_sim">("eng");
  const [ocrStatus, setOcrStatus] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");
  const [validation, setValidation] = useState<PdfValidation | null>(null);
  const [output, setOutput] = useState<PdfOutput | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [pageMethods, setPageMethods] = useState<("text-layer" | "ocr-required" | "ocr")[]>([]);
  const [scannedPages, setScannedPages] = useState<number[]>([]);

  const currentRegions = regions.filter((region) => region.pageIndex === pageIndex);
  const acceptedRegions = regions.filter((region) => region.accepted);
  const allPagesScanned = pageCount > 0 && scannedPages.length === pageCount;
  const canExport = allPagesScanned && acceptedRegions.length > 0 && !isLoading && !isOcrRunning && !isExporting;
  const handlePdfRenderError = useCallback(() => {
    setError((current) => current && current !== copy.renderError ? current : copy.renderError);
  }, [copy.renderError]);

  useEffect(() => () => {
    void loadingTaskRef.current?.destroy();
    loadingTaskRef.current = null;
    activeDocumentRef.current = null;
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
    setShowOriginal(false);
  }

  async function loadExample(path: string, name: string, language: "eng" | "eng+chi_sim" = "eng") {
    const selectionId = ++selectionSequence.current;
    loadSequence.current += 1;
    activeDocumentRef.current = null;
    setActiveDocumentId(0);
    setPageCount(0);
    setPageIndex(0);
    setRegions([]);
    setScannedPages([]);
    setPageMethods([]);
    clearOutput();
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error("Example PDF unavailable");
      if (selectionId !== selectionSequence.current) return;
      setOcrLanguage(language);
      await loadFile(new File([await response.blob()], name, { type: "application/pdf" }));
    } catch (cause) {
      if (selectionId !== selectionSequence.current) return;
      console.error("Privacy PDF example could not load.", cause);
      setError(copy.loadError);
      setIsLoading(false);
    }
  }

  async function loadFile(file: File) {
    const requestId = ++loadSequence.current;
    setError("");
    clearOutput();
    activeDocumentRef.current = null;
    setActiveDocumentId(0);
    setFileName("");
    setPageCount(0);
    setPageIndex(0);
    setRegions([]);
    setScannedPages([]);
    setOcrStatus("");
    setOcrProgress(0);
    setIsOcrRunning(false);
    setIsExporting(false);
    setPageMethods([]);
    originalFileNameRef.current = "";
    const previousTask = loadingTaskRef.current;
    loadingTaskRef.current = null;
    if (previousTask) await previousTask.destroy();
    if (requestId !== loadSequence.current) return;
    if (file.type !== "application/pdf" || file.size > MAX_PDF_BYTES) {
      setError(copy.invalid);
      return;
    }
    setIsLoading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/generated/privacy-pdf/pdf.worker.min.mjs";
      const loadingTask = pdfjs.getDocument({ data: bytes.slice() });
      loadingTaskRef.current = loadingTask;
      const document = await loadingTask.promise;
      if (requestId !== loadSequence.current) {
        await loadingTask.destroy();
        return;
      }
      if (document.numPages < 1 || document.numPages > MAX_PDF_PAGES) {
        await loadingTask.destroy();
        loadingTaskRef.current = null;
        throw new Error(copy.invalid);
      }
      originalFileNameRef.current = file.name;
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
      if (requestId !== loadSequence.current) {
        await loadingTask.destroy();
        return;
      }
      const activeDocument: ActivePdfDocument = {
        id: requestId,
        fileName: file.name,
        document,
        textLayerRegions: mergePdfRegions(textLayerRegions),
      };
      activeDocumentRef.current = activeDocument;
      setActiveDocumentId(activeDocument.id);
      setFileName(activeDocument.fileName);
      setPageCount(document.numPages);
      setPageIndex(0);
      setRegions([]);
      setPageMethods(methods);
      setScannedPages([]);
      setOcrStatus(copy.scanNext);
      setOcrProgress(0);
    } catch (cause) {
      if (requestId !== loadSequence.current) return;
      console.error("Privacy PDF could not load.", cause);
      await loadingTaskRef.current?.destroy();
      loadingTaskRef.current = null;
      activeDocumentRef.current = null;
      setActiveDocumentId(0);
      setPageCount(0);
      setError(copy.loadError);
    } finally {
      if (requestId === loadSequence.current) setIsLoading(false);
    }
  }

  function updateRegion(id: string, patch: Partial<PdfRegion>) {
    setRegions((current) => current.map((region) => region.id === id ? normalizeRegion({ ...region, ...patch }) : region));
    clearOutput();
  }

  async function scanDocument() {
    const activeDocument = activeDocumentRef.current;
    if (!activeDocument || !pageCount || isOcrRunning || isExporting) return;
    const sourceDocument = activeDocument.document;
    clearOutput();
    setScannedPages([]);
    setRegions((current) => current.filter((region) => region.source === "manual"));
    setIsOcrRunning(true);
    setError("");
    setOcrProgress(0);
    setOcrStatus(`0 / ${pageCount}`);
    const canvas = window.document.createElement("canvas");
    let worker: Worker | null = null;
    try {
      for (let index = 0; index < pageCount; index += 1) {
        const page = await sourceDocument.getPage(index + 1);
        const viewport = page.getViewport({ scale: PREVIEW_SCALE });
        page.cleanup();
        if (viewport.width * viewport.height > MAX_RENDER_PIXELS) throw new Error("Page exceeds the local OCR render limit.");
      }
      const { createWorker, OEM } = await import("tesseract.js");
      const languages = ocrLanguage === "eng" ? "eng" : ["eng", "chi_sim"];
      let currentScanIndex = 0;
      worker = await createWorker(languages, OEM.LSTM_ONLY, {
        workerPath: "/generated/privacy-ocr/worker.min.js",
        corePath: "/generated/privacy-ocr/core",
        langPath: "/generated/privacy-ocr/lang",
        cacheMethod: "none",
        logger: (message) => {
          if (activeDocumentRef.current?.id !== activeDocument.id) return;
          setOcrProgress(Math.round(((currentScanIndex + message.progress) / pageCount) * 100));
        },
      });

      for (let scanPageIndex = 0; scanPageIndex < pageCount; scanPageIndex += 1) {
        if (activeDocumentRef.current?.id !== activeDocument.id) return;
        setPageIndex(scanPageIndex);
        currentScanIndex = scanPageIndex;
        const stagedTextRegions = activeDocument.textLayerRegions.filter((region) => region.pageIndex === scanPageIndex);
        const detected: PdfRegion[] = [];
        const needsOcr = true;
        try {
          if (needsOcr) {
            if (!worker) throw new Error("OCR worker unavailable.");
            const page = await sourceDocument.getPage(scanPageIndex + 1);
            try {
              const viewport = page.getViewport({ scale: PREVIEW_SCALE });
              if (viewport.width * viewport.height > MAX_RENDER_PIXELS) throw new Error("Page exceeds the local OCR render limit.");
              canvas.width = Math.round(viewport.width);
              canvas.height = Math.round(viewport.height);
              const context = canvas.getContext("2d");
              if (!context) throw new Error("Canvas unavailable.");
              await page.render({ canvas, canvasContext: context, viewport }).promise;
            } finally {
              page.cleanup();
            }
            const result = await worker.recognize(canvas, {}, { blocks: true });
            const lines = result.data.blocks?.flatMap((block) => block.paragraphs.flatMap((paragraph) => paragraph.lines)) ?? [];
            for (const line of lines) {
              for (const mapped of mapSensitiveOcrLine(line)) {
                if (mapped.confidence < 35) continue;
                const { entity: match, bbox } = mapped;
                detected.push(normalizeRegion({
                  id: `p${scanPageIndex + 1}-ocr-${detected.length + 1}`,
                  pageIndex: scanPageIndex,
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
          }
        } catch (cause) {
          console.error("Privacy PDF document scan could not finish a page.", cause);
          setError(copy.ocrError);
          setOcrStatus(`${scanPageIndex} / ${pageCount}`);
          break;
        }
        setRegions((current) => mergePdfRegions([
          ...current.filter((region) => region.pageIndex !== scanPageIndex || region.source === "manual"),
          ...stagedTextRegions,
          ...detected,
        ]));
        setScannedPages((current) => current.includes(scanPageIndex) ? current : [...current, scanPageIndex].sort((a, b) => a - b));
        setPageMethods((current) => current.map((method, index) => index === scanPageIndex ? needsOcr ? "ocr" : "text-layer" : method));
        setOcrStatus(`${scanPageIndex + 1} / ${pageCount}`);
        setOcrProgress(Math.round(((scanPageIndex + 1) / pageCount) * 100));
      }
    } catch (cause) {
      if (activeDocumentRef.current?.id !== activeDocument.id) return;
      console.error("Privacy PDF document scan could not start.", cause);
      setOcrStatus(copy.ocrError);
      setError(copy.ocrError);
    } finally {
      canvas.width = 0;
      canvas.height = 0;
      await worker?.terminate();
      if (activeDocumentRef.current?.id === activeDocument.id) setIsOcrRunning(false);
    }
  }

  async function exportPdf() {
    const activeDocument = activeDocumentRef.current;
    const source = activeDocument?.document;
    if (!activeDocument || !source || !canExport) return;
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
      if (activeDocumentRef.current?.id !== activeDocument.id) return;
      setValidation(result);
      if (!result.safe) return;
      const name = `${fileName.replace(/\.pdf$/i, "") || "document"}-redacted.pdf`;
      const url = URL.createObjectURL(blob);
      setOutput((current) => {
        if (current) URL.revokeObjectURL(current.url);
        return { documentId: activeDocument.id, url, name, size: blob.size, type: blob.type, bytes: new Uint8Array(outputBytes) };
      });
      setPageIndex(0);
      setShowOriginal(false);
    } catch (cause) {
      if (activeDocumentRef.current?.id !== activeDocument.id) return;
      console.error("Privacy PDF safe export could not finish.", cause);
      setError(copy.exportError);
    } finally {
      if (activeDocumentRef.current?.id === activeDocument.id) setIsExporting(false);
    }
  }

  async function reset() {
    selectionSequence.current += 1;
    loadSequence.current += 1;
    await loadingTaskRef.current?.destroy();
    loadingTaskRef.current = null;
    activeDocumentRef.current = null;
    setActiveDocumentId(0);
    originalFileNameRef.current = "";
    setFileName("");
    setPageCount(0);
    setPageIndex(0);
    setRegions([]);
    setScannedPages([]);
    setOcrStatus("");
    setOcrProgress(0);
    setIsOcrRunning(false);
    setIsExporting(false);
    setError("");
    setValidation(null);
    setOutput((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
    setPageMethods([]);
    setShowOriginal(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  const validationChecks = validation ? (Object.keys(copy.checks) as (keyof typeof copy.checks)[]) : [];
  const currentPageScanned = scannedPages.includes(pageIndex);
  const hasCurrentOutput = Boolean(output && validation?.safe && output.documentId === activeDocumentId);
  const activeDocument = activeDocumentRef.current?.id === activeDocumentId ? activeDocumentRef.current : null;

  function replacePageRegions(targetPageIndex: number, pageRegions: PdfRegion[]) {
    setRegions((current) => mergePdfRegions([
      ...current.filter((region) => region.pageIndex !== targetPageIndex),
      ...pageRegions,
    ]));
    clearOutput();
  }

  return (
    <div className="privacy-pdf-workspace">
      <div className="privacy-actionbar">
        <input ref={inputRef} className="sr-only" type="file" accept="application/pdf" onChange={(event) => { const file = event.target.files?.[0]; if (file) { selectionSequence.current += 1; void loadFile(file); } }} />
        <button type="button" onClick={() => inputRef.current?.click()}><FileText aria-hidden="true" />{copy.choose}</button>
        <button type="button" onClick={() => void loadExample("/case-studies/privacy-preflight/pdf-example-text-layer.pdf", "privacy-text-layer-example.pdf")}><FileText aria-hidden="true" />{copy.exampleText}</button>
        <button type="button" onClick={() => void loadExample("/case-studies/privacy-preflight/pdf-example-scanned.pdf", "privacy-scanned-example.pdf")}><FileText aria-hidden="true" />{copy.exampleScan}</button>
        <button type="button" onClick={() => void loadExample("/case-studies/privacy-preflight/pdf-example-multipage.pdf", "privacy-multipage-example.pdf", "eng+chi_sim")}><FileText aria-hidden="true" />{copy.exampleMulti}</button>
        <span className="privacy-file-name">{fileName || copy.local}</span>
        <strong className="privacy-page-counter">{copy.page} {pageCount ? `${pageIndex + 1} / ${pageCount}` : "-"}</strong>
        <select value={ocrLanguage} onChange={(event) => setOcrLanguage(event.target.value as "eng" | "eng+chi_sim")} aria-label={locale === "en" ? "OCR language" : "OCR 语言"}><option value="eng">{copy.english}</option><option value="eng+chi_sim">{copy.bilingual}</option></select>
        <button type="button" className="privacy-scan-primary" onClick={() => void scanDocument()} disabled={!pageCount || isLoading || isOcrRunning || isExporting}><ScanSearch aria-hidden="true" />{copy.ocr}</button>
        <button type="button" onClick={() => void reset()} disabled={!pageCount && !fileName}><RotateCcw aria-hidden="true" />{copy.reset}</button>
      </div>
      <div className="privacy-pdf-grid">
        <div className="privacy-pdf-canvas-wrap privacy-main-result-area" aria-busy={isLoading}>
          {pageCount && activeDocument ? (hasCurrentOutput && !showOriginal && output
            ? <PrivacyPdfResultPreview key={output.url} bytes={output.bytes} locale={locale} />
            : <div className="privacy-pdf-page-stream" data-testid={hasCurrentOutput ? "privacy-pdf-original-view" : "privacy-pdf-source-pages"}>{Array.from({ length: pageCount }, (_, index) => (
              <PrivacyPdfPage
                key={index}
                document={activeDocument}
                pageIndex={index}
                regions={regions.filter((region) => region.pageIndex === index)}
                scanned={scannedPages.includes(index)}
                active={pageIndex === index}
                locale={locale}
                readOnly={hasCurrentOutput}
                onActivate={setPageIndex}
                onRegionsChange={replacePageRegions}
                onRenderError={handlePdfRenderError}
              />
            ))}</div>)
            : <button type="button" className="privacy-drop-target" onClick={() => inputRef.current?.click()}><FileText aria-hidden="true" /><strong>{copy.choose}</strong><span>{copy.local}</span></button>}
          {pageCount && !allPagesScanned && !hasCurrentOutput ? <p className="privacy-scan-hint" role="status"><ScanSearch aria-hidden="true" />{copy.scanNext}</p> : null}
          {hasCurrentOutput && output ? <div className="privacy-inplace-result-toolbar" data-testid="privacy-pdf-output"><button type="button" className="privacy-before-after-toggle" aria-pressed={showOriginal} onClick={() => setShowOriginal((current) => !current)}><Columns2 aria-hidden="true" />{copy.compare}</button><span role="status">{showOriginal ? copy.originalView : copy.redactedView}</span><a className="button-link primary" href={output.url} download={output.name}><Download aria-hidden="true" />{copy.download}</a></div> : null}
        </div>
        <aside className="privacy-pdf-gate">
          <ShieldX aria-hidden="true" />
          <p className="eyebrow">{copy.gate}</p>
          <h4>{copy.review}</h4>
          <p>{copy.note}</p>
          <div className="privacy-output-steps" aria-label={locale === "en" ? "Redaction progress" : "脱敏进度"}><span className={pageCount ? "done" : ""}>{copy.before}</span><span className={scannedPages.length ? "done" : ""}>{copy.detected}</span><span className={hasCurrentOutput ? "done" : ""}>{copy.redacted}</span></div>
          <p className="privacy-page-method"><strong>{copy.method}:</strong> {pageMethods[pageIndex] === "text-layer" ? copy.textLayer : pageMethods[pageIndex] === "ocr" ? copy.ocrMethod : copy.ocrRequired}</p>
          <div className="privacy-ocr-status" data-testid="privacy-pdf-scan-progress" aria-live="polite"><span>{ocrStatus || copy.scanNext}</span><progress max="100" value={ocrProgress} /></div>
          <div className="privacy-box-list"><h5>{copy.regions} <span>{currentRegions.length}</span></h5>{!currentRegions.length ? <p>{currentPageScanned ? copy.none : copy.scanNext}</p> : currentRegions.map((region, index) => <article className={region.accepted ? "" : "rejected"} key={region.id}><div><strong>{region.type} {index + 1}</strong><div><code>{privacySourceLabel(locale, region.source)}</code><button type="button" className="privacy-box-accept" aria-pressed={region.accepted} onClick={() => updateRegion(region.id, { accepted: !region.accepted })}>{region.accepted ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}{region.accepted ? copy.accept : copy.reject}</button><button type="button" className="icon-only" title={copy.delete} onClick={() => { setRegions((current) => current.filter((item) => item.id !== region.id)); clearOutput(); }}><Trash2 aria-hidden="true" /></button></div></div>{region.text ? <p><code>{region.text}</code>{region.reason}</p> : null}<div className="privacy-box-fields">{(["x", "y", "width", "height"] as const).map((field) => <label key={field}>{field} %<input type="number" min="0" max="100" step="0.1" value={Number((region[field] * 100).toFixed(1))} onChange={(event) => updateRegion(region.id, { [field]: Number(event.target.value) / 100 })} /></label>)}</div></article>)}</div>
          <div className="privacy-pdf-explanation"><strong>{copy.gate}</strong><p>{copy.gateBody}</p>{!canExport ? <p>{copy.needReview}</p> : null}</div>
          <button type="button" className="privacy-export-button" onClick={() => void exportPdf()} disabled={!canExport}><Eye aria-hidden="true" />{copy.confirm}</button>
          {hasCurrentOutput && output ? <dl className="privacy-result-meta"><div><dt>{locale === "en" ? "File" : "文件"}</dt><dd>{output.name}</dd></div><div><dt>{locale === "en" ? "Type" : "类型"}</dt><dd>{output.type}</dd></div><div><dt>{locale === "en" ? "Size" : "大小"}</dt><dd>{(output.size / 1024).toFixed(1)} KB</dd></div></dl> : null}
          {validation ? <div className={`privacy-validation ${validation.safe ? "pass" : "fail"}`}><div>{validation.safe ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}<strong>{copy.verification}</strong></div><p>{validation.safe ? copy.safe : copy.unsafe}</p><div className="privacy-pdf-checks">{validationChecks.map((key) => <span key={key}>{validation[key] ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}{copy.checks[key]}</span>)}</div><code>SHA-256 {validation.outputHash}</code></div> : null}
          {error ? <p className="privacy-error" role="alert">{error}</p> : null}
        </aside>
      </div>
    </div>
  );
}

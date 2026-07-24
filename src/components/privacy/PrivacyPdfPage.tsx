"use client";

import { useEffect, useRef, useState } from "react";
import type { RenderTask } from "pdfjs-dist";
import type { Locale } from "@/lib/i18n";
import type { ActivePdfDocument, PdfRegion } from "./privacy-pdf-types";

const PREVIEW_SCALE = 1.45;
const MAX_RENDER_PIXELS = 18_000_000;

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

interface PrivacyPdfPageProps {
  document: ActivePdfDocument;
  pageIndex: number;
  regions: PdfRegion[];
  scanned: boolean;
  active: boolean;
  locale: Locale;
  readOnly?: boolean;
  onActivate(pageIndex: number): void;
  onRegionsChange(pageIndex: number, regions: PdfRegion[]): void;
  onRenderError?(): void;
}

export default function PrivacyPdfPage({
  document: activeDocument,
  pageIndex,
  regions,
  scanned,
  active,
  locale,
  readOnly = false,
  onActivate,
  onRegionsChange,
  onRenderError,
}: PrivacyPdfPageProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pageCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const interactionRef = useRef<{ kind: "move" | "resize"; id: string; start: { x: number; y: number }; original: PdfRegion } | null>(null);
  const [visible, setVisible] = useState(pageIndex === 0);
  const [aspectRatio, setAspectRatio] = useState("8.5 / 11");
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [draft, setDraft] = useState<PdfRegion | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setVisible(true);
    }, { root: wrapper.closest(".privacy-pdf-page-stream"), rootMargin: "500px 0px" });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let alive = true;
    void activeDocument.document.getPage(pageIndex + 1).then((page) => {
      if (!alive) return;
      const viewport = page.getViewport({ scale: 1 });
      setAspectRatio(`${viewport.width} / ${viewport.height}`);
    }).catch(() => onRenderError?.());
    return () => { alive = false; };
  }, [activeDocument, onRenderError, pageIndex]);

  useEffect(() => {
    const canvas = pageCanvasRef.current;
    if (!visible || !canvas) return;
    let alive = true;
    void (async () => {
      try {
        renderTaskRef.current?.cancel();
        const page = await activeDocument.document.getPage(pageIndex + 1);
        const viewport = page.getViewport({ scale: PREVIEW_SCALE });
        if (viewport.width * viewport.height > MAX_RENDER_PIXELS) throw new Error("Page exceeds the local render limit.");
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas unavailable.");
        const renderTask = page.render({ canvas, canvasContext: context, viewport });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        if (alive) setPageSize({ width: canvas.width, height: canvas.height });
        page.cleanup();
      } catch (cause) {
        if (alive && !(cause instanceof Error && cause.name === "RenderingCancelledException")) onRenderError?.();
      }
    })();
    return () => {
      alive = false;
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
    };
  }, [activeDocument, onRenderError, pageIndex, visible]);

  useEffect(() => {
    const overlay = overlayCanvasRef.current;
    if (!overlay || !pageSize.width || !pageSize.height) return;
    overlay.width = pageSize.width;
    overlay.height = pageSize.height;
    const context = overlay.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, overlay.width, overlay.height);
    if (!scanned || readOnly) return;
    context.lineWidth = Math.max(2, overlay.width / 600);
    context.setLineDash([context.lineWidth * 3, context.lineWidth * 2]);
    for (const region of [...regions, ...(draft ? [draft] : [])]) {
      const rect = pixelRect(region, overlay.width, overlay.height);
      context.fillStyle = region.accepted ? "rgba(138, 47, 47, .2)" : "rgba(93, 101, 97, .12)";
      context.strokeStyle = region.accepted ? "#8a2f2f" : "#5d6561";
      context.fillRect(rect.x, rect.y, rect.width, rect.height);
      context.strokeRect(rect.x, rect.y, rect.width, rect.height);
      const handle = context.lineWidth * 4;
      context.fillStyle = region.accepted ? "#8a2f2f" : "#5d6561";
      context.fillRect(rect.x + rect.width - handle / 2, rect.y + rect.height - handle / 2, handle, handle);
    }
  }, [draft, pageSize, readOnly, regions, scanned]);

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: clamp((event.clientX - bounds.left) / bounds.width), y: clamp((event.clientY - bounds.top) / bounds.height) };
  }

  function pointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!scanned || readOnly) return;
    onActivate(pageIndex);
    event.currentTarget.setPointerCapture(event.pointerId);
    const start = point(event);
    const bounds = event.currentTarget.getBoundingClientRect();
    const hit = [...regions].reverse().find((region) => start.x >= region.x && start.x <= region.x + region.width && start.y >= region.y && start.y <= region.y + region.height);
    if (hit) {
      const resize = Math.abs(start.x - (hit.x + hit.width)) <= 14 / bounds.width && Math.abs(start.y - (hit.y + hit.height)) <= 14 / bounds.height;
      interactionRef.current = { kind: resize ? "resize" : "move", id: hit.id, start, original: { ...hit } };
      return;
    }
    setDragStart(start);
    setDraft({ id: "draft", pageIndex, x: start.x, y: start.y, width: .001, height: .001, source: "manual", accepted: true, type: "CUSTOM", reason: locale === "en" ? "Added manually by the reviewer." : "由复核者手动新增。" });
  }

  function pointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const end = point(event);
    const interaction = interactionRef.current;
    if (interaction) {
      const deltaX = end.x - interaction.start.x;
      const deltaY = end.y - interaction.start.y;
      onRegionsChange(pageIndex, regions.map((region) => region.id === interaction.id ? normalizeRegion(interaction.kind === "move"
        ? { ...interaction.original, x: interaction.original.x + deltaX, y: interaction.original.y + deltaY }
        : { ...interaction.original, width: interaction.original.width + deltaX, height: interaction.original.height + deltaY }) : region));
      return;
    }
    if (!dragStart) return;
    setDraft(normalizeRegion({ id: "draft", pageIndex, x: Math.min(dragStart.x, end.x), y: Math.min(dragStart.y, end.y), width: Math.abs(end.x - dragStart.x), height: Math.abs(end.y - dragStart.y), source: "manual", accepted: true, type: "CUSTOM", reason: locale === "en" ? "Added manually by the reviewer." : "由复核者手动新增。" }));
  }

  function pointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    if (draft && draft.width > .005 && draft.height > .005) onRegionsChange(pageIndex, [...regions, { ...draft, id: `p${pageIndex + 1}-manual-${regions.length + 1}` }]);
    setDraft(null);
    setDragStart(null);
    interactionRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <div ref={wrapperRef} className={`privacy-pdf-page${active ? " active" : ""}`} data-pdf-page={pageIndex + 1} onClick={() => onActivate(pageIndex)}>
      <span className="privacy-pdf-page-label">{locale === "en" ? "Page" : "第"} {pageIndex + 1}{locale === "zh" ? " 页" : ""}</span>
      <div className="privacy-pdf-canvas-stack" style={{ aspectRatio }}>
        <canvas ref={pageCanvasRef} />
        {!readOnly ? <canvas ref={overlayCanvasRef} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} aria-label={scanned ? (locale === "en" ? "Per-page redaction review" : "逐页脱敏复核") : (locale === "en" ? "Scan entire PDF before review" : "扫描整份 PDF 后再复核")} aria-disabled={!scanned} /> : null}
      </div>
    </div>
  );
}

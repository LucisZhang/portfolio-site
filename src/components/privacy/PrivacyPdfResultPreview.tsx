"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import type { Locale } from "@/lib/i18n";

export default function PrivacyPdfResultPreview({ bytes, locale }: { bytes: Uint8Array; locale: Locale }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const documentRef = useRef<PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [error, setError] = useState("");
  const previewError = locale === "en"
    ? "The generated PDF could not be displayed in-page. The verified download remains available."
    : "无法在页内显示生成的 PDF；经验证的下载文件仍然可用。";

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/generated/privacy-pdf/pdf.worker.min.mjs";
        const loadingTask = pdfjs.getDocument({ data: bytes.slice() });
        loadingTaskRef.current = loadingTask;
        const document = await loadingTask.promise;
        if (!active) {
          await loadingTask.destroy();
          return;
        }
        documentRef.current = document;
        setPageCount(document.numPages);
      } catch (cause) {
        console.error("Privacy PDF result preview could not load.", cause);
        if (active) setError(previewError);
      }
    })();

    return () => {
      active = false;
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
      void loadingTaskRef.current?.destroy();
      loadingTaskRef.current = null;
      documentRef.current = null;
    };
  }, [bytes, previewError]);

  useEffect(() => {
    const document = documentRef.current;
    const canvas = canvasRef.current;
    if (!document || !canvas || !pageCount) return;
    let active = true;
    void (async () => {
      try {
        renderTaskRef.current?.cancel();
        const page = await document.getPage(pageIndex + 1);
        const viewport = page.getViewport({ scale: 1.25 });
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas unavailable");
        const renderTask = page.render({ canvas, canvasContext: context, viewport, background: "#ffffff" });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        if (active) page.cleanup();
      } catch (cause) {
        if (active && !(cause instanceof Error && cause.name === "RenderingCancelledException")) {
          console.error("Privacy PDF result preview page could not render.", cause);
          setError(previewError);
        }
      }
    })();
    return () => {
      active = false;
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
    };
  }, [pageCount, pageIndex, previewError]);

  return (
    <div data-testid="privacy-pdf-result-preview">
      <div className="privacy-actionbar" aria-label={locale === "en" ? "Redacted PDF preview navigation" : "脱敏 PDF 预览导航"}>
        <button type="button" title={locale === "en" ? "Previous preview page" : "上一预览页"} onClick={() => setPageIndex((current) => Math.max(0, current - 1))} disabled={pageIndex === 0}><ChevronLeft aria-hidden="true" /></button>
        <strong className="privacy-page-counter">{locale === "en" ? "Preview page" : "预览页"} {pageCount ? `${pageIndex + 1} / ${pageCount}` : "-"}</strong>
        <button type="button" title={locale === "en" ? "Next preview page" : "下一预览页"} onClick={() => setPageIndex((current) => Math.min(pageCount - 1, current + 1))} disabled={!pageCount || pageIndex >= pageCount - 1}><ChevronRight aria-hidden="true" /></button>
      </div>
      <div className="privacy-pdf-canvas-stack" style={{ margin: 0 }}><canvas ref={canvasRef} aria-label={locale === "en" ? "Generated redacted PDF page" : "实时生成的脱敏 PDF 页面"} /></div>
      {error ? <p className="privacy-error" role="alert">{error}</p> : null}
    </div>
  );
}

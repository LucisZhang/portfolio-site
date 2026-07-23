"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import type { Locale } from "@/lib/i18n";

function ResultPage({ document, pageIndex, locale, onError }: { document: PDFDocumentProxy; pageIndex: number; locale: Locale; onError(): void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let active = true;
    void (async () => {
      try {
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
        if (active && !(cause instanceof Error && cause.name === "RenderingCancelledException")) onError();
      }
    })();
    return () => {
      active = false;
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
    };
  }, [document, onError, pageIndex]);
  return (
    <div className="privacy-pdf-page" data-pdf-page={pageIndex + 1}>
      <span className="privacy-pdf-page-label">{locale === "en" ? `Page ${pageIndex + 1}` : `第 ${pageIndex + 1} 页`}</span>
      <div className="privacy-pdf-canvas-stack"><canvas ref={canvasRef} aria-label={locale === "en" ? `Generated redacted PDF page ${pageIndex + 1}` : `实时生成的脱敏 PDF 第 ${pageIndex + 1} 页`} /></div>
    </div>
  );
}

export default function PrivacyPdfResultPreview({ bytes, locale }: { bytes: Uint8Array; locale: Locale }) {
  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
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
        const loaded = await loadingTask.promise;
        if (!active) {
          await loadingTask.destroy();
          return;
        }
        setDocument(loaded);
      } catch (cause) {
        console.error("Privacy PDF result preview could not load.", cause);
        if (active) setError(previewError);
      }
    })();
    return () => {
      active = false;
      void loadingTaskRef.current?.destroy();
      loadingTaskRef.current = null;
      setDocument(null);
    };
  }, [bytes, previewError]);

  return (
    <div className="privacy-pdf-result-preview" data-testid="privacy-pdf-result-preview">
      <strong className="privacy-result-page-counter">{locale === "en" ? "Redacted result" : "脱敏结果"} · {document ? `${document.numPages} ${locale === "en" ? "pages" : "页"}` : "-"}</strong>
      <div className="privacy-pdf-page-stream" data-testid="privacy-pdf-result-pages">
        {document ? Array.from({ length: document.numPages }, (_, pageIndex) => (
          <ResultPage key={pageIndex} document={document} pageIndex={pageIndex} locale={locale} onError={() => setError(previewError)} />
        )) : null}
      </div>
      {error ? <p className="privacy-error" role="alert">{error}</p> : null}
    </div>
  );
}

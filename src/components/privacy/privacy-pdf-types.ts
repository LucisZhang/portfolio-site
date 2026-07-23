import type { PDFDocumentProxy } from "pdfjs-dist";

export interface PdfRegion {
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

export interface ActivePdfDocument {
  id: number;
  fileName: string;
  document: PDFDocumentProxy;
  textLayerRegions: PdfRegion[];
}

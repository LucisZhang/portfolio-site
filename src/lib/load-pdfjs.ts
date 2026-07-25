const pdfJsUrl = "/generated/privacy-pdf/pdf.min.mjs";
const pdfJsCompatUrl = "/generated/privacy-pdf/pdf.runtime-compat.mjs";

export const PDFJS_WORKER_URL = "/generated/privacy-pdf/pdf.worker.compat.mjs";

export async function loadPdfJs(): Promise<typeof import("pdfjs-dist")> {
  await import(/* webpackIgnore: true */ pdfJsCompatUrl);
  return import(/* webpackIgnore: true */ pdfJsUrl) as Promise<typeof import("pdfjs-dist")>;
}

const pdfJsUrl = "/generated/privacy-pdf/pdf.min.mjs";

export async function loadPdfJs(): Promise<typeof import("pdfjs-dist")> {
  return import(/* webpackIgnore: true */ pdfJsUrl) as Promise<typeof import("pdfjs-dist")>;
}

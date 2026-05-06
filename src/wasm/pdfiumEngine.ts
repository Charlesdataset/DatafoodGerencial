import { createPdfiumDirectEngine, type PdfEngine } from "@embedpdf/engines/pdfium";
import pdfiumWasmUrl from "@embedpdf/pdfium/pdfium.wasm?url";

let pdfiumEnginePromise: Promise<PdfEngine<Blob>> | null = null;

export async function getPdfiumEngine(): Promise<PdfEngine<Blob>> {
  if (!pdfiumEnginePromise) {
    pdfiumEnginePromise = createPdfiumDirectEngine(pdfiumWasmUrl, {
      encoderPoolSize: 0,
    });
  }
  return pdfiumEnginePromise;
}

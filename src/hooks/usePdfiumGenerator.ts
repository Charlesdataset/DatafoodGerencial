import { useCallback, useState } from "react";
import { downloadPdf, generatePdf, navigatePdfWindow, openPdfWindow, previewPdf, type PdfConfig } from "../wasm/pdfium_generator";

type PdfAction = "download" | "preview";

export interface UsePdfiumGeneratorOptions {
  filename?: string;
  onStart?: () => void;
  onSuccess?: (bytes: Uint8Array) => void;
  onError?: (err: Error) => void;
}

export interface UsePdfiumGeneratorResult {
  download: (config: PdfConfig) => Promise<void>;
  preview: (config: PdfConfig) => Promise<void>;
  isLoading: boolean;
  progress: string;
  error: string | null;
  clearError: () => void;
}

export function usePdfiumGenerator(opts: UsePdfiumGeneratorOptions = {}): UsePdfiumGeneratorResult {
  const { filename = "pdfium.pdf", onStart, onSuccess, onError } = opts;

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (config: PdfConfig, action: PdfAction) => {
      setIsLoading(true);
      setError(null);
      onStart?.();

      const pdfWindow = openPdfWindow();

      try {
        setProgress("Carregando PDFium... ");
        const bytes = await generatePdf(config);
        setProgress("Finalizando...");

        onSuccess?.(bytes);

        if (pdfWindow && !pdfWindow.closed) {
          navigatePdfWindow(pdfWindow, bytes);
        } else if (action === "download") {
          downloadPdf(bytes, filename);
        } else {
          previewPdf(bytes);
        }
      } catch (err) {
        pdfWindow?.close();
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e.message);
        onError?.(e);
      } finally {
        setIsLoading(false);
        setProgress("");
      }
    },
    [filename, onStart, onSuccess, onError],
  );

  const download = useCallback((cfg: PdfConfig) => run(cfg, "download"), [run]);
  const preview = useCallback((cfg: PdfConfig) => run(cfg, "preview"), [run]);

  return {
    download,
    preview,
    isLoading,
    progress,
    error,
    clearError: () => setError(null),
  };
}

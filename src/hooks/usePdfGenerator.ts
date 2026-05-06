import { useCallback, useState } from "react";
import { downloadPdf, generatePdf, navigatePdfWindow, openPdfWindow, previewPdf, type PdfConfig } from "../wasm/pdfium_generator";

// ─── Types ────────────────────────────────────────────────────────────────────

type PdfAction = "download" | "preview";

export interface UsePdfGeneratorOptions {
  /** Default filename used when action === 'download'. */
  filename?: string;
  /** Called right before the WASM module starts loading / generating. */
  onStart?: () => void;
  /** Called after the PDF bytes have been produced (before download/preview). */
  onSuccess?: (bytes: Uint8Array) => void;
  /** Called on any error. */
  onError?: (err: Error) => void;
}

export interface UsePdfGeneratorResult {
  /** Download the PDF as a file. */
  download: (config: PdfConfig) => Promise<void>;
  /** Open the PDF in a new browser tab. */
  preview: (config: PdfConfig) => Promise<void>;
  /** True while the WASM module is loading or the PDF is being generated. */
  isLoading: boolean;
  /** Human-readable progress message (empty when idle). */
  progress: string;
  /** Last error message, or null when no error. */
  error: string | null;
  /** Clear the error state. */
  clearError: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePdfGenerator(opts: UsePdfGeneratorOptions = {}): UsePdfGeneratorResult {
  const { filename = "relatorio.pdf", onStart, onSuccess, onError } = opts;

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (config: PdfConfig, action: PdfAction) => {
      setIsLoading(true);
      setError(null);
      onStart?.();

      // iOS Safari bloqueia window.open() chamado após um await (considera popup).
      // Abrimos a janela AQUI, sincronamente dentro do click handler,
      // e navegamos para o blob URL depois que o WASM terminar.
      const pdfWindow = openPdfWindow();

      try {
        setProgress("Carregando módulo PDF…");
        // First call also downloads & compiles the WASM binary (~150-300 KB).
        // Subsequent calls are instant (module is cached in memory).
        const bytes = await generatePdf(config);
        setProgress("Finalizando…");

        onSuccess?.(bytes);

        if (pdfWindow && !pdfWindow.closed) {
          // Usa a janela já aberta — funciona no iOS
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

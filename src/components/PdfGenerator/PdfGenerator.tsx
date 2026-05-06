import { usePdfGenerator } from "../../hooks/usePdfGenerator";
import type { PdfConfig } from "../../wasm/pdfium_generator";
import styles from "./PdfGenerator.module.scss";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PdfGeneratorProps {
  /** Full PDF configuration passed to the Rust/WASM generator. */
  config: PdfConfig;
  /** Download filename.  @default 'relatorio.pdf' */
  filename?: string;
  /** Show a "Preview" button in addition to "Download". @default false */
  showPreview?: boolean;
  /** Override the download button label. */
  downloadLabel?: string;
  /** Override the preview button label. */
  previewLabel?: string;
  className?: string;
}

// ─── Icon helpers ─────────────────────────────────────────────────────────────

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
    <path d="M12 16l-5-5h3V4h4v7h3l-5 5zm-7 4v-2h14v2H5z" />
  </svg>
);

const PreviewIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
  </svg>
);

const Spinner = () => <span className={styles.spinner} aria-hidden="true" />;

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Drop-in button group that generates a PDF **100 % in the browser** via
 * a Rust/WASM module.  The WASM binary is lazy-loaded on first click —
 * zero impact on the initial bundle.
 *
 * @example
 * <PdfGenerator
 *   config={{ title: 'Vendas Maio', headers: ['Produto','Qtd','Valor'],
 *             rows: data.map(r => ({ cells: [r.produto, String(r.qtd), r.valor] })) }}
 *   filename="vendas-maio.pdf"
 *   showPreview
 * />
 */
export function PdfGenerator({ config, filename, showPreview = false, downloadLabel = "Exportar PDF", previewLabel = "Visualizar", className }: PdfGeneratorProps) {
  const { download, preview, isLoading, progress, error, clearError } = usePdfGenerator({ filename });

  return (
    <div className={[styles.root, className].filter(Boolean).join(" ")}>
      {/* ── Button row ─────────────────────────────────────────────── */}
      <div className={styles.buttons}>
        <button type="button" className={styles.btnPrimary} onClick={() => download(config)} disabled={isLoading} title="Gerar e baixar PDF">
          {isLoading ? <Spinner /> : <DownloadIcon />}
          <span>{isLoading ? progress || "Gerando…" : downloadLabel}</span>
        </button>

        {showPreview && (
          <button type="button" className={styles.btnSecondary} onClick={() => preview(config)} disabled={isLoading} title="Abrir PDF em nova aba">
            {isLoading ? <Spinner /> : <PreviewIcon />}
            <span>{previewLabel}</span>
          </button>
        )}
      </div>

      {/* ── Error banner ───────────────────────────────────────────── */}
      {error && (
        <div className={styles.error} role="alert">
          <span>⚠ {error}</span>
          <button type="button" className={styles.errorDismiss} onClick={clearError} aria-label="Fechar">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default PdfGenerator;

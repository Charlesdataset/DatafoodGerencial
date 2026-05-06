// src/components/DocumentViewer/DocumentViewer.tsx

import { faDownload, faExpand, faFilePdf, faPrint, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useEffect, useRef, useState } from "react";

import styles from "./DocumentViewer.module.scss";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

interface Document {
  uri: string;
  fileType: string;
  fileName: string;
}

interface DocumentViewerProps {
  title: string;
  docs: Document[];
  onClose: () => void;
  eventName?: string;
  eventId?: number;
}

export const DocumentViewer = ({ title, docs, onClose, eventName, eventId }: DocumentViewerProps) => {
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRenderingPdf, setIsRenderingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);

  const currentDoc = docs[currentDocIndex];
  const isPdf = currentDoc?.fileType.toLowerCase() === "pdf";

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!isPdf || !currentDoc) {
      setPdfError(null);
      setIsRenderingPdf(false);
      viewerRef.current?.replaceChildren();
      return;
    }

    let cancelled = false;
    let loadingTask: any = null;

    const renderPdf = async () => {
      const container = viewerRef.current;
      if (!container) return;

      setIsRenderingPdf(true);
      setPdfError(null);
      container.replaceChildren();

      try {
        const response = await fetch(currentDoc.uri);
        if (!response.ok) {
          throw new Error(`Não foi possível carregar o PDF (${response.status}).`);
        }

        const pdfBytes = new Uint8Array(await response.arrayBuffer());
        loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
        const pdfDocument = await loadingTask.promise;

        if (cancelled) {
          await loadingTask.destroy();
          return;
        }

        const containerWidth = container.clientWidth || window.innerWidth;
        const pixelRatio = Math.max(window.devicePixelRatio || 1, 1);

        for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
          if (cancelled) break;

          const page = await pdfDocument.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1 });
          const scale = Math.max(Math.min((containerWidth - 32) / viewport.width, 1.75), 0.5);
          const scaledViewport = page.getViewport({ scale });

          const pageWrapper = document.createElement("div");
          pageWrapper.className = styles.pdfPageWrapper;

          const pageCanvas = document.createElement("canvas");
          pageCanvas.className = styles.pdfPageCanvas;
          pageCanvas.style.width = `${Math.floor(scaledViewport.width)}px`;
          pageCanvas.style.height = `${Math.floor(scaledViewport.height)}px`;
          pageCanvas.width = Math.floor(scaledViewport.width * pixelRatio);
          pageCanvas.height = Math.floor(scaledViewport.height * pixelRatio);

          const context = pageCanvas.getContext("2d");
          if (!context) {
            throw new Error("Não foi possível criar o canvas do PDF.");
          }

          context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
          pageWrapper.appendChild(pageCanvas);
          container.appendChild(pageWrapper);

          await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
          page.cleanup();
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Falha ao renderizar o PDF.";
          setPdfError(message);
          container.replaceChildren();
        }
      } finally {
        if (!cancelled) {
          setIsRenderingPdf(false);
        }
      }
    };

    void renderPdf();

    return () => {
      cancelled = true;
      void loadingTask?.destroy();
      viewerRef.current?.replaceChildren();
    };
  }, [currentDoc?.uri, isPdf]);

  const handleDownload = () => {
    if (!currentDoc) return;

    const link = document.createElement("a");
    link.href = currentDoc.uri;
    link.download = currentDoc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!currentDoc) return;

    const printWindow = window.open(currentDoc.uri, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      const viewer = document.querySelector(`.${styles.viewerContent}`);
      if (viewer && viewer.requestFullscreen) {
        viewer.requestFullscreen();
        setIsFullscreen(true);
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!currentDoc) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalContent} ${isFullscreen ? styles.fullscreen : ""}`} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <h3 className={styles.modalTitle}>{title}</h3>
            {eventName && (
              <div className={styles.eventInfo}>
                <span className={styles.eventName}>{eventName}</span>
                {eventId && <span className={styles.eventId}>ID: {eventId}</span>}
              </div>
            )}
          </div>
          <div className={styles.headerRight}>
            <button className={styles.headerButton} onClick={handleFullscreen} title={isFullscreen ? "Sair do modo tela cheia" : "Tela cheia"}>
              <FontAwesomeIcon icon={isFullscreen ? faTimes : faExpand} className={styles.buttonIcon} />
            </button>
            <button className={styles.headerButton} onClick={onClose} title="Fechar">
              <FontAwesomeIcon icon={faTimes} className={styles.buttonIcon} />
            </button>
          </div>
        </div>

        <div className={styles.modalBody}>
          {docs.length > 1 && (
            <div className={styles.docNavigation}>
              <button className={styles.navButton} onClick={() => setCurrentDocIndex((previous) => (previous > 0 ? previous - 1 : docs.length - 1))} disabled={docs.length <= 1}>
                Anterior
              </button>
              <div className={styles.docCounter}>
                {currentDocIndex + 1} / {docs.length}
              </div>
              <button className={styles.navButton} onClick={() => setCurrentDocIndex((previous) => (previous < docs.length - 1 ? previous + 1 : 0))} disabled={docs.length <= 1}>
                Próximo
              </button>
            </div>
          )}

          <div className={styles.viewerContent}>
            {isPdf ? (
              <>
                <div ref={viewerRef} className={styles.pdfDocumentContainer} />

                {isRenderingPdf && (
                  <div className={styles.pdfLoadingState}>
                    <div className={styles.pdfLoadingIcon}>
                      <FontAwesomeIcon icon={faFilePdf} />
                    </div>
                    <p>Carregando visualização do PDF…</p>
                  </div>
                )}

                {pdfError && (
                  <div className={styles.pdfFallback}>
                    <div className={styles.pdfFallbackIcon}>
                      <FontAwesomeIcon icon={faFilePdf} />
                    </div>
                    <h4>Não foi possível renderizar o PDF aqui.</h4>
                    <p>{pdfError}</p>
                    <div className={styles.pdfFallbackActions}>
                      <a href={currentDoc.uri} target="_blank" rel="noopener noreferrer" className={styles.mobilePdfButton}>
                        Abrir PDF no navegador
                      </a>
                      <button className={styles.mobilePdfButton} onClick={handleDownload}>
                        Baixar PDF
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.unsupportedFormat}>
                <div className={styles.unsupportedIcon}>
                  <FontAwesomeIcon icon="file" />
                </div>
                <h4>Formato não suportado para visualização</h4>
                <p>Este formato de arquivo não pode ser visualizado no navegador.</p>
                <button className={styles.downloadButton} onClick={handleDownload}>
                  <FontAwesomeIcon icon={faDownload} className={styles.buttonIcon} />
                  Baixar arquivo
                </button>
              </div>
            )}
          </div>

          <div className={styles.docInfo}>
            <div className={styles.fileInfo}>
              <div className={styles.fileName}>
                <FontAwesomeIcon icon="file" className={styles.fileIcon} />
                <span>{currentDoc.fileName}</span>
              </div>
              <div className={styles.fileType}>Tipo: {currentDoc.fileType.toUpperCase()}</div>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <div className={styles.footerLeft}>
            <button className={styles.footerButton} onClick={handleDownload} title="Baixar documento">
              <FontAwesomeIcon icon={faDownload} className={styles.buttonIcon} />
              Baixar
            </button>
            <button className={styles.footerButton} onClick={handlePrint} title="Imprimir documento" disabled={!isPdf}>
              <FontAwesomeIcon icon={faPrint} className={styles.buttonIcon} />
              Imprimir
            </button>
          </div>
          <div className={styles.footerRight}>
            <button className={styles.closeButton} onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

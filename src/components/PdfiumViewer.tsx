import type { PdfEngine } from "@embedpdf/engines/pdfium";
import type { ImageDataLike, PdfDocumentObject, PdfPageObject } from "@embedpdf/models";
import { Rotation } from "@embedpdf/models";
import { faClose, faDownload, faFileExcel, faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../contexts/AppContext";


import { getPdfiumEngine } from "../wasm/pdfiumEngine";
import { FormButton } from "./Inputs/Button/FormButton";
import Fluid from "./Layout/Fluid";
import styles from "./PdfiumViewer.module.scss";


interface PdfiumViewerProps {
  pdfUrl: string;
  onClose?: () => void;
  /** Nome do arquivo baixado. Default: "documento.pdf" */
  filename?: string;
  /** Chamado quando o PDF falha ao carregar (ex: FPDF_LoadMemDocument failed) */
  onError?: (message: string) => void;
  /** Se informado, exibe botão de download Excel na toolbar */
  hasExcel?: boolean;
  onExcelClick?: () => void;

}

/**
 * Força o download de uma URL (blob: ou http) em qualquer browser/OS.
 * - Cria um <a download> invisível e clica programaticamente.
 * - Funciona em Chrome, Firefox, Edge, Safari 13+, Android, iOS 13+.
 * - Fallback com window.open para iOS antigo (< 13) que ignora `download` em blob URLs.
 */
function forceDownload(url: string, filename: string) {
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener noreferrer";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    // Remove depois de um tick para garantir que o clique foi processado
    setTimeout(() => document.body.removeChild(a), 200);
  } catch {
    // Fallback universal: abre em nova aba (iOS Safari antigo, WebView restrito)
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

function drawImageData(canvas: HTMLCanvasElement, imageData: ImageDataLike) {
  canvas.width = imageData.width;
  canvas.height = imageData.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Não foi possível obter contexto 2D para renderização do PDF.");
  }

  const data = new ImageData(imageData.data, imageData.width, imageData.height);
  ctx.putImageData(data, 0, 0);
}

function getTouchDistance(touches: TouchList) {
  if (touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

export function PdfiumViewer({ pdfUrl, onClose, filename = "documento.pdf", onError, hasExcel, onExcelClick }: PdfiumViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageCanvasRefs = useRef<Record<number, HTMLCanvasElement | null>>({});
  const engineRef = useRef<PdfEngine<Blob> | null>(null);
  const documentRef = useRef<PdfDocumentObject | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const touchStateRef = useRef<{ initialDistance: number; initialZoom: number } | null>(null);
  const dragStateRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [zoom, setZoom] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  const [pageWidth, setPageWidth] = useState<number | null>(null);
  const [rotation, setRotation] = useState<Rotation>(Rotation.Degree0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isMobile, isCollapsed } = useApp();

  const pageIndexes = useMemo(() => Array.from({ length: pageCount }, (_, index) => index), [pageCount]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setPageCount(0);
    setZoom(1.25);
    setRotation(0);
    setIsLoading(true);

    fetch(pdfUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`Falha ao buscar PDF: ${response.status}`);
        return response.arrayBuffer();
      })
      .then((buffer) => {
        if (cancelled) return;
        setPdfBytes(new Uint8Array(buffer));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  useEffect(() => {
    if (!pdfBytes) return;

    let cancelled = false;
    let currentDoc: PdfDocumentObject | null = null;

    const loadDocument = async () => {
      setError(null);
      setIsLoading(true);
      try {
        const engine = await getPdfiumEngine();
        engineRef.current = engine;

        const pdfFile = {
          id: `${Date.now()}-generated-pdf`,
          content: pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer,
        };

        const doc = await engine.openDocumentBuffer(pdfFile).toPromise();
        if (cancelled) {
          await engine.closeDocument(doc).toPromise();
          return;
        }

        currentDoc = doc;
        documentRef.current = doc;
        setPageCount(doc.pageCount);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        onError?.(msg);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadDocument();

    return () => {
      cancelled = true;
      if (currentDoc && engineRef.current) {
        engineRef.current
          .closeDocument(currentDoc)
          .toPromise()
          .catch(() => { });
      }
      documentRef.current = null;
    };
  }, [pdfBytes]);

  const renderPageToCanvas = async (pageIndex: number) => {
    const canvas = pageCanvasRefs.current[pageIndex];
    const engine = engineRef.current;
    const doc = documentRef.current;

    if (!canvas || !engine || !doc) return;

    setError(null);
    try {
      const actualScale = fitScale * zoom;
      const page = doc.pages[pageIndex] as PdfPageObject;
      const imageData = await engine
        .renderPageRaw(doc, page, {
          scaleFactor: actualScale,
          rotation,
          dpr: window.devicePixelRatio || 1,
        })
        .toPromise();

      drawImageData(canvas, imageData);
      const dpr = window.devicePixelRatio || 1;
      canvas.style.width = `${imageData.width / dpr}px`;
      canvas.style.height = `${imageData.height / dpr}px`;
      canvas.style.maxWidth = 'none';

      if (pageWidth === null && actualScale > 0) {
        const measuredWidth = canvas.width / (dpr * actualScale);
        if (measuredWidth > 0) {
          setPageWidth(measuredWidth);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      if (width > 0) {
        setFitScale((current) => {
          if (pageWidth === null) return current;
          return width / pageWidth;
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [pageWidth]);

  useEffect(() => {
    if (pageWidth === null || !containerRef.current) return;
    const width = containerRef.current.clientWidth;
    if (width > 0) {
      setFitScale(width / pageWidth);
    }
  }, [pageWidth]);

  useEffect(() => {
    if (!containerRef.current || pageCount === 0) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageIndex = Number(entry.target.getAttribute("data-page-index"));
            if (!Number.isNaN(pageIndex)) {
              renderPageToCanvas(pageIndex);
            }
          }
        });
      },
      {
        root: containerRef.current,
        rootMargin: "400px",
        threshold: 0.1,
      },
    );

    pageIndexes.forEach((pageIndex) => {
      const canvas = pageCanvasRefs.current[pageIndex];
      if (canvas) observerRef.current?.observe(canvas);
    });

    return () => observerRef.current?.disconnect();
  }, [pageCount, pageIndexes, zoom, rotation]);

  useEffect(() => {
    if (!pdfBytes || pageCount === 0) return;

    Object.entries(pageCanvasRefs.current).forEach(([pageIndexStr, canvas]) => {
      const pageIndex = Number(pageIndexStr);
      if (!Number.isNaN(pageIndex) && canvas) {
        renderPageToCanvas(pageIndex);
      }
    });
  }, [zoom, rotation]);

  const handleTouchStart = (event: any) => {
    if (event.touches.length !== 2) return;
    touchStateRef.current = {
      initialDistance: getTouchDistance(event.touches),
      initialZoom: zoom,
    };
  };

  const handleTouchMove = (event: any) => {
    if (event.touches.length !== 2 || !touchStateRef.current) return;
    event.preventDefault();

    const currentDistance = getTouchDistance(event.touches);
    if (!currentDistance) return;

    const nextZoom = Math.min(3, Math.max(0.5, touchStateRef.current.initialZoom * (currentDistance / touchStateRef.current.initialDistance)));

    setZoom(nextZoom);
  };

  const handleTouchEnd = (event: any) => {
    if (event.touches.length < 2) {
      touchStateRef.current = null;
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || zoom <= 1) return;
    const container = containerRef.current;
    if (!container) return;
    container.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      x: event.clientX,
      y: event.clientY,
      left: container.scrollLeft,
      top: container.scrollTop,
    };
    setIsDragging(true);
    event.preventDefault();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current || event.pointerType !== 'mouse') return;
    const container = containerRef.current;
    if (!container) return;
    event.preventDefault();
    const dx = dragStateRef.current.x - event.clientX;
    const dy = dragStateRef.current.y - event.clientY;
    container.scrollLeft = dragStateRef.current.left + dx;
    container.scrollTop = dragStateRef.current.top + dy;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (container) {
      try {
        container.releasePointerCapture(event.pointerId);
      } catch {
        // ignore unsupported release
      }
    }
    dragStateRef.current = null;
    setIsDragging(false);
  };

  useEffect(() => {
    return () => {
      if (engineRef.current && documentRef.current) {
        engineRef.current
          .closeDocument(documentRef.current)
          .toPromise()
          .catch(() => { });
      }
    };
  }, []);

  return (
    <div
      className={styles.overlay}
      style={!isMobile ? { left: isCollapsed ? 50 : 200, right: 0 } : { left: 0, right: 0 }}
    >
      <div className={styles.floatingToolbar}>
        <Fluid xs={hasExcel ? ["expand", "auto", "auto", "auto", "auto", "auto"] : ["expand", "auto", "auto", "auto", "auto"]}>
          <div className="mx-6">
            <FormButton variant="icon" onClick={onClose}>
              <FontAwesomeIcon icon={faClose} size="xs" />
            </FormButton>
          </div>

          <div>
            <FormButton variant="icon" onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))} disabled={isLoading} title="Diminuir zoom">
              <FontAwesomeIcon icon={faMinus} size="xs" />
            </FormButton>
          </div>
          <div className="mt-2">
            <span className={`${styles.zoomLabel} `}>{Math.round(zoom * 100)}%</span>
          </div>

          <div>
            <FormButton variant="icon" onClick={() => setZoom((z) => Math.min(4, z + 0.25))} disabled={isLoading} title="Aumentar zoom">
              <FontAwesomeIcon icon={faPlus} size="xs" />
            </FormButton>
          </div>
          <div>
            <FormButton variant="icon" onClick={() => forceDownload(pdfUrl, filename)} title="Baixar PDF">
              <FontAwesomeIcon icon={faDownload} size="xs" />
            </FormButton>
          </div>
          {hasExcel && (
            <div>
              <FormButton
                variant="icon"
                title="Baixar Excel"
                onClick={() => {
                  //chamar função externa
                  onExcelClick();
                }
                }
              >
                <FontAwesomeIcon icon={faFileExcel} size="xs" />
              </FormButton>
            </div>
          )}
        </Fluid>
      </div>

      <div
        className={styles.scrollArea}
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'auto' }}
      >
        {isLoading && <div className={styles.loadingMessage}>Carregando...</div>}
        {error && <div className={styles.error}>{error}</div>}
        {pageIndexes.map((pageIndex) => (
          <div key={pageIndex} className={styles.pageWrapper}>
            <canvas
              ref={(canvas) => {
                pageCanvasRefs.current[pageIndex] = canvas;
              }}
              data-page-index={pageIndex}
              className={styles.pageCanvas}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

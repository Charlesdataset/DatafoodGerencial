import dayjs from "dayjs";
import { useState } from "react";
import { Button } from "./Button";
import styles from "./GeradorRelatorio.module.scss";
import { PdfiumViewer } from "./PdfiumViewer";

const sampleRows = [
  { produto: "Ingresso VIP", categoria: "Evento", quantidade: 120, preco: 240.0 },
  { produto: "Open Bar", categoria: "Bebidas", quantidade: 150, preco: 55.0 },
  { produto: "Food Truck", categoria: "Alimentos", quantidade: 430, preco: 40.0 },
];

async function createPdfBlobUrl(): Promise<string> {
  const { default: PDFDocument } = await import("pdfkit/js/pdfkit.standalone");
  const blobStream = (await import("blob-stream")).default;
  const doc = new PDFDocument({ size: "A4", margin: 40, autoFirstPage: true });
  const stream = doc.pipe(blobStream());

  const now = dayjs();
  doc.fillColor("#111827").fontSize(20).font("Helvetica-Bold").text("Relatório DataTicket", { align: "center" });
  doc.moveDown(0.5);
  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor("#475569")
    .text(`Data: ${now.format("DD/MM/YYYY")}`, { align: "right" });
  doc.moveDown(1.5);

  const tableTop = doc.y;
  const columnSizes = [180, 120, 90, 110];
  const headers = ["Produto", "Categoria", "Qtd.", "Preço"];

  doc.fillColor("#ffffff").fontSize(10).font("Helvetica-Bold");
  let x = 40;
  const headerHeight = 24;
  doc
    .rect(
      40,
      tableTop,
      columnSizes.reduce((sum, value) => sum + value, 0),
      headerHeight,
    )
    .fill("#0f172a");
  headers.forEach((header, index) => {
    doc.text(header, x + 8, tableTop + 7, { width: columnSizes[index] - 16, align: "left" });
    x += columnSizes[index];
  });

  doc.fillColor("#0f172a").font("Helvetica");
  let y = tableTop + headerHeight + 8;
  sampleRows.forEach((row, rowIndex) => {
    const background = rowIndex % 2 === 0 ? "#f8fafc" : "#ffffff";
    doc
      .rect(
        40,
        y - 4,
        columnSizes.reduce((sum, value) => sum + value, 0),
        28,
      )
      .fill(background);
    x = 40;
    const rowValues = [row.produto, row.categoria, String(row.quantidade), `R$ ${row.preco.toFixed(2)}`];
    rowValues.forEach((value, index) => {
      doc.fillColor("#111827").text(value, x + 8, y, { width: columnSizes[index] - 16, align: "left" });
      x += columnSizes[index];
    });
    y += 28;
  });

  const footer = () => {
    const bottomPosition = doc.page.height - 50;
    doc
      .fontSize(9)
      .fillColor("#6b7280")
      .text(`Página ${doc.page.number}`, 40, bottomPosition, {
        width: doc.page.width - 80,
        align: "right",
      });
  };

  footer();
  doc.on("pageAdded", footer);

  doc.end();

  return new Promise<string>((resolve, reject) => {
    stream.on("finish", () => {
      stream.toBlob((blob: Blob) => {
        const url = URL.createObjectURL(blob);
        resolve(url);
      });
    });
    stream.on("error", reject);
  });
}

export function GeradorRelatorio() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const url = await createPdfBlobUrl();
      setPdfUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return url;
      });
    } catch (err) {
      setError("Falha ao gerar o PDF. Verifique o console para mais detalhes.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Gerador de Relatório</h1>
        <p>Gera um PDF com PDFKit no navegador e exibe o preview usando o visualizador PDFium próprio.</p>
        <Button onClick={handleGenerate} isLoading={isLoading} disabled={isLoading}>
          Gerar e Visualizar Relatório
        </Button>
        {error && <div className={styles.error}>{error}</div>}
      </div>

      {pdfUrl && <PdfiumViewer pdfUrl={pdfUrl} onClose={() => setPdfUrl(null)} filename="relatorio.pdf" />}
    </div>
  );
}

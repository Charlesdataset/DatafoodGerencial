import ExcelJS from "exceljs";
import type { TableHeaderDef } from "../types/v3.types";

// Defaults espelhando pdf_v3.rs
// header_bg   : rgb(0.15, 0.22, 0.37) → #26385E
// header_text : rgb(1.0,  1.0,  1.0)  → #FFFFFF
// zebra_bg    : rgb(0.96, 0.97, 0.99) → #F5F7FC
// body_text   : rgb(0.20, 0.22, 0.26) → #333842
const DEFAULT = {
  headerBg:   "#26385E",
  headerText: "#FFFFFF",
  zebraBg:    "#F5F7FC",
  bodyText:   "#333842",
} as const;

function toArgb(hex: string): string {
  const h = hex.replace(/^#/, "").replace(/\s/g, "").toUpperCase();
  if (h.length === 8) return h;
  return `FF${h.padStart(6, "0")}`;
}

async function fetchLogo(
  src: string
): Promise<{ base64: string; extension: "png" | "jpeg" | "gif" } | null> {
  try {
    if (src.startsWith("data:")) {
      const [meta, b64] = src.split(",");
      const ext: "png" | "jpeg" | "gif" = meta.includes("png") ? "png" : meta.includes("gif") ? "gif" : "jpeg";
      return { base64: b64, extension: ext };
    }
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const [meta, b64] = (reader.result as string).split(",");
        const ext: "png" | "jpeg" | "gif" = meta.includes("png") ? "png" : meta.includes("gif") ? "gif" : "jpeg";
        resolve({ base64: b64, extension: ext });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function applyMask(value: unknown, mask?: string): string {
  const raw = value == null ? "" : String(value);
  if (!mask || raw === "") return raw;
  switch (mask) {
    case "currency": {
      const n = parseFloat(raw);
      if (isNaN(n)) return raw;
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
    }
    case "number": {
      const n = parseFloat(raw);
      if (isNaN(n)) return raw;
      return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
    }
    case "percentage": {
      const n = parseFloat(raw);
      if (isNaN(n)) return raw;
      return `${n.toFixed(2)} %`;
    }
    case "date": {
      const d = new Date(raw.replace(" ", "T"));
      if (isNaN(d.getTime())) return raw;
      return d.toLocaleDateString("pt-BR");
    }
    case "date-time": {
      const d = new Date(raw.replace(" ", "T"));
      if (isNaN(d.getTime())) return raw;
      return d.toLocaleString("pt-BR");
    }
    case "cnpj": {
      const c = raw.replace(/\D/g, "");
      return c.replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{4})/, "$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2").slice(0, 18);
    }
    case "cpf": {
      const c = raw.replace(/\D/g, "");
      return c.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2").slice(0, 14);
    }
    case "cnpjCpf": {
      const c = raw.replace(/\D/g, "");
      return c.length > 11 ? applyMask(c, "cnpj") : applyMask(c, "cpf");
    }
    case "cep": {
      const c = raw.replace(/\D/g, "");
      return c.replace(/(\d{5})(\d{1,3})/, "$1-$2").slice(0, 9);
    }
    case "phone": {
      const c = raw.replace(/\D/g, "");
      if (c.length === 11) return c.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
      return c.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    default:
      return raw;
  }
}

function resolvePillLabel(value: string, col: TableHeaderDef): string {
  if (!col.pill || !col.pillCases) return value;
  const matched = col.pillCases.find((pc) => pc.case === value);
  if (!matched) return value;
  return matched.transform ?? value;
}

function resolveCell(raw: unknown, col: TableHeaderDef): string {
  const strVal = raw == null ? "" : String(raw);
  return col.pill ? resolvePillLabel(strVal, col) : applyMask(raw, col.mask);
}

function clearRowBg(row: ExcelJS.Row, cc: number) {
  for (let ci = 1; ci <= cc; ci++) {
    row.getCell(ci).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
  }
}

function styleDataRow(
  row: ExcelJS.Row,
  columns: TableHeaderDef[],
  isZebra: boolean,
  zebraBackgroundColor: string,
  zebraTextColor: string | undefined,
  cc: number
) {
  const textArgb = isZebra && zebraTextColor ? toArgb(zebraTextColor) : toArgb(DEFAULT.bodyText);
  for (let ci = 1; ci <= cc; ci++) {
    const col = columns[ci - 1];
    const cell = row.getCell(ci);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: isZebra ? toArgb(zebraBackgroundColor) : "FFFFFFFF" },
    };
    cell.font = { size: 10, color: { argb: textArgb } };
    cell.alignment = {
      vertical: "middle",
      horizontal: col.align === "right" ? "right" : col.align === "center" ? "center" : "left",
    };
  }
}

export interface ExportToExcelOptions {
  sheetName?: string;
  fileName?: string;
  logo?: string;
  title?: string;
  subtitle?: string;
  headerBackgroundColor?: string;
  headerTextColor?: string;
  zebraBackgroundColor?: string;
  zebraTextColor?: string;
  groupBy?: string;
  groupPrefix?: string;
  groupHeaderBackgroundColor?: string;
  groupHeaderTextColor?: string;
}

export async function exportToExcel(
  dataset: Record<string, unknown>[],
  columns: TableHeaderDef[],
  options: ExportToExcelOptions = {}
): Promise<void> {
  const {
    sheetName = "Dados",
    fileName = "exportacao",
    logo,
    title,
    subtitle,
    headerBackgroundColor = DEFAULT.headerBg,
    headerTextColor       = DEFAULT.headerText,
    zebraBackgroundColor  = DEFAULT.zebraBg,
    zebraTextColor,
    groupBy,
    groupPrefix = "",
    groupHeaderBackgroundColor = "#E8EAF0",
    groupHeaderTextColor       = "#1A1A2E",
  } = options;

  const wb = new ExcelJS.Workbook();
  wb.creator = "Dataset Sistemas";
  wb.created = new Date();

  const ws = wb.addWorksheet(sheetName, { views: [{ showGridLines: false }] });

  const cc = columns.length;
  const leftCols   = Math.max(1, Math.round(cc * 0.25));
  const rightCols  = Math.max(1, Math.round(cc * 0.25));
  const centerCols = cc - leftCols - rightCols;
  const centerStart = leftCols + 1;
  const centerEnd   = leftCols + centerCols;
  const rightStart  = centerEnd + 1;

  let currentRow = 1;
  const HEADER_ROWS = 4;

  for (let i = 0; i < HEADER_ROWS; i++) {
    const r = ws.addRow(Array<string>(cc).fill(""));
    r.height = 18;
    clearRowBg(r, cc);
  }

  if (title) {
    ws.mergeCells(2, centerStart, 2, centerEnd);
    const cell = ws.getCell(2, centerStart);
    cell.value = title;
    cell.font = { bold: true, size: 14, color: { argb: toArgb(DEFAULT.bodyText) } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  }

  if (subtitle) {
    ws.mergeCells(3, rightStart, 3, cc);
    const cell = ws.getCell(3, rightStart);
    cell.value = subtitle;
    cell.font = { size: 8, color: { argb: toArgb(DEFAULT.bodyText) } };
    cell.alignment = { vertical: "middle", horizontal: "right" };
  }

  if (logo) {
    const img = await fetchLogo(logo);
    if (img) {
      const imgId = wb.addImage({ base64: img.base64, extension: img.extension });
      ws.addImage(imgId, {
        tl: { col: 0,        row: 0 }          as ExcelJS.Anchor,
        br: { col: leftCols, row: HEADER_ROWS } as ExcelJS.Anchor,
        editAs: "oneCell",
      });
    }
  }

  currentRow = HEADER_ROWS + 1;

  const headerRow = ws.addRow(columns.map((c) => c.prefix ?? c.key));
  headerRow.height = 20;
  for (let ci = 1; ci <= cc; ci++) {
    const col  = columns[ci - 1];
    const cell = headerRow.getCell(ci);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: toArgb(headerBackgroundColor) } };
    cell.font = { bold: true, size: 10, color: { argb: toArgb(headerTextColor) } };
    cell.alignment = {
      vertical: "middle",
      horizontal: col.align === "right" ? "right" : col.align === "center" ? "center" : "left",
    };
  }
  currentRow++;

  let dataRowIndex = 0;

  const emitDataRow = (rowData: Record<string, unknown>) => {
    const values = columns.map((col) => resolveCell(rowData[col.key], col));
    const row = ws.addRow(values);
    row.height = 18;
    styleDataRow(row, columns, dataRowIndex % 2 === 1, zebraBackgroundColor, zebraTextColor, cc);
    dataRowIndex++;
  };

  const emitGroupHeader = (groupValue: string) => {
    const row = ws.addRow([`${groupPrefix}${groupValue}`, ...Array<string>(cc - 1).fill("")]);
    row.height = 18;
    ws.mergeCells(currentRow, 1, currentRow, cc);
    for (let ci = 1; ci <= cc; ci++) {
      const cell = row.getCell(ci);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: toArgb(groupHeaderBackgroundColor) } };
      cell.font = { bold: true, size: 10, color: { argb: toArgb(groupHeaderTextColor) } };
      cell.alignment = { vertical: "middle", horizontal: "left" };
    }
    currentRow++;
    dataRowIndex = 0;
  };

  if (groupBy) {
    let lastGroup: string | null = null;
    for (const rowData of dataset) {
      const groupVal = rowData[groupBy] == null ? "" : String(rowData[groupBy]);
      if (groupVal !== lastGroup) {
        emitGroupHeader(groupVal);
        lastGroup = groupVal;
      }
      emitDataRow(rowData);
      currentRow++;
    }
  } else {
    for (const rowData of dataset) {
      emitDataRow(rowData);
      currentRow++;
    }
  }

  columns.forEach((col, ci) => {
    const headerLen = (col.prefix ?? col.key).length;
    const maxData = dataset.reduce((acc, rowData) => Math.max(acc, resolveCell(rowData[col.key], col).length), 0);
    ws.getColumn(ci + 1).width = Math.min(Math.max(headerLen, maxData) + 4, 60);
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: `${fileName}.xlsx`, style: "display:none" });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

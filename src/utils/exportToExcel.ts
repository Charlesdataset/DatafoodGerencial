import ExcelJS from "exceljs";
import type { TableHeaderDef, TableMultiDataField } from "../types/v3.types";

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

/** Configuração do layout multiData (espelha tableMultiData do PDF V3) */
export interface MultiDataConfig {
  /** Lista de campos exibidos por registro */
  fields: TableMultiDataField[];
  /** Número de colunas da grade por registro. Padrão: 4 */
  columns?: number;
  /** Campo usado como título do bloco */
  titleField?: string;
  /** Prefixo antes do valor do título */
  titlePrefix?: string;
  /** Cor de fundo da barra de título. Padrão: #404040 */
  titleBackgroundColor?: string;
  /** Cor do texto do título. Padrão: #ffffff */
  titleTextColor?: string;
  /** Cor de fundo da linha de labels. Padrão: #EEF1F6 */
  labelBackgroundColor?: string;
  /** Cor dos labels. Padrão: #555e74 */
  labelColor?: string;
  /** Cor dos valores. Padrão: #1e222b */
  valueColor?: string;
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
  /** Label exibido quando o valor do grupo é nulo ou vazio. Padrão: "(Sem dados)" */
  nullGroupLabel?: string;
  groupHeaderBackgroundColor?: string;
  groupHeaderTextColor?: string;
  /** Quando informado, usa layout multi-bloco em vez de tabela plana */
  multiData?: MultiDataConfig;
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
    nullGroupLabel = "(Sem dados)",
    groupHeaderBackgroundColor = "#E8EAF0",
    groupHeaderTextColor       = "#1A1A2E",
    multiData,
  } = options;

  // Número de colunas da planilha: multiData usa grid próprio, tabela usa headers normais
  const cc = multiData ? (multiData.columns ?? 4) : columns.length;

  const wb = new ExcelJS.Workbook();
  wb.creator = "Dataset Sistemas";
  wb.created = new Date();

  const ws = wb.addWorksheet(sheetName, { views: [{ showGridLines: false }] });

  const leftCols   = Math.max(1, Math.round(cc * 0.25));
  const rightCols  = Math.max(1, Math.round(cc * 0.25));
  const centerCols = cc - leftCols - rightCols;
  const centerStart = leftCols + 1;
  const centerEnd   = leftCols + centerCols;
  const rightStart  = centerEnd + 1;

  let currentRow = 1;
  const HEADER_ROWS = 4;

  for (let i = 0; i < HEADER_ROWS; i++) {
    const r = ws.addRow(Array<null>(cc).fill(null));
    r.height = 18;
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

  // Helper: linha de cabeçalho das colunas (reutilizado por grupo e no modo sem grupo)
  const emitColumnHeader = () => {
    const colHeaderRow = ws.addRow(columns.map((c) => c.prefix ?? c.key));
    colHeaderRow.height = 20;
    for (let ci = 1; ci <= cc; ci++) {
      const col  = columns[ci - 1];
      const cell = colHeaderRow.getCell(ci);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: toArgb(headerBackgroundColor) } };
      cell.font = { bold: true, size: 10, color: { argb: toArgb(headerTextColor) } };
      cell.alignment = {
        vertical: "middle",
        horizontal: col.align === "right" ? "right" : col.align === "center" ? "center" : "left",
      };
    }
    currentRow++;
  };

  // Cabeçalho de colunas fixo no topo (só quando NÃO há agrupamento e NÃO é multiData)
  if (!groupBy && !multiData) {
    emitColumnHeader();
  }

  let dataRowIndex = 0;

  const emitDataRow = (rowData: Record<string, unknown>) => {
    const values = columns.map((col) => resolveCell(rowData[col.key], col));
    const row = ws.addRow(values);
    row.height = 18;
    styleDataRow(row, columns, dataRowIndex % 2 === 1, zebraBackgroundColor, zebraTextColor, cc);
    dataRowIndex++;
  };

  /** Emite um bloco de registro no estilo tableMultiData */
  const emitMultiDataRecord = (rowData: Record<string, unknown>, isZebra: boolean) => {
    const {
      fields,
      columns: gridCols = 4,
      titleField,
      titlePrefix = "",
      titleBackgroundColor = "#404040",
      titleTextColor = "#ffffff",
      labelBackgroundColor = "#EEF1F6",
      labelColor = "#555e74",
      valueColor = "#1e222b",
    } = multiData!;

    // Barra de título
    if (titleField) {
      const titleVal = rowData[titleField] == null ? "" : String(rowData[titleField]);
      const titleRow = ws.addRow([`${titlePrefix}${titleVal}`, ...Array<null>(gridCols - 1).fill(null)]);
      titleRow.height = 18;
      ws.mergeCells(titleRow.number, 1, titleRow.number, gridCols);
      const mc = titleRow.getCell(1);
      mc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: toArgb(titleBackgroundColor) } };
      mc.font = { bold: true, size: 10, color: { argb: toArgb(titleTextColor) } };
      mc.alignment = { vertical: "middle", horizontal: "left" };
    }

    // Grade de campos em chunks de gridCols
    const bgArgb = isZebra ? toArgb(zebraBackgroundColor) : "FFFFFFFF";
    let fi = 0;
    while (fi < fields.length) {
      // Acumula campos até preencher gridCols colunas (respeitando span)
      const chunkFields: TableMultiDataField[] = [];
      let spanUsed = 0;
      while (fi < fields.length) {
        const span = fields[fi].span ?? 1;
        if (spanUsed + span > gridCols) break;
        chunkFields.push(fields[fi]);
        spanUsed += span;
        fi++;
      }

      // Linha de labels
      const labelValues: (string | null)[] = Array<null>(gridCols).fill(null);
      const valueValues: (string | null)[] = Array<null>(gridCols).fill(null);
      let colOff = 0;
      for (const field of chunkFields) {
        labelValues[colOff] = field.prefix ?? field.key;
        valueValues[colOff] = applyMask(rowData[field.key], field.mask);
        colOff += field.span ?? 1;
      }

      const lRow = ws.addRow(labelValues);
      lRow.height = 14;
      colOff = 0;
      for (const field of chunkFields) {
        const span = field.span ?? 1;
        if (span > 1) ws.mergeCells(lRow.number, colOff + 1, lRow.number, colOff + span);
        const cell = lRow.getCell(colOff + 1);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: toArgb(labelBackgroundColor) } };
        cell.font = { size: 8, color: { argb: toArgb(labelColor) } };
        cell.alignment = { vertical: "middle", horizontal: "left" };
        colOff += span;
      }

      // Linha de valores
      const vRow = ws.addRow(valueValues);
      vRow.height = 18;
      colOff = 0;
      for (const field of chunkFields) {
        const span = field.span ?? 1;
        if (span > 1) ws.mergeCells(vRow.number, colOff + 1, vRow.number, colOff + span);
        const cell = vRow.getCell(colOff + 1);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
        cell.font = { size: 10, bold: field.bold, color: { argb: toArgb(valueColor) } };
        cell.alignment = {
          vertical: "middle",
          horizontal: field.align === "right" ? "right" : field.align === "center" ? "center" : "left",
        };
        colOff += span;
      }
    }

    // Linha de separação entre registros
    ws.addRow(Array<null>(gridCols).fill(null)).height = 4;
  };

  const emitGroupHeader = (groupValue: string) => {
    const displayValue = groupValue.trim() === ""
      ? nullGroupLabel
      : `${groupPrefix}${groupValue}`;
    const row = ws.addRow([displayValue, ...Array<null>(cc - 1).fill(null)]);
    row.height = 18;
    // Usa row.number (número real do ExcelJS) — currentRow pode estar dessincronizado
    ws.mergeCells(row.number, 1, row.number, cc);
    // ⚠ Após mergeCells, só a célula master (col 1) pode ser estilizada.
    const masterCell = row.getCell(1);
    masterCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: toArgb(groupHeaderBackgroundColor) } };
    masterCell.font = { bold: true, size: 10, color: { argb: toArgb(groupHeaderTextColor) } };
    masterCell.alignment = { vertical: "middle", horizontal: "left" };
    dataRowIndex = 0;
  };

  if (multiData) {
    // ── Modo multiData ──────────────────────────────────────────────────────
    if (groupBy) {
      let lastGroup: string | null = null;
      for (const rowData of dataset) {
        const groupVal = rowData[groupBy] == null ? "" : String(rowData[groupBy]);
        if (groupVal !== lastGroup) {
          emitGroupHeader(groupVal);
          lastGroup = groupVal;
          dataRowIndex = 0;
        }
        emitMultiDataRecord(rowData, dataRowIndex % 2 === 1);
        dataRowIndex++;
      }
    } else {
      for (const [i, rowData] of dataset.entries()) {
        emitMultiDataRecord(rowData, i % 2 === 1);
      }
    }
  } else if (groupBy) {
    // ── Modo tabela com agrupamento ─────────────────────────────────────────
    let lastGroup: string | null = null;
    for (const rowData of dataset) {
      const groupVal = rowData[groupBy] == null ? "" : String(rowData[groupBy]);
      if (groupVal !== lastGroup) {
        emitGroupHeader(groupVal);
        // Repete o header das colunas após cada cabeçalho de grupo
        emitColumnHeader();
        lastGroup = groupVal;
      }
      emitDataRow(rowData);
      currentRow++;
    }
  } else {
    // ── Modo tabela simples ─────────────────────────────────────────────────
    for (const rowData of dataset) {
      emitDataRow(rowData);
      currentRow++;
    }
  }

  // Largura das colunas
  if (multiData) {
    const { fields, columns: gridCols = 4 } = multiData;
    for (let ci = 1; ci <= gridCols; ci++) {
      const relevantFields = fields.filter((_, idx) => {
        let col = 0;
        for (let i = 0; i <= idx; i++) col += fields[i].span ?? 1;
        return col === ci;
      });
      const maxLen = relevantFields.reduce((acc, f) => {
        const labelLen = (f.prefix ?? f.key).length;
        const maxVal = dataset.reduce((a, r) => Math.max(a, applyMask(r[f.key], f.mask).length), 0);
        return Math.max(acc, labelLen, maxVal);
      }, 10);
      ws.getColumn(ci).width = Math.min(maxLen + 4, 60);
    }
  } else {
    columns.forEach((col, ci) => {
      const headerLen = (col.prefix ?? col.key).length;
      const maxData = dataset.reduce((acc, rowData) => Math.max(acc, resolveCell(rowData[col.key], col).length), 0);
      ws.getColumn(ci + 1).width = Math.min(Math.max(headerLen, maxData) + 4, 60);
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: `${fileName}.xlsx`, style: "display:none" });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

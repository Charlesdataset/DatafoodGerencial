/**
 * pdf-layout/types.ts
 *
 * Tipos do sistema de templates JSON para PDF.
 * Define o schema que o usuário escreve + o RenderPlan (já calculado) para o WASM.
 *
 * ─── Exemplo de template ─────────────────────────────────────────────────────
 * {
 *   "pageSize": "A4",
 *   "margins": [30, 30, 30, 30],
 *   "header": {
 *     "type": "box",
 *     "backgroundColor": "#0f1b2d",
 *     "borderRadius": 10,
 *     "padding": [15, 25],
 *     "display": "flex",
 *     "flexDirection": "row",
 *     "children": [
 *       { "type": "text", "value": "{empresa}", "fontSize": 9, "color": "#94a3b8" },
 *       { "type": "text", "value": "{titulo}", "fontSize": 22, "bold": true, "color": "#ffffff" }
 *     ]
 *   },
 *   "body": [{ "type": "section", "table": { ... } }]
 * }
 */

// ─── Cores ───────────────────────────────────────────────────────────────────

export type RgbColor = [number, number, number]; // 0..1 each

export function hexToRgb(hex: string): RgbColor {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return [r, g, b];
}

// ─── Template Schema (o que o usuário escreve) ────────────────────────────────

export interface PdfTemplate {
  pageSize?: "A4" | "LETTER";
  margins?: number | [number, number, number, number]; // single or [top, right, bottom, left]
  header?: Component;
  body?: Component[];
  footer?: Component;
}

export type Component =
  | BoxComponent
  | TextComponent
  | TableComponent
  | SectionComponent
  | DividerComponent
  | PageBreakComponent;

export interface BoxComponent {
  type: "box";
  display?: "flex" | "block";
  flexDirection?: "row" | "column";
  flex?: number;
  width?: number;
  height?: number;
  minHeight?: number;
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number | [number, number, number, number];
  margin?: number | [number, number, number, number];
  gap?: number;
  alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
  justifyContent?: "flex-start" | "center" | "flex-end" | "space-between";
  children?: Component[];
}

export interface TextComponent {
  type: "text";
  value: string; // pode conter {placeholders}
  fontSize?: number;
  bold?: boolean;
  color?: string;
  align?: "left" | "center" | "right";
  letterSpacing?: number;
  width?: number; // se não definido, usa o container
}

export interface ColumnDef {
  field: string;
  header: string;
  width: number;
  align?: "left" | "center" | "right";
  format?: "text" | "number" | "currency";
}

export interface TotalDef {
  label: string; // pode usar {groupByField} para label dinâmica
  fields: string[]; // campos a totalizar
  style?: {
    bold?: boolean;
    backgroundColor?: string;
    textColor?: string;
  };
}

export interface TableComponent {
  type: "table";
  dataSource: string; // caminho no data, ex: "vendas"
  groupBy?: string; // campo para agrupar, ex: "categoria"
  columns: ColumnDef[];
  totals?: TotalDef; // subtotal por grupo
  globalTotals?: TotalDef; // total geral no final
  headerStyle?: {
    backgroundColor?: string;
    textColor?: string;
    bold?: boolean;
  };
  rowStyle?: {
    evenBackground?: string;
    oddBackground?: string;
    fontSize?: number;
  };
}

export interface SectionComponent {
  type: "section";
  title?: string;
  titleStyle?: {
    fontSize?: number;
    color?: string;
    bold?: boolean;
  };
  children?: Component[];
}

export interface DividerComponent {
  type: "divider";
  color?: string;
  height?: number;
  margin?: number;
}

export interface PageBreakComponent {
  type: "pageBreak";
}

// ─── Data Binding ─────────────────────────────────────────────────────────────

/**
 * Dados que o usuário passa para mesclar com o template.
 * Ex: { empresa: "ClearDataTicket", vendas: [...], titulo: "Relatório" }
 */
export type ReportData = Record<string, unknown>;

// ─── Render Plan (saída do engine, entrada do WASM) ───────────────────────────

export type RenderElement =
  | RenderRect
  | RenderText
  | RenderLine
  | RenderPageBreak;

export interface RenderRect {
  type: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
  backgroundColor: RgbColor;
  borderRadius: number;
}

export interface RenderText {
  type: "text";
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  fontSize: number;
  color: RgbColor;
  bold: boolean;
  align: "left" | "center" | "right";
}

export interface RenderLine {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: RgbColor;
  lineWidth: number;
}

export interface RenderPageBreak {
  type: "pageBreak";
}

/** Página renderizada — um array de elementos que cabem numa página A4 */
export interface RenderPage {
  elements: RenderElement[];
}

/** Plano completo de renderização = uma ou mais páginas */
export interface RenderPlan {
  pages: RenderPage[];
  pageWidth: number;
  pageHeight: number;
}

// ─── Constantes de página ─────────────────────────────────────────────────────

export const PAGE_SIZES: Record<string, [number, number]> = {
  A4: [595.28, 841.89],
  LETTER: [612.0, 792.0],
};

export const DEFAULT_MARGIN = 30;

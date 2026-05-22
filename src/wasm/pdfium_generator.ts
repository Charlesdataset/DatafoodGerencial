/**
 * src/wasm/pdfium_generator.ts
 *
 * Lazy-loading wrapper around the PDFium WASM output.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PdfRow {
  cells: string[];
}

export interface ChartData {
  title: string;
  labels: string[]; // Ex: ["Jan", "Fev", "Mar"]
  values: number[]; // Ex: [120, 200, 150]
  chartType: "bar" | "line" | "pie" | "donut";
}

export interface MetricCard {
  title: string;
  value: string;
  change?: string; // Ex: "+12.5%"
  icon?: string; // Ex: "💰"
}

export interface PdfConfig {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: PdfRow[];
  primaryColor?: [number, number, number];
  accentColor?: [number, number, number];
  companyName?: string;
  chartData?: ChartData[]; // 🆕 Gráficos!
  generationDate?: string; // 🆕 Data de geração
  metricCards?: MetricCard[]; // 🆕 Metric Cards
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLEX REPORT — Motor de relatório flexível (JSON declarativo)
// ═══════════════════════════════════════════════════════════════════════════════

export interface FlexCorners {
  /** Raio único para todos os cantos */
  all?: number;
  /** [top-left, top-right, bottom-right, bottom-left] */
  four?: [number, number, number, number];
}

export interface FlexGradient {
  direction?: "top-bottom" | "left-right" | "diagonal";
  colors: string[]; // cores hex: ["#1a3a6b", "#ff6600"]
}

export interface FlexStyle {
  backgroundColor?: string;
  color?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  align?: "left" | "center" | "right" | "justify";
  verticalAlign?: "top" | "middle" | "bottom";
  borderRadius?: FlexCorners | number;
  padding?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  margin?: number;
  marginTop?: number;
  marginBottom?: number;
  width?: number;
  height?: number;
  minHeight?: number;
  borderColor?: string;
  borderWidth?: number;
  gradient?: FlexGradient;
  opacity?: number;
}

export interface FlexColumnDef {
  width?: string; // "50%", "200" (absolute), "auto"
  style?: FlexStyle;
  children?: FlexElement[];
}

export interface FlexTableColumnDef {
  key?: string;
  label?: string;
  prefix?: string;
  width?: number;
  align?: "left" | "center" | "right";
  format?: "number" | "currency" | "percentage";
  style?: FlexStyle;
  children?: FlexElement[];
}

export interface FlexElement {
  type: "text" | "rect" | "container" | "div" | "columns" | "table" | "totalizer" | "spacer" | "chart" | "bar" | "line" | "pie" | "donut";
  value?: string;
  key?: string;
  prefix?: string;
  suffix?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  style?: FlexStyle;
  children?: FlexElement[];
  columns?: FlexColumnDef[];
  tableColumns?: FlexTableColumnDef[];
  /** Para totalizer: nome da coluna a somar */
  column?: string;
  /** Para totalizer: label exibida */
  label?: string;
  /** Formato do valor */
  format?: "number" | "currency" | "percentage";
  /** Para gráficos: tipo do gráfico */
  chartType?: "bar" | "line" | "pie" | "donut";
  /** Para gráficos: labels dos dados */
  chartLabels?: string[];
  /** Para gráficos: valores */
  chartValues?: number[];
  /** Para gráficos: paleta de cores customizada (hex) */
  chartColors?: string[];
  /** Para gráficos: título */
  chartTitle?: string;
  /** Para gráficos v2: nome da key no dataSource */
  chartDataSource?: string;
}

export interface FlexSectionStyle {
  backgroundColor?: string;
  height?: number;
  padding?: number;
  borderRadius?: FlexCorners | number;
  marginBottom?: number;
}

export interface FlexSection {
  type?: "header" | "body" | "footer";
  style?: FlexSectionStyle;
  children?: FlexElement[];
}

export interface FlexPageConfig {
  width?: number;
  height?: number;
  margin?: number;
  backgroundColor?: string;
  /** Se true (default), o header repete em todas as páginas. Se false, só na primeira. */
  repeatHeader?: boolean;
  /** Se true (default), o footer repete em todas as páginas. Se false, só na última. */
  repeatFooter?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// V2 DATA STRUCTURES (DataBlock / DataGroup)
// ═══════════════════════════════════════════════════════════════════════════════

/** Coluna do header da tabela (v2) */
export interface DataHeaderColumn {
  /** Chave do campo no objeto de dados (ex: "id") */
  key: string;
  /** Rótulo exibido para o usuário (ex: "Código") */
  prefix: string;
}

/** Item de totalização / sumário (v2) */
export interface DataBodyItem {
  /** accessor para lookup no dado atual (opcional — se ausente, usa value direto) */
  accessor?: string;
  /** Valor fixo (usado quando não tem accessor) */
  value?: string | number;
  /** Rótulo exibido (ex: "Total de produtos") */
  prefix: string;
}

/** Bloco de dados simples (v2) — gera tabela automática */
export interface DataBlock {
  /** Texto opcional exibido acima do header (ex: "Produtos") */
  preHeader?: string;
  /** Definição das colunas da tabela */
  dataHeader: DataHeaderColumn[];
  /** Chave para buscar os dados no DataSource (ex: "dadosProduto") */
  dataBodyValue: string;
  /** Totalizadores / sumários exibidos abaixo da tabela */
  body?: DataBodyItem[];
}

/** Bloco de dados agrupado (v2) — contém sub-blocos */
export interface DataGroup {
  /** Chave para buscar os dados agrupados no DataSource */
  groupKey: string;
  /** Sub-blocos que compõem o grupo */
  groupData: DataBlock[];
}

export interface FlexReport {
  page?: FlexPageConfig;
  /** Fonte de dados externa (v2) — mapa de chave → array de objetos */
  dataSource?: Record<string, unknown>;
  /**
   * Array de dados. Pode ser:
   * - v1 (legado): `Record<string, unknown>[]` — array de objetos planos
   * - v2: `(DataBlock | DataGroup)[]` — blocos auto-descritivos
   */
  data?: (DataBlock | DataGroup | Record<string, unknown>)[];
  /** Seções do relatório: header, body, footer... */
  sections?: FlexSection[];
  /** Atalho: se vier "elements" diretamente (sem sections) */
  elements?: FlexElement[];
}

/**
 * Normaliza objetos FlexCorners ({ all: n } ou { four: [a,b,c,d] })
 * para o formato que o Rust espera (número puro ou array).
 *
 * O Rust usa #[serde(untagged)] no enum Corners:
 *   All(f32)          ← número simples
 *   Four([f32;4])     ← array de 4 floats
 * Então { all: 10 } vira 10, e { four: [1,2,3,4] } vira [1,2,3,4].
 */
function normalizeValue(val: unknown): unknown {
  if (Array.isArray(val)) {
    return val.map(normalizeValue);
  }
  if (val !== null && typeof val === "object" && !Array.isArray(val)) {
    const obj = val as Record<string, unknown>;

    // Se parece FlexCorners { all: n } → vira número
    if ("all" in obj && Object.keys(obj).length === 1 && typeof obj.all === "number") {
      return obj.all;
    }
    // Se parece FlexCorners { four: [n,n,n,n] } → vira array
    if ("four" in obj && Object.keys(obj).length === 1 && Array.isArray(obj.four)) {
      return obj.four;
    }

    // Objeto normal — sanitiza cada campo recursivamente
    const sanitized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      sanitized[k] = normalizeValue(v);
    }
    return sanitized;
  }
  return val;
}

export async function generateFlexReport(report: FlexReport): Promise<Uint8Array> {
  const mod = await loadModule();
  const sanitized = normalizeValue(report);
  const json = JSON.stringify(sanitized);
  return mod.generate_flex_report(json);
}

// ═══════════════════════════════════════════════════════════════════════════════
// V3 — NOVO MOTOR
// ═══════════════════════════════════════════════════════════════════════════════

export async function gerarRelatorioPdfV3(
  report: Record<string, unknown>,
  datasets?: Record<string, Record<string, unknown>[]>,
  variables?: Record<string, string>,
): Promise<Uint8Array> {
  const mod = await loadModule();
  const clean = { ...report } as Record<string, unknown>;

  const reportDatasets = (clean._datasets as Record<string, Record<string, unknown>[]> | undefined) ?? {};
  const reportVariables = (clean._variables as Record<string, string> | undefined) ?? {};
  delete clean._datasets;
  delete clean._variables;

  const mergedDatasets = {
    ...reportDatasets,
    ...(datasets ?? {}),
  };

  const mergedVariables = {
    ...reportVariables,
    ...(variables ?? {}),
  };

  const stringifiedVariables = Object.fromEntries(
    Object.entries(mergedVariables).map(([key, value]) => [
      key,
      value === undefined || value === null ? "" : String(value),
    ]),
  );

  const varsWithDate = {
    ...stringifiedVariables,
    currDate: stringifiedVariables.currDate ?? new Date().toLocaleString("pt-BR"),
  };

  const result = mod.generate_pdf_v3(
    JSON.stringify(clean),
    JSON.stringify(mergedDatasets),
    JSON.stringify(varsWithDate),
  );

  // Rust returns raw error strings (not valid PDF) when parsing fails.
  // Detect and convert them into proper JS errors before returning.
  if (result.length > 5) {
    const prefix = String.fromCharCode(...result.slice(0, 5));
    if (prefix === "ERRO:") {
      const msg = new TextDecoder().decode(result);
      throw new Error(msg);
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEGADO — playground de teste
// ═══════════════════════════════════════════════════════════════════════════════

export interface MeuConfig {
  titulo: string;
  mensagem: string;
  corPrincipal?: [number, number, number];
}

export interface EstiloConfig {
  titulo: string;
  subtitulo: string;
  empresa: string;
  corPrimaria: [number, number, number];
  corDestaque: [number, number, number];
}

//função teste playground brincadeira
export async function gerarPdfBrincadeira(
  config: MeuConfig,
): Promise<Uint8Array> {
  const mod = await loadModule();
  const json = JSON.stringify(config);
  return mod.gerar_pdf_brincadeira(json);
}

export async function gerarRelatorioEstiloso(
  config: EstiloConfig,
): Promise<Uint8Array> {
  const mod = await loadModule();
  const json = JSON.stringify(config);
  return mod.gerar_relatorio_estiloso(json);
}

export interface PremiumConfig {
  titulo: string;
  subtitulo?: string;
  empresa?: string;
  corPrimaria?: [number, number, number];
  corDestaque?: [number, number, number];
  corSecundaria?: [number, number, number];
}

export async function gerarRelatorioPremium(
  config: PremiumConfig,
): Promise<Uint8Array> {
  const mod = await loadModule();
  const json = JSON.stringify(config);
  return mod.gerar_relatorio_premium(json);
}

// ─── Internal module cache ────────────────────────────────────────────────────

type WasmBindings = {
  generate_flex_report: (json: string) => Uint8Array;
  generate_pdf: (configJson: string) => Uint8Array;
  gerar_pdf_brincadeira: (configJson: string) => Uint8Array; // puchar metodo
  gerar_relatorio_estiloso: (configJson: string) => Uint8Array;
  gerar_relatorio_premium: (configJson: string) => Uint8Array;
  render_template: (planJson: string) => Uint8Array;
  generate_pdf_v3: (reportJson: string, datasetsJson: string, variablesJson: string) => Uint8Array;
  default: (input?: {
    module_or_path: ArrayBuffer | string | URL | Request;
  }) => Promise<void>;
};

let _module: WasmBindings | null = null;
let _loadPromise: Promise<WasmBindings> | null = null;

async function loadModule(): Promise<WasmBindings> {
  // In DEV mode, never cache the module — always reload so a fresh
  // wasm-pack build is picked up immediately without a hard page refresh.
  if (import.meta.env.DEV) {
    _module = null;
    _loadPromise = null;
  }

  if (_module) return _module;

  if (!_loadPromise) {
    _loadPromise = (async () => {
      const origin = window.location.origin;
      const cacheSuffix = import.meta.env.DEV ? `?t=${Date.now()}` : "";
      const jsFile = `${origin}/wasm/pdf_wasm.js${cacheSuffix}`;
      const wasmFile = `${origin}/wasm/pdf_wasm_bg.wasm${cacheSuffix}`;

      const wasmResp = await fetch(wasmFile, { cache: "no-store" });
      if (!wasmResp.ok) {
        throw new Error(
          `Falha ao carregar WASM (${wasmResp.status}): ${wasmFile}\nVerifique se public/wasm/pdf_wasm_bg.wasm existe no deploy.`,
        );
      }
      const wasmBytes = await wasmResp.arrayBuffer();

      const magic = new Uint8Array(wasmBytes, 0, 4);
      if (
        magic[0] !== 0x00 ||
        magic[1] !== 0x61 ||
        magic[2] !== 0x73 ||
        magic[3] !== 0x6d
      ) {
        throw new Error(`O arquivo ${wasmFile} não é um binário WASM válido.`);
      }

      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const dynamicImport = new Function("p", "return import(p)") as (
        p: string,
      ) => Promise<WasmBindings>;
      const mod = await dynamicImport(jsFile);
      await mod.default({ module_or_path: wasmBytes });

      _module = mod;
      return mod;
    })();
  }

  return _loadPromise;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generatePdf(config: PdfConfig): Promise<Uint8Array> {
  const mod = await loadModule();
  const json = JSON.stringify(config);
  return mod.generate_pdf(json);
}

function isIOS(): boolean {
  return (
    /ipad|iphone|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function openPdfWindow(): Window | null {
  return window.open("", "_blank");
}

export function navigatePdfWindow(win: Window, bytes: Uint8Array): void {
  const blob = new Blob([bytes.slice()], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  win.location.href = url;
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// ─── Template Engine (novo) ───────────────────────────────────────────────────

import type { PdfTemplate } from "../pdf-layout/types";
import { renderPlanToJson } from "../pdf-layout/renderer";
import { buildRenderPlanFromTemplate } from "../pdf-layout/engine";

/**
 * Gera um PDF a partir de um template JSON + dados.
 * O template define o layout (header, body, tabelas com agrupamento),
 * os dados preenchem os placeholders e alimentam as tabelas.
 */
export async function renderTemplate(
  template: PdfTemplate,
  data: Record<string, unknown>,
): Promise<Uint8Array> {
  // 1. Processa template + dados → plano de renderização
  const plan = await buildRenderPlanFromTemplate(template, data);

  // 2. Converte o plano para JSON
  const planJson = renderPlanToJson(plan);

  // 3. Envia para o WASM
  const mod = await loadModule();
  return mod.render_template(planJson);
}

export type { PdfTemplate } from "../pdf-layout/types";

export function downloadPdf(bytes: Uint8Array, filename = "pdfium.pdf"): void {
  const blob = new Blob([bytes.slice()], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  if (isIOS()) {
    const a = Object.assign(document.createElement("a"), {
      href: url,
      target: "_blank",
      rel: "noopener noreferrer",
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: filename,
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function previewPdf(bytes: Uint8Array): void {
  const blob = new Blob([bytes.slice()], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank");

  if (!opened) {
    window.location.href = url;
  }

  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

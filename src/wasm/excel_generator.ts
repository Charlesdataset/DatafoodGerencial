type ExcelWasmBindings = {
  gerar_excel: (json: string) => Uint8Array;
  default: (input?: { module_or_path: ArrayBuffer | string | URL | Request }) => Promise<void>;
};

let _excelModule: ExcelWasmBindings | null = null;
let _excelLoadPromise: Promise<ExcelWasmBindings> | null = null;

async function loadExcelModule(): Promise<ExcelWasmBindings> {
  if (import.meta.env.DEV) {
    _excelModule = null;
    _excelLoadPromise = null;
  }

  if (_excelModule) return _excelModule;

  if (!_excelLoadPromise) {
    _excelLoadPromise = (async () => {
      const origin = window.location.origin;

      const cacheSuffix = import.meta.env.DEV ? `?t=${Date.now()}` : '';

      const jsFile = `${origin}/wasm/excel_wasm.js${cacheSuffix}`;

      const wasmFile = `${origin}/wasm/excel_wasm_bg.wasm${cacheSuffix}`;

      const wasmResp = await fetch(wasmFile, {
        cache: 'no-store',
      });

      if (!wasmResp.ok) {
        throw new Error(`Falha ao carregar o Excel WASM (${wasmResp.status})`);
      }

      const wasmBytes = await wasmResp.arrayBuffer();

      const magic = new Uint8Array(wasmBytes, 0, 4);

      if (magic[0] !== 0x00 || magic[1] !== 0x61 || magic[2] !== 0x73 || magic[3] !== 0x6d) {
        throw new Error('Binário WASM inválido');
      }

      const dynamicImport = new Function('p', 'return import(p)') as (p: string) => Promise<ExcelWasmBindings>;

      const mod = await dynamicImport(jsFile);

      await mod.default({
        module_or_path: wasmBytes,
      });

      _excelModule = mod;
      return mod;
    })();
  }
  return _excelLoadPromise;
}

//=============================================================
//            tipo do excel v3
//=============================================================
export interface ExcelV3 {
  config: ExcelConfig;
  header: HeaderComponent;
  footer: FooterComponent;
  content: Array<ExcelV3Component>;
  _datasets: ExcelV3Datasets;
  _variables: ExcelV3Variables;
}
export type ExcelV3Datasets = Record<string, Record<string, unknown>[]>;
export type ExcelV3Variables = Record<string, string>;

export type ExcelV3Component = TableComponent;

export interface TableComponent {
  type: 'table';
  datasetName: string;
  tableHeader: Array<ExcelTableColumn>;
  grouping?: ExcelGroupConfig;
  summaryBox?: ExcelSummaryBox;
  childrens?: Array<ChildremTable>;
  sheetName?: string;
}

export interface ChildremTable {
  path: string;
  tableHeader: Array<ExcelTableColumn>;
  grouping?: ExcelGroupConfig;
  preHeader?: string;
  preHeaderPath?: string;
  marginTop?: number;
  marginBottom?: number;
}

export interface ExcelSummaryBox {
  rows: Array<ExcelSummaryRow>;
}
export interface ExcelSummaryRow {
  key: string;
  label: string;
  mask?: ExcelV3Mask;
  bold?: boolean;
}

export interface ExcelGroupConfig {
  groupBy: string;
  groupHeaderMask?: string;
  subtotal?: string;
  gap?: number;
}

export interface ExcelTableColumn {
  key: string;
  cols: Array<number>;
  prefix: string;
  align?: ExcelV3Align;
  headerAlign?: ExcelV3Align;
  mask?: ExcelV3Mask;
  sum?: boolean;
}

export enum ExcelV3Mask {
  Cnpj = 'cnpj',
  Monetary = 'monetary',
  Number = 'number',
  Document = 'document',
  Percent = 'percent',
  DateTime = 'datetime',
  Date = 'date',
  Decimal = 'decimal',
  Milhar = 'milhar',
  Number3 = 'number-3',
}

export enum ExcelV3Align {
  Center = 'center',
  Right = 'right',
  Left = 'left',
}

export interface FooterComponent {
  site: string;
}

export interface ExcelConfig {
  rowHeight?: number;
  headerBackground?: string;
  headerForeground?: string;
  zebraBackground?: string;
  rowBackground?: string;
  borderStryle?: BorderStyle;
  primaryColor?: string;
}

export interface HeaderComponent {
  title: string;
  companyName: string;
  logoBase64?: string;
  filters?: Array<FilterItem>;
}

export interface FilterItem {
  key: string;
  value: string;
  mask?: string;
}

export enum BorderStyle {
  None = 'none',
  Thin = 'thin',
  Medium = 'medium',
  Thick = 'thick',
  Dashed = 'dashed',
  Dotted = 'dotted',
  MediumDashed = 'medium_dashed',
}

export async function excelEngineGenerate(json: ExcelV3): Promise<Uint8Array<ArrayBufferLike> | undefined> {
  const excel = await loadExcelModule();
  return excel.gerar_excel(JSON.stringify(json));
}

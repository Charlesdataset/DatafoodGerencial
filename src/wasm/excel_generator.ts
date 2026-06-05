import { getImageBase64FromPath } from '../utils/format';

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
}

export interface ChildremTable {
  path: string;
  tableHeader: Array<ExcelTableColumn>;
  grouping?: ExcelGroupConfig;
  summaryBox?: ExcelSummaryBox;
}

export interface ExcelSummaryBox {
  rows: Array<ExcelSummaryRow>;
}
export interface ExcelSummaryRow {
  key: string;
  label: string;
  mask?: ExelV3Mask;
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
  mask?: ExelV3Mask;
  sum?: boolean;
}

export enum ExelV3Mask {
  Cnpj = 'cnpj',
  Monetary = 'monetary',
  Number = 'number',
  Document = 'document',
  Percent = 'percent',
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

export async function gerarExcelTeste(logo: string, primaryColor: string) {
  const base64 = await getImageBase64FromPath(logo);
  const excel = await loadExcelModule();

  const json: ExcelV3 = {
    config: {
      rowHeight: 20,
      headerBackground: '#404040',
      zebraBackground: '#cbcbcb',
      primaryColor: primaryColor,
    },
    header: {
      title: 'Relatório NFC-e',
      companyName: 'DataSet Sistemas \n 25306810000100',
      filters: [{ key: 'Data Inicial', value: '08/05/2024' }],
    },

    footer: {
      site: 'www.datasetsistemas.com.br',
    },

    _variables: {
      empresa: 'DataSet Sistemas | 25306810000100',
      cnpj: '00.000.000/0001-00',
      logoSistema: base64,
    },

    _datasets: {
      notas: [
        {
          numero: 1,
          cliente: 'João',
          vlrTotal: 100,
          grupo: 'SADIA',
          itens: [
            {
              id: 9,
              produto: 'TIXAN YPE',
              valor: 17.89,
            },
            {
              id: 15,
              produto: 'PAPEL HIGIENICO',
              valor: 20.79,
            },
          ],
        },
        {
          numero: 2,
          cliente: 'Maristela',
          vlrTotal: 100,
          grupo: 'SADIA',
        },
        {
          numero: 3,
          cliente: 'Joaninha',
          vlrTotal: 100,
          grupo: 'SADIA',
        },
        {
          numero: 4,
          cliente: 'Fabíola',
          vlrTotal: 360,
          grupo: 'PERDIGAO',
        },
        {
          numero: 5,
          cliente: 'Cezar',
          vlrTotal: 450,
          grupo: 'PERDIGAO',
        },
        {
          numero: 6,
          cliente: 'TzarBomb',
          vlrTotal: 200,
          grupo: 'PERDIGAO',
        },
      ],
    },

    content: [
      {
        type: 'table',
        datasetName: 'notas',
        grouping: {
          groupBy: 'grupo',
        },
        childrens: [
          {
            path: 'itens',
            tableHeader: [
              { key: 'id', prefix: 'ID', cols: [2, 3] },
              { key: 'produto', prefix: 'Produto', cols: [4, 8] },
              { key: 'valor', prefix: 'Valor', cols: [9, 12], sum: true },
            ],
          },
        ],

        tableHeader: [
          {
            key: 'numero',
            prefix: 'NOTA',
            cols: [1, 2],
            align: ExcelV3Align.Center,
            headerAlign: ExcelV3Align.Center,
          },
          {
            key: 'cliente',
            prefix: 'CLIENTE',
            cols: [3, 9],
            align: ExcelV3Align.Left,
            headerAlign: ExcelV3Align.Left,
          },
          {
            key: 'grupo',
            prefix: 'GRUPO',
            cols: [10, 12],
            align: ExcelV3Align.Center,
            headerAlign: ExcelV3Align.Center,
          },
          {
            key: 'vlrTotal',
            prefix: 'TOTAL',
            cols: [13, 16],
            align: ExcelV3Align.Right,
            headerAlign: ExcelV3Align.Center,
            sum: true,
          },
        ],

        summaryBox: {
          rows: [
            {
              key: 'vlrTotal',
              label: 'VALOR TOTAL',
              mask: ExelV3Mask.Monetary,
            },
          ],
        },
      } as ExcelV3Component,
    ],
  };

  const bytes = excel.gerar_excel(JSON.stringify(json));

  const blob = new Blob([bytes as any], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  7;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'realtorio-teste.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

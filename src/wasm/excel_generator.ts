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

export async function gerarExcelTeste(logo: string) {
  const base64 = await getImageBase64FromPath(logo);
  const excel = await loadExcelModule();

  const json = {
    header: {
      title: 'Relatório NFC-e',
      company_name: '$empresa',
      document: '$cnpj',
    },

    _variables: {
      empresa: 'Dataset Sistemas',
      cnpj: '00.000.000/0001-00',
    },

    _datasets: {
      notas: [
        {
          numero: 1,
          cliente: 'João',
          vlrTotal: 100,
          itens: [
            {
              id: 1,
              nome: 'sanduiche',
              valor: 4.5,
            },
            {
              id: 1,
              nome: 'sanduiche',
              valor: 4.5,
            },
          ],
        },
        {
          numero: 2,
          cliente: 'Maria',
          vlrTotal: 200,
        },
      ],
    },

    content: [
      {
        type: 'table',
        datasetName: 'notas',

        tableHeader: [
          {
            key: 'numero',
            prefix: 'NOTA',
          },
          {
            key: 'cliente',
            prefix: 'CLIENTE',
          },
          {
            key: 'vlrTotal',
            prefix: 'TOTAL',
          },
        ],

        summaryBox: {
          rows: [
            {
              key: 'vlrTotal',
              label: 'VALOR TOTAL',
            },
          ],
        },
      },
    ],
  };

  json._variables = {
    logoSistema: base64,
  } as any;

  const bytes = excel.gerar_excel(JSON.stringify(json));

  const blob = new Blob([bytes as any], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'realtorio-teste.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

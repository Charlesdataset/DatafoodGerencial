import { NfceAgrupadoPor } from '../../pages/Relatorios/types/relatorios.types';
import type { ComponentV3, ReportV3 } from '../../types/v3.types';
import { getImageBase64FromPath, maskCnpj, maskCpf } from '../../utils/format';
import { gerarRelatorioPdfV3 } from '../../wasm/pdfium_generator';
import {
  formatFiltersForHeader,
  formatPeriod,
  type FilterConfig,
} from '../utils/filterFormatter';

const formatCurrency = (value: number | string) => {
  const num =
    typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
};

const getOrderByLabel = (value?: string) => {
  switch (value) {
    case 'FAZ':
      return 'Fornecedor A-Z';
    case 'FZA':
      return 'Fornecedor Z-A';
    case 'CAZ':
      return 'Código A-Z';
    case 'CZA':
      return 'Código Z-A';
    case 'EAZ':
      return 'Entrada A-Z';
    case 'EZA':
      return 'Entrada Z-A';
    default:
      return '';
  }
};

const getAgrupadoPorLabel = (value?: string) => {
  switch (value) {
    case 'Cliente':
      return 'Cliente';
    case 'Data Emissão':
      return 'Data de emissão';
    case 'Data Saída':
      return 'Data de saída';
    case 'Data Recebimento':
      return 'Data de recebimento';
    case 'Status':
      return 'Status';
    default:
      return '';
  }
};

const handleReportNfce = async (
  dataset: any,
  agrupadoPor: NfceAgrupadoPor,
  exibeItens: boolean,
  companyInfo: any,
  currLogoRelatorio: string,
  filters?: {
    pesquisa?: string;
    valorInicial?: number | string;
    valorFinal?: number | string;
    ordenadoPor?: string;
    agrupadoPor?: string;
    dataInicial?: string | Date | null;
    dataFinal?: string | Date | null;
  },
) => {
  const filterConfigs: FilterConfig[] = [];

  if (filters?.pesquisa) {
    filterConfigs.push({ label: 'Pesquisa', values: [filters.pesquisa] });
  }

  const periodLabel = formatPeriod(
    filters?.dataInicial ?? null,
    filters?.dataFinal ?? null,
  );
  if (periodLabel) {
    filterConfigs.push({
      label: 'Período',
      values: [periodLabel],
      showAll: true,
    });
  }

  if (filters?.valorInicial != null || filters?.valorFinal != null) {
    const initial =
      filters?.valorInicial != null
        ? formatCurrency(filters.valorInicial)
        : undefined;
    const final =
      filters?.valorFinal != null
        ? formatCurrency(filters.valorFinal)
        : undefined;
    const valorLabel =
      initial && final
        ? `${initial} a ${final}`
        : initial
        ? `>= ${initial}`
        : final
        ? `<= ${final}`
        : '';
    if (valorLabel) {
      filterConfigs.push({
        label: 'Valor',
        values: [valorLabel],
        showAll: true,
      });
    }
  }

  const agrupadoLabel = getAgrupadoPorLabel(filters?.agrupadoPor);
  if (agrupadoLabel) {
    filterConfigs.push({
      label: 'Agrupado por',
      values: [agrupadoLabel],
      showAll: true,
    });
  }
  const getAgrupado: Record<NfceAgrupadoPor, string> = {
    [NfceAgrupadoPor.Cliente]: 'cliente',
    [NfceAgrupadoPor.DataEmissao]: 'dataEmissao',
    [NfceAgrupadoPor.DataRecebimento]: 'dataEmissao',
    [NfceAgrupadoPor.DataSaida]: 'dataSaida',
    [NfceAgrupadoPor.Status]: 'status',
    [NfceAgrupadoPor.Nenhum]: '',
  };

  const filtrosHeader =
    filterConfigs.length > 0 ? formatFiltersForHeader(filterConfigs, 180) : '';

  const json: ReportV3 = {
    pageConfiguration: {
      backgroundColor: '#ffffff',
      margin: {
        four: [40, 35, 40, 35],
      },
      orientation: 'landscape',
    },
    header: {
      repeat: false,
      height: filtrosHeader ? 90 : 60,
      backgroundColor: '#ffffff',
      content: [
        {
          type: 'fluidLayout',
          sizes: ['25%', '50%', '25%'],

          content: [
            {
              type: 'image-box' as const,
              variable: 'logoSistema',
              width: 120,
              height: 40,
            },
            {
              type: 'text',
              value: 'Relatório Nfc-e',

              fontSize: 20,
              bold: true,
              color: '#000',
              align: 'left',
              margin: {
                four: [30, 0, 0, 50],
              },
            },
            {
              type: 'text',
              value: "'$cnpj'  '$empresa'",

              fontSize: 8,

              color: '#000',
              align: 'left',
              margin: {
                four: [25, 0, 0, 50],
              },
            },
          ],
        },
        ...(filtrosHeader
          ? ([
              {
                type: 'text' as const,
                value: `Filtros: $filtros_header`,
                fontSize: 9,
                color: '#575757',
                align: 'left' as const,
                margin: {
                  four: [10, 0, 0, 0],
                },
              },
            ] as ComponentV3[])
          : []),
      ],
    },
    footer: {
      repeat: true,
      minHeight: 40,

      border: [1, 0, 0, 0],
      borderColor: '#c0c0c0',
      borderStyle: 'solid',
      backgroundColor: '#ffffff',
      content: [
        {
          type: 'fluidLayout',
          sizes: ['33%', '33%', '33%'],
          gap: 0,
          content: [
            {
              type: 'text',
              value: "Gerado em : '$currDate'",

              fontSize: 10,
              color: '#303030',
              align: 'left',
              margin: {
                all: 5,
              },
            },
            {
              type: 'text',
              value: 'www.datasetsistemas.com.br',
              fontSize: 10,
              color: '#303030',
              align: 'center',
              margin: {
                all: 5,
              },
            },
            // {
            //   type: 'card',
            //   content:[],
            //   backgroundColor: '#404040',
            // },
            // {
            //   type: 'card',
            //   content:[],
            //   backgroundColor: '#404040',
            // },
            // {
            //   type: 'card',
            //   content:[],
            //   backgroundColor: '#404040',
            // }
            {
              type: 'text',
              value: "Página '$page'/'$pages'",
              // value: "Página testando",
              fontSize: 10,
              color: '#303030',

              align: 'right',
              margin: {
                four: [5, -40, 5, 5],
              },
            },
            // {
            //   type: 'text',
            //  value: "Texto Qualquer",
            //  // value: "Página testando",
            //   fontSize: 10,
            //   color: '#303030',

            //   align: 'right',

            // },
          ],
        },
      ],
    },
    content: [
      {
        type: 'table',
        headerBackgroundColor: '#404040',
        zebraBackgroundColor: '#202020',
        zebraTextColor: '#FFFFFF',
        ...(exibeItens
          ? {
              items: {
                headerBackgroundColor: '#ffffff',
                textColor: '#404040',
                zebraBackgroundColor: '#202020',
                zebraTextColor: '#FFFFFF',
                headerTextColor: '#000000',

                borderStyle: 'none',
                gapTop: 10,
                gap: 20,
                path: 'itens',
                tableHeader: [
                  {
                    key: 'id',
                    prefix: 'ID',
                  },
                  {
                    key: 'produto',
                    prefix: 'PRODUTO',
                  },

                  {
                    key: 'qtd',
                    prefix: 'QUANTIDADE',
                    align: 'right',
                    mask: 'number-3',
                    sum: true,
                  },

                  {
                    key: 'valorTotal',
                    prefix: 'VALOR TOTAL',
                    align: 'right',
                    mask: 'number',
                    sum: true,
                  },
                ],
                widths: [50, 'expand', 60, 60],
                indent: 100,
              },
            }
          : {}),

        datasetName: 'notas',
        ...(agrupadoPor !== NfceAgrupadoPor.Nenhum
          ? {
              grouping: {
                groupBy: getAgrupado[agrupadoPor],
                groupHeaderMask:
                  agrupadoPor === NfceAgrupadoPor.DataEmissao ||
                  agrupadoPor === NfceAgrupadoPor.DataRecebimento ||
                  agrupadoPor === NfceAgrupadoPor.DataSaida
                    ? 'date'
                    : undefined,
                gap: 40,
                subtotal: true,
              },
            }
          : {}),
        tableHeader: [
          {
            key: 'numero',
            prefix: 'NOTA',
            align: 'center',
          },
          {
            key: 'cliente',
            prefix: 'CLIENTE',
            align: 'left',
          },
          {
            key: 'status',
            prefix: 'STATUS',
            align: 'center',
          },
          {
            key: 'dataEmissao',
            prefix: 'DATA EMISSÃO',
            align: 'center',
            mask: 'date',
          },
          {
            key: 'dataSaida',
            prefix: 'DATA SAÍDA',
            align: 'center',
            mask: 'date',
          },
          {
            key: 'valorProdutos',
            prefix: 'VALOR PRODUTOS',
            align: 'right',
            mask: 'number',
            sum: true,
          },
          {
            key: 'vlrTotal',
            prefix: 'VALOR TOTAL',
            align: 'right',
            mask: 'number',
            sum: true,
          },
        ],
        widths: [50, 'expand', 80, 80, 80, 90, 90],
      },
    ],
  };
  json._datasets = {
    notas: dataset,
  };

  const imageBase64 = await getImageBase64FromPath(currLogoRelatorio);
  const rawCnpj = companyInfo?.cnpj ?? '';
  json._variables = {
    filtros_header: filtrosHeader,
    data_geracao: new Date().toLocaleDateString('pf-BR'),
    empresa: companyInfo?.nomeCli ?? '',
    cnpj:
      rawCnpj.length > 11 ? maskCnpj(rawCnpj) : rawCnpj ? maskCpf(rawCnpj) : '',

    currDate: new Date().toLocaleDateString('pt-BR'),
    logoSistema: imageBase64,
  };

  const bufferArray = await gerarRelatorioPdfV3(json as any);
  return bufferArray;
};
export default handleReportNfce;

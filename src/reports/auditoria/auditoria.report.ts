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

export enum AuditoriaAgrupadoPor {
  Nenhum = '',
  Data = 'Data',
  Operacao = 'Operação',
  Colaborador = 'Colaborador',
  Computador = 'Computador',
}

const handleReportAuditoria = async (
  dataset: any,
  agrupadoPor: AuditoriaAgrupadoPor,
  exibirDetalhes: boolean,
  companyInfo: any,
  currLogoRelatorio: string,
  filters?: {
    pesquisa?: string;
    agrupadoPor?: string;
    dataInicial?: string | Date | null;
    dataFinal?: string | Date | null;
    formulario: string | null;
  },
) => {
  const getAgrupado: Record<AuditoriaAgrupadoPor, string> = {
    [AuditoriaAgrupadoPor.Colaborador]: 'colaborador',
    [AuditoriaAgrupadoPor.Computador]: 'computador',
    [AuditoriaAgrupadoPor.Data]: 'data',
    [AuditoriaAgrupadoPor.Operacao]: 'operacao',
    [AuditoriaAgrupadoPor.Nenhum]: 'nenhum',
  };

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

  if (agrupadoPor != AuditoriaAgrupadoPor.Nenhum) {
    filterConfigs.push({
      label: 'Agrupado por',
      values: [filters.agrupadoPor],
      showAll: true,
    });
  }

  const filtrosHeader =
    filterConfigs.length > 0 ? formatFiltersForHeader(filterConfigs, 180) : '';

  const buildDetalhes = (dadosJson: any) => {
    if (!dadosJson || !dadosJson.alterados || typeof dadosJson.alterados !== 'object') {
      return [];
    }

    return Object.entries(dadosJson.alterados)
      .map(([campo, item]) => {
        if (JSON.stringify(item?.antes) === JSON.stringify(item?.depois)) {
          return null;
        }
        return {
          campo,
          antes: item?.antes ?? '',
          depois: item?.depois ?? '',
        };
      })
      .filter(Boolean) as Array<{ campo: string; antes: string; depois: string }>;
  };

  const datasetWithColaborador = dataset.map((item: any) => ({
    ...item,
    colaborador: item.colaborador ?? item.nomeColaborador ?? '',
    itens: exibirDetalhes ? buildDetalhes(item.dadosJson) : [],
  }));

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
      height: 60,
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
              value: 'Relatório Auditoria',

              fontSize: 20,
              bold: true,
              color: '#000',
              align: 'center',
              margin: {
                four: [30, 0, 0, 50],
              },
            },
            {
              type: 'text',
              value: "'$cnpj'  '$empresa'",

              fontSize: 8,

              color: '#000',
              align: 'right',
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

            {
              type: 'text',
              value: "Página '$page'/'$pages'",

              fontSize: 10,
              color: '#303030',

              align: 'right',
              margin: {
                four: [5, -40, 5, 5],
              },
            },
          ],
        },
      ],
    },
    content: [
      {
        type: 'table',
        headerBackgroundColor: '#404040',
        zebraBackgroundColor: '#cbcbcb',
        zebraTextColor: '#000000',
        ...(exibirDetalhes
          ? {
              items: {
                headerBackgroundColor: '#ffffff',
                textColor: '#404040',
                zebraBackgroundColor: '#cbcbcb',
                zebraTextColor: '#000000',
                headerTextColor: '#000000',
                borderStyle: 'none',
                gapTop: 10,
                gap: 20,
                path: 'itens',
                tableHeader: [
                  {
                    key: 'campo',
                    prefix: 'Campo',
                    align: 'left',
         
                  },
                  {
                    key: 'antes',
                    prefix: 'Antes',
                    align: 'left',
                    wrap: true,
                  },
                  {
                    key: 'depois',
                    prefix: 'Depois',
                    align: 'left',
                    wrap: true,
          
                  },
                ],
                widths: ['expand', 250, 250],
                indent: 10,
              },
            }
          : {}),

        datasetName: 'notas',
        ...(agrupadoPor !== AuditoriaAgrupadoPor.Nenhum
          ? {
              grouping: {
                groupBy: getAgrupado[agrupadoPor],
                groupHeaderMask:
                  agrupadoPor === AuditoriaAgrupadoPor.Data
                    ? 'date'
                    : undefined,
                gap: 40,
              },
            }
          : {}),
        tableHeader: [
          {
            key: 'idAuditoria',
            prefix: 'Cód.',
            align: 'center',
          },
          {
            key: 'formulario',
            prefix: 'Formulário',
            align: 'left',
        
          },
          {
            key: 'colaborador',
            prefix: 'Colaborador',
            align: 'left',
          
          },
          {
            key: 'operacao',
            prefix: 'Operação',
            align: 'center',
          },
          {
            key: 'computador',
            prefix: 'Computador',
            align: 'center',
          },
          {
            key: 'data',
            prefix: 'Data',
            align: 'center',

            mask: 'date-time',
          },
        ],
        widths: [50, 'expand', 80, 80, 80, 80],
      },
    ],
  };
  json._datasets = {
    notas: datasetWithColaborador,
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
export default handleReportAuditoria;

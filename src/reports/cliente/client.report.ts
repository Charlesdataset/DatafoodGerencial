import type { CompanyInfo } from '../../contexts/AppContext';
import type { ComponentV3, ReportV3 } from '../../types/v3.types';
import { getImageBase64FromPath, maskCnpj, maskCpf } from '../../utils/format';
import { gerarRelatorioPdfV3 } from '../../wasm/pdfium_generator';
import { formatFiltersForHeader, type FilterConfig } from '../utils/filterFormatter';

export enum ClienteAgrupadoPor {
  Bairro = 'bairro',
  Cidade = 'cidade',
  Nenhum = 'nenhum',
}
export enum ModeloRelatorio {
  Simplificado = 'simplificado',
  Detalhado = 'detalhado',
}

const handleGenerateClientReport = async (dataset: any[], agrupadoPor: ClienteAgrupadoPor, modelo: ModeloRelatorio, companyInfo: CompanyInfo, currLogoRelatorio: string, filters: any = []) => {
  const filterConfigs: FilterConfig[] = [];
  if (filters?.pesquisa) {
    filterConfigs.push({ label: 'Pesquisa', values: [filters.pesquisa] });
  }

  const filtrosHeader = filterConfigs.length > 0 ? formatFiltersForHeader(filterConfigs, 180) : '';

  const json: ReportV3 = {
    pageConfiguration: {
      backgroundColor: '#ffffff',
      margin: {
        four: [40, 35, 40, 35],
      },
      orientation: modelo === ModeloRelatorio.Detalhado ? 'landscape' : 'portrait',
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
              value: 'Relatório Clientes',

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
          sizes: ['33', '33', '33'],
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
                four: [5, 0, 0, 0],
              },
            },
          ],
        },
      ],
    },
    content:
      modelo === ModeloRelatorio.Simplificado
        ? [
            {
              ...(agrupadoPor !== ClienteAgrupadoPor.Nenhum && {
                grouping: {
                  groupBy: agrupadoPor === ClienteAgrupadoPor.Bairro ? 'bairro' : 'cidade',
                },
              }),
              headerBackgroundColor: '#404040',

              type: 'table' as const,
              datasetName: 'clientes',
              tableHeader: [
                {
                  key: 'idCliente',
                  prefix: 'Código',
                },
                {
                  key: 'razaoSocial',
                  prefix: 'Nome',
                },
                {
                  key: 'dataCadastro',
                  prefix: 'Data Cadastro',
                  mask: 'date-time' as const,
                  align: 'center' as const,
                },
                {
                  key: 'celular',
                  prefix: 'Celular',
                  align: 'center' as const,
                },
                {
                  key: 'limiteCredito',
                  prefix: 'Saldo',

                  align: 'right',
                },
              ],
              widths: [60, 'expand', 100, 80, 80],
            },
          ]
        : [
            {
              ...(agrupadoPor !== ClienteAgrupadoPor.Nenhum && {
                grouping: {
                  groupHeaderBackgroundColor: '#ffffff',
                  groupHeaderTextColor: '#000000',
                  groupBy: agrupadoPor === ClienteAgrupadoPor.Bairro ? 'bairro' : 'cidade',
                },
              }),
              type: 'tableMultiData' as const,
              datasetName: 'clientes',
              titleField: 'razaoSocial',
              titlePrefix: 'Cliente: ',
              titleBackgroundColor: '#404040',
              titleTextColor: '#ffffff',
              labelBackgroundColor: '#EEF1F6',
              labelColor: '#555e74',
              valueColor: '#1e222b',
              borderColor: '#c8cdd8',
              borderWidth: 0.4,
              columns: 8,
              gap: 8,
              fields: [
                {
                  key: 'idCliente',
                  prefix: 'Código',
                },
                {
                  key: 'dataCadastro',
                  prefix: 'Data Cadastro',
                  mask: 'date-time' as const,
                },
                {
                  key: 'celular',
                  prefix: 'Celular',
                },
                {
                  key: 'telefone',
                  prefix: 'Telefone',
                  mask: 'phone' as const,
                },
                {
                  key: 'limiteCredito',
                  prefix: 'Limite de Crédito',
                  mask: 'currency' as const,
                  align: 'right' as const,
                },
                {
                  key: 'cnpjCpf',
                  prefix: 'CPF / CNPJ',
                  mask: 'cnpjCpf' as const,
                },
                {
                  key: 'email',
                  prefix: 'E-mail',
                  span: 2,
                },
                {
                  key: 'logradouro',
                  prefix: 'Endereço',
                  span: 3,
                },
                {
                  key: 'bairro',
                  prefix: 'Bairro',
                  span: 2,
                },
                {
                  key: 'cidade',
                  prefix: 'Cidade',
                },
                {
                  key: 'cep',
                  prefix: 'CEP',
                  mask: 'cep' as const,
                },
                {
                  key: 'uf',
                  prefix: 'UF',
                },
              ],
              margin: {
                four: [0, 0, 6, 0] as [number, number, number, number],
              },
            },
          ],
  };

  json._datasets = {
    clientes: dataset,
  };

  const imageBase64 = await getImageBase64FromPath(currLogoRelatorio);
  json._variables = {
    data_geracao: new Date().toLocaleDateString('pf-BR'),
    empresa: companyInfo.nomeCli,
    cnpj: companyInfo.cnpj.length > 11 ? maskCnpj(companyInfo.cnpj) : maskCpf(companyInfo.cnpj),
    filtros_header: filtrosHeader,
    currDate: new Date().toLocaleDateString('pt-BR'),
    logoSistema: imageBase64,
  };

  const bufferArray = await gerarRelatorioPdfV3(json as any);
  return bufferArray;
};

export default handleGenerateClientReport;

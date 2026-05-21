import {
  EntradaNFAgrupadoPor,
  type EntradaNFOrderBy,
} from '../../pages/Relatorios/types/relatorios.types';
import type { ReportV3 } from '../../types/v3.types';
import { getImageBase64FromPath, maskCnpj, maskCpf } from '../../utils/format';
import { gerarRelatorioPdfV3 } from '../../wasm/pdfium_generator';

const handleReportNotaEntrada = async (
  dataset: any,
  agrupadoPor: EntradaNFAgrupadoPor,
  ordenadoPor: EntradaNFOrderBy,
  exibeItens: boolean,
  companyInfo: any,
  currLogoRelatorio: string,
) => {
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
              value: 'Relatório Notas Entrada',

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
          sizes: ['33%', '33%',"33%"],
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
                four: [5,-40,5,5],
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

        ...(exibeItens
          ? {
              items: {
                headerBackgroundColor: '#ffffff',
                textColor: '#404040',
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
                    key: 'descricao',
                    prefix: 'DESCRIÇÃO',
                  },
                  {
                    key: 'ncm',
                    prefix: 'NCM',
                  },
                  {
                    key: 'cfop',
                    prefix: 'CFOP',
                  },
                  {
                    key: 'quantidade',
                    prefix: 'QUANTIDADE',
                    align: 'right',
                    mask: 'number-3',
                    sum: true,
                  },
                  {
                    key: 'vlrUnitario',
                    prefix: 'VALOR UNITÁRIO',
                    align: 'right',
                    mask: 'number',
                    sum: true,
                  },
                  {
                    key: 'vlrDesconto',
                    prefix: 'VALOR DESCONTO',
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
                widths: [50, 'expand', 60, 60, 60, 100, 100, 80],
                indent: 100,
              },
            }
          : {}),
        summaryBox: {
          rows: [
            {
              key: 'baseSt',
              label: 'TOTAL BASE ST',
              mask: 'currency',
            },
            {
              key: 'icmsSt',
              label: 'TOTAL ICMS ST',
              mask: 'currency',
            },
            {
              key: 'ipi',
              label: 'TOTAL IPI',
              mask: 'currency',
            },
            {
              key: 'frete',
              label: 'TOTAL FRETE',
              mask: 'currency',
            },
            {
              key: 'total',
              label: 'TOTAL GERAL',
              mask: 'currency',
              bold: true,
              dividerBefore: true,
            },
          ],
        },
        datasetName: 'notas',
        ...(agrupadoPor !== EntradaNFAgrupadoPor.NENHUM
          ? {
              grouping: {
                groupBy:
                  agrupadoPor === EntradaNFAgrupadoPor.FORNECEDOR
                    ? 'fornecedor'
                    : 'entrada',
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
            key: 'entrada',
            prefix: 'ENTRADA',
            align: 'center',
            mask: 'date',
          },
          {
            key: 'serie',
            prefix: 'SÉRIE',
            align: 'right',
          },
          {
            key: 'baseSt',
            prefix: 'VLR BASE ST',
            align: 'right',
            mask: 'number',
            sum: true,
          },
          {
            key: 'icmsSt',
            prefix: 'ICMS ST',
            align: 'right',
            mask: 'number',
            sum: true,
          },
          {
            key: 'ipi',
            prefix: 'IPI',
            align: 'right',
            mask: 'number',
            sum: true,
          },
          {
            key: 'frete',
            prefix: 'FRETE',
            align: 'right',
            mask: 'number',
            sum: true,
          },
          {
            key: 'total',
            prefix: 'VLR TOTAL',
            align: 'right',
            mask: 'number',
            sum: true,
          },
          {
            key: 'natureza',
            prefix: 'NATUREZA OP',
            align: 'center',
          },
          {
            key: 'chave',
            prefix: 'CHAVE ACESSO',
            align: 'center',
          },
        ],
        widths: [50, 60, 40, 70, 50, 50, 50, 70, 100, 100],
      },
    ],
  };
  json._datasets = {
    notas: dataset,
  };

  const imageBase64 = await getImageBase64FromPath(currLogoRelatorio);
  json._variables = {
    data_geracao: new Date().toLocaleDateString('pf-BR'),
    empresa: companyInfo.nomeCli,
    cnpj:
      companyInfo.cnpj.length > 11
        ? maskCnpj(companyInfo.cnpj)
        : maskCpf(companyInfo.cnpj),

    currDate: new Date().toLocaleDateString('pt-BR'),
    logoSistema: imageBase64,
  };

  const bufferArray = await gerarRelatorioPdfV3(json as any);
  return bufferArray;
};
export default handleReportNotaEntrada;

import type { ReportV3 } from '../../types/v3.types';
import { getImageBase64FromPath, maskCnpj, maskCpf } from '../../utils/format';
import { gerarRelatorioPdfV3 } from '../../wasm/pdfium_generator';

const handleRelatorioNfCfopUf = async (
  dataset: any,
  companyInfo: any,
  currLogoRelatorio: string,
) => {
  const agrupadoDia = dataset.agrupadosPorDia.dados;
  const resumoUf = dataset.resumoPorUF.dados;
  const totaisUf = dataset.resumoPorUF.total;
  const totaisCfop = dataset.resumoPorCFOP.total;
  const resumoCfop = dataset.resumoPorCFOP.dados;
  console.log('Dataset recebido para o relatório de CFOP por UF:', dataset);
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
        datasetName: 'notas',
        summaryBox: {
          rows: [
            { key: 'valorICMS', label: 'TOTAL ICMS', mask: 'currency' },
            { key: 'baseICMS', label: 'TOTAL BASE ICMS', mask: 'currency' },
            { key: 'baseST', label: 'TOTAL BASE ST', mask: 'currency' },
            { key: 'valorST', label: 'TOTAL ST', mask: 'currency' },
            {
              key: 'valorContabil',
              label: 'TOTAL GERAL',
              mask: 'currency',
              bold: true,
              dividerBefore: true,
            },
          ],
          align: 'center',
        },

        tableHeader: [
          { key: 'numero', prefix: 'NÚMERO', align: 'center' },
          { key: 'modelo', prefix: 'MODELO', align: 'center' },
          { key: 'dia', prefix: 'DIA', align: 'center' },
          { key: 'uf', prefix: 'UF', align: 'center' },
          {
            key: 'valorContabil',
            prefix: 'VALOR CONTÁBIL',
            align: 'right',

            sum: true,
          },
          {
            key: 'valorICMS',
            prefix: 'VALOR ICMS',
            align: 'right',
            mask: 'number',
            sum: true,
          },
          {
            key: 'baseICMS',
            prefix: 'BASE ICMS',
            align: 'right',
            mask: 'number',
            sum: true,
          },
          {
            key: 'baseST',
            prefix: 'BASE ST',
            align: 'right',
            mask: 'number',
            sum: true,
          },
          {
            key: 'valorST',
            prefix: 'VALOR ST',
            align: 'right',
            mask: 'number',
            sum: true,
          },
        ],
        widths: [70, 70, 70, 60, 100, 100, 100, 100, 100],
      },
      {
        type: 'table',
        headerBackgroundColor: '#ffffff',
        headerTextColor: '#000000',
        textColor: '#404040',
        datasetName: 'resumoUf',
        zebraBackgroundColor: '#ffffff',
        margin: {
          four: [40, 0, 0, 0],
        },
        tableHeader: [
          { key: 'uf', prefix: 'Resumo por estado', align: 'left' },
        ],
        summaryBox: {
          rows: [
            {
              key: 'valorICMS',
              label: 'TOTAL ICMS',
              mask: 'currency',
              value: '$totalValorICMSUF',
            },
            {
              key: 'baseICMS',
              label: 'TOTAL BASE ICMS',
              mask: 'currency',
              value: '$totalBaseICMSUF',
            },
            {
              key: 'baseST',
              label: 'TOTAL BASE ST',
              mask: 'currency',
              value: '$totalBaseSTUF',
            },
            {
              key: 'valorST',
              label: 'TOTAL ST',
              mask: 'currency',
              value: '$totalValorSTUF',
            },
            {
              key: 'valorContabil',
              label: 'TOTAL GERAL',
              value: '$totalValorContabilResumoUf',
              mask: 'currency',
              bold: true,
              dividerBefore: true,
            },
          ],
          align: 'center',
        },
        widths: ['auto'],
        items: {
          path: 'dados',
          indent: 0,

          tableHeader: [
            { key: 'uf', prefix: 'UF', align: 'center' },
            {
              key: 'valorContabil',
              prefix: 'VALOR CONTÁBIL',
              align: 'left',
              mask: 'number',
              sum: true,
            },
            {
              key: 'valorICMS',
              prefix: 'VALOR ICMS',
              mask: 'number',
              align: 'left',
              sum: true,
            },
            {
              key: 'baseICMS',
              prefix: 'BASE ICMS',
              align: 'left',
              mask: 'number',
              sum: true,
            },
            {
              key: 'baseST',
              prefix: 'BASE ST',
              align: 'left',
              mask: 'number',
              sum: true,
            },
            {
              key: 'valorST',
              prefix: 'VALOR ST',
              align: 'left',
              mask: 'number',
              sum: true,
            },
          ],
          widths: [70, 100, 100, 100, 100, 100],
        },
      },
      {
        type: 'table',
        headerBackgroundColor: '#ffffff',
        headerTextColor: '#000000',
        textColor: '#404040',
        datasetName: 'resumoCfop',
        zebraBackgroundColor: '#ffffff',
        summaryBox: {
          rows: [
            {
              key: 'valorICMS',
              label: 'TOTAL ICMS',
              mask: 'currency',
              value: '$totalValorICMSUF',
            },
            {
              key: 'baseICMS',
              label: 'TOTAL BASE ICMS',
              mask: 'currency',
              value: '$totalBaseICMSCFOP',
            },
            {
              key: 'baseST',
              label: 'TOTAL BASE ST',
              mask: 'currency',
              value: '$totalBaseSTCFOP',
            },
            {
              key: 'valorST',
              label: 'TOTAL ST',
              mask: 'currency',
              value: '$totalValorSTCFOP',
            },
            {
              key: 'valorContabil',
              label: 'TOTAL GERAL',
              value: '$totalValorContabilResumoCFOP',
              mask: 'currency',
              bold: true,
              dividerBefore: true,
            },
          ],
          align: 'center',
        },
        margin: {
          four: [40, 0, 0, 0],
        },
        tableHeader: [{ key: 'uf', prefix: 'Resumo por cfop', align: 'left' }],
        widths: ['auto'],
        items: {
          path: 'dados',
          indent: 0,

          tableHeader: [
            { key: 'cfop', prefix: 'CFOP', align: 'center' },
            {
              key: 'valorContabil',
              prefix: 'VALOR CONTÁBIL',
              align: 'left',
              mask: 'number',
              sum: true,
            },
            {
              key: 'valorICMS',
              prefix: 'VALOR ICMS',
              mask: 'number',
              align: 'left',
              sum: true,
            },
            {
              key: 'baseICMS',
              prefix: 'BASE ICMS',
              align: 'left',
              mask: 'number',
              sum: true,
            },
            {
              key: 'baseST',
              prefix: 'BASE ST',
              align: 'left',
              mask: 'number',
              sum: true,
            },
            {
              key: 'valorST',
              prefix: 'VALOR ST',
              align: 'left',
              mask: 'number',
              sum: true,
            },
          ],
          widths: [70, 100, 100, 100, 100, 100],
        },
      },
    ],
  };
  json._datasets = {
    notas: agrupadoDia,
    resumoUf: resumoUf,
    resumoCfop: resumoCfop,
  };

  const imageBase64 = await getImageBase64FromPath(currLogoRelatorio);
  json._variables = {
    totalValorContabilResumoUf: totaisUf.totalValorContabuil,
    totalBaseICMSUF: totaisUf.totalBaseICMS,
    totalValorICMSUF: totaisUf.totalValorICMS,
    totalBaseSTUF: totaisUf.totalBaseST,
    totalValorSTUF: totaisUf.totalValorST,
    totalValorContabilResumoCFOP: totaisCfop.totalValorContabuil,
    totalBaseICMSCFOP: totaisCfop.totalBaseICMS,
    totalValorICMSCFOP: totaisCfop.totalValorICMS,
    totalBaseSTCFOP: totaisCfop.totalBaseST,
    totalValorSTCFOP: totaisCfop.totalValorST,
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

export default handleRelatorioNfCfopUf;

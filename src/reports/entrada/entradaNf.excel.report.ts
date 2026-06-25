import type { CompanyInfo } from '../../contexts/AppContext';
import { EntradaNFAgrupadoPor } from '../../pages/Relatorios/types/relatorios.types';
import { getImageBase64FromPath } from '../../utils/format';
import { excelEngineGenerate, ExcelV3Align, ExcelV3Mask, type ExcelV3, type ExcelV3Component } from '../../wasm/excel_generator';

const handleGenerateEntradaExcelReport = async (dataset: any, agrupado: EntradaNFAgrupadoPor, exibeItens: boolean, companyInfo: CompanyInfo, primaryColor: string, reportLogo: string) => {
  const base64 = await getImageBase64FromPath(reportLogo);
  // console.log(JSON.stringify(dataset));
  const json: ExcelV3 = {
    config: {
      rowHeight: 20,
      headerBackground: '#404040',
      zebraBackground: '#cbcbcb',
      primaryColor: primaryColor,
    },
    header: {
      title: 'Relatório Entradas NF',
      companyName: `${companyInfo.nomeCli}\n${companyInfo.cnpj}`,
      // filters: [{ key: 'Data Inicial', value: '08/05/2024' }],
    },

    footer: {
      site: companyInfo.site,
    },

    _variables: {
      logoSistema: base64,
    },

    _datasets: {
      ...(agrupado != EntradaNFAgrupadoPor.CFOP_UF_DIA && { clientes: dataset }),
      resumo_uf_dia: dataset?.agrupadosPorDia?.dados ?? [],
      resumo_uf: dataset?.resumoPorUF?.dados ?? [],
      resumo_cfop: dataset?.resumoPorCFOP?.dados ?? [],
    },

    content: [
      ...(agrupado == EntradaNFAgrupadoPor.CFOP_UF_DIA
        ? [
            {
              type: 'table',
              datasetName: 'resumo_uf_dia',
              sheetName: 'Resumo UF Dia',
              tableHeader: [
                { key: 'numero', prefix: 'NÚMERO', cols: [1, 2] },
                { key: 'modelo', prefix: 'MODELO', cols: [3, 3] },
                { key: 'dia', prefix: 'DIA', cols: [4, 4] },
                { key: 'uf', prefix: 'UF', cols: [5, 5] },
                { key: 'valorContabil', prefix: 'VALOR CONTÁBIL', cols: [6, 7], sum: true },
                { key: 'valorICMS', prefix: 'VALOR ICMS', cols: [8, 9], sum: true },
                { key: 'baseICMS', prefix: 'BASE ICMS', cols: [10, 11], sum: true },
                { key: 'baseST', prefix: 'BASE ST', cols: [12, 13], sum: true },
                { key: 'valorST', prefix: 'VALOR ST', cols: [14, 16], sum: true },
              ],
            } as ExcelV3Component,
            {
              type: 'table',
              datasetName: 'resumo_uf',
              sheetName: 'Resumo UF',

              childrens: [
                {
                  path: 'dados',
                  preHeaderPath: 'uf',
                  tableHeader: [
                    { key: 'uf', prefix: 'UF', cols: [1, 1] },
                    { key: 'valorContabil', prefix: 'VALOR CONTÁBIL', cols: [2, 3], sum: true },
                    { key: 'valorICMS', prefix: 'VALOR ICMS', cols: [4, 5], sum: true },
                    { key: 'baseICMS', prefix: 'BASE ICMS', cols: [6, 7], sum: true },
                    { key: 'baseST', prefix: 'VALOR CONTÁBIL', cols: [8, 9], sum: true },
                    { key: 'valorST', prefix: 'VALOR ST', cols: [10, 11], sum: true },
                  ],
                },
              ],
            } as ExcelV3Component,
            {
              type: 'table',
              sheetName: 'Resumo CFOP',
              datasetName: 'resumo_cfop',
              childrens: [
                {
                  path: 'dados',
                  preHeaderPath: 'cfop',
                  tableHeader: [
                    { key: 'cfop', prefix: 'CFOP', cols: [1, 1] },
                    { key: 'valorContabil', prefix: 'VALOR CONTÁBIL', cols: [2, 3], sum: true },
                    { key: 'valorICMS', prefix: 'VALOR ICMS', cols: [4, 5], sum: true },
                    { key: 'baseICMS', prefix: 'BASE ICMS', cols: [6, 7], sum: true },
                    { key: 'baseST', prefix: 'VALOR CONTÁBIL', cols: [8, 9], sum: true },
                    { key: 'valorContabil', prefix: 'VALOR ST', cols: [10, 11], sum: true },
                  ],
                },
              ],
            } as ExcelV3Component,
          ]
        : [
            {
              type: 'table',
              datasetName: 'clientes',
              sheetName: 'Entradas NF',
              ...(agrupado != EntradaNFAgrupadoPor.NENHUM && {
                grouping: {
                  groupBy: agrupado == EntradaNFAgrupadoPor.DATA_ENTRADA ? 'entrada' : 'fornecedor',
                },
              }),
              ...(exibeItens && {
                childrens: [
                  {
                    marginTop: 2,
                    path: 'itens',
                    tableHeader: [
                      {
                        key: 'id',
                        prefix: 'ID',
                        cols: [1, 2],
                      },
                      {
                        key: 'descricao',
                        prefix: 'DESCRIÇÃO',
                        cols: [3, 6],
                      },
                      {
                        key: 'ncm',
                        prefix: 'NCM',
                        cols: [7, 8],
                      },
                      {
                        key: 'cfop',
                        prefix: 'CFOP',
                        cols: [9, 10],
                      },
                      {
                        key: 'quantidade',
                        prefix: 'QUANTIDADE',
                        cols: [11, 12],
                        mask: ExcelV3Mask.Number3,
                        sum: true,
                      },
                      {
                        key: 'vlrUnitario',
                        prefix: 'VALOR UNITÁRIO',
                        align: ExcelV3Align.Right,
                        mask: ExcelV3Mask.Monetary,
                        sum: true,
                        cols: [13, 14],
                      },
                      {
                        key: 'vlrDesconto',
                        prefix: 'VALOR DESCONTO',
                        align: ExcelV3Align.Right,
                        mask: ExcelV3Mask.Monetary,
                        sum: true,
                        cols: [15, 16],
                      },
                      {
                        key: 'vlrTotal',
                        prefix: 'VALOR TOTAL',
                        align: ExcelV3Align.Right,
                        mask: ExcelV3Mask.Monetary,
                        sum: true,
                        cols: [17, 18],
                      },
                    ],
                  },
                ],
              }),

              tableHeader: [
                {
                  key: 'numero',
                  prefix: 'NOTA',
                  cols: [1, 2],
                },
                {
                  key: 'entrada',
                  prefix: 'ENTRADA',
                  mask: ExcelV3Mask.Date,
                  cols: [3, 4],
                },
                {
                  key: 'serie',
                  prefix: 'SÉRIE',
                  cols: [5, 6],
                },
                {
                  key: 'baseSt',
                  prefix: 'VLR BASE ST',
                  align: ExcelV3Align.Right,
                  mask: ExcelV3Mask.Monetary,
                  sum: true,
                  cols: [7, 8],
                },
                {
                  key: 'icmsSt',
                  prefix: 'ICMS ST',
                  align: ExcelV3Align.Right,
                  mask: ExcelV3Mask.Monetary,
                  sum: true,
                  cols: [9, 10],
                },
                {
                  key: 'ipi',
                  prefix: 'IPI',
                  align: ExcelV3Align.Right,
                  mask: ExcelV3Mask.Monetary,
                  sum: true,
                  cols: [11, 12],
                },
                {
                  key: 'frete',
                  prefix: 'FRETE',
                  align: ExcelV3Align.Right,
                  mask: ExcelV3Mask.Monetary,
                  sum: true,
                  cols: [13, 14],
                },
                {
                  key: 'total',
                  prefix: 'VLR TOTAL',
                  align: ExcelV3Align.Right,
                  mask: ExcelV3Mask.Monetary,
                  sum: true,
                  cols: [15, 16],
                },
                {
                  key: 'natureza',
                  prefix: 'NATUREZA OP',
                  cols: [17, 19],
                },
                {
                  key: 'chave',
                  prefix: 'CHAVE ACESSO',
                  cols: [20, 24],
                },
              ],
            } as ExcelV3Component,
          ]),
    ],
  };

  return await excelEngineGenerate(json);
};
export default handleGenerateEntradaExcelReport;

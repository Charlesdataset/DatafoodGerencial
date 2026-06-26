import dayjs from 'dayjs';
import type { CompanyInfo } from '../../contexts/AppContext';
import { NfceAgrupadoPor } from '../../pages/Relatorios/types/relatorios.types';
import { getImageBase64FromPath } from '../../utils/format';
import { excelEngineGenerate, ExcelV3Align, ExcelV3Mask, type ExcelV3 } from '../../wasm/excel_generator';

const handleGenerateNfeExcelReport = async (
  dataset: any,
  agrupadoPor: NfceAgrupadoPor,
  exibeItens: boolean,
  companyInfo: CompanyInfo,
  primaryColor: string,
  reportLogo: string,
  filters?: {
    pesquisa?: string;
    valorInicial?: number | string;
    valorFinal?: number | string;
    ordenadoPor?: string;
    agrupadoPor?: string;
    dataInicial?: string | Date | null;
    dataFinal?: string | Date | null;
    status: string;
  },
) => {
  const base64 = await getImageBase64FromPath(reportLogo);
  const hasFilter = () => {
    return (
      filters &&
      ((filters.pesquisa && filters.pesquisa != '') ||
        (filters.valorInicial && Number(filters.valorInicial) > 0) ||
        (filters.valorFinal && Number(filters.valorFinal) > 0) ||
        (filters.dataInicial && dayjs(filters.dataInicial).isValid()) ||
        (filters.dataFinal && dayjs(filters.dataFinal).isValid()) ||
        (filters.status && filters.status != undefined))
    );
  };
  const currFilter = () => {
    const activeFilters = [];

    if (filters?.pesquisa && filters.pesquisa !== '') {
      activeFilters.push({ key: 'Pesquisa', value: filters.pesquisa });
    }

    if (filters?.valorInicial && Number(filters.valorInicial) > 0) {
      activeFilters.push({ key: 'Valor Inicial', value: `R$ ${Number(filters.valorInicial).toLocaleString('pt-BR')}` });
    }

    if (filters?.valorFinal && Number(filters.valorFinal) > 0) {
      activeFilters.push({ key: 'Valor Final', value: `R$ ${Number(filters.valorFinal).toLocaleString('pt-BR')}` });
    }

    if (filters?.dataInicial && dayjs(filters.dataInicial).isValid()) {
      activeFilters.push({ key: 'Data Inicial', value: dayjs(filters.dataInicial).format('DD/MM/YYYY') });
    }

    if (filters?.dataFinal && dayjs(filters.dataFinal).isValid()) {
      activeFilters.push({ key: 'Data Final', value: dayjs(filters.dataFinal).format('DD/MM/YYYY') });
    }

    if (filters?.status && filters.status !== undefined) {
      activeFilters.push({ key: 'Status', value: filters.status });
    }

    return activeFilters;
  };
  const json: ExcelV3 = {
    config: {
      rowHeight: 20,
      headerBackground: '#404040',
      zebraBackground: '#cbcbcb',
      primaryColor: primaryColor,
    },
    header: {
      title: 'Relatório NFc-e',
      companyName: `${companyInfo.nomeCli}\n${companyInfo.cnpj}`,
      ...(hasFilter() && {
        filters: [...currFilter()],
      }),
    },

    footer: {
      site: companyInfo.site,
    },

    _variables: {
      logoSistema: base64,
    },

    _datasets: {
      clientes: dataset,
    },

    content: [
      {
        type: 'table',
        datasetName: 'clientes',
        sheetName: 'Relatório Nfe',
        ...(agrupadoPor != NfceAgrupadoPor.Nenhum && {
          grouping: {
            groupBy: agrupadoPor == NfceAgrupadoPor.Cliente ? 'cliente' : agrupadoPor == NfceAgrupadoPor.DataEmissao ? 'dataEmissao' : agrupadoPor == NfceAgrupadoPor.DataRecebimento ? 'dataRecebimento' : agrupadoPor == NfceAgrupadoPor.DataSaida ? 'dataSaida' : 'status',
          },
        }),
        ...(exibeItens && {
          childrens: [
            {
              path: 'itens',
              tableHeader: [
                {
                  key: 'id',
                  prefix: 'ID',
                  cols: [1, 1],
                },
                {
                  key: 'produto',
                  prefix: 'PRODUTO',
                  cols: [2, 4],
                },

                {
                  key: 'qtd',
                  prefix: 'QUANTIDADE',
                  align: ExcelV3Align.Right,
                  mask: ExcelV3Mask.Number,
                  sum: true,
                  cols: [5, 6],
                },

                {
                  key: 'valorTotal',
                  prefix: 'VALOR TOTAL',
                  align: ExcelV3Align.Right,
                  mask: ExcelV3Mask.Number,
                  sum: true,
                  cols: [7, 8],
                },
              ],
            },
          ],
        }),
        tableHeader: [
          {
            key: 'numero',
            prefix: 'Nota',
            cols: [1, 2],
          },
          {
            key: 'cliente',
            prefix: 'Cliente',
            cols: [3, 6],
          },
          {
            key: 'status',
            prefix: 'Status',
            align: ExcelV3Align.Center,
            cols: [7, 8],
          },
          {
            key: 'dataEmissao',
            prefix: 'Data Emissão',
            mask: ExcelV3Mask.Date,
            cols: [9, 10],
          },
          {
            key: 'dataSaida',
            prefix: 'Data Saída',
            mask: ExcelV3Mask.Date,
            cols: [11, 12],
          },
          {
            key: 'valorProdutos',
            prefix: 'Valor Produtos',
            mask: ExcelV3Mask.Monetary,
            cols: [13, 14],
          },
          {
            key: 'vlrTotal',
            prefix: 'Valor Total',
            mask: ExcelV3Mask.Monetary,
            cols: [15, 16],
            sum: true,
          },
        ],
      },
    ],
  };

  return await excelEngineGenerate(json);
};
export default handleGenerateNfeExcelReport;

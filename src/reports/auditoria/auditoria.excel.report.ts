import dayjs from 'dayjs';
import type { CompanyInfo } from '../../contexts/AppContext';
import { excelEngineGenerate, ExcelV3Align, ExcelV3Mask, type ExcelV3, type ExcelV3Component } from '../../wasm/excel_generator';
import { AuditoriaAgrupadoPor } from './auditoria.report';

const handleGenerateAuditoriaExcelReport = async (
  dataset: any,
  agrupadoPor: AuditoriaAgrupadoPor,
  exibirDetalhes: boolean,
  companyInfo: CompanyInfo,
  currLogoRelatorio: string,
  primaryColor: string,
  filters?: {
    pesquisa?: string;
    agrupadoPor?: string;
    dataInicial?: string | Date | null;
    dataFinal?: string | Date | null;
    formulario: string | null;
  },
) => {
  console.log(JSON.stringify(filters));
  const getImageBase64FromPath = async (imagePath: string): Promise<string> => {
    const response = await fetch(imagePath);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const getAgrupado: Record<AuditoriaAgrupadoPor, string> = {
    [AuditoriaAgrupadoPor.Colaborador]: 'colaborador',
    [AuditoriaAgrupadoPor.Computador]: 'computador',
    [AuditoriaAgrupadoPor.Data]: 'data',
    [AuditoriaAgrupadoPor.Operacao]: 'operacao',
    [AuditoriaAgrupadoPor.Nenhum]: 'nenhum',
  };

  const hasFilter = () => {
    return (
      filters &&
      ((filters.pesquisa && filters.pesquisa != '') ||
        (filters.agrupadoPor && filters.agrupadoPor != AuditoriaAgrupadoPor.Nenhum) ||
        (filters.dataInicial && dayjs(filters.dataInicial).isValid()) ||
        (filters.dataFinal && dayjs(filters.dataFinal).isValid()) ||
        (filters.formulario && filters.formulario != undefined))
    );
  };
  const currFilter = () => {
    const activeFilters = [];

    if (filters?.pesquisa && filters.pesquisa !== '') {
      activeFilters.push({ key: 'Pesquisa', value: filters.pesquisa });
    }

    if (filters?.agrupadoPor && filters?.agrupadoPor != AuditoriaAgrupadoPor.Nenhum) {
      activeFilters.push({ key: 'Agrupado por', value: agrupadoPor });
    }

    if (filters?.dataInicial && dayjs(filters.dataInicial).isValid()) {
      activeFilters.push({ key: 'Data Inicial', value: dayjs(filters.dataInicial).format('DD/MM/YYYY') });
    }

    if (filters?.dataFinal && dayjs(filters.dataFinal).isValid()) {
      activeFilters.push({ key: 'Data Final', value: dayjs(filters.dataFinal).format('DD/MM/YYYY') });
    }

    if (filters?.formulario && filters.formulario !== undefined) {
      activeFilters.push({ key: 'Formulário', value: filters.formulario });
    }

    return activeFilters;
  };

  const buildDetalhes = (dadosJson: any) => {
    if (!dadosJson || !dadosJson.alterados || typeof dadosJson.alterados !== 'object') {
      return [];
    }

    return Object.entries(dadosJson.alterados)
      .map(([campo, item]: any) => {
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
  const base64 = await getImageBase64FromPath(currLogoRelatorio);

  const json: ExcelV3 = {
    config: {
      rowHeight: 20,
      headerBackground: '#404040',
      zebraBackground: '#cbcbcb',
      primaryColor: primaryColor,
    },
    header: {
      title: 'Relatório Auditoria',
      companyName: `${companyInfo.nomeCli}\n${companyInfo.cnpj}`,
      ...(hasFilter() && {
        filters: [...currFilter()],
      }),
      // filters: [{ key: 'Data Inicial', value: '08/05/2024' }],
    },

    footer: {
      site: companyInfo.site,
    },

    _variables: {
      logoSistema: base64,
    },

    _datasets: {
      clientes: datasetWithColaborador,
    },

    content: [
      {
        type: 'table',
        datasetName: 'clientes',
        sheetName: 'Clientes',
        ...(agrupadoPor != AuditoriaAgrupadoPor.Nenhum
          ? {
              grouping: {
                groupBy: getAgrupado[agrupadoPor],
                groupHeaderMask: agrupadoPor == AuditoriaAgrupadoPor.Data ? ExcelV3Mask.DateTime : 'nenhum',
              },
            }
          : []),
        tableHeader: [
          {
            key: 'idAuditoria',
            prefix: 'Cód.',
            cols: [1, 2],
          },
          {
            key: 'formulario',
            prefix: 'Formulário',
            align: ExcelV3Align.Left,
            headerAlign: ExcelV3Align.Left,
            cols: [3, 8],
          },
          {
            key: 'colaborador',
            prefix: 'Colaborador',
            align: ExcelV3Align.Left,
            cols: [9, 11],
          },
          {
            key: 'operacao',
            prefix: 'Operação',
            cols: [12, 14],
          },
          {
            key: 'computador',
            prefix: 'Computador',
            cols: [15, 16],
          },
          {
            key: 'data',
            prefix: 'Data',
            mask: ExcelV3Mask.DateTime,
            cols: [17, 18],
          },
        ],
        ...(exibirDetalhes && {
          childrens: [
            {
              path: 'itens',
              tableHeader: [
                { key: 'campo', prefix: 'Campo', align: ExcelV3Align.Left, cols: [1, 3] },
                { key: 'antes', prefix: 'Antes', align: ExcelV3Align.Left, cols: [4, 10] },
                { key: 'depois', prefix: 'Depois', align: ExcelV3Align.Left, cols: [11, 18] },
              ],
            },
          ],
        }),
      } as ExcelV3Component,
    ],
  };

  return await excelEngineGenerate(json);
};

export default handleGenerateAuditoriaExcelReport;

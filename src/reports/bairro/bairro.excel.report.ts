import type { CompanyInfo } from '../../contexts/AppContext';
import { getImageBase64FromPath } from '../../utils/format';
import { excelEngineGenerate, type ExcelV3, type ExcelV3Component } from '../../wasm/excel_generator';

const handleGenerateBairroExcelReport = async (dataset: any, companyInfo: CompanyInfo, primaryColor: string, reportLogo: string) => {
  const base64 = await getImageBase64FromPath(reportLogo);

  const json: ExcelV3 = {
    config: {
      rowHeight: 20,
      headerBackground: '#404040',
      zebraBackground: '#cbcbcb',
      primaryColor: primaryColor,
    },
    header: {
      title: 'Relatório Bairros',
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
      bairros: dataset,
    },

    content: [
      {
        type: 'table',
        datasetName: 'bairros',
        tableHeader: [
          {
            key: 'idBairro',
            prefix: 'Código',
            cols: [1, 2],
          },
          {
            key: 'descricao',
            prefix: 'Descrição',
            align: 'left',
            headerAlign: 'left',
            cols: [3, 8],
          },
          {
            key: 'dataCadastro',
            prefix: 'Data Cadastro',
            mask: 'datetime',
            align: 'center',
            cols: [9, 11],
          },
          {
            key: 'pausar',
            prefix: 'Pausar',
            align: 'center',
            cols: [12, 14],
          },
          {
            key: 'taxaEntrega',
            prefix: 'Taxa',
            mask: 'currency',
            align: 'center',
            cols: [15, 16],
          },
        ],

        // summaryBox: {
        //   rows: [
        //     {
        //       key: 'vlrTotal',
        //       label: 'VALOR TOTAL',
        //       mask: ExelV3Mask.Monetary,
        //     },
        //   ],
        // },
      } as ExcelV3Component,
    ],
  };

  return await excelEngineGenerate(json);
};
export default handleGenerateBairroExcelReport;

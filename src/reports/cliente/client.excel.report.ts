import type { CompanyInfo } from '../../contexts/AppContext';
import { getImageBase64FromPath } from '../../utils/format';
import { excelEngineGenerate, type ExcelV3, type ExcelV3Component } from '../../wasm/excel_generator';
import { ClienteAgrupadoPor, ModeloRelatorio } from './client.report';

const handleGenerateClientExcelReport = async (dataset: any, agrupado: ClienteAgrupadoPor, tipo: ModeloRelatorio, companyInfo: CompanyInfo, primaryColor: string, reportLogo: string) => {
  const base64 = await getImageBase64FromPath(reportLogo);

  const json: ExcelV3 = {
    config: {
      rowHeight: 20,
      headerBackground: '#404040',
      zebraBackground: '#cbcbcb',
      primaryColor: primaryColor,
    },
    header: {
      title: 'Relatório Clientes',
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
      clientes: dataset,
    },

    content: [
      {
        type: 'table',
        datasetName: 'clientes',
        sheetName: 'Clientes',
        ...(agrupado != ClienteAgrupadoPor.Nenhum && {
          grouping: {
            groupBy: agrupado == ClienteAgrupadoPor.Bairro ? 'bairro' : 'cidade',
          },
        }),
        ...(tipo == ModeloRelatorio.Simplificado
          ? {
              tableHeader: [
                {
                  key: 'idCliente',
                  prefix: 'Código',
                  cols: [1, 2],
                },
                {
                  key: 'razaoSocial',
                  prefix: 'Nome',
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
                  key: 'celular',
                  prefix: 'Celular',
                  align: 'center',
                  cols: [12, 14],
                },
                {
                  key: 'limiteCredito',
                  prefix: 'Saldo',
                  mask: 'currency',
                  align: 'center',
                  cols: [15, 16],
                },
              ],
            }
          : {
              tableHeader: [
                {
                  key: 'idCliente',
                  prefix: 'Código',
                  cols: [1, 2],
                },
                {
                  key: 'razaoSocial',
                  prefix: 'Nome',
                  align: 'left',
                  headerAlign: 'left',
                  cols: [3, 8],
                },
                {
                  key: 'dataCadastro',
                  prefix: 'Data Cadastro',
                  mask: 'datetime',
                  align: 'center',
                  cols: [9, 10],
                },
                {
                  key: 'celular',
                  prefix: 'Celular',
                  align: 'center',
                  cols: [11, 12],
                },
                {
                  key: 'telefone',
                  prefix: 'Telefone',
                  cols: [13, 14],
                },
                {
                  key: 'limiteCredito',
                  prefix: 'Saldo',
                  mask: 'currency',
                  align: 'center',
                  cols: [15, 16],
                },
                {
                  key: 'cnpjCpf',
                  prefix: 'CPF / CNPJ',
                  mask: 'document' as const,
                  cols: [17, 18],
                },
                {
                  key: 'email',
                  prefix: 'E-mail',
                  cols: [19, 20],
                },
                {
                  key: 'logradouro',
                  prefix: 'Endereço',
                  cols: [21, 22],
                },
                {
                  key: 'bairro',
                  prefix: 'Bairro',
                  cols: [23, 24],
                },
                {
                  key: 'cidade',
                  prefix: 'Cidade',
                  cols: [25, 26],
                },
                {
                  key: 'cep',
                  prefix: 'CEP',
                  mask: 'cep' as const,
                  cols: [27, 28],
                },
                {
                  key: 'uf',
                  prefix: 'UF',
                  cols: [29, 30],
                },
              ],
            }),
      } as ExcelV3Component,
    ],
  };

  return await excelEngineGenerate(json);
};
export default handleGenerateClientExcelReport;

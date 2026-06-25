import type { CompanyInfo } from '../../contexts/AppContext';
import { getImageBase64FromPath } from '../../utils/format';
import { excelEngineGenerate, type ExcelV3, type ExcelV3Component } from '../../wasm/excel_generator';
import { ModeloRelatorio } from '../cliente/client.report';
import { ProdutoAgrupadoPor } from './produt.report';

const handleGenerateProdutoExcelReport = async (dataset: any, agrupadoPor: ProdutoAgrupadoPor, modelo: ModeloRelatorio, companyInfo: CompanyInfo, primaryColor: string, reportLogo: string) => {
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
      produtos: dataset,
    },

    content: [
      {
        type: 'table',
        datasetName: 'produtos',
        ...(agrupadoPor != ProdutoAgrupadoPor.Nenhum
          ? {
              grouping: {
                groupBy: 'ncm',
              },
            }
          : {}),
        ...(modelo == ModeloRelatorio.Simplificado
          ? {
              tableHeader: [
                { key: 'idProduto', prefix: 'Código', cols: [1, 1] },
                { key: 'descricao', prefix: 'Descrição', cols: [2, 6] },
                { key: 'dataCadastro', prefix: 'Data Cadastro', mask: 'datetime' as const, align: 'center' as const, cols: [7, 8] },
                { key: 'cest', prefix: 'Cest', align: 'center', cols: [9, 10] },
                { key: 'custoAtual', prefix: 'Custo Atual', align: 'center', cols: [11, 12] },
                { key: 'ncm', prefix: 'Ncm', align: 'center', cols: [13, 14] },
                { key: 'ean1', prefix: 'Cod. Barra', align: 'center' as const, cols: [15, 18] },
              ],
            }
          : {
              tableHeader: [
                { key: 'idProduto', prefix: 'Código', cols: [1, 1] },
                { key: 'dataCadastro', prefix: 'Data Cadastro', mask: 'date-time' as const, cols: [2, 6] },
                { key: 'precoVenda', prefix: 'Celular', cols: [7, 8] },
                { key: 'precoDelivery', prefix: 'Telefone', cols: [9, 10] },
                { key: 'precoAPartir', prefix: 'Preço Apartir', align: 'right' as const, cols: [11, 12] },
                { key: 'custoAtual', prefix: 'Custo Atual', cols: [13, 14] },
                { key: 'cest', prefix: 'Cest', cols: [15, 16] },
                { key: 'ncm', prefix: 'Ncm', cols: [17, 18] },
                { key: 'qtdeAtual', prefix: 'Qtde. Atual', cols: [19, 20] },
                { key: 'estoqueMin', prefix: 'Estoque mim.', cols: [21, 22] },
                { key: 'estoqueMax', prefix: 'Estoque mix', cols: [23, 24] },
                { key: 'margem', prefix: 'Margem', cols: [25, 26] },
                { key: 'ean1', prefix: 'Cód. barra', span: 2, cols: [27, 29] },
              ],
            }),
      } as ExcelV3Component,
    ],
  };

  return await excelEngineGenerate(json);
};
export default handleGenerateProdutoExcelReport;

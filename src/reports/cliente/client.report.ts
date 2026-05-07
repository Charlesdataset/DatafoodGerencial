import type { CompanyInfo } from "../../contexts/AppContext";
import type { ReportV3 } from "../../types/v3.types";
import { maskCnpj, maskCpf } from "../../utils/format";
import { gerarRelatorioPdfV3 } from "../../wasm/pdfium_generator";




export enum ClienteAgrupadoPor {
  Bairro = 'bairro',
  Cidade = 'cidade',
  Nenhum = 'nenhum'
}
export enum ModeloRelatorio {
  Simplificado = 'simplificado',
  Detalhado = 'detalhado'
}

const handleGenerateClientReport = async (
  dataset: any[],
  agrupadoPor: ClienteAgrupadoPor,
  modelo: ModeloRelatorio,
  companyInfo: CompanyInfo
) => {

  const json: ReportV3 = {
    pageConfiguration: {
      backgroundColor: "#ffffff",
      margin: {
        four: [40, 35, 40, 35],
      },
    },
    header: {
      repeat: false,
      minHeight: 100,
      backgroundColor: "#20435C",
      content: [
        {
          type: "fluidLayout",
          sizes: [420, 150],

          content: [
            {
              type: 'stackLayout',
              content: [
                {
                  type: "text",
                  value: "Relatório de Clientes",

                  fontSize: 20,
                  bold: true,
                  color: "#ffffff",
                  align: "left",
                  margin: {
                    four: [30, 0, 0, 0],
                  },
                },
                {
                  type: "text",
                  value: "/building/ $empresa",

                  fontSize: 12,
                  bold: true,
                  color: "#ffffff",
                  align: "left",
                  margin: {
                    four: [-10, 0, 0, 0],
                  },
                },
              ]
            },

            {
              type: "text",
              value: "'$cnpj'",

              fontSize: 12,
              bold: true,
              color: "#ffffff",
              align: "center",
              margin: {
                four: [30, 0, 0, 0],
              },
            },



          ]
        }
      ],
    },
    footer: {
      repeat: true,
      minHeight: 40,

      border: [1, 0, 0, 0],
      borderColor: "#c0c0c0",
      borderStyle: "solid",
      backgroundColor: "#ffffff",
      content: [
        {
          type: "fluidLayout",
          sizes: ['40%', '52%', '33.33%'],
          gap: 0,
          content: [
            {
              type: "text",
              value: "Gerado em : '$currDate'",

              fontSize: 10,
              color: "#303030",
              align: "left",
              margin: {
                all: 5,
              },
            },
            {
              type: "text",
              value: "www.datasetsistemas.com.br",
              fontSize: 10,
              color: "#303030",
              align: "left",
              margin: {
                all: 5,
              },
            },
            {
              type: "text",
              value: "Página '$page'/'$pages'",
              fontSize: 10,
              color: "#303030",
              align: "right",
              margin: {
                four: [5, 0, 0, 0],
              },
            },
          ],
        },
      ],
    },
    content: [




      {
        ...(agrupadoPor !== ClienteAgrupadoPor.Nenhum && {

          grouping: {
            groupBy: agrupadoPor === ClienteAgrupadoPor.Bairro ? 'bairro' : 'cidade',
          }
        }),

        type: "table",
        datasetName: 'clientes',
        ...(modelo === ModeloRelatorio.Simplificado ? {
          tableHeader: [
            { key: 'idCliente', prefix: 'Código' },
            { key: 'razaoSocial', prefix: 'Nome' },
            { key: 'dataCadastro', prefix: 'Data Cadastro', mask: 'date-time', align: 'center' },
            { key: 'celular', prefix: 'Celular', align: 'center' },
            { key: 'limiteCredito', prefix: 'Saldo', align: 'center' },
          ],
          widths: [60, 'expand', 100, 80, 80, 50],

        } : {
          tableHeader: [
            { key: 'idCliente', prefix: 'Código' },
            { key: 'razaoSocial', prefix: 'Nome' },
            { key: 'dataCadastro', prefix: 'Data Cadastro', mask: 'date-time', align: 'center' },
            { key: 'celular', prefix: 'Celular', align: 'center' },
            { key: 'limiteCredito', prefix: 'Saldo', align: 'center' },
          ],
          widths: [60, 'expand', 100, 80, 80, 50],
        })

      }

    ],
  };

  json._datasets = {
    clientes: dataset,
  };


  json._variables = {
    data_geracao: new Date().toLocaleDateString("pf-BR"),
    empresa: companyInfo.nomeCli,
    cnpj:
      companyInfo.cnpj.length > 11
        ? maskCnpj(companyInfo.cnpj)
        : maskCpf(companyInfo.cnpj),

    currDate: new Date().toLocaleDateString("pt-BR"),
  };

  const bufferArray = await gerarRelatorioPdfV3(json as any);
  return bufferArray;





}

export default handleGenerateClientReport;
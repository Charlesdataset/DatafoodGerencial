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
    content: modelo === ModeloRelatorio.Simplificado
      ? [
          {
            ...(agrupadoPor !== ClienteAgrupadoPor.Nenhum && {
              grouping: {
                groupBy: agrupadoPor === ClienteAgrupadoPor.Bairro ? 'bairro' : 'cidade',
              },
            }),
            type: "table" as const,
            datasetName: 'clientes',
            tableHeader: [
              { key: 'idCliente', prefix: 'Código' },
              { key: 'razaoSocial', prefix: 'Nome' },
              { key: 'dataCadastro', prefix: 'Data Cadastro', mask: 'date-time' as const, align: 'center' as const },
              { key: 'celular', prefix: 'Celular', align: 'center' as const },
              { key: 'limiteCredito', prefix: 'Saldo', mask: 'currency' as const, align: 'center' as const },
            ],
            widths: [60, 'expand', 100, 80, 80],
          },
        ]
      : [
          {
            type: "tableMultiData" as const,
            datasetName: 'clientes',
            titleField: 'razaoSocial',
            titlePrefix: 'Cliente: ',
            titleBackgroundColor: '#20435C',
            titleTextColor: '#ffffff',
            labelBackgroundColor: '#EEF1F6',
            labelColor: '#555e74',
            valueColor: '#1e222b',
            borderColor: '#c8cdd8',
            borderWidth: 0.4,
            columns: 4,
            gap: 8,
            fields: [
              { key: 'idCliente',      prefix: 'Código' },
              { key: 'dataCadastro',   prefix: 'Data Cadastro',   mask: 'date-time' as const },
              { key: 'celular',        prefix: 'Celular' },
              { key: 'limiteCredito',  prefix: 'Limite de Crédito', mask: 'currency' as const, align: 'right' as const },
              // { key: 'cpf',            prefix: 'CPF / CNPJ',       mask: 'cnpjCpf' as const,  span: 2 },
              // { key: 'email',          prefix: 'E-mail',            span: 2 },
              // { key: 'endereco',       prefix: 'Endereço',          span: 2 },
              // { key: 'bairro',         prefix: 'Bairro' },
              // { key: 'cidade',         prefix: 'Cidade' },
              // { key: 'cep',            prefix: 'CEP',               mask: 'cep' as const },
              // { key: 'uf',             prefix: 'UF' },
              // { key: 'telefone',       prefix: 'Telefone',          mask: 'phone' as const },
            ],
            margin: { four: [0, 0, 6, 0] as [number, number, number, number] },
          },
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
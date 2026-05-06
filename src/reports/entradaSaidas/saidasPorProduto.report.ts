import dayjs from "dayjs";
import { SaidaProdAgrupadoPor } from "../../pages/ReportSaidaPorProduto/types/SaidaPorProduto";
import type { ReportV3 } from "../../types/v3.types";
import { maskCnpj, maskCpf } from "../../utils/format";
import { gerarRelatorioPdfV3 } from "../../wasm/pdfium_generator";

export interface ReportSaidaPorProdutoFilter {
  periodoInicial: string;
  periodoFinal: string;
  funcionarios: Array<string>;
  maquinas: Array<string>;
  produtos: Array<string>;
  grupos: Array<string>;
  agruparProdutos: boolean;

  agrupadoPor: SaidaProdAgrupadoPor;
}

const handleReportSaidaPorProduto = async (
  dataset: any,
  companyInfo: any,
  filters: ReportSaidaPorProdutoFilter,
): Promise<Uint8Array<ArrayBufferLike>> => {
 
  const datasetDados = dataset;
  const json: ReportV3 = {
    pageConfiguration: {
      backgroundColor: "#ffffff",
      margin: {
        four: [40, 35, 40, 35],
      },
    },
    header: {
      repeat: false,
      minHeight: 50,

      backgroundColor: "#20435C",
      content: [
        {
          type: "fluidLayout",
          sizes: [440, 100],
          
          content: [
            {
              type: "text",
              value: "Relatório saída por forma de pagamento",

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
              value: "'$cnpj'",

              fontSize: 12,
              bold: true,
              color: "#ffffff",
              align: "center",
              margin: {
                four: [30, 0, 0, 0],
              },
            },
          ],
        },
        {
          type: 'text',
          value:'/building/ $empresa   |    /megaphone/ $evento    |/ticket/ $ticket',
          color: '#ffffff',
          fontSize: 10,
   
          margin: {
            four: [20, 10, 0, 0],
          }
        },
        {
          type: 'text',
          value:'/calendar/ Abertura: $data_abertura /calendar/ Fechamento: $data_fechamento',
          color: '#ffffff',
          fontSize: 10,
   
          margin: {
            four: [5, 0, 0, 0],
          }
        },
        ...(filters.funcionarios.length > 0 || filters.produtos.length > 0 || filters.grupos.length > 0 || filters.maquinas.length > 0
          ? [
            {
              type: 'card',
              backgroundColor: '#ffffff',
              height: 40,
              margin:{
                four: [0, 10, -10, 0], 
              },
              padding: {
                four: [10, 10, 10, 10],
              },
             
              content:[
                ...(filters.funcionarios.length > 0 ?   [{
                    type:'text',
                    value: "/user/ Funcionarios : $funcionarios",
                  }] :[ ] as any)
              ,
              ...(filters.produtos.length > 0 ?   [
                {
                  type:'text',
                  value: "/box/ Produtos : $produtos",
                }
              ] : [] as any)
                ,
                ...(filters.grupos.length > 0 ?   [
                  {
                    type:'text',
                    value: "/box/ Grupos : $grupos",
                  }
                ] : [] as any
                )
                ,
                ...(filters.maquinas.length > 0 ?   [ 
                  {
                    type:'text',
                    value: "/box/ Aparelhos : $maquininhas",
                  }
                ] : [] as any
                )
              ,
              ]
            }
          ] : [] as any),
       
        
       
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
          sizes: ["40%", "52%", "33.33%"],
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
        type: "table",
        headerBackgroundColor: "#21455f",
        ...(filters.agrupadoPor !== SaidaProdAgrupadoPor.NENHUM && {
          grouping: {
            groupBy:
              filters.agrupadoPor === SaidaProdAgrupadoPor.FUNCIONARIO
                ? "funcionario"
                : filters.agrupadoPor === SaidaProdAgrupadoPor.MAQUINA
                  ? "maquina"
                  : filters.agrupadoPor === SaidaProdAgrupadoPor.GRUPO
                    ? "grupo"
                    : "produto",
            gap: 40,
            subtotal: true,
          },
        }),
        ...(filters.agruparProdutos == true
          ? {
              aggregate: ["produto"],
              aggregateSum: ["qtd", "total"],
            }
          : ""),
        ...(filters.agruparProdutos == true
          ? {
              tableHeader: [
                { key: "produto", prefix: "Produto" },

                {
                  key: "qtd",
                  prefix: "Qtde.",
                  align: "center",
                  sum: true,
                },
                {
                  key: "total",
                  prefix: "Total",
                  align: "center",
                  sum: true,
                },
              ],
            }
          : {
              tableHeader: [
                { key: "produto", prefix: "Produto" },
                { key: "funcionario", prefix: "Funcionario" },
                { key: "grupo", prefix: "Grupo" },
                { key: "maquina", prefix: "Máquina" },
                {
                  key: "qtd",
                  prefix: "Qtde.",
                  align: "center",
                  sum: true,
                },
                {
                  key: "total",
                  prefix: "Total",
                  align: "center",
                  sum: true,
                },
              ],
            }),

        ...(filters.agruparProdutos == true
          ? { widths: ["expand", 50, 50] }
          : { widths: ["expand", 100, 100, 80, 50, 50] }),
        datasetName: "saidas",
        summaryBox: {
          rows: [
            { key: "qtd", label: "Quantidade Total" },
            {
              key: "total",
              label: "Valor Total",
              bold: true,
              dividerBefore: true,
              mask: "currency",
            },
          ],
        },

        items: {
          path: "items",

          tableHeader: [
            { key: "produto", prefix: "Produto" },
            { key: "preco", prefix: "preço", align: "center" },
            { key: "qtd", prefix: "Quantidade", align: "center" },
            { key: "vlrTotal", prefix: "Total", align: "center" },
          ],
          widths: ["expand", 80, 80, 80],

          gapTop: 20,
          indent: 80,
          headerBackgroundColor: "#ffffff",
          headerTextColor: "#606060",
          borderStyle: "dashed",
          borderWidth: 2,
          borderColor: "#cbcbcb",
        },
      },
    ],
  };

  json._datasets = {
    saidas: datasetDados,
  };
  console.log(companyInfo);

  json._variables = {
    data_geracao: new Date().toLocaleDateString("pf-BR"),
    empresa: companyInfo.empresaNome,
    cnpj:
      companyInfo.empresaCnpj.lenght > 11
        ? maskCnpj(companyInfo.empresaCnpj)
        : maskCpf(companyInfo.empresaCnpj),
    evento: companyInfo.nomeEvento,
    funcionarios: filters.funcionarios.join(", "),
    maquinas: filters.maquinas.join(", "),
    produtos: filters.produtos.join(", "),
    grupos: filters.grupos.join(", "),

    ticket: companyInfo.ticket,
    data_abertura: dayjs(companyInfo.dataAbertura).format("DD/MM/YYYY HH:mm"),
    data_fechamento: dayjs(companyInfo.dataFechamento).format(
      "DD/MM/YYYY HH:mm",
    ),
    currDate: new Date().toLocaleDateString("pt-BR"),
  };

  const bufferArray = await gerarRelatorioPdfV3(json as any);
  return bufferArray;
};

export default handleReportSaidaPorProduto;

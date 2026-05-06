import dayjs from "dayjs";
import type { ComponentV3, ReportV3 } from "../../types/v3.types";
import { maskCnpj, maskCpf } from "../../utils/format";
import { gerarRelatorioPdfV3 } from "../../wasm/pdfium_generator";
import { createFilterVariables } from "../utils/filterFormatter";

export enum SaidaPorPagamentoAgrupadoPor {
  NENHUM = "",
  FUNCIONARIOS = "usuario",
  MAQUININHAS = "maquininha",
}

export interface ReportSaidaPorPagtoFilter {
  funcionarios: Array<string>;
  maquinas: Array<string>;
  mostrarVendas: boolean;
  mostrarItens: boolean;
  periodoInicial: string;
  periodoFinal: string;
  agrupadoPor: SaidaPorPagamentoAgrupadoPor;
}

const handleReportSaidaPorPagto = async (
  dataset: any,
  companyInfo: any,
  filters: ReportSaidaPorPagtoFilter,
): Promise<Uint8Array<ArrayBufferLike>> => {
  console.log(dataset);
  let table: ComponentV3 = {
    type: "table",
    headerBackgroundColor: "#21455f",
    ...(filters.agrupadoPor !== SaidaPorPagamentoAgrupadoPor.NENHUM
      ? {
        grouping: {
          groupBy: "formaPagamento",
          subGroupBy:
            filters.agrupadoPor === SaidaPorPagamentoAgrupadoPor.FUNCIONARIOS
              ? "funcionario"
              : "maquininha",

          gap: 40,
          subtotal: true,
        },
      }
      : {}),

    tableHeader: [
      { key: "id", prefix: "Identificador" },
      { key: "funcionario", prefix: "Funcionario" },
      { key: "maquininha", prefix: "Máquina" },
      { key: "data", prefix: "Data", mask: "date-time", align: "center" },
      { key: "valor_taxa", prefix: "Valor Taxa", align: "center" },
      { key: "vlr", prefix: "Valor", align: "center", sum: true },
      {
        key: "valor_liquido",
        prefix: "Valor Líquido",
        align: "center",
        sum: true,
      },
    ],
    widths: [80, "expand", 100, 100, 60, 60, 60],
    datasetName: "saidas",
    summaryBox: {
      rows: [
        { key: "vlr", label: "Valor Total", mask: "currency" },
        { key: "valor_taxa", label: "Total Taxas", mask: "currency" },
        {
          key: "valor_liquido",
          label: "Total Líquido",
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
  };
  if (filters.mostrarVendas == false) {
    table = {
      ...table,
      aggregate: ["formaPagamento"],
      aggregateSum: ["vlr", "valor_liquido", "valor_taxa"],
      tableHeader: [
        {
          key: "formaPagamento",
          prefix: "Forma Pagamento",
          pill: true,
          pillCases: [
            { case: "dinheiro", color: "#2e7d32" },
            { case: "cartao_deb", color: "#1565c0" },
            { case: "pix", color: "#6a1b9a" },
            { case: "cartao_credit", color: "#c62828" },
          ],
          align: "left",
          pillWidth: 100,
        },
        { key: "valor_taxa", prefix: "Valor Taxa", align: "center" },
        { key: "vlr", prefix: "Valor", align: "center", sum: true },
        {
          key: "valor_liquido",
          prefix: "Valor Líquido",
          align: "center",
          sum: true,
        },
      ],
      widths: ["expand", 80, 80, 80],
    };
  }
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
          value: '/building/ $empresa   |    /megaphone/ $evento    |/ticket/ $ticket',
          color: '#ffffff',
          fontSize: 10,

          margin: {
            four: [20, 10, 0, 0],
          }
        },
        {
          type: 'text',
          value: '/calendar/ Abertura: $data_abertura /calendar/ Fechamento: $data_fechamento',
          color: '#ffffff',
          fontSize: 10,

          margin: {
            four: [5, 0, 0, 0],
          }
        },
        ...(filters.funcionarios.length > 0 || filters.maquinas.length > 0
          ? [
            {
              type: 'card',
              backgroundColor: '#ffffff',
              height: 40,
              margin: {
                four: [0, 10, -10, 0],
              },
              padding: {
                four: [10, 10, 10, 10],
              },

              content: [
                ...(filters.funcionarios.length > 0 ? [{
                  type: 'text',
                  value: "/user/ Funcionarios : $funcionarios",
                }] : [] as any)
                ,
                ...(filters.maquinas.length > 0 ? [
                  {
                    type: 'text',
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
    content: [table as any],
  };

  json._datasets = {
    saidas: dataset,
  };
  console.log(companyInfo);

  const filterVars = createFilterVariables(filters, companyInfo);

  json._variables = {
    data_geracao: new Date().toLocaleDateString("pt-BR"),
    empresa: companyInfo.empresaNome,
    cnpj:
      companyInfo.empresaCnpj.lenght > 11
        ? maskCnpj(companyInfo.empresaCnpj)
        : maskCpf(companyInfo.empresaCnpj),
    evento: companyInfo.nomeEvento,
    funcionarios: filters.funcionarios.join(", "),
    maquinas: filters.maquinas.join(", "),
    ticket: companyInfo.ticket,
    data_abertura: dayjs(companyInfo.dataAbertura).format("DD/MM/YYYY HH:mm"),
    data_fechamento: dayjs(companyInfo.dataFechamento).format(
      "DD/MM/YYYY HH:mm",
    ),
    currDate: new Date().toLocaleDateString("pt-BR"),
    ...filterVars,
  };

  const bufferArray = await gerarRelatorioPdfV3(json as any);
  return bufferArray;
};

export default handleReportSaidaPorPagto;

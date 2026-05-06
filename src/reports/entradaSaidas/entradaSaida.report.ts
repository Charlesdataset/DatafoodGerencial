



import dayjs from "dayjs";
import type { ReportV3 } from "../../types/v3.types";
import { maskCnpj, maskCpf } from "../../utils/format";
import { gerarRelatorioPdfV3 } from "../../wasm/pdfium_generator";



const handleReportEntradaSaida = async (
  dataset: any,
  companyInfo: any,
): Promise<Uint8Array<ArrayBufferLike>> => {
  console.log(dataset)
  

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
          sizes:[440,100],

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
          gap:0,
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
        grouping:{
            groupBy: 'usuario',
            gap: 20
        },
        type:'table',
        tableHeader: [
            {key:'nomeProduto', prefix:'Produto'},
            {key:'origem', prefix:'Origem', align:'center' },
            {key:'usuario', prefix:'Usuário', align:'center'},
            {key:'data', prefix:'Data',mask: 'date-time', align:'center'},
            {key:'obs', prefix:'Observação',align:'center'},
            {key:'qtd', prefix:'Qtde.', align:'center'},
        ],
        widths:['expand', 60,80,100,100,50],
        datasetName: 'saidas'
      }
    ],
  };

  
  
  json._datasets = {
    saidas: dataset,
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

export default handleReportEntradaSaida;

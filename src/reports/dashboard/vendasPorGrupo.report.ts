import dayjs from "dayjs";
import type { ReportV3 } from "../../types/v3.types";
import { maskCnpj, maskCpf } from "../../utils/format";
import { gerarRelatorioPdfV3 } from "../../wasm/pdfium_generator";

const handleReportVendasPorGrupo = async (
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
              value: "Relatório vendas por grupo",
              
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
        type: "horizontalStack",
        margin:{four: [0,0,20,40]},
        content: [
          {
            type: 'chart',
            topCount: 5,
            header: {value: "Top 5 mais venderam (R$)", color: "#20435C", fontSize:12,},
            keyGroup: 'title',
            keyPresent: 'title',
            chartModel:'candles',
            dataset: 'grupos',
            keySum: 'price',
            width: 200,
            align:'left'
          },
          {
            type: 'chart',
            topCount: 5,
            header: {value: "Top 5 mais venderam (Qtd)", color: "#20435C", fontSize:12,},
            keyGroup: 'title',
            keyPresent: 'title',
            chartModel:'candles',
            dataset: 'grupos',
            keySum: 'unit',
            width: 200,
            align:'left'
          }
        ]
      },
      
      {
        grandTotal:true,
        margin:{four: [40,0,0,0]},
        type: 'table',
        datasetName: "grupos",
       
        preHeader:{ variable:"Vendas por grupo", color: "#20435C",fontSize: 12},
        tableHeader: [
          { key: "id", prefix: 'Código', align:'center'}, 
          {key: 'title', prefix: "Descrição"},
         
          {key: "unit", prefix: "Qtd", align:'center'},
           {key: "price", prefix:"Valor", align:'center', sum: true},
          ],
           
        widths:[80, 'expand','auto',80],
        headerBackgroundColor: '#21455f'

      }

    ],
  };

  json._datasets = {
    grupos: dataset,
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

export default handleReportVendasPorGrupo;

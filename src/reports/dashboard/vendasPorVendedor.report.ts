import dayjs from "dayjs";
import type { ReportV3 } from "../../types/v3.types";
import { maskCnpj, maskCpf } from "../../utils/format";
import { gerarRelatorioPdfV3 } from "../../wasm/pdfium_generator";

const handleReportVendasPorVendedor = async (
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
               value: "Relatório vendas por vendedor",
               
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
         margin:{four: [40,0,40,40]},
         content: [
           {
             type: 'chart',
             topCount: 5,
             header: {value: "Top 5 vendedores (R$)", color: "#20435C", fontSize:12,},
             keyGroup: 'nomeVendedor',
             keyPresent: 'nomeVendedor',
             chartModel:'candles',
             
             dataset: 'vendedores',
             keySum: 'receita_total',
             width: 200,
             align:'left'
           },
           {
             type: 'chart',
             topCount: 5,
             header: {value: "Top 5 vendedores (Qtd)", color: "#20435C", fontSize:12,},
             keyGroup: 'nomeVendedor',
             keyPresent: 'nomeVendedor',
             chartModel:'candles',
             
             dataset: 'vendedores',
             keySum: 'qtd_vendas',
             width: 200,
             align:'left'
           }
         ]
       },
       {
         type: "horizontalStack",
         margin:{four: [40,0,40,0]},
         content: [
           {
             type: 'chart',
             topCount: 5,
             header: {value: "Top 5 mais venderam (%) vz (R$)", color: "#20435C", fontSize:12,},
             keyGroup: 'nomeVendedor',
             keyPresent: 'nomeVendedor',
             chartModel:'pie',
             
             dataset: 'vendedores',
             keySum: 'receita_total',
             width: 200,
             align:'left'
           },
           {
             type: 'chart',
             topCount: 5,
             header: {value: "Top 5 mais venderam (%) vz (Qtd)", color: "#20435C", fontSize:12,},
             keyGroup: 'nomeVendedor',
             keyPresent: 'nomeVendedor',
             chartModel:'pie',
             
             dataset: 'vendedores',
             keySum: 'qtd_vendas',
             width: 200,
             align:'left'
           }
         ]
       },
       {
         items: {
         
           path:'vendas',
           tableHeader:[{key: 'nome', prefix:"Produto"}, {key: 'quantidade', prefix: 'Quantidade'},{key: 'preco', prefix: 'Total'}],
           widths:['expand', 80,80],
           indent: 80,
           headerBackgroundColor: '#ffffff',
           borderStyle:'solid',
           borderColor:'#20435C',
           headerTextColor: '#20435C'
           
         },
         preHeader: {variable: 'Vendas por vendedor', color: "#20435C",fontSize: 12,},
         type: 'table',
         
         grandTotal:true,
         datasetName: "vendedores",
         tableHeader: [
          
           {key: 'nomeVendedor', prefix: "Vendedor"},
           {key:'qtd_vendas', prefix: "Quantidade"},
           {key: "receita_total", prefix: "Receita total", align:'center', mask: 'currency', sum: true},
           
           ],
            
         widths:[80, 'expand',80],
         headerBackgroundColor: '#21455f'
 
       },
     
 
     ],
   };
 
   json._datasets = {
     vendedores: dataset,
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

export default handleReportVendasPorVendedor;

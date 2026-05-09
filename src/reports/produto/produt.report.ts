import type { CompanyInfo } from "../../contexts/AppContext";
import type { ReportV3 } from "../../types/v3.types";
import { maskCnpj, maskCpf } from "../../utils/format";
import { gerarRelatorioPdfV3 } from "../../wasm/pdfium_generator";
import { ModeloRelatorio } from "../cliente/client.report";




export enum ProdutoAgrupadoPor {
    NCM = 'ncm',
    Nenhum = 'nenhum'
}


const handleGenerateProductReport = async (
    dataset: any[],
    agrupadoPor: ProdutoAgrupadoPor,
    modelo: ModeloRelatorio,
    companyInfo: CompanyInfo,
    currLogoRelatorio: string
) => {

    const getImageBase64FromPath = async (imagePath: string): Promise<string> => {
        const response = await fetch(imagePath);
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };



    const json: ReportV3 = {
        pageConfiguration: {
            backgroundColor: "#ffffff",
            margin: {
                four: [40, 35, 40, 35],
            },
            orientation: modelo === ModeloRelatorio.Detalhado ? 'landscape' : 'portrait',
        },
        header: {
            repeat: false,
            height: 60,
            backgroundColor: "#ffffff",
            content: [
                {
                    type: "fluidLayout",
                    sizes: ['25%', '50%', '25%'],

                    content: [
                        {
                            type: "image-box" as const,
                            variable: 'logoSistema',
                            width: 120,
                            height: 40,


                        },
                        {
                            type: "text",
                            value: "Relatório Produtos",

                            fontSize: 20,
                            bold: true,
                            color: "#000",
                            align: "left",
                            margin: {
                                four: [30, 0, 0, 50],
                            },
                        },
                        {
                            type: "text",
                            value: "'$cnpj'  '$empresa'",

                            fontSize: 8,

                            color: "#000",
                            align: "left",
                            margin: {
                                four: [25, 0, 0, 50],
                            },
                        }

                    ],
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
                    ...(agrupadoPor !== ProdutoAgrupadoPor.Nenhum && {
                        grouping: {
                            groupBy: 'ncm',
                        },
                    }),
                    headerBackgroundColor: '#404040',

                    type: "table" as const,
                    datasetName: 'produtos',
                    tableHeader: [
                        { key: 'idProduto', prefix: 'Código' },
                        { key: 'descricao', prefix: 'Descrição' },
                        { key: 'dataCadastro', prefix: 'Data Cadastro', mask: 'date-time' as const, align: 'center' as const },
                        { key: 'cest', prefix: 'Cest', align: 'center' },
                        { key: 'custoAtual', prefix: 'Custo Atual', align: 'center' },
                        { key: 'ncm', prefix: 'Ncm', align: 'center' },
                        { key: 'ean1', prefix: 'Cod. Barra', align: 'center' as const },
                    ],
                    widths: [60, 'expand', 100, 80, 80],
                },
            ]
            : [
                {
                    ...(agrupadoPor !== ProdutoAgrupadoPor.Nenhum && {
                        grouping: {
                            groupHeaderBackgroundColor: '#ffffff',
                            groupHeaderTextColor: '#000000',
                            groupBy: 'ncm'
                        },
                    }),
                    type: "tableMultiData" as const,
                    datasetName: 'produtos',
                    titleField: 'descricao',
                    titlePrefix: 'Produto: ',
                    titleBackgroundColor: '#404040',
                    titleTextColor: '#ffffff',
                    labelBackgroundColor: '#EEF1F6',
                    labelColor: '#555e74',
                    valueColor: '#1e222b',
                    borderColor: '#c8cdd8',
                    borderWidth: 0.4,
                    columns: 7,
                    gap: 8,
                    fields: [
                        { key: 'idProduto', prefix: 'Código' },
                        { key: 'dataCadastro', prefix: 'Data Cadastro', mask: 'date-time' as const },
                        { key: 'precoVenda', prefix: 'Celular' },
                        { key: 'precoDelivery', prefix: 'Telefone', },
                        { key: 'precoAPartir', prefix: 'Preço Apartir', align: 'right' as const },
                        { key: 'custoAtual', prefix: 'Custo Atual', },
                        { key: 'cest', prefix: 'Cest', },
                        { key: 'ncm', prefix: 'Ncm', },
                        { key: 'qtdeAtual', prefix: 'Qtde. Atual' },
                        { key: 'estoqueMin', prefix: 'Estoque mim.' },
                        { key: 'estoqueMax', prefix: 'Estoque mix', },
                        { key: 'margem', prefix: 'Margem' },
                        { key: 'ean1', prefix: 'Cód. barra', span: 2 },
                    ],
                    margin: { four: [0, 0, 6, 0] as [number, number, number, number] },
                },
            ],
    };

    json._datasets = {
        produtos: dataset,
    };


    const imageBase64 = await getImageBase64FromPath(currLogoRelatorio);
    json._variables = {
        data_geracao: new Date().toLocaleDateString("pf-BR"),
        empresa: companyInfo.nomeCli,
        cnpj:
            companyInfo.cnpj.length > 11
                ? maskCnpj(companyInfo.cnpj)
                : maskCpf(companyInfo.cnpj),

        currDate: new Date().toLocaleDateString("pt-BR"),
        logoSistema: imageBase64
    };

    const bufferArray = await gerarRelatorioPdfV3(json as any);
    return bufferArray;





}

export default handleGenerateProductReport;
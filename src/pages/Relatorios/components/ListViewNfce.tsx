import {
    faBox,
    faCancel,
    faDollar,
    faFileExcel,
    faFilePdf,
    faPrint,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type React from "react";
import { useEffect, useState } from "react";

import Card from "../../../components/Card/Card";
import type { ExtendedColumnDef } from "../../../components/DataGrid/DataGrid";
import DataGridServerSide from "../../../components/DataGrid/DataGridServerSide";
import { DatePicker } from "../../../components/DatePicker/DatePicker";
import { FormButton } from "../../../components/Inputs/Button/FormButton";
import Select from "../../../components/Inputs/Select/Select";
import TextBox from "../../../components/Inputs/TextBox/TextBox";
import { TextSearch } from "../../../components/Inputs/TextSearch/TextSearch";
import Fluid from "../../../components/Layout/Fluid";

import { toast } from "react-toastify";
import { Flex } from "../../../components/Layout";
import { Modal } from "../../../components/Modal";
import { PdfiumViewer } from "../../../components/PdfiumViewer";
import Switch from "../../../components/Switch/Switch";
import { useApp } from "../../../contexts/AppContext";
import handleReportNfce from "../../../reports/nfce/nfce.report";
import { api } from "../../../services/api";
import type { TableHeaderDef } from "../../../types/v3.types";
import { EntradaNFAgrupadoPor, NfceAgrupadoPor } from "../types/relatorios.types";
import { InfoCard } from "./InfoCard";

interface NfceItem {
    id: number;
    produto: string;
    qtd: number;
    valorTotal: number;
}

interface Nfce {
    id: number;
    numero: number;
    vlrTotal: number;
    cliente: string;
    status: string;
    dataEmissao: Date;
    dataSaida: Date;
    valorProdutos: number;
    xmlAutorizacao: string;
    itens: Array<NfceItem>;
}

interface NfceTotais {
    totalRows: number,
    totalGeral: number,
    totalProdutos: number
}

const ListViewNfce: React.FC = () => {
    const { dataInicial, dataFinal, companyInfo, currLogoRelatorio } = useApp();
    const [textSearch, setTextSearch] = useState("")
    const [nfceReport, setNfceReport] = useState([]);
    const [nfcePayload, setNfcePayload] = useState(null)
    const [data, setData] = useState<Array<Nfce>>([]);

    const [loading, setLoading] = useState(false);

    const [limit, setLimit] = useState(10);
    const [offset, setOffset] = useState(0);

    const [totais, setTotais] = useState<NfceTotais>(null);
    const [exibirItens, setExibirItens] = useState(false);
    const [showPreviewPdf, setShowPreviewPdf] = useState(false);
    const [url, setUrl] = useState<string | null>(null);
    const [modalReportShow, setModalReportShow] = useState(false);
    const [search, setSearch] = useState("");
    const [agrupadoPor, setAgrupadoPor] = useState<NfceAgrupadoPor>(NfceAgrupadoPor.Nenhum)
    const [status, setStatus] = useState("");

    const [valorInicial, setValorInicial] = useState("");
    const [valorFinal, setValorFinal] = useState("");

    const [saidaInicial, setSaidaInicial] = useState<Date | undefined>();
    const [saidaFinal, setSaidaFinal] = useState<Date | undefined>();

    const fetchNfces = async () => {
        try {
            setLoading(true);

            const res = await api.get("nfce", {
                params: {
                    limit: Number(limit),
                    offset: Number(offset),

                    textSerach: search || undefined,

                    status: status || undefined,

                    valorInicial:
                        valorInicial !== ""
                            ? Number(valorInicial)
                            : undefined,

                    valorFinal:
                        valorFinal !== ""
                            ? Number(valorFinal)
                            : undefined,

                    saidaInicial:
                        saidaInicial?.toISOString(),

                    saidaFinal:
                        saidaFinal?.toISOString(),

                    exibirItens: false,
                },
            });

            if (res?.status === 200) {
                setData(res.data);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error(error);

            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTotais = async () => {
        const res = await api.get('nfce/totais');
        if (res?.status === 200) {
            setTotais(res.data)
        }
    }
    useEffect(() => {
        fetchNfces();
        fetchTotais()
    }, [limit, offset]);

    const handleImprimirNfce = async (xml: string) => {



    }

    const handleGeneratePdf = async () => {
        const res = await api.get("nfce", {
            params: {
                limit: Number(limit),
                offset: Number(offset),

                textSerach: search || undefined,

                status: status || undefined,

                valorInicial:
                    valorInicial !== ""
                        ? Number(valorInicial)
                        : undefined,

                valorFinal:
                    valorFinal !== ""
                        ? Number(valorFinal)
                        : undefined,

                saidaInicial:
                    saidaInicial?.toISOString(),

                saidaFinal:
                    saidaFinal?.toISOString(),

                exibirItens: false,
            },
        });
        if (res?.status == 200) {
            const nfces = res.data;
            setNfceReport(nfces);
            if (!nfces) {
                toast.info("Não foi possível encontrar dados para os filtros solicitados!")
                return;
            }
            const bytes = await handleReportNfce(nfces, agrupadoPor, exibirItens, companyInfo, currLogoRelatorio, {
                pesquisa: textSearch,
                valorInicial,
                valorFinal,
                agrupadoPor,
                dataInicial,
                dataFinal,
            });
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setUrl(url);
            setShowPreviewPdf(true);

        }
        else {
            toast.info("Não foi possível encontrar dados para os filtros solicitados!")
        }
    }
    const handleGenerateExcel = () => {

    }

    const columns: ExtendedColumnDef<Nfce>[] = [
        {
            accessorKey: "numero",
            header: "Nº Nota",
            size: 80,
            textAlign: 'center'
        },

        {
            accessorKey: "id",
            header: "Cód.",
            textAlign: 'center',
            width: 80,

        },
        {
            accessorKey: 'cliente',
            header: 'Cliente',
            width: 'auto',
            textAlign: 'left',
            cell: (info) => {
                const { original } = info.row;

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{original.cliente}</span>

                        {/* Botão aparece só se tiver XML autorizado */}
                        {original.xmlAutorizacao && (
                            <button
                                onClick={() => handleImprimirNfce(original.xmlAutorizacao)}
                                style={{
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px'
                                }}
                            >
                                🖨️ Imprimir
                            </button>
                        )}
                    </div>
                );
            }
        },
        {
            accessorKey: 'status',
            header: 'Status',
            size: 120,
            textAlign: 'center',
            badge: (value) => {
                return { label: `${value}`, color: 'green' }
            }
        },
        {
            accessorKey: 'dataEmissao',
            header: 'Emissão',
            width: 120,
            mask: 'date',
            textAlign: 'center'
        },
        {
            accessorKey: 'dataSaida',
            header: 'Saída',
            width: 120,
            mask: 'date',
            textAlign: 'center'
        },
        {
            accessorKey: "valorProdutos",
            header: "Valor Produtos",
            width: 120,
            textAlign: 'center',
            mask: 'monetary-clear'
        },
        {
            accessorKey: "vlrTotal",
            header: "Valor Total",
            width: 120,
            textAlign: 'center',
            mask: 'monetary-clear'
        },
    ];



    return (
        <>
            <Modal isOpen={modalReportShow} onClose={() => { }} size="md">
                <Modal.Header onClose={() => {
                    setModalReportShow(false)
                }}>
                    <Flex>
                        <FontAwesomeIcon icon={faPrint} className="mr-2" />
                        Visualização de impressão

                    </Flex>
                </Modal.Header>
                <Modal.Body>
                    <Fluid xs={[100, 100]}>
                        <Select label="Agrupado por" value={agrupadoPor} options={[
                            { label: 'Nenhum', value: EntradaNFAgrupadoPor.NENHUM },
                            { label: 'Fornecedor', value: EntradaNFAgrupadoPor.FORNECEDOR },
                            { label: 'Data de entrada', value: EntradaNFAgrupadoPor.DATA_ENTRADA },
                            { label: 'CFOP UF DIA', value: EntradaNFAgrupadoPor.CFOP_UF_DIA }
                        ]} onChange={(e) => {
                            setAgrupadoPor(e as NfceAgrupadoPor)
                        }} />


                        <Switch label="Exibir itens" checked={exibirItens}

                            onChange={(e) => {
                                setExibirItens(e)
                            }} />

                    </Fluid>
                </Modal.Body>
                <Modal.Footer>
                    <Fluid
                        xs={['expand']}
                    >
                        <FormButton variant="outline-secondary" className="justify-content-center">
                            <Flex wrap="nowrap">
                                <FontAwesomeIcon icon={faCancel} />
                                Cancelar
                            </Flex>
                        </FormButton>
                        <FormButton className="justify-content-center" style={{ background: '#217145' }} onClick={handleGenerateExcel}>
                            <Flex wrap="nowrap">
                                <FontAwesomeIcon icon={faFileExcel} />
                                Gerar Excel
                            </Flex>
                        </FormButton>
                        <FormButton className="justify-content-center " style={{ background: '#C50606' }} onClick={() => {
                            setModalReportShow(false);
                            handleGeneratePdf();
                        }}>
                            <Flex wrap="nowrap">
                                <FontAwesomeIcon icon={faFilePdf} />
                                Gerar PDF
                            </Flex>
                        </FormButton>
                    </Fluid>
                </Modal.Footer>
            </Modal>

            <Card>
                <Card.Body>
                    <Fluid
                        xs={[30, 10, 12, 12, 15, 15, 6]}
                    >
                        <TextSearch
                            placeholder="Cliente..."
                            value={search}
                            onChange={(e: any) => {
                                setSearch(e.target.value);
                            }}
                        />

                        <Select
                            value={status}
                            options={[
                                {
                                    label: "Autorizada",
                                    value: "AUTORIZADA",
                                },
                                {
                                    label: "Cancelada",
                                    value: "CANCELADA",
                                },
                                {
                                    label: "Pendente",
                                    value: "PENDENTE",
                                },
                            ]}
                            onChange={(e: any) => {
                                setStatus(e.target.value);
                            }}
                            placeholder="Status"
                        />

                        <TextBox
                            isFormField={false}
                            placeholder="Valor Inicial"
                            value={valorInicial}
                            onChange={(e: any) => {
                                setValorInicial(e.target.value);
                            }}
                        />

                        <TextBox
                            isFormField={false}
                            placeholder="Valor Final"
                            value={valorFinal}
                            onChange={(e: any) => {
                                setValorFinal(e.target.value);
                            }}
                        />

                        <DatePicker
                            placeholder="Saída Inicial"
                            value={saidaInicial}
                            isFormField={false}
                            onChange={(value: any) => {
                                setSaidaInicial(value);
                            }}
                        />

                        <DatePicker
                            isFormField={false}
                            placeholder="Saída Final"
                            value={saidaFinal}
                            onChange={(value: any) => {
                                setSaidaFinal(value);
                            }}
                        />

                        <FormButton
                            className="justify-content-center"
                            onClick={fetchNfces}
                            disabled={loading}
                        >
                            <FontAwesomeIcon icon={faPrint} />
                        </FormButton>
                    </Fluid>
                </Card.Body>
            </Card>

            <DataGridServerSide
                className="mt-4"
                columns={columns}
                data={data}
                limit={limit}
                offset={offset}
                totalRows={totais?.totalRows}
                loading={loading}
                showPagination
                offsets={80}
                autoPageSizeOnDesktop
                onPaginationChange={(newLimit, newOffset) => {
                    setLimit(newLimit);
                    setOffset(newOffset);
                }}
            />

            <Fluid
                className="mt-4"
                xs={[50, 50]}
            >
                <InfoCard
                    title="Total Produtos"
                    value={totais?.totalProdutos}
                    icone={faBox}
                    accent="rgb(18, 135, 182)"
                    accentPill="rgba(18, 135, 182, 0.2)"
                />

                <InfoCard
                    title="Total Geral"
                    value={totais?.totalGeral}
                    icone={faDollar}
                    accent="rgb(35, 160, 77)"
                    accentPill="rgba(35, 160, 77, 0.2)"
                />
            </Fluid>

            {showPreviewPdf && url && (
                <PdfiumViewer
                    pdfUrl={url}
                    filename="relatorio_notas_entrada"
                    excelDataset={nfceReport.length > 0 ? (() => {
                        const rawData = notasReportPayload && agrupadoPor == EntradaNFAgrupadoPor.CFOP_UF_DIA
                            ? notasReportPayload.agrupadosPorDia?.dados ?? []
                            : notasReport as any[];
                        const { data: excelData, groupBy, groupPrefix } = buildNotaEntradaExcelPayload(
                            rawData,
                            agrupadoPor,
                            exibirItens,
                            agrupadoPor == EntradaNFAgrupadoPor.CFOP_UF_DIA
                                ? {
                                    resumoPorUF: notasReportPayload?.resumoPorUF?.dados ?? [],
                                    resumoPorCFOP: notasReportPayload?.resumoPorCFOP?.dados ?? [],
                                    totaisUf: notasReportPayload?.resumoPorUF?.total,
                                    totaisCfop: notasReportPayload?.resumoPorCFOP?.total,
                                    totalDia: notasReportPayload?.agrupadosPorDia?.total,
                                }
                                : undefined,
                        );
                        const columns: TableHeaderDef[] = agrupadoPor === EntradaNFAgrupadoPor.CFOP_UF_DIA
                            ? [
                                { key: 'dia', prefix: 'Dia', align: 'center' },
                                { key: 'uf', prefix: 'UF', align: 'center' },
                                { key: 'modelo', prefix: 'Modelo', align: 'center' },
                                { key: 'cfop', prefix: 'CFOP', align: 'center' },
                                { key: 'numero', prefix: 'Número', align: 'center' },
                                { key: 'aliquota', prefix: 'Alíquota', mask: 'number', align: 'right' },
                                { key: 'valorContabil', prefix: 'Valor Contábil', mask: 'currency', align: 'right' },
                                { key: 'baseICMS', prefix: 'Base ICMS', mask: 'currency', align: 'right' },
                                { key: 'valorICMS', prefix: 'Valor ICMS', mask: 'currency', align: 'right' },
                                { key: 'baseST', prefix: 'Base ST', mask: 'currency', align: 'right' },
                                { key: 'valorST', prefix: 'Valor ST', mask: 'currency', align: 'right' },
                            ]
                            : [
                                { key: 'numero', prefix: 'NF', align: 'center' },
                                { key: 'entrada', prefix: 'Entrada', mask: 'date', align: 'center' },
                                { key: 'fornecedor', prefix: 'Fornecedor' },
                                { key: 'serie', prefix: 'Série', align: 'center' },
                                { key: 'baseSt', prefix: 'Base ST', mask: 'currency', align: 'right' },
                                { key: 'icmsSt', prefix: 'ICMS ST', mask: 'currency', align: 'right' },
                                { key: 'ipi', prefix: 'IPI', mask: 'currency', align: 'right' },
                                { key: 'frete', prefix: 'Frete', mask: 'currency', align: 'right' },
                                { key: 'vlrProdutos', prefix: 'Valor Produtos', mask: 'currency', align: 'right' },
                                { key: 'vlrTotal', prefix: 'Valor Total', mask: 'currency', align: 'right' },
                                { key: 'natureza', prefix: 'Natureza' },
                                { key: 'chave', prefix: 'Chave Acesso' },
                            ];
                        return {
                            data: excelData,
                            columns,
                            fileName: agrupadoPor === EntradaNFAgrupadoPor.CFOP_UF_DIA ? 'notas_entrada_cfop_uf' : 'notas_entrada',
                            sheetName: agrupadoPor === EntradaNFAgrupadoPor.CFOP_UF_DIA ? 'CFOP UF Dia' : 'Notas Entrada',
                            logo: currLogoRelatorio,
                            title: agrupadoPor === EntradaNFAgrupadoPor.CFOP_UF_DIA ? 'Relatório Notas Entrada (CFOP UF Dia)' : 'Relatório Notas Entrada',
                            subtitle: `${companyInfo?.cnpj ? (companyInfo.cnpj.length > 11 ? companyInfo.cnpj : companyInfo.cnpj) : ''} ${companyInfo?.nomeCli ?? ''}`.trim(),
                            headerBackgroundColor: '#404040',
                            groupBy,
                            groupPrefix,
                        };
                    })() : undefined}
                    onClose={() => {
                        setShowPreviewPdf(false)
                    }}
                />
            )}
        </>
    );
};

export default ListViewNfce;
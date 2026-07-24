import { faBox, faCancel, faDollar, faFileExcel, faFilePdf, faHandHoldingDollar, faPrint } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Card from "../../../components/Card/Card";
import type { ExtendedColumnDef } from "../../../components/DataGrid/DataGrid";
import DataGridServerSide from "../../../components/DataGrid/DataGridServerSide";
import { FormButton } from "../../../components/Inputs/Button/FormButton";
import Select from "../../../components/Inputs/Select/Select";
import TextBox from "../../../components/Inputs/TextBox/TextBox";
import { TextSearch } from "../../../components/Inputs/TextSearch/TextSearch";
import { Flex } from "../../../components/Layout";
import Fluid from "../../../components/Layout/Fluid";
import { Modal } from "../../../components/Modal";
import { PdfiumViewer } from "../../../components/PdfiumViewer";
import Switch from "../../../components/Switch/Switch";
import { useApp } from "../../../contexts/AppContext";
import handleReportNotaEntrada from "../../../reports/entrada/entadaNF.report";
import handleGenerateEntradaExcelReport from "../../../reports/entrada/entradaNf.excel.report";
import handleRelatorioNfCfopUf from "../../../reports/entrada/entradaNf_cfopUf.report";
import { api } from "../../../services/api";
import { EntradaNFAgrupadoPor, EntradaNFOrderBy, type EntradaNfTotais } from "../types/relatorios.types";
import { InfoCard } from "./InfoCard";


export const ListViewNotaEntreda = () => {

    const [valorInicial, setValorInicial] = useState<number | undefined>(undefined);
    const [valorFinal, setValorFinal] = useState<number | undefined>(undefined);
    const [ordenadoPor, setOrdenadoPor] = useState<EntradaNFOrderBy>(null);
    const [textSearch, setTextSearch] = useState("");
    const [notas, setNotas] = useState<any[]>([]);
    const [totais, setTotais] = useState<EntradaNfTotais>();
    const [notasReport, setNotasReport] = useState<any[]>([]);
    const [notasReportPayload, setNotasReportPayload] = useState<any>(null);
    const [url, setUrl] = useState<string | null>(null);
    const [showPreviewPdf, setShowPreviewPdf] = useState(false);
    const [totalRows, setTotalRows] = useState(10);
    const [limit, setLimit] = useState(10);
    const [offset, setOffset] = useState(0);
    const [exibirItens, setExibirItens] = useState(false);
    const [modalReportShow, setModalReportShow] = useState(false);
    const [agrupadoPor, setAgrupadoPor] = useState<EntradaNFAgrupadoPor>(EntradaNFAgrupadoPor.NENHUM)
    const ROW_HEIGHT = 42;
    const { dataInicial, dataFinal, companyInfo, currLogoRelatorio, primaryColor } = useApp();

    const fetchNotas = async () => {
        const params = {
            dataInicial: dataInicial,
            dataFinal: dataFinal,
            orderBy: ordenadoPor,
            valorInicial: valorInicial,
            valorFinal: valorFinal,
            textSearch: textSearch,
            limit: limit,
            offset: offset,
        }
        const res = await api.get(`/entrada-nf/by-range`, { params });
        if (res?.status === 200) {
            setNotas(res.data);
        }
        else {
            setNotas([])
        }
    };
    const fetchTotais = async () => {
        const params = {
            dataInicial: dataInicial,
            dataFinal: dataFinal,
            valorInicial: valorInicial,
            valorFinal: valorFinal,
            textSearch: textSearch,
        }
        const res = await api.get(`/entrada-nf/totals`, { params: params });
        if (res?.status === 200) {
            setTotais(res.data);
            setTotalRows(res.data.totalRows);
        }
        else {
            setTotais(null)
            setTotalRows(0);
        }


    }


    useEffect(() => {
        setOffset(0)
        fetchTotais();
        fetchNotas();
    }, [limit, dataInicial, textSearch, dataFinal, ordenadoPor, valorInicial, valorFinal]);
    useEffect(() => {
        fetchTotais();
        fetchNotas();
    }, [offset])


    const handleGeneratePdf = async () => {
        const params = {
            dataInicial: dataInicial,
            dataFinal: dataFinal,
            orderBy: ordenadoPor,
            valorInicial: valorInicial,
            valorFinal: valorFinal,
            textSearch: textSearch,
            agrupadoPor: agrupadoPor,
            exibeItens: exibirItens
        }
        const url = agrupadoPor == EntradaNFAgrupadoPor.CFOP_UF_DIA ? '/entrada-nf/report-cfop-uf' : '/entrada-nf/report';
        const res = await api.get(url, { params });
        if (res.status == 200) {
            const data = res.data;
            if (!data) {
                toast.info("Não encontramos dados suficientes para gerar o relatório!")
            }
            else {
                if (agrupadoPor != EntradaNFAgrupadoPor.CFOP_UF_DIA) {
                    setNotasReport(data);
                    setNotasReportPayload(null);
                    const bytes = await handleReportNotaEntrada(res.data, agrupadoPor, ordenadoPor, exibirItens, companyInfo, currLogoRelatorio, {
                        pesquisa: textSearch,
                        valorInicial,
                        valorFinal,
                        ordenadoPor,
                        agrupadoPor,
                        dataInicial,
                        dataFinal,
                    });
                    const blob = new Blob([bytes], { type: 'application/pdf' });
                    const url = URL.createObjectURL(blob);
                    setUrl(url);
                    setShowPreviewPdf(true);
                } else {
                    const groupedRows = data?.agrupadosPorDia?.dados ?? [];
                    setNotasReport(groupedRows);
                    setNotasReportPayload(data);

                    const bytes = await handleRelatorioNfCfopUf(res.data,

                        companyInfo, currLogoRelatorio, {
                        pesquisa: textSearch,
                        valorInicial,
                        valorFinal,
                        ordenadoPor,
                        agrupadoPor,
                        //@ts-expect-error
                        dataInicial,
                        //@ts-expect-error
                        dataFinal,
                    });
                    const blob = new Blob([bytes], { type: 'application/pdf' });
                    const url = URL.createObjectURL(blob);
                    setUrl(url);
                    setShowPreviewPdf(true);
                }
            }

        }
    }









    const columns: ExtendedColumnDef<any>[] = [

        {
            accessorKey: 'numero',
            header: 'NF',
            width: 80,
            textAlign: 'center',

        },
        {
            accessorKey: 'fornecedorNome',
            header: 'Fornecedor',
            width: 200,
            textAlign: 'left',

        },
        {
            accessorKey: 'dataEntrada',
            header: 'Entrada',
            width: 100,
            textAlign: 'center',
            mask: 'date'
        },
        {
            accessorKey: 'vlrPis',
            header: 'PIS',
            width: 90,
            textAlign: 'right',
            mask: 'monetary-clear'

        },
        {
            accessorKey: 'vlrCofins',
            header: 'COFINS',
            width: 90,
            textAlign: 'right',
            mask: 'monetary-clear'
        },
        {
            accessorKey: 'vlrIcms',
            header: 'ICMS',
            width: 90,
            textAlign: 'right',
            mask: 'monetary-clear'
        },
        {
            accessorKey: 'vlrIpi',
            header: 'IPI',
            width: 90,
            textAlign: 'right',
            mask: 'monetary-clear'
        },
        {
            accessorKey: 'vlrIcmsSt',
            header: 'ICMS ST',
            width: 90,
            textAlign: 'right',
            mask: 'monetary-clear'
        },
        {
            accessorKey: 'vlrProdutos',
            header: 'VALOR PRODUTOS',
            width: 140,
            textAlign: 'right',
            mask: 'monetary-clear'
        },
        {
            accessorKey: 'vlrTotal',
            header: 'VALOR TOTAL',
            width: 140,
            textAlign: 'right',
            mask: 'monetary-clear'
        },


    ]


    const handleExcelReport = async () => {
        const params = {
            dataInicial: dataInicial,
            dataFinal: dataFinal,
            orderBy: ordenadoPor,
            valorInicial: valorInicial,
            valorFinal: valorFinal,
            textSearch: textSearch,
            agrupadoPor: agrupadoPor,
            exibeItens: exibirItens
        }
        const urlFecth = agrupadoPor == EntradaNFAgrupadoPor.CFOP_UF_DIA ? '/entrada-nf/report-cfop-uf' : '/entrada-nf/report';
        const res = await api.get(urlFecth, { params });
        if (res?.status == 200) {


            const bytes = await handleGenerateEntradaExcelReport(
                res.data,
                agrupadoPor,
                exibirItens,
                companyInfo,
                primaryColor,
                currLogoRelatorio
            );

            const blob = new Blob([bytes as any], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            7;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `relatorio_entrada-nfs.xlsx-${dayjs().format('DD-MM-YYYY')}.xlsx`;
            a.click();
        }
        else {
            toast.info("Não encontramos dados para o filtro selecionado!");
        }
    }

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
                            setAgrupadoPor(e as EntradaNFAgrupadoPor)
                        }} />
                        {agrupadoPor != EntradaNFAgrupadoPor.CFOP_UF_DIA && (

                            <Switch label="Exibir itens" checked={exibirItens}

                                onChange={(e) => {
                                    setExibirItens(e)
                                }} />
                        )}
                    </Fluid>
                </Modal.Body>
                <Modal.Footer>
                    <Fluid
                        xs={[100, 50, 50]}
                        lg={['expand']}
                    >
                        <FormButton variant="outline-secondary" className="justify-content-center" onClick={() => {
                            setModalReportShow(false)
                        }}>
                            <Flex wrap="nowrap">
                                <FontAwesomeIcon icon={faCancel} />
                                Cancelar
                            </Flex>
                        </FormButton>
                        <FormButton className="justify-content-center" style={{ background: '#217145' }} onClick={() => {
                            handleExcelReport();
                        }}>
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
                        xs={[60, 40, 50, 50, 'expand']}
                        sm={[50, 25, 25, 90, 'expand']}
                        lg={['expand', 'auto', 'auto', 'auto', 'auto']}
                    >
                        <TextSearch value={textSearch} placeholder="Forncedor, numero..." onChange={(e) => {
                            setTextSearch(e.target.value)
                        }} />
                        <Select value={ordenadoPor} className="mb-0" placeholder="Ordenado por" onChange={(e) => {
                            setOrdenadoPor(e as EntradaNFOrderBy)
                        }} options={[
                            { label: 'Nenhum', value: EntradaNFOrderBy.NENHUM },
                            { label: 'Fornecedor A-Z', value: EntradaNFOrderBy.FORNECEDOR_AZ },
                            { label: 'Fornecedor Z-A', value: EntradaNFOrderBy.FORNECEDOR_ZA },
                            { label: 'Código A-Z', value: EntradaNFOrderBy.CODIGO_AZ },
                            { label: 'Código Z-A', value: EntradaNFOrderBy.CODIGO_ZA },
                            { label: 'Entrada A-Z', value: EntradaNFOrderBy.ENTRADA_AZ },
                            { label: 'Entrada Z-A', value: EntradaNFOrderBy.ENTRADA_ZA },

                        ]} />
                        <TextBox isFormField={false} value={valorInicial} mask={'number'} onChange={(e) => {
                            setValorInicial(Number(e.target.value))
                        }} placeholder="Valor inicial" className="mb-0" />
                        <TextBox isFormField={false} value={valorFinal} onChange={(e) => {
                            setValorFinal(Number(e.target.value))
                        }} placeholder="Valor final" className="mb-0" />



                        <FormButton variant="secondary" className="mb-0 justify-content-center" onClick={() => {
                            setModalReportShow(true)
                        }}>
                            <FontAwesomeIcon icon={faPrint} />
                            Relatório

                        </FormButton>
                    </Fluid>
                </Card.Body>
            </Card>


            <DataGridServerSide
                className="mt-4"
                showVerticalGrid
                columns={columns}
                data={notas}
                limit={limit}
                offset={offset}
                totalRows={totalRows}
                rowHeight={ROW_HEIGHT}
                autoPageSizeOnDesktop
                offsets={100}
                onPaginationChange={(newLimit, newOffset) => {
                    setLimit(newLimit);
                    setOffset(newOffset);
                }}
                showPagination
                showPageSizeSelector
            />


            <Fluid
                className="mt-4"
                xs={[100, 100, 100, 100]}
                sm={[50, 50, 50, 50, 100]}
                lg={['expand']}
            >
                <InfoCard title="Total ICMS ST" value={totais?.totalICMSST ?? 0}
                    icone={faHandHoldingDollar} />
                <InfoCard
                    title="Total COFINS"
                    value={totais?.totalCOFINS ?? 0}
                    accent="rgb(142, 97, 172)"
                    accentPill="rgba(142, 97, 172, 0.2)"
                    icone={faHandHoldingDollar} />
                <InfoCard title="Total IPI" value={totais?.totalIPI ?? 0} accent="rgb(223, 79, 115)"
                    accentPill="rgba(223, 79, 115, 0.2)"
                    icone={faHandHoldingDollar} />
                <InfoCard
                    title="Total PRODUTOS"
                    value={totais?.totalProdutos ?? 0}
                    accent="rgb(18, 103, 143)"
                    accentPill="rgba(18, 103, 143, 0.2)"
                    icone={faBox}
                />
                <InfoCard
                    title="Total NOTAS"
                    value={totais?.totalNotas ?? 0}
                    accent="rgb(12, 131, 72)"
                    accentPill="rgba(12, 131, 72, 0.2)"
                    icone={faDollar} />

            </Fluid>


            {showPreviewPdf && url && (
                <PdfiumViewer
                    pdfUrl={url}
                    filename="relatorio_notas_entrada"
                    hasExcel
                    onClose={() => {
                        setShowPreviewPdf(false)
                    }}
                    onExcelClick={() => {
                        handleExcelReport();
                    }}

                />
            )}
        </>
    )
}
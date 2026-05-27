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
import { exportToExcel } from "../../../utils/exportToExcel";
import { NfceAgrupadoPor } from "../types/relatorios.types";
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
    const [nfceReport, setNfceReport] = useState([]);
    const [data, setData] = useState<Array<Nfce>>([]);

    const [loading, setLoading] = useState(false);

    const [limit, setLimit] = useState(10);
    const [offset, setOffset] = useState(0);

    const [totais, setTotais] = useState<NfceTotais>(null);
    const [exibirItens, setExibirItens] = useState(false);
    const [showPreviewPdf, setShowPreviewPdf] = useState(false);
    const [url, setUrl] = useState<string | null>(null);
    const [modalReportShow, setModalReportShow] = useState(false);
    const [textSearch, setTextSearch] = useState("");
    const [agrupadoPor, setAgrupadoPor] = useState<NfceAgrupadoPor>(NfceAgrupadoPor.Nenhum)
    const [status, setStatus] = useState("");

    const [valorInicial, setValorInicial] = useState("");
    const [valorFinal, setValorFinal] = useState("");

    const [saidaInicial, setSaidaInicial] = useState<Date | undefined>();
    const [saidaFinal, setSaidaFinal] = useState<Date | undefined>();

    useEffect(() => {
        fetchNfces();
        fetchTotais();
    }, [textSearch, status, valorInicial, valorFinal, dataInicial, dataFinal, saidaInicial, saidaFinal, limit, offset])

    const fetchNfces = async () => {
        try {
            setLoading(true);
            const params = {
                dataInicial: dataInicial,
                dataFinal: dataFinal,
                valorInicial: valorInicial,
                valorFinal: valorFinal,
                textSearch: textSearch,
                limit: limit,
                offset: offset,
                saidaInicial: saidaInicial,
                saidaFinal: saidaFinal,
                status: status

            }

            const res = await api.get("nfce", {
                params: params,
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
        const params = {
            dataInicial: dataInicial,
            dataFinal: dataFinal,
            valorInicial: valorInicial,
            valorFinal: valorFinal,
            textSearch: textSearch,
            saidaInicial: saidaInicial,
            saidaFinal: saidaFinal,
            status: status

        }

        const res = await api.get('nfce/totais', { params: params });
        if (res?.status === 200) {
            setTotais(res.data)
        }
    }

    const buildNfceFetchParams = () => ({
        limit: Number(limit),
        offset: Number(offset),

        textSerach: textSearch || undefined,

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

        exibirItens,
    });

    const formatDateForExcel = (value: unknown) => {
        if (value == null) return "";
        const date = value instanceof Date ? value : new Date(String(value).replace(" ", "T"));
        if (Number.isNaN(date.getTime())) return String(value);
        return date.toLocaleDateString("pt-BR");
    };

    const buildNfceExcelPayload = (
        rows: Nfce[],
        agrupadoPor: NfceAgrupadoPor,
        exibirItensExport: boolean,
    ) => {
        const groupBy =
            agrupadoPor === NfceAgrupadoPor.Cliente ? 'cliente' :
                agrupadoPor === NfceAgrupadoPor.DataEmissao ? 'dataEmissao' :
                    agrupadoPor === NfceAgrupadoPor.DataSaida ? 'dataSaida' :
                        agrupadoPor === NfceAgrupadoPor.Status ? 'status' :
                            agrupadoPor === NfceAgrupadoPor.DataRecebimento ? 'dataEmissao' :
                                undefined;

        const groupPrefix =
            agrupadoPor === NfceAgrupadoPor.Cliente ? 'Cliente: ' :
                agrupadoPor === NfceAgrupadoPor.DataEmissao ? 'Emissão: ' :
                    agrupadoPor === NfceAgrupadoPor.DataSaida ? 'Saída: ' :
                        agrupadoPor === NfceAgrupadoPor.Status ? 'Status: ' :
                            agrupadoPor === NfceAgrupadoPor.DataRecebimento ? 'Recebimento: ' :
                                '';

        const rowsWithItems: any[] = [];
        for (const row of rows) {
            rowsWithItems.push({
                ...row,
                dataEmissao: formatDateForExcel(row.dataEmissao),
                dataSaida: formatDateForExcel(row.dataSaida),
                produto: undefined,
                qtd: undefined,
                valorTotalItem: undefined,
                __rowType: 'note',
            });

            if (exibirItensExport && row.itens?.length) {
                rowsWithItems.push({
                    numero: '',
                    cliente: '',
                    status: '',
                    dataEmissao: '',
                    dataSaida: '',
                    valorProdutos: '',
                    vlrTotal: '',
                    produto: 'Produto',
                    qtd: 'Quantidade',
                    valorTotalItem: 'Valor Item',
                    __rowType: 'itemHeader',
                    ...(groupBy ? { [groupBy]: row[groupBy] } : {}),
                });

                for (const item of row.itens) {
                    rowsWithItems.push({
                        numero: '',
                        cliente: '',
                        status: '',
                        dataEmissao: '',
                        dataSaida: '',
                        valorProdutos: '',
                        vlrTotal: '',
                        produto: item.produto,
                        qtd: item.qtd,
                        valorTotalItem: item.valorTotal,
                        __rowType: 'item',
                        ...(groupBy ? { [groupBy]: row[groupBy] } : {}),
                    });
                }
            }
        }

        return {
            data: rowsWithItems,
            groupBy,
            groupPrefix,
        };
    };



    const handleImprimirNfce = async (xml: string) => {
        try {
            const blob = new Blob([xml], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error(error);
            toast.error('Não foi possível abrir o XML.');
        }
    }

    const handleGeneratePdf = async () => {
        const params = {
            textSerach: textSearch || undefined,
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
            exibirItens,
        }

        const res = await api.get("nfce", {
            params: params,
        });
        if (res?.status == 200) {
            const nfces = res.data;
            setNfceReport(nfces);
            if (!nfces || nfces.length === 0) {
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
                status
            });
            const blob = new Blob([bytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setUrl(url);
            setShowPreviewPdf(true);

        }
        else {
            toast.info("Não foi possível encontrar dados para os filtros solicitados!")
        }
    }
    const handleGenerateExcel = async () => {
        const res = await api.get("nfce", {
            params: buildNfceFetchParams(),
        });
        if (res?.status === 200) {
            const nfces = res.data;
            setNfceReport(nfces);
            if (!nfces || nfces.length === 0) {
                toast.info("Não foi possível encontrar dados para os filtros solicitados!")
                return;
            }

            const { data: excelData, groupBy, groupPrefix } = buildNfceExcelPayload(nfces, agrupadoPor, exibirItens);
            const excelColumns: TableHeaderDef[] = [
                { key: 'numero', prefix: 'Nº Nota', align: 'center' },
                { key: 'cliente', prefix: 'Cliente', align: 'left' },
                { key: 'status', prefix: 'Status', align: 'center' },
                { key: 'dataEmissao', prefix: 'Emissão', mask: 'date', align: 'center' },
                { key: 'dataSaida', prefix: 'Saída', mask: 'date', align: 'center' },
                { key: 'valorProdutos', prefix: 'Valor Produtos', mask: 'currency', align: 'right' },
                { key: 'vlrTotal', prefix: 'Valor Total', mask: 'currency', align: 'right' },
            ];

            if (exibirItens) {
                excelColumns.push(
                    { key: 'produto', prefix: 'Produto', align: 'left' },
                    { key: 'qtd', prefix: 'Quantidade', mask: 'number-3', align: 'right' },
                    { key: 'valorTotalItem', prefix: 'Valor Item', mask: 'currency', align: 'right' },
                );
            }

            await exportToExcel(excelData, excelColumns, {
                fileName: 'nfce',
                sheetName: 'NFCe',
                logo: currLogoRelatorio,
                title: 'Relatório NFCe',
                subtitle: `${companyInfo?.cnpj ? (companyInfo.cnpj.length > 11 ? companyInfo.cnpj : companyInfo.cnpj) : ''} ${companyInfo?.nomeCli ?? ''}`.trim(),
                headerBackgroundColor: '#404040',
                groupBy,
                groupPrefix,
            });
        } else {
            toast.info("Não foi possível encontrar dados para os filtros solicitados!")
        }
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
                if (value == 'AUTORIZADA')
                    return { label: `${value}`, color: 'green' }
                else if (value == 'CANCELADA')
                    return { label: `${value}`, color: 'red' }
                else
                    return { label: `${value}`, color: 'blue' }
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
                            { label: 'Nenhum', value: NfceAgrupadoPor.Nenhum },
                            { label: 'Cliente', value: NfceAgrupadoPor.Cliente },
                            { label: 'Data de emissão', value: NfceAgrupadoPor.DataEmissao },
                            { label: 'Data de saída', value: NfceAgrupadoPor.DataSaida },
                            { label: 'Data de recebimento', value: NfceAgrupadoPor.DataRecebimento },
                            { label: 'Status', value: NfceAgrupadoPor.Status },
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
                        xs={[100, 50, 50]}
                        lg={['expand']}
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
                        xs={[70, 30, 50, 50, 50, 50, 'expand']}
                        sm={[100, 50, 25, 25, 25, 25, 'expand']}

                        md={[25, 10, 11, 11, 15, 15, 'expand']}
                    >
                        <TextSearch
                            placeholder="Cliente..."
                            value={textSearch}

                            onChange={(e: any) => {
                                setTextSearch(e.target.value);
                            }}
                        />

                        <Select
                            value={status}
                            options={[
                                {
                                    label: "Todos",
                                    value: undefined,
                                },
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
                                setStatus(e);
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
                            // isFormField={false}
                            className="mb-0"
                            onChange={(value: any) => {
                                setSaidaInicial(value);
                            }}
                        />

                        <DatePicker
                            // isFormField={false}
                            className="mb-0"
                            placeholder="Saída Final"
                            value={saidaFinal}
                            onChange={(value: any) => {
                                setSaidaFinal(value);
                            }}
                        />

                        <FormButton
                            className="justify-content-center"
                            variant="secondary"
                            onClick={() => setModalReportShow(true)}
                            disabled={loading}
                        >
                            <FontAwesomeIcon icon={faPrint} />
                            Relatório
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
                xs={[100, 100]}
                sm={[50, 50]}
                lg={[50, 50]}
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
                    filename="relatorio_nfce"
                    excelDataset={nfceReport.length > 0 ? (() => {
                        const { data: excelData, groupBy, groupPrefix } = buildNfceExcelPayload(nfceReport, agrupadoPor, exibirItens);
                        const columns: TableHeaderDef[] = [
                            { key: 'numero', prefix: 'Nº Nota', align: 'center' },
                            { key: 'cliente', prefix: 'Cliente', align: 'left' },
                            { key: 'status', prefix: 'Status', align: 'center' },
                            { key: 'dataEmissao', prefix: 'Emissão', mask: 'date', align: 'center' },
                            { key: 'dataSaida', prefix: 'Saída', mask: 'date', align: 'center' },
                            { key: 'valorProdutos', prefix: 'Valor Produtos', mask: 'currency', align: 'right' },
                            { key: 'vlrTotal', prefix: 'Valor Total', mask: 'currency', align: 'right' },
                        ];
                        if (exibirItens) {
                            columns.push(
                                { key: 'produto', prefix: 'Produto', align: 'left' },
                                { key: 'qtd', prefix: 'Quantidade', mask: 'number-3', align: 'right' },
                                { key: 'valorTotalItem', prefix: 'Valor Item', mask: 'currency', align: 'right' },
                            );
                        }
                        return {
                            data: excelData,
                            columns,
                            fileName: 'nfce',
                            sheetName: 'NFCe',
                            logo: currLogoRelatorio,
                            title: 'Relatório NFCe',
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
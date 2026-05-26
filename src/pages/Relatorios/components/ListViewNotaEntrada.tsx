import { faBox, faCancel, faDollar, faFileExcel, faFilePdf, faHandHoldingDollar, faPrint } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
import handleRelatorioNfCfopUf from "../../../reports/entrada/entradaNf_cfopUf.report";
import { api } from "../../../services/api";
import type { TableHeaderDef } from "../../../types/v3.types";
import { exportToExcel } from "../../../utils/exportToExcel";
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
    const { dataInicial, dataFinal, companyInfo, currLogoRelatorio } = useApp();

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






    const formatDateForExcel = (value: unknown) => {
        if (value == null) return "";
        const date = value instanceof Date ? value : new Date(String(value).replace(" ", "T"));
        if (isNaN(date.getTime())) return String(value);
        return date.toLocaleDateString("pt-BR");
    };

    const buildNotaEntradaExcelPayload = (
        rows: any[],
        agrupadoPor: EntradaNFAgrupadoPor,
        exibeItens: boolean,
        summary?: {
            resumoPorUF?: any[];
            resumoPorCFOP?: any[];
            totaisUf?: any;
            totaisCfop?: any;
            totalDia?: any;
        }
    ) => {
        const groupBy = agrupadoPor === EntradaNFAgrupadoPor.FORNECEDOR
            ? 'fornecedor'
            : agrupadoPor === EntradaNFAgrupadoPor.DATA_ENTRADA
                ? 'entrada'
                : undefined;
        const groupPrefix = agrupadoPor === EntradaNFAgrupadoPor.FORNECEDOR
            ? 'Fornecedor: '
            : agrupadoPor === EntradaNFAgrupadoPor.DATA_ENTRADA
                ? 'Entrada: '
                : '';

        if (agrupadoPor === EntradaNFAgrupadoPor.CFOP_UF_DIA) {
            const output = rows.map((row) => ({
                ...row,
                __rowType: 'note',
            }));

            if (!summary) {
                return {
                    data: output,
                    groupBy: undefined,
                    groupPrefix: '',
                };
            }

            const summaryRows: any[] = [];

            if (summary.resumoPorUF?.length) {
                summaryRows.push({ __rowType: 'blank' });
                summaryRows.push({ __rowType: 'section', sectionTitle: 'RESUMO POR UF' });
                summaryRows.push({
                    __rowType: 'summary',
                    dia: '',
                    uf: 'UF',
                    modelo: 'CFOP',
                    cfop: '',
                    numero: 'VALOR CONTÁBIL',
                    aliquota: 'VALOR ICMS',
                    valorContabil: 'BASE ICMS',
                    baseICMS: 'BASE ST',
                    valorICMS: 'VALOR ST',
                    valorST: '',
                });
                for (const ufItem of summary.resumoPorUF) {
                    summaryRows.push({
                        __rowType: 'subtotal',
                        dia: '',
                        uf: ufItem.uf ?? '',
                        modelo: '',
                        cfop: '',
                        numero: ufItem.totalValorContabil,
                        aliquota: ufItem.totalValorICMS,
                        valorContabil: ufItem.totalBaseICMS,
                        baseICMS: ufItem.totalBaseST,
                        valorICMS: ufItem.totalValorST,
                        baseST: '',
                        valorST: '',
                    });
                }
                if (summary.totaisUf) {
                    summaryRows.push({
                        __rowType: 'summary',
                        dia: '',
                        uf: '',
                        modelo: '',
                        cfop: '',
                        numero: 'TOTAL RESUMO POR UF',
                        aliquota: '',
                        valorContabil: summary.totaisUf.valorContabil,
                        baseICMS: summary.totaisUf.baseICMS,
                        valorICMS: summary.totaisUf.valorICMS,
                        baseST: summary.totaisUf.baseST,
                        valorST: summary.totaisUf.valorST,
                    });
                }
            }

            if (summary.resumoPorCFOP?.length) {
                summaryRows.push({ __rowType: 'blank' });
                summaryRows.push({ __rowType: 'section', sectionTitle: 'RESUMO POR CFOP' });
                summaryRows.push({
                    __rowType: 'summary',
                    dia: '',
                    uf: 'CFOP',
                    modelo: 'VALOR CONTÁBIL',
                    cfop: '',
                    numero: 'BASE ICMS',
                    aliquota: 'VALOR ICMS',
                    valorContabil: 'BASE ST',
                    baseICMS: 'VALOR ST',
                    valorICMS: '',
                    baseST: '',
                    valorST: '',
                });
                for (const cfopItem of summary.resumoPorCFOP) {
                    summaryRows.push({
                        __rowType: 'subtotal',
                        dia: '',
                        uf: '',
                        modelo: cfopItem.cfop ?? '',
                        cfop: '',
                        numero: cfopItem.totalValorContabil,
                        aliquota: cfopItem.totalBaseICMS,
                        valorContabil: cfopItem.totalValorICMS,
                        baseICMS: cfopItem.totalBaseST,
                        valorICMS: cfopItem.totalValorST,
                        baseST: '',
                        valorST: '',
                    });
                }
                if (summary.totaisCfop) {
                    summaryRows.push({
                        __rowType: 'summary',
                        dia: '',
                        uf: '',
                        modelo: '',
                        cfop: '',
                        numero: 'TOTAL RESUMO POR CFOP',
                        aliquota: '',
                        valorContabil: summary.totaisCfop.valorContabil,
                        baseICMS: summary.totaisCfop.baseICMS,
                        valorICMS: summary.totaisCfop.valorICMS,
                        baseST: summary.totaisCfop.baseST,
                        valorST: summary.totaisCfop.valorST,
                    });
                }
            }

            if (summary.totalDia) {
                summaryRows.push({
                    __rowType: 'summary',
                    dia: '',
                    uf: '',
                    modelo: '',
                    cfop: '',
                    numero: 'TOTAL GERAL',
                    aliquota: '',
                    valorContabil: summary.totalDia.valorContabil,
                    baseICMS: summary.totalDia.baseICMS,
                    valorICMS: summary.totalDia.valorICMS,
                    baseST: summary.totalDia.baseST,
                    valorST: summary.totalDia.valorST,
                });
            }

            return {
                data: [...output, ...summaryRows],
                groupBy: undefined,
                groupPrefix: '',
            };
        }

        const formattedRows = rows.map((row) => ({
            ...row,
            entrada: groupBy === 'entrada' ? formatDateForExcel(row?.entrada) : row?.entrada,
        }));

        const sortedRows = groupBy
            ? [...formattedRows].sort((a, b) => {
                const aGroup = String(a[groupBy] ?? "");
                const bGroup = String(b[groupBy] ?? "");
                const groupCompare = aGroup.localeCompare(bGroup, "pt-BR", { sensitivity: "base" });
                if (groupCompare !== 0) return groupCompare;
                const aNum = Number(a.numero ?? 0);
                const bNum = Number(b.numero ?? 0);
                return aNum - bNum;
            })
            : formattedRows;

        const totalsAccumulator = () => ({
            baseSt: 0,
            icmsSt: 0,
            ipi: 0,
            frete: 0,
            vlrProdutos: 0,
            vlrTotal: 0,
        });

        const sumRow = (source: any, target: any) => {
            target.baseSt += Number(source.baseSt ?? 0);
            target.icmsSt += Number(source.icmsSt ?? 0);
            target.ipi += Number(source.ipi ?? 0);
            target.frete += Number(source.frete ?? 0);
            target.vlrProdutos += Number(source.vlrProdutos ?? 0);
            target.vlrTotal += Number(source.vlrTotal ?? 0);
        };

        const output: any[] = [];
        const globalTotals = totalsAccumulator();
        let currentGroupKey: string | null = null;
        let currentGroupTotals = totalsAccumulator();

        const pushGroupTotal = (groupKey: string) => {
            output.push({
                __rowType: 'subtotal',
                numero: 'Subtotal',
                fornecedor: groupBy === 'fornecedor' ? groupKey : '',
                entrada: groupBy === 'entrada' ? groupKey : '',
                serie: '',
                baseSt: currentGroupTotals.baseSt,
                icmsSt: currentGroupTotals.icmsSt,
                ipi: currentGroupTotals.ipi,
                frete: currentGroupTotals.frete,
                vlrProdutos: currentGroupTotals.vlrProdutos,
                vlrTotal: currentGroupTotals.vlrTotal,
                natureza: '',
                chave: '',
                itemDescricao: '',
                itemNcm: '',
                itemCfop: '',
                itemQuantidade: '',
                itemVlrUnitario: '',
                itemVlrDesconto: '',
                itemVlrTotal: '',
                ...(groupBy ? { [groupBy]: groupKey } : {}),
            });
        };

        for (const row of sortedRows) {
            const groupKey = groupBy ? String(row[groupBy] ?? '') : '';
            if (groupBy && currentGroupKey !== null && groupKey !== currentGroupKey) {
                pushGroupTotal(currentGroupKey);
                currentGroupTotals = totalsAccumulator();
            }
            if (groupBy && currentGroupKey === null) {
                currentGroupKey = groupKey;
            }
            if (groupBy && currentGroupKey !== groupKey) {
                currentGroupKey = groupKey;
            }

            const noteRow = {
                ...row,
                __rowType: 'note',
                itemDescricao: '',
                itemNcm: '',
                itemCfop: '',
                itemQuantidade: '',
                itemVlrUnitario: '',
                itemVlrDesconto: '',
                itemVlrTotal: '',
                ...(groupBy ? { [groupBy]: groupKey } : {}),
            };
            output.push(noteRow);
            sumRow(row, currentGroupTotals);
            sumRow(row, globalTotals);

            if (exibeItens && Array.isArray(row.itens)) {
                for (const item of row.itens) {
                    output.push({
                        __rowType: 'item',
                        numero: '',
                        entrada: '',
                        fornecedor: row.fornecedor ?? '',
                        serie: '',
                        baseSt: '',
                        icmsSt: '',
                        ipi: '',
                        frete: '',
                        vlrProdutos: '',
                        vlrTotal: '',
                        natureza: '',
                        chave: '',
                        itemDescricao: item.descricao ?? '',
                        itemNcm: item.ncm ?? '',
                        itemCfop: item.cfop ?? '',
                        itemQuantidade: item.quantidade ?? '',
                        itemVlrUnitario: item.vlrUnitario ?? '',
                        itemVlrDesconto: item.vlrDesconto ?? '',
                        itemVlrTotal: item.vlrTotal ?? '',
                        ...(groupBy ? { [groupBy]: groupKey } : {}),
                    });
                }
            }
        }

        if (groupBy && currentGroupKey !== null) {
            pushGroupTotal(currentGroupKey);
        }

        output.push({
            __rowType: 'summary',
            numero: 'TOTAL GERAL',
            fornecedor: '',
            entrada: '',
            serie: '',
            baseSt: globalTotals.baseSt,
            icmsSt: globalTotals.icmsSt,
            ipi: globalTotals.ipi,
            frete: globalTotals.frete,
            vlrProdutos: globalTotals.vlrProdutos,
            vlrTotal: globalTotals.vlrTotal,
            natureza: '',
            chave: '',
            itemDescricao: '',
            itemNcm: '',
            itemCfop: '',
            itemQuantidade: '',
            itemVlrUnitario: '',
            itemVlrDesconto: '',
            itemVlrTotal: '',
            ...(groupBy ? { [groupBy]: currentGroupKey ?? '' } : {}),
        });

        return {
            data: output,
            groupBy,
            groupPrefix,
        };
    };

    const handleGenerateExcel = async () => {
        const params = {
            dataInicial: dataInicial,
            dataFinal: dataFinal,
            orderBy: ordenadoPor,
            valorInicial: valorInicial,
            valorFinal: valorFinal,
            textSearch: textSearch,
            agrupadoPor: agrupadoPor,
            exibeItens: exibirItens,
        };
        const url = agrupadoPor == EntradaNFAgrupadoPor.CFOP_UF_DIA ? '/entrada-nf/report-cfop-uf' : '/entrada-nf/report';
        const res = await api.get(url, { params });
        if (res.status === 200) {
            const excelColumns = agrupadoPor === EntradaNFAgrupadoPor.CFOP_UF_DIA
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
                ] as TableHeaderDef[];

            if (exibirItens) {
                excelColumns.push(
                    //@ts-expect-error
                    { key: 'itemDescricao', prefix: 'Item Descrição' },
                    { key: 'itemNcm', prefix: 'Item NCM' },
                    { key: 'itemCfop', prefix: 'Item CFOP' },
                    { key: 'itemQuantidade', prefix: 'Item Quantidade', mask: 'number-3', align: 'right' },
                    { key: 'itemVlrUnitario', prefix: 'Item Valor Unitário', mask: 'currency', align: 'right' },
                    { key: 'itemVlrDesconto', prefix: 'Item Valor Desconto', mask: 'currency', align: 'right' },
                    { key: 'itemVlrTotal', prefix: 'Item Valor Total', mask: 'currency', align: 'right' },
                );
            }

            const rawData = agrupadoPor == EntradaNFAgrupadoPor.CFOP_UF_DIA
                ? res.data?.agrupadosPorDia?.dados ?? []
                : res.data;
            const { data: excelData, groupBy, groupPrefix } = buildNotaEntradaExcelPayload(
                rawData,
                agrupadoPor,
                exibirItens,
                agrupadoPor == EntradaNFAgrupadoPor.CFOP_UF_DIA
                    ? {
                        resumoPorUF: res.data?.resumoPorUF?.dados ?? [],
                        resumoPorCFOP: res.data?.resumoPorCFOP?.dados ?? [],
                        totaisUf: res.data?.resumoPorUF?.total,
                        totaisCfop: res.data?.resumoPorCFOP?.total,
                        totalDia: res.data?.agrupadosPorDia?.total,
                    }
                    : undefined,
            );

            if (excelData.length > 0) {
                //@ts-expect-error
                await exportToExcel(excelData, excelColumns, {
                    fileName: agrupadoPor == EntradaNFAgrupadoPor.CFOP_UF_DIA ? 'notas_entrada_cfop_uf' : 'notas_entrada',
                    sheetName: 'Notas Entrada',
                    logo: currLogoRelatorio,
                    title: agrupadoPor == EntradaNFAgrupadoPor.CFOP_UF_DIA ? 'Relatório Notas Entrada (CFOP UF)' : 'Relatório Notas Entrada',
                    subtitle: `${companyInfo?.cnpj ? (companyInfo.cnpj.length > 11 ? companyInfo.cnpj : companyInfo.cnpj) : ''} ${companyInfo?.nomeCli ?? ''}`.trim(),
                    headerBackgroundColor: '#404040',
                    groupBy,
                    groupPrefix,
                });
            } else {
                toast.info('Não encontramos dados suficientes para gerar o Excel!');
            }
        } else {
            toast.info('Não encontramos dados suficientes para gerar o Excel!');
        }
    };

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
                        xs={[100, 50, 50, 70, 'expand']}
                        sm={[50, 25, 25, 90, 'expand']}
                        lg={['expand', 'auto', 'auto', 'auto', 'auto']}
                    >
                        <TextSearch value={textSearch} placeholder="Forncedor, numero..." onChange={(e) => {
                            setTextSearch(e.target.value)
                        }} />
                        <TextBox isFormField={false} value={valorInicial} mask={'number'} onChange={(e) => {
                            setValorInicial(Number(e.target.value))
                        }} placeholder="Valor inicial" className="mb-0" />
                        <TextBox isFormField={false} value={valorFinal} onChange={(e) => {
                            setValorFinal(Number(e.target.value))
                        }} placeholder="Valor final" className="mb-0" />
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


                        <FormButton className="mb-0 justify-content-center" onClick={() => {
                            setModalReportShow(true)
                        }}>
                            <FontAwesomeIcon icon={faPrint} />

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
                offsets={80}
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
                sm={[50,50,50,50,100]}
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
                    excelDataset={notasReport.length > 0 ? (() => {
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
    )
}
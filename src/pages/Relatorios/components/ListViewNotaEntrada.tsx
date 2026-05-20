import { faBox, faDollar, faHandHoldingDollar, faPrint } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
import { PdfiumViewer } from "../../../components/PdfiumViewer";
import { api } from "../../../services/api";
import { EntradaNFOrderBy, type EntradaNfTotais } from "../types/relatorios.types";
import { InfoCard } from "./InfoCard";


export const ListViewNotaEntreda = () => {
    const [dataInicial, setDataInicial] = useState(null); //TODO: ajustar para data hoje 
    const [dataFinal, setDataFinal] = useState(null); //TODO: ajustar para data de hoje
    const [valorInicial, setValorInicial] = useState<number | undefined>(undefined);
    const [valorFinal, setValorFinal] = useState<number | undefined>(undefined);
    const [ordenadoPor, setOrdenadoPor] = useState<EntradaNFOrderBy>(null);
    const [textSearch, setTextSearch] = useState("");
    const [notas, setNotas] = useState<any[]>([]);
    const [totais, setTotais] = useState<EntradaNfTotais>();
    const [notasReport, setNotasReport] = useState<any[]>([]);
    const [url, setUrl] = useState<string | null>(null);
    const [showPreviewPdf, setShowPreviewPdf] = useState(false);
    const [totalRows, setTotalRows] = useState(10);
    const [limit, setLimit] = useState(10);
    const [offset, setOffset] = useState(0);
    const ROW_HEIGHT = 42;

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
            accessorKey: 'vlrIpi',
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

            <Card>
                <Card.Body>
                    <Fluid
                        xs={['expand', 12, 12, 'auto', 15, 15, 'auto']}
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
                        <DatePicker value={dataInicial} placeholder="Data Início" onChange={(e) => {
                            setDataInicial(e);
                        }} className="mb-0" />
                        <DatePicker value={dataFinal} placeholder="Data Final" onChange={(e) => {
                            setDataFinal(e)
                        }} className="mb-0" />

                        <FormButton className="mb-0" >
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
                xs={['expand']}
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
                <PdfiumViewer pdfUrl={url} filename="" excelDataset={null} />

            )}
        </>
    )
}
import { faFilter, faPrint } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import Card from "../../../components/Card/Card";
import type { ExtendedColumnDef } from "../../../components/DataGrid/DataGrid";
import DataGridServerSide from "../../../components/DataGrid/DataGridServerSide";
import { DatePicker } from "../../../components/DatePicker/DatePicker";
import { FormButton } from "../../../components/Inputs/Button/FormButton";
import Select from "../../../components/Inputs/Select/Select";
import { TextSearch } from "../../../components/Inputs/TextSearch/TextSearch";
import Fluid from "../../../components/Layout/Fluid";
import { PdfiumViewer } from "../../../components/PdfiumViewer";
import { api } from "../../../services/api";
import { InfoCard } from "./InfoCard";



export const ListViewNotaEntreda = () => {
    const [dataInicial, setDataInicial] = useState("");
    const [dataFinal, setDataFinal] = useState(null);
    const [ordenadoPor, setOrdenadoPor] = useState(null);
    const [textSearch, setTextSearch] = useState("");
    const [notas, setNotas] = useState<any[]>([]);
    const [notasReport, setNotasReport] = useState<any[]>([]);
    const [url, setUrl] = useState<string | null>(null);
    const [showPreviewPdf, setShowPreviewPdf] = useState(false);
    const [totalRows, setTotalRows] = useState(10);
    const [limit, setLimit] = useState(10);
    const [offset, setOffset] = useState(0);
    const ROW_HEIGHT = 42;

    const fetchNotas = async () => {
        const res = await api.get(`/entrada-nf?limit=${limit}&offset=${offset}`);
        if (res?.status === 200) {
            const payload = res.data;
            const dataArray = Array.isArray(payload) ? payload : payload?.data ?? [];
            const headerTotal = res.headers?.["x-total-count"];
            const totalFromPayload =
                payload?.totalRows ?? payload?.total ?? payload?.count ?? payload?.totalCount ??
                (headerTotal ? Number(headerTotal) : undefined);

            setNotas(dataArray);
            // setTotalRows(
            //     typeof totalFromPayload === "number" && !Number.isNaN(totalFromPayload)
            //         ? totalFromPayload
            //         : dataArray.length,
            // );
        }
    };

    

    useEffect(() => {
        fetchNotas();
    }, [limit, offset]);

   



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
            width: 'expand',
            textAlign: 'left',

        },
        {
            accessorKey: 'dataEntrada',
            header: 'Entrada',
            width: 'expand',
            textAlign: 'left',

        },
        {
            accessorKey: 'vlrIpi',
            header: 'PIS',
            width: 'expand',
            textAlign: 'left',

        },
        {
            accessorKey: 'vlrCofins',
            header: 'COFINS',
            width: 'expand',
            textAlign: 'left',

        },
        {
            accessorKey: 'vlrIcms',
            header: 'ICMS',
            width: 'expand',
            textAlign: 'left',

        },
        {
            accessorKey: 'vlrIpi',
            header: 'IPI',
            width: 'expand',
            textAlign: 'left',

        },
        {
            accessorKey: 'vlrIcmsSt',
            header: 'ICMS ST',
            width: 'expand',
            textAlign: 'left',

        },
        {
            accessorKey: 'vlrProdutos',
            header: 'VALOR PRODUTOS',
            width: 'expand',
            textAlign: 'left',

        },
        {
            accessorKey: 'vlrTotal',
            header: 'VALOR TOTAL',
            width: 'expand',
            textAlign: 'left',

        },


    ]



    return (
        <>

            <Card>
                <Card.Body>
                    <Fluid
                        xs={['expand', 'auto', 'auto', 'auto', 'auto']}
                    >
                        <TextSearch />
                        <Select value="" className="mb-0" onChange={() => { }} options={[]} />
                        <DatePicker value={null} onChange={() => { }} className="mb-0" />
                        <DatePicker value={null} onChange={() => { }} className="mb-0" />
                        <FormButton variant="icon">
                            <FontAwesomeIcon icon={faFilter} />
                        </FormButton>
                        <FormButton >
                            <FontAwesomeIcon icon={faPrint} />

                        </FormButton>
                    </Fluid>
                </Card.Body>
            </Card>
           
               
                <DataGridServerSide
                    className="mt-4"
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
                <InfoCard title="Total ICMS ST" value={0} />
                <InfoCard title="Total IPI" value={0} accent="rgb(223, 79, 115)"
                    accentPill="rgba(223, 79, 115, 0.2)" />
                <InfoCard title="Total NOTAS" value={0} accent="rgb(12, 131, 72)"
                    accentPill="rgba(12, 131, 72, 0.2)" />

            </Fluid>


            {showPreviewPdf && url && (
                <PdfiumViewer pdfUrl={url} filename="" excelDataset={null} />

            )}


        </>




    )



}
import { faPrint } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type React from "react";
import { useEffect, useState } from "react";
import Card from "../../../components/Card/Card";
import type { ExtendedColumnDef } from "../../../components/DataGrid/DataGrid";
import DataGridServerSide from "../../../components/DataGrid/DataGridServerSide";
import { FormButton } from "../../../components/Inputs/Button/FormButton";
import Select from "../../../components/Inputs/Select/Select";
import { TextSearch } from "../../../components/Inputs/TextSearch/TextSearch";
import Fluid from "../../../components/Layout/Fluid";
import { useApp } from "../../../contexts/AppContext";
import { api } from "../../../services/api";


export enum OperacaoAuditoria {
    Todos = '',
    Delete = 'D',
    Insert = 'I',
    Update = 'U',
    Create = 'C'

}

const ListViewAuditoria: React.FC = () => {
    const [operacao, setOperacao] = useState<OperacaoAuditoria>(null)
    const { dataInicial, dataFinal, currLogoRelatorio, companyInfo } = useApp();
    const [limit, setLimit] = useState(10);
    const [offset, setOffset] = useState(0)
    const [formularios, setFormularios] = useState([]);
    const [currForm, setCurrForm] = useState(null)
    const [totalRows, setTotalRows] = useState(null)
    const [data, setData] = useState([])
    const [resportData, setReportData] = useState([])

    const fetchForms = async () => {
        const res = await api("auditoria/auto-complete");
        if (res.status === 200) {
            const autoCompletes: Array<any> = res.data;
            autoCompletes.unshift({ label: 'Todos', value: '' })
            setFormularios(autoCompletes)
        }
    }
    useEffect(() => {

        fetchForms();

    }, [])

    useEffect(() => {
        fetchData();
        fetchTotal();
    }, [dataInicial, dataFinal, currForm, operacao, limit, offset])


    const fetchData = async () => {
        const params = {
            dataInicial: dataInicial,
            dataFinal: dataFinal,
            formulario: currForm,
            operacao: operacao,
            limit: limit,
            offset: offset
        }

        const res = await api.get('auditoria', { params })
        if (res?.status === 200) {

            setData(res.data)
        }
        else {
            setData([])
        }
    }

    const fetchTotal = async () => {
        const params = {
            dataInicial: dataInicial,
            dataFinal: dataFinal,
            formulario: currForm,
            operacao: operacao,

        }
        const res = await api.get("auditoria/totais", { params: params })
        if (res?.status == 200) {
            setTotalRows(res.data)
        }
        else {
            setTotalRows(0)
        }
    }

    const columns: ExtendedColumnDef<any>[] = [

        {
            accessorKey: 'idAuditoria',
            header: 'Cód.',
            width: 80
        },
        {
            accessorKey: 'formulario',
            header: 'Formulario',
            width: 100,

        }, {
            accessorKey: 'operacao',
            header: 'Operação'
        }

    ]

    return (
        <>
            <Card>
                <Card.Body>
                    <Fluid
                        xs={['expand', 'auto', 'auto', 'auto']}
                    >


                        <TextSearch placeholder="Computador, usuario ..." />
                        <Select placeholder="Operação" options={[
                            { label: 'Todos', value: OperacaoAuditoria.Todos },
                            { label: 'Deletou', value: OperacaoAuditoria.Delete },
                            { label: 'Inseriu', value: OperacaoAuditoria.Insert },
                            { label: 'Atualizou', value: OperacaoAuditoria.Update },
                            { label: 'Criou', value: OperacaoAuditoria.Create }
                        ]}
                            onChange={(e) => {
                                setOperacao(e as any)
                            }}
                            value={operacao}

                        />
                        <Select placeholder="Formulario" options={formularios.map((x) => {
                            return { label: x.label, value: x.value }
                        })}
                            onChange={(e) => {
                                setCurrForm(e)
                            }}
                            value={currForm}
                        />

                        <FormButton variant="secondary">
                            <FontAwesomeIcon icon={faPrint} />
                            Relatório
                        </FormButton>


                    </Fluid>



                </Card.Body>
            </Card>

            <DataGridServerSide
                className="mt-4"
                data={data}
                columns={columns}
                limit={limit}
                offset={offset}
                onPaginationChange={(l, o) => {
                    setLimit(l);
                    setOffset(o)
                }}
                showPageSizeSelector
                showPagination
                autoPageSizeOnDesktop
                totalRows={totalRows?.totalRows ?? 0}
            />

        </>
    )
}


export default ListViewAuditoria;
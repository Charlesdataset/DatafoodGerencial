import { faBookBookmark, faCancel, faFileExcel, faFilePdf, faFilter, faList, faPrint, faSignOut } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Card from "../../../components/Card/Card";
import type { ExtendedColumnDef } from "../../../components/DataGrid/DataGrid";
import DataGridServerSide from "../../../components/DataGrid/DataGridServerSide";
import { FormButton } from "../../../components/Inputs/Button/FormButton";
import Select from "../../../components/Inputs/Select/Select";
import { TextSearch } from "../../../components/Inputs/TextSearch/TextSearch";
import { Flex } from "../../../components/Layout";
import Fluid from "../../../components/Layout/Fluid";
import ListGroup from "../../../components/ListGroup/ListGroup";
import { Modal } from "../../../components/Modal";
import { PdfiumViewer } from "../../../components/PdfiumViewer";
import Switch from "../../../components/Switch/Switch";
import { exportToExcel } from "../../../utils/exportToExcel";
import { useApp } from "../../../contexts/AppContext";
import handleReportAuditoria, { AuditoriaAgrupadoPor } from "../../../reports/auditoria/auditoria.report";
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
    const [agrupadoPor, setAgrupadoPor] = useState<AuditoriaAgrupadoPor>(AuditoriaAgrupadoPor.Nenhum)
    const { dataInicial, dataFinal, currLogoRelatorio, companyInfo } = useApp();
    const [showPreviewPdf, setShowPreviewPdf] = useState(false)
    const [url, setUrl] = useState(null)
    const [textSearch, setTextSearch] = useState("");
    const [exibeDetalhes, setExibeDetalhes] = useState(false)
    const [limit, setLimit] = useState(10);
    const [offset, setOffset] = useState(0)
    const [formularios, setFormularios] = useState([]);
    const [currForm, setCurrForm] = useState(null)
    const [totalRows, setTotalRows] = useState(null)
    const [data, setData] = useState([])
    const [id, setId] = useState(0)
    const [dadosJson, setDadosJson] = useState(null)
    const [modalDetailShow, setModalDetailShow] = useState(false)
    const [showModalReport, setShowModalReport] = useState(false)

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
    }, [dataInicial, dataFinal, currForm, operacao, textSearch, limit, offset])


    const fetchData = async () => {
        const params = {
            dataInicial: dataInicial,
            dataFinal: dataFinal,
            formulario: currForm,
            operacao: operacao,
            textSearch: textSearch,
            limit: limit,
            offset: offset,
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
            textSearch: textSearch,
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
            width: 80,
            textAlign: 'center'
        },
        {
            accessorKey: 'formulario',
            header: 'Formulario',
            width: 150,
            textAlign: 'center'

        },
        {
            accessorKey: 'operacao',
            header: 'Operação',
            textAlign: 'center',
            width: 100
        },
        {
            accessorKey: 'data',
            header: 'Data',
            mask: 'datetime',
            textAlign: 'center',
            width: 100
        },
        {
            accessorKey: 'computador',
            header: 'Computador',
            textAlign: 'center',
            width: 100
        },
        {
            accessorKey: 'nomeColaborador',
            header: 'Colaborador',
            textAlign: 'center',
            width: 150
        },

        {
            accessorKey: 'dadosJson',
            header: 'Detalhes',
            textAlign: 'center',
            cell: (info) => {
                return (
                    <>
                        {
                            info.row.original.operacao == 'Alteração' && (
                                <FormButton variant="icon" onClick={() => {
                                    const id = info.row.original.idAuditoria;
                                    const dadosJson = info.row.original.dadosJson;
                                    setDadosJson(dadosJson)
                                    setId(id)
                                    setModalDetailShow(true)
                                }} >
                                    <FontAwesomeIcon icon={faList} />
                                </FormButton>
                            )
                        }
                    </>
                )
            },
            width: 100
        }

    ]

    const fetchDataReport = async () => {
        const params = {
            dataInicial: dataInicial,
            dataFinal: dataFinal,
            operacao: operacao,
            formulario: currForm,
            textSearch: textSearch
        }

        const res = await api.get("auditoria", { params: params });
        if (res?.status == 200)
            return res.data;
        return null;
    }


    const formatDetalhes = (dadosJson: any) => {
        if (!dadosJson) return '';

        if (dadosJson.alterados && typeof dadosJson.alterados === 'object') {
            return Object.entries(dadosJson.alterados)
                .map(([campo, item]) => {
                    if (JSON.stringify(item?.antes) === JSON.stringify(item?.depois)) {
                        return null;
                    }
                    return `${campo}: ${item?.antes ?? ''} → ${item?.depois ?? ''}`;
                })
                .filter(Boolean)
                .join(' | ');
        }

        return JSON.stringify(dadosJson);
    }

    const handleGenerateExcel = async () => {
        const dataSet = await fetchDataReport();
        if (!dataSet || dataSet.length === 0) {
            toast.info('Não encontramos dados suficientes para gerar o Excel!');
            return;
        }

        const excelColumns = [
            { key: 'idAuditoria', prefix: 'Cód.', align: 'center' },
            { key: 'formulario', prefix: 'Formulário', align: 'left' },
            { key: 'nomeColaborador', prefix: 'Colaborador', align: 'left' },
            { key: 'operacao', prefix: 'Operação', align: 'center' },
            { key: 'computador', prefix: 'Computador', align: 'center' },
            { key: 'data', prefix: 'Data', mask: 'date-time', align: 'center' },
            { key: 'detalhes', prefix: 'Detalhes', align: 'left' },
        ];

        const excelData = dataSet.map((row: any) => ({
            ...row,
            detalhes: formatDetalhes(row.dadosJson),
        }));

        const excelGroupBy = {
            [AuditoriaAgrupadoPor.Colaborador]: 'nomeColaborador',
            [AuditoriaAgrupadoPor.Computador]: 'computador',
            [AuditoriaAgrupadoPor.Data]: 'data',
            [AuditoriaAgrupadoPor.Operacao]: 'operacao',
        };

        await exportToExcel(excelData, excelColumns, {
            fileName: 'relatorio_auditoria',
            sheetName: 'Auditoria',
            logo: currLogoRelatorio,
            title: 'Relatório Auditoria',
            subtitle: `${companyInfo?.cnpj ?? ''} ${companyInfo?.nomeCli ?? ''}`.trim(),
            headerBackgroundColor: '#404040',
            groupBy: excelGroupBy[agrupadoPor],
            groupPrefix: agrupadoPor || undefined,
            nullGroupLabel: '(Sem dados)',
        });
    }

    const handleGeneratePdf = async () => {
        const dataSet = await fetchDataReport();
        if (dataSet) {
            const bytes = await handleReportAuditoria(dataSet, agrupadoPor, exibeDetalhes, companyInfo, currLogoRelatorio, {
                dataInicial: dataInicial, dataFinal: dataFinal,
                formulario: currForm,
                pesquisa: textSearch
            })
            const blob = new Blob([bytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setUrl(url);
            setShowPreviewPdf(true);
        }
        else {
            toast.info("Não encontramos dados pora o filtro selecionado!")
        }
    }

    return (
        <>
            <Modal isOpen={modalDetailShow} onClose={() => { }}>
                <Modal.Header onClose={() => { setModalDetailShow(false) }}>
                    <Flex align="center">
                        <FontAwesomeIcon icon={faBookBookmark} />
                        {`Detalhes da auditoria id ${id}`}

                    </Flex>
                </Modal.Header>

                <Modal.Body>
                    {dadosJson != null && dadosJson.alterados && (
                        <ListGroup>
                            {Object.keys(dadosJson.alterados).map((key) => {
                                const item = dadosJson.alterados[key];
                                // Filtra apenas os campos que realmente mudaram
                                if (JSON.stringify(item.antes) === JSON.stringify(item.depois)) {
                                    return null;
                                }

                                return (
                                    <ListGroup.Item key={key}>
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div className="fw-bold" style={{ minWidth: '150px' }}>
                                                {key}
                                            </div>
                                            <div className="flex-grow-1">
                                                <span className="text-danger me-2">
                                                    Antes: {item.antes}
                                                </span>
                                                <span className="text-muted mx-2">→</span>
                                                <span className="text-success">
                                                    Depois: {item.depois}
                                                </span>
                                            </div>
                                        </div>
                                    </ListGroup.Item>
                                );
                            })}
                        </ListGroup>
                    )}
                    {(!dadosJson || !dadosJson.alterados || Object.keys(dadosJson.alterados).length === 0) && (
                        <div className="text-muted">Não há detalhes de alteração para este registro.</div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <FormButton variant="link-info" onClick={() => {
                        setModalDetailShow(false)
                    }}>
                        <FontAwesomeIcon icon={faSignOut} />
                        Sair
                    </FormButton>
                </Modal.Footer>
            </Modal>

            <Modal isOpen={showModalReport} onClose={() => { }}>
                <Modal.Header onClose={() => { setShowModalReport(false) }}>
                    <Flex>
                        <FontAwesomeIcon icon={faFilter} />
                        Filtros do relatório
                    </Flex>
                </Modal.Header>

                <Modal.Body>

                    <Fluid
                        xs={[100]}
                    >
                        <Select value={agrupadoPor} options={[
                            { label: 'Nenhum', value: AuditoriaAgrupadoPor.Nenhum },
                            { label: 'Data', value: AuditoriaAgrupadoPor.Data },
                            { label: 'Computador', value: AuditoriaAgrupadoPor.Computador },
                            { label: 'Colaborador', value: AuditoriaAgrupadoPor.Colaborador },
                            { label: 'Operação', value: AuditoriaAgrupadoPor.Operacao },
                        ]} onChange={(e: any) => {
                            setAgrupadoPor(e)
                        }} label="Agrupado por" />
                        <Switch label="Exibir detalhes" checked={exibeDetalhes} onChange={setExibeDetalhes} />
                    </Fluid>

                </Modal.Body>

                <Modal.Footer>
                    <Fluid
                        xs={[100, 50, 50]}
                        lg={['expand']}
                    >
                        <FormButton variant="outline-secondary" className="justify-content-center" onClick={() => {
                            setShowModalReport(false)
                        }}>
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
                            setShowModalReport(false);
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
                        xs={['expand', 'auto', 'auto', 'auto']}
                    >


                        <TextSearch
                            placeholder="Computador, usuario ..."
                            value={textSearch}
                            onSearch={(value) => {
                                setTextSearch(value);
                                setOffset(0);
                            }}
                        />
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

                        <FormButton variant="secondary" onClick={() => {
                            setShowModalReport(true)
                        }}>
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
                showSorting={false}
                onPaginationChange={(l, o) => {
                    setLimit(l);
                    setOffset(o)
                }}
                showPageSizeSelector
                showPagination
                autoPageSizeOnDesktop
                totalRows={totalRows?.totalRows ?? 0}
            />

            {showPreviewPdf && url && (
                <PdfiumViewer
                    pdfUrl={url}
                    filename="relatorio_auditoria"

                    onClose={() => {
                        setShowPreviewPdf(false)
                    }}
                />
            )}

        </>
    )
}


export default ListViewAuditoria;
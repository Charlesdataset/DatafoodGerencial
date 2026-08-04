import { faArrowRightArrowLeft, faBookBookmark, faCancel, faCheckCircle, faFileExcel, faFilePdf, faFilter, faMagnifyingGlass, faPrint, faSignOut, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "dayjs";
import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Card from "../../../components/Card/Card";
import type { ExtendedColumnDef } from "../../../components/DataGrid/DataGrid";
import DataGridServerSide from "../../../components/DataGrid/DataGridServerSide";
import { FormButton } from "../../../components/Inputs/Button/FormButton";
import Select from "../../../components/Inputs/Select/Select";
import { TextSearch } from "../../../components/Inputs/TextSearch/TextSearch";
import { Flex } from "../../../components/Layout";
import Fluid from "../../../components/Layout/Fluid";
import { Modal } from "../../../components/Modal";
import { PdfiumViewer } from "../../../components/PdfiumViewer";
import Switch from "../../../components/Switch/Switch";
import { useApp } from "../../../contexts/AppContext";
import { useNavigation } from "../../../contexts/NavigationContext";
import handleGenerateAuditoriaExcelReport from "../../../reports/auditoria/auditoria.excel.report";
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
    const { dataInicial, dataFinal, currLogoRelatorio, companyInfo, primaryColor } = useApp();
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
    const { subscribe } = useNavigation();
    const navigate = useNavigate();
    const fetchForms = async () => {
        const res = await api("auditoria/auto-complete");
        if (res.status === 200) {
            const autoCompletes: Array<any> = res.data;
            autoCompletes.unshift({ label: 'Todos', value: '' })
            setFormularios(autoCompletes)
        }
    }
    useEffect(() => {
        const unsubscribeBackView = subscribe('backView', () => {
            // Lógica para voltar à tela anterior
            navigate(`/reports`)
        }
        );
        return () => {
            unsubscribeBackView();
        }
        fetchForms();
        fetchData();
        fetchTotal();
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
            pesquisa: textSearch,
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
            pesquisa: textSearch,
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
                                    <FontAwesomeIcon icon={faMagnifyingGlass} size="xs" />
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
            pesquisa: textSearch
        }

        const res = await api.get("auditoria", { params: params });
        if (res?.status == 200)
            return res.data;
        return null;
    }

    const handleGenerateExcel = async () => {

        const dataSet = await fetchDataReport();
        if (dataSet) {
            const bytes = await handleGenerateAuditoriaExcelReport(dataSet, agrupadoPor, exibeDetalhes, companyInfo, currLogoRelatorio, primaryColor, {
                dataInicial: dataInicial, dataFinal: dataFinal,
                formulario: currForm,
                pesquisa: textSearch,
                agrupadoPor: agrupadoPor
            })
            const blob = new Blob([bytes as any], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            7;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `relatorio_auditoria.xlsx-${dayjs().format('DD-MM-YYYY')}.xlsx`;
            a.click();
        }
        else {
            toast.info("Não encontramos dados pora o filtro selecionado!")
        }

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
                    <Flex align="center" gap={'xs'}>
                        <FontAwesomeIcon icon={faBookBookmark} style={{ fontSize: 18 }} />
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 16 }}>Auditoria #{id}</div>
                            <div style={{ fontSize: 12, color: '#6c757d', marginTop: 2 }}>Histórico de alterações</div>
                        </div>
                    </Flex>
                </Modal.Header>

                <Modal.Body>
                    {dadosJson != null && dadosJson.alterados && (
                        <div style={{
                            maxHeight: 'calc(100vh - 250px)',
                            overflowY: 'auto',
                            paddingRight: 12,
                            borderRadius: 8
                        }}>
                            {/* Header Summary */}
                            <div style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: '#fff',
                                padding: '16px 20px',
                                borderRadius: 12,
                                marginBottom: 24,
                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)'
                            }}>
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                    <div>
                                        <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 4 }}>Total de campos alterados</div>
                                        <div style={{ fontSize: 28, fontWeight: 700 }}>
                                            {Object.keys(dadosJson.alterados).filter((key) => {
                                                const item = dadosJson.alterados[key];
                                                return JSON.stringify(item.antes) !== JSON.stringify(item.depois);
                                            }).length}
                                        </div>
                                    </div>
                                    <div style={{
                                        background: 'rgba(255,255,255,0.2)',
                                        padding: '8px 16px',
                                        borderRadius: 8,
                                        fontSize: 12,
                                        backdropFilter: 'blur(10px)'
                                    }}>
                                        <FontAwesomeIcon icon={faArrowRightArrowLeft} style={{ marginRight: 6 }} />
                                        Mudanças detectadas
                                    </div>
                                </div>
                            </div>

                            {/* Fields List */}
                            {Object.keys(dadosJson.alterados).map((key, index) => {
                                const item = dadosJson.alterados[key];
                                if (JSON.stringify(item.antes) === JSON.stringify(item.depois)) {
                                    return null;
                                }

                                return (
                                    <div
                                        key={key}
                                        style={{
                                            marginBottom: 20,
                                            animation: `slideIn 0.3s ease-out ${index * 0.05}s both`,
                                        }}
                                    >
                                        <style>{`
                                            @keyframes slideIn {
                                                from {
                                                    opacity: 0;
                                                    transform: translateX(-10px);
                                                }
                                                to {
                                                    opacity: 1;
                                                    transform: translateX(0);
                                                }
                                            }
                                        `}</style>

                                        {/* Field Label */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            marginBottom: 12,
                                            gap: 8
                                        }}>
                                            <div style={{
                                                width: 4,
                                                height: 24,
                                                background: 'linear-gradient(180deg, #dc3545, #fd7e14)',
                                                borderRadius: 2
                                            }}></div>
                                            <div>
                                                <div style={{
                                                    fontWeight: 600,
                                                    fontSize: 14,
                                                    color: '#212529',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: 0.5
                                                }}>
                                                    {key}
                                                </div>
                                                <div style={{
                                                    fontSize: 11,
                                                    color: '#6c757d',
                                                    marginTop: 2
                                                }}>
                                                    Campo modificado
                                                </div>
                                            </div>
                                        </div>

                                        {/* Before & After Comparison */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                            {/* ANTES (Vermelho/Old) */}
                                            <div style={{
                                                background: '#fff5f5',
                                                border: '2px solid #dc3545',
                                                borderRadius: 10,
                                                padding: 16,
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    height: 3,
                                                    background: '#dc3545'
                                                }}></div>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    marginBottom: 10,
                                                    color: '#dc3545',
                                                    fontWeight: 600,
                                                    fontSize: 12
                                                }}>
                                                    <FontAwesomeIcon icon={faTimesCircle} />
                                                    Antigo
                                                </div>
                                                <div style={{
                                                    fontSize: 13,
                                                    color: '#495057',
                                                    whiteSpace: 'pre-wrap',
                                                    wordBreak: 'break-word',
                                                    lineHeight: 1.6,
                                                    maxHeight: 120,
                                                    overflowY: 'auto',
                                                    paddingRight: 8,
                                                    fontFamily: 'Monaco, "Courier New", monospace',
                                                    backgroundColor: '#fff',
                                                    padding: '8px 10px',
                                                    borderRadius: 6,
                                                    marginTop: 8
                                                }}>
                                                    {item.antes ?? '-'}
                                                </div>
                                            </div>

                                            {/* DEPOIS (Verde/New) */}
                                            <div style={{
                                                background: '#f0fdf4',
                                                border: '2px solid #198754',
                                                borderRadius: 10,
                                                padding: 16,
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    height: 3,
                                                    background: '#198754'
                                                }}></div>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    marginBottom: 10,
                                                    color: '#198754',
                                                    fontWeight: 600,
                                                    fontSize: 12
                                                }}>
                                                    <FontAwesomeIcon icon={faCheckCircle} />
                                                    Novo
                                                </div>
                                                <div style={{
                                                    fontSize: 13,
                                                    color: '#495057',
                                                    whiteSpace: 'pre-wrap',
                                                    wordBreak: 'break-word',
                                                    lineHeight: 1.6,
                                                    maxHeight: 120,
                                                    overflowY: 'auto',
                                                    paddingRight: 8,
                                                    fontFamily: 'Monaco, "Courier New", monospace',
                                                    backgroundColor: '#fff',
                                                    padding: '8px 10px',
                                                    borderRadius: 6,
                                                    marginTop: 8
                                                }}>
                                                    {item.depois ?? '-'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {(!dadosJson || !dadosJson.alterados || Object.keys(dadosJson.alterados).length === 0) && (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px 20px',
                            color: '#6c757d'
                        }}>
                            <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: 32, marginBottom: 12, color: '#198754', opacity: 0.5 }} />
                            <div>Não há alterações neste registro</div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <FormButton variant="link-info" onClick={() => {
                        setModalDetailShow(false)
                    }}>
                        <FontAwesomeIcon icon={faSignOut} />
                        Fechar
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
                        <FormButton className="justify-content-center" style={{ background: '#217145' }} onClick={() => {
                            handleGenerateExcel();
                        }}>
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

                        <FormButton onClick={() => {
                            setShowModalReport(true)
                        }}>
                            <FontAwesomeIcon icon={faPrint} />

                        </FormButton>


                    </Fluid>



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
                        offsets={12}
                        autoPageSizeOnDesktop
                        totalRows={totalRows?.totalRows ?? 0}
                    />
                </Card.Body>
            </Card>


            {showPreviewPdf && url && (
                <PdfiumViewer
                    pdfUrl={url}
                    filename="relatorio_auditoria"

                    onClose={() => {
                        setShowPreviewPdf(false)
                    }}
                    hasExcel={true}
                />
            )}

        </>
    )
}


export default ListViewAuditoria;
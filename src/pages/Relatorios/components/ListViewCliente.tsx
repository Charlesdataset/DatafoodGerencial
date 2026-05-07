import { faCancel, faFileAlt, faPrint, faRedo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/Card/Card";
import type { ExtendedColumnDef } from "../../../components/DataGrid/DataGrid";
import DataGrid from "../../../components/DataGrid/DataGrid";
import { FormButton } from "../../../components/Inputs/Button/FormButton";
import Select from "../../../components/Inputs/Select/Select";
import { TextSearch } from "../../../components/Inputs/TextSearch/TextSearch";
import { Flex } from "../../../components/Layout";
import Fluid from "../../../components/Layout/Fluid";
import { Modal } from "../../../components/Modal";
import { PdfiumViewer } from "../../../components/PdfiumViewer";
import { useApp } from "../../../contexts/AppContext";
import { useNavigation } from "../../../contexts/NavigationContext";
import handleGenerateClientReport, { ClienteAgrupadoPor, ModeloRelatorio } from "../../../reports/cliente/client.report";
import { api } from "../../../services/api";


const ListViewCliente: React.FC = () => {
    const navigate = useNavigate();
    const [dados, setDados] = useState([])
    const [refreshKey, setRefreshKey] = useState(0);
    const [url, setUrl] = useState(null);

    const [modalShow, setModalShow] = useState(false);
    const [agrupado, setAgrupado] = useState<ClienteAgrupadoPor>(ClienteAgrupadoPor.Nenhum);
    const [tipo, setTipo] = useState<ModeloRelatorio>(ModeloRelatorio.Simplificado);
    const { subscribe } = useNavigation();
    const { companyInfo } = useApp();
    useEffect(() => {
        const unsubscribeBackView = subscribe('backView', () => {
            // Lógica para voltar à tela anterior
            navigate(`/reports`)
        }
        );
        return () => {
            unsubscribeBackView();
        }
    }, [])



    useEffect(() => {
        fetchData();

    }, [])

    const fetchData = async () => {
        setRefreshKey(prev => prev + 1);
        const res = await api.get("/clients");
        if (res?.status === 200) {
            setDados(res.data);
        }
        else {
            setDados([])
        }

    }

    const columns: Array<ExtendedColumnDef<any>> = [
        {
            accessorKey: 'idCliente',
            header: "Código",
            width: 80,
            headerAlign: "center",
            textAlign: "center",

        },
        {
            accessorKey: 'razaoSocial',
            header: "Razão Social",
            width: 180,
            headerAlign: "left",
            textAlign: "left",

        },
        {
            accessorKey: 'bairro',
            header: "Bairro",
            width: 180,
            headerAlign: "center",
            textAlign: "center",

        },
        {
            accessorKey: 'cidade',
            header: "Cidade",
            width: 180,
            headerAlign: "center",
            textAlign: "center",

        },
        {
            accessorKey: 'dataCadastro',
            header: "Cadastro",
            width: 120,
            headerAlign: "center",
            textAlign: "center",
            mask: "datetime",
        },
        {
            accessorKey: 'celular',
            header: "Celular",
            width: 120,
            headerAlign: "center",
            textAlign: "center",

        }
    ]

    const handlePrint = async () => {
        console.log(companyInfo)
        const bytes = await handleGenerateClientReport(dados, agrupado, tipo, companyInfo);
        const blob = new Blob([bytes], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        setUrl(url);


    }


    return (
        <>
            <Modal isOpen={modalShow} onClose={() => { }} size="xs">
                <Modal.Header onClose={() => { setModalShow(false) }}>
                    <Flex align="center">
                        <FontAwesomeIcon icon={faFileAlt} />
                        Escolha os filtros
                    </Flex>
                </Modal.Header>
                <Modal.Body>
                    <Fluid
                        xs={[100]}
                    >
                        <Select label="Agrupado por" value={agrupado} options={[
                            {
                                value: ClienteAgrupadoPor.Nenhum, label: 'Nenhum'
                            }, {
                                value: ClienteAgrupadoPor.Bairro, label: 'Bairro'
                            }, { value: ClienteAgrupadoPor.Cidade, label: 'Cidade' }
                        ]} onChange={(e: any) => { setAgrupado(e) }} />
                        <Select label="Tipo" value={tipo} options={[{
                            value: ModeloRelatorio.Detalhado, label: 'Detalhado'
                        }, { value: ModeloRelatorio.Simplificado, label: 'Simplificado' }]} onChange={(e: any) => { setTipo(e) }} />
                    </Fluid>
                </Modal.Body>
                <Modal.Footer>
                    <Fluid xs={[50, 50]}>

                        <FormButton variant="outline-secondary" className="text-center align-items-center justify-content-center" onClick={() => { }}>
                            <FontAwesomeIcon icon={faCancel} />
                            fechar
                        </FormButton>
                        <FormButton className="justify-content-center" variant="secondary" onClick={() => {
                            setModalShow(false);
                            handlePrint();
                        }}>
                            <FontAwesomeIcon icon={faPrint} />
                            Gerar
                        </FormButton>
                    </Fluid>
                </Modal.Footer>
            </Modal>

            <Card>
                <Card.Body>
                    <Fluid
                        xs={['expand', 'auto']}

                        rowGap={0}
                    >
                        <TextSearch placeholder="Digite para buscar..." />
                        <FormButton variant="text"  >
                            <FontAwesomeIcon icon={faRedo} />
                        </FormButton>
                        <FormButton variant="primary" onClick={() => {
                            setModalShow(true);
                        }}>
                            <FontAwesomeIcon icon={faPrint} />
                            imprimir
                        </FormButton>
                    </Fluid>
                </Card.Body>
            </Card>
            <DataGrid
                columns={columns}
                data={dados}
                refreshKey={refreshKey}
                autoPageSizeOnDesktop
            />
            {
                url && <PdfiumViewer pdfUrl={url} filename="relatorio_clientes" onClose={() => {
                    URL.revokeObjectURL(url);
                    setUrl(null);
                }} />

            }



        </>
    );
}
export default ListViewCliente;
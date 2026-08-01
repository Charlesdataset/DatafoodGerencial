import { faCancel, faFileAlt, faFilePdf, faPrint, faRedo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/Card/Card";
import type { ExtendedColumnDef } from "../../../components/DataGrid/DataGrid";
import DataGrid from "../../../components/DataGrid/DataGrid";
import { FormButton } from "../../../components/Inputs/Button/FormButton";
import Select from "../../../components/Inputs/Select/Select";

import dayjs from "dayjs";
import { TextSearch } from "../../../components/Inputs/TextSearch/TextSearch";
import { Flex } from "../../../components/Layout";
import Fluid from "../../../components/Layout/Fluid";
import { Modal } from "../../../components/Modal";
import { PdfiumViewer } from "../../../components/PdfiumViewer";
import { useApp } from "../../../contexts/AppContext";
import { useNavigation } from "../../../contexts/NavigationContext";
import { ModeloRelatorio } from "../../../reports/cliente/client.report";
import handleGenerateProductReport, { ProdutoAgrupadoPor } from "../../../reports/produto/produt.report";
import handleGenerateProdutoExcelReport from "../../../reports/produto/produto.excel.report";
import { api } from "../../../services/api";


const ListViewProduto: React.FC = () => {
    const navigate = useNavigate();
    const [dados, setDados] = useState([])
    const [refreshKey, setRefreshKey] = useState(0);
    const [url, setUrl] = useState(null);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [textSearch, setTextSearch] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [modalShow, setModalShow] = useState(false);
    const [agrupado, setAgrupado] = useState<ProdutoAgrupadoPor>(ProdutoAgrupadoPor.Nenhum);
    const [tipo, setTipo] = useState<ModeloRelatorio>(ModeloRelatorio.Simplificado);
    const { subscribe } = useNavigation();
    const { companyInfo, currLogoRelatorio, primaryColor } = useApp();
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
        if (!hasLoaded) {
            setHasLoaded(true);
            fetchData();
            return;
        }

        const timer = setTimeout(() => {
            if (textSearch !== "") {
                fetchData();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [textSearch])

    const fetchData = async () => {
        setIsLoading(true);
        setRefreshKey(prev => prev + 1);
        const res = await api.get(`/products?textSearch=${textSearch}&detail=${tipo === ModeloRelatorio.Detalhado ? 'S' : 'N'}`);
        if (res?.status === 200) {
            setDados(res.data);
        }
        else {
            setDados([])
        }
        setIsLoading(false);

    }

    const columns: Array<ExtendedColumnDef<any>> = [
        {
            accessorKey: 'idProduto',
            header: "Código",
            width: 80,
            headerAlign: "center",
            textAlign: "center",

        },
        {
            accessorKey: 'descricao',
            header: "Produto",
            width: 'expand',
            headerAlign: "left",
            textAlign: "left",

        },
        {
            accessorKey: 'precoVenda',
            header: "Preço Venda",
            width: 80,
            headerAlign: "center",
            textAlign: "center",

        },
        {
            accessorKey: 'cest',
            header: "Cest",
            width: 80,
            headerAlign: "center",
            textAlign: "center",

        },
        {
            accessorKey: 'ncm',
            header: "Ncm",
            width: 80,
            headerAlign: "center",
            textAlign: "center",

        },
        {
            accessorKey: 'dataCadastro',
            header: "Data Cadastro",
            width: 180,
            headerAlign: "center",
            textAlign: "center",
            mask: "datetime",

        },
        {
            accessorKey: 'ean1',
            header: "Cód. Barra",
            width: 100,
            headerAlign: "center",
            textAlign: "center",

        }
    ]

    const handlePrint = async () => {
        await fetchData();
        console.log(companyInfo)
        const bytes = await handleGenerateProductReport(dados, agrupado, tipo, companyInfo, currLogoRelatorio);
        const blob = new Blob([bytes], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        setUrl(url);


    }
    const handleExcelReport = async () => {

        const bytes = await handleGenerateProdutoExcelReport(
            dados,
            agrupado,
            tipo,
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
        a.download = `relatorio_produtos.xlsx-${dayjs().format('DD-MM-YYYY')}.xlsx`;
        a.click();
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
                                value: ProdutoAgrupadoPor.Nenhum, label: 'Nenhum'
                            }, {
                                value: ProdutoAgrupadoPor.NCM, label: 'Ncm'
                            },
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
                        xs={[80, 'expand', 100]}
                        lg={['expand', 'auto']}
                    >
                        <TextSearch isLoading={isLoading} placeholder="Digite para buscar..." value={textSearch} onChange={(e) => {
                            setTextSearch(e.target.value);
                        }} />
                        <FormButton isLoading={isLoading} loadAlone variant="text" onClick={() => {
                            fetchData();
                        }} >
                            <FontAwesomeIcon icon={faRedo} />
                        </FormButton>
                        <FormButton bgColor="#C50606" className="justify-content-center" onClick={() => {
                            setModalShow(true);
                        }}>
                            <FontAwesomeIcon icon={faFilePdf} />

                        </FormButton>
                    </Fluid>
                    <DataGrid
                        columns={columns}
                        data={dados}
                        refreshKey={refreshKey}
                        autoPageSizeOnDesktop
                    />
                    {
                        url && <PdfiumViewer
                            pdfUrl={url}
                            filename="relatorio_produtos"
                            onClose={() => {
                                URL.revokeObjectURL(url);
                                setUrl(null);
                            }}
                            hasExcel
                            onExcelClick={() => {
                                handleExcelReport()
                            }}
                        />

                    }
                </Card.Body>
            </Card>



        </>
    );
}
export default ListViewProduto;
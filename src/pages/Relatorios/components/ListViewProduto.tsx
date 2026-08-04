import { faCancel, faFileAlt, faFileExcel, faFilePdf, faPrint, faRedo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/Card/Card";
import type { ExtendedColumnDef } from "../../../components/DataGrid/DataGrid";
import DataGrid from "../../../components/DataGrid/DataGrid";
import { FormButton } from "../../../components/Inputs/Button/FormButton";
import Select from "../../../components/Inputs/Select/Select";

import dayjs from "dayjs";
import { toast } from "react-toastify";
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
            if (hasLoaded)
                fetchData();

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




    const handlePrintExcel = async () => {
        await fetchData();
        if (dados.length && dados.length > 0) {

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
        else {
            toast.info("Não há dados para a impressão!")
        }
    }
    const handlePrintPdf = async () => {
        await fetchData();
        if (dados.length && dados.length > 0) {
            console.log(companyInfo)
            const bytes = await handleGenerateProductReport(dados, agrupado, tipo, companyInfo, currLogoRelatorio);
            const blob = new Blob([bytes], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            setUrl(url);
        }
        else {
            toast.info("Não há dados para a impressão!")
        }


    }

    return (
        <>
            <Modal isOpen={modalShow} onClose={() => { }} size="md">
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
                    <Fluid
                        xs={[100]}
                        sm={['expand']}
                    >

                        <FormButton variant="outline-secondary" className="text-center align-items-center justify-content-center" onClick={() => { }}>
                            <FontAwesomeIcon icon={faCancel} />
                            fechar
                        </FormButton>
                        <FormButton style={{ background: '#217145' }} className="justify-content-center" onClick={() => {

                            handlePrintExcel();
                            setModalShow(false);
                        }}>
                            <FontAwesomeIcon icon={faFileExcel} />
                            Gerar Excel
                        </FormButton>
                        <FormButton style={{ background: '#C50606' }} className="justify-content-center" onClick={() => {
                            handlePrintPdf();
                            setModalShow(false);
                        }}>
                            <FontAwesomeIcon icon={faFilePdf} />
                            Gerar Pdf
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
                        <FormButton className="justify-content-center" onClick={() => {
                            setModalShow(true);
                        }}>
                            <FontAwesomeIcon icon={faPrint} />

                        </FormButton>
                    </Fluid>
                    <DataGrid
                        columns={columns}
                        data={dados}
                        refreshKey={refreshKey}
                        autoPageSizeOnDesktop
                        offsets={12}
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
                                handlePrintPdf()
                            }}
                        />

                    }
                </Card.Body>
            </Card>



        </>
    );
}
export default ListViewProduto;
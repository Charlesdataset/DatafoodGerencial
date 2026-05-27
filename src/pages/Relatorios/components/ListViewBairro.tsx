import { faPrint, faRedo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/Card/Card";
import type { ExtendedColumnDef } from "../../../components/DataGrid/DataGrid";
import DataGrid from "../../../components/DataGrid/DataGrid";
import { FormButton } from "../../../components/Inputs/Button/FormButton";

import { TextSearch } from "../../../components/Inputs/TextSearch/TextSearch";
import Fluid from "../../../components/Layout/Fluid";
import { PdfiumViewer } from "../../../components/PdfiumViewer";
import { useApp } from "../../../contexts/AppContext";
import { useNavigation } from "../../../contexts/NavigationContext";
import handleGenerateBairroReport from "../../../reports/bairro/bairro.report";
import { api } from "../../../services/api";
import type { TableHeaderDef } from "../../../types/v3.types";
import { maskCnpj, maskCpf } from "../../../utils/format";


const ListViewBairro: React.FC = () => {
    const navigate = useNavigate();
    const [dados, setDados] = useState([])
    const [refreshKey, setRefreshKey] = useState(0);
    const [url, setUrl] = useState(null);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [textSearch, setTextSearch] = useState("");
    const [isLoading, setIsLoading] = useState(false);


    const { subscribe } = useNavigation();
    const { companyInfo, currLogoRelatorio } = useApp();
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

            fetchData();

        }, 500);
        return () => clearTimeout(timer);
    }, [textSearch])

    const fetchData = async () => {
        setIsLoading(true);
        setRefreshKey(prev => prev + 1);
        const res = await api.get(`/bairros?textSearch=${textSearch}`);
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
            accessorKey: 'idBairro',
            header: "Código",
            width: 80,
            headerAlign: "center",
            textAlign: "center",

        },
        {
            accessorKey: 'descricao',
            header: "Bairro",
            width: 'expand',
            headerAlign: "left",
            textAlign: "left",

        },
        {
            accessorKey: 'dataCadastro',
            header: "Data Cadastro",
            width: 170,
            headerAlign: "center",
            textAlign: "center",
            mask: 'datetime'

        },


        {
            accessorKey: 'pausar',
            header: "Pausada",
            width: 80,
            headerAlign: "center",
            textAlign: "center",
            badge(value, row) {
                if (value) {
                    return {
                        label: "Sim",
                        color: "green"
                    }
                }
                return {
                    label: "Não",
                    color: "amber"
                }
            },

        },
        {
            accessorKey: 'taxaEntrega',
            header: "Taxa",
            width: 80,
            headerAlign: "center",
            textAlign: "center",


        },
    ]

    const handlePrint = async () => {
        await fetchData();
        console.log(companyInfo)
        const bytes = await handleGenerateBairroReport(dados, companyInfo, currLogoRelatorio);
        const blob = new Blob([bytes], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        setUrl(url);


    }


    return (
        <>


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
                        <FormButton variant="secondary" className="justify-content-center" onClick={() => {
                            handlePrint();
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
                url && <PdfiumViewer
                    pdfUrl={url}
                    filename="relatorio_bairros"
                    onClose={() => {
                        URL.revokeObjectURL(url);
                        setUrl(null);
                    }}
                    excelDataset={{
                        data: dados,
                        columns: [
                            { key: 'idBairro', prefix: 'Código', align: 'center' as const },
                            { key: 'descricao', prefix: 'Bairro' },
                            { key: 'dataCadastro', prefix: 'Data Cadastro', mask: 'date-time' as const, align: 'center' as const },
                            {
                                key: 'pausar', prefix: 'Pausada', pill: true, pillCases: [
                                    { case: 'true', color: '#16a34a', transform: 'Sim' },
                                    { case: 'false', color: '#d97706', transform: 'Não' },
                                ]
                            },
                            { key: 'taxaEntrega', prefix: 'Taxa Entrega', align: 'right' as const, mask: 'currency' as const },
                        ] as TableHeaderDef[],
                        fileName: 'bairros',
                        sheetName: 'Bairros',
                        logo: currLogoRelatorio,
                        title: 'Relatório Bairros',
                        subtitle: `${companyInfo?.cnpj
                            ? (companyInfo.cnpj.length > 11 ? maskCnpj(companyInfo.cnpj) : maskCpf(companyInfo.cnpj))
                            : ''
                            }  ${companyInfo?.nomeCli ?? ''}`.trim(),
                        headerBackgroundColor: '#404040',
                    }}
                />
            }



        </>
    );
}
export default ListViewBairro;
import { faDollar, faHandHoldingDollar, faPrint } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/Card/Card";
import type { ExtendedColumnDef } from "../../../components/DataGrid/DataGrid";
import DataGridServerSide from "../../../components/DataGrid/DataGridServerSide";
import { FormButton } from "../../../components/Inputs/Button/FormButton";
import MultiTextBox from "../../../components/Inputs/MultiTextBox/MultiTextBox";
import Select from "../../../components/Inputs/Select/Select";
import { TextSearch } from "../../../components/Inputs/TextSearch/TextSearch";
import Fluid from "../../../components/Layout/Fluid";
import { useApp } from "../../../contexts/AppContext";
import { useNavigation } from "../../../contexts/NavigationContext";
import { InfoCard } from "./InfoCard";


const ListViewContaReceber: React.FC = () => {
    //@ts-expect-error
    const { dataInicial, dataFinal, companyInfo, currLogoRelatorio } = useApp();
    const [data, setData] = useState([])
    const [totais, setTotais] = useState({
        totalReceber: 0,
        totalParciais: 0,
        totalVencidas: 0,
        totalNaoPagas: 0,
        totalPagas: 0
    })
    const navigate = useNavigate();
    const { subscribe } = useNavigation();
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

    const columns: ExtendedColumnDef<any>[] = [

    ]

    return (
        <>
            <Card>
                <Card.Body>
                    <Fluid
                        xs={['expand', 'auto', 'auto', 'auto', 'auto', 'auto']}
                    >
                        <TextSearch placeholder="Cliente..." />
                        <MultiTextBox
                            values={[]}
                            onChange={() => {

                            }}
                            boxHeight={40}
                            placeholder="Selecione a conta..."
                            className="mb-0"
                        />
                        <Select placeholder="Ordenado por" value="" options={[]} onChange={() => { }} />
                        <Select placeholder="Tipo" value="" options={[]} onChange={() => { }} />
                        <Select placeholder="Status" value="" options={[]} onChange={() => { }} />
                        <FormButton  >
                            <FontAwesomeIcon icon={faPrint} />
                        </FormButton>
                    </Fluid>

                    <DataGridServerSide
                        data={data}
                        columns={columns}
                        limit={10}
                        offset={0}
                        onPaginationChange={() => {

                        }}
                        autoPageSizeOnDesktop={true}
                        totalRows={0}
                        offsets={110}
                        className="mt-4"

                    />
                </Card.Body>
            </Card>


            <Fluid
                className="mt-4"
                xs={['expand']}
            >
                <InfoCard title="Total Receber" value={totais?.totalReceber ?? 0}
                    icone={faHandHoldingDollar} />
                <InfoCard
                    title="Total Parciais"
                    value={totais?.totalParciais ?? 0}
                    accent="rgb(142, 97, 172)"
                    accentPill="rgba(142, 97, 172, 0.2)"
                    icone={faDollar} />
                <InfoCard title="Total Vencidas" value={totais?.totalVencidas ?? 0} accent="rgb(223, 79, 115)"
                    accentPill="rgba(223, 79, 115, 0.2)"
                    icone={faDollar} />
                <InfoCard
                    title="Total Não Pagas"
                    value={totais?.totalNaoPagas ?? 0}
                    accent="rgb(18, 103, 143)"
                    accentPill="rgba(18, 103, 143, 0.2)"
                    icone={faDollar}
                />
                <InfoCard
                    title="Total Pagas"
                    value={totais?.totalPagas ?? 0}
                    accent="rgb(12, 131, 72)"
                    accentPill="rgba(12, 131, 72, 0.2)"
                    icone={faDollar} />

            </Fluid>


        </>
    )
}

export default ListViewContaReceber;
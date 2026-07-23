import { faFilter, faPrint } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "../../../components/Button";
import Card from "../../../components/Card/Card";
import MiniCard from "../../../components/Card/MiniCard";
import SelectCard from "../../../components/Card/SelectCard";
import { ButtonGroup } from "../../../components/Inputs/ButtonGroup/ButtonGroup";
import SectionHeader from "../../../components/Label/SectionHeader";
import { Flex } from "../../../components/Layout";
import Fluid from "../../../components/Layout/Fluid";
import { useApp } from "../../../contexts/AppContext";


const SaidaPorProduto: React.FC = () => {
    const [preData, setPreData] = useState('hoje');
    const [modeloImpressao, setModeloImpressao] = useState('a4')
    const { setCanShowTurnoTipo } = useApp();
    useEffect(() => {
        setCanShowTurnoTipo(true);
    }, [])

    return (
        <>
            <Card>
                <Card.Body>

                    <SectionHeader title="Filtros" icon={faFilter}
                        actions={
                            <>
                                <ButtonGroup
                                    variant="toggle"
                                    wrap
                                    value={preData}
                                    onChange={(e) => {
                                        setPreData(e)
                                    }} options={[
                                        { label: 'Hoje', value: 'hoje' },
                                        { label: 'Ontem', value: 'otem' },
                                        { label: 'Esse mês', value: 'mes_atual' },
                                        { label: 'Mês passado', value: 'mes_passado' },

                                    ]} />
                                <Button variant="primary" size="xs" >
                                    <FontAwesomeIcon icon={faPrint} />
                                    Gerar Relatório
                                </Button>
                            </>
                        }
                    />
                </Card.Body>
            </Card>

            <Card className="mt-5">
                <Card.Body>
                    <Fluid>
                        <Flex direction="column">
                            <SectionHeader title="Modelo"
                                subtitle="Selecione o modelo de impressão" />
                            <SelectCard direction="row" options={[
                                { label: 'A4', value: 'a4' },
                                { label: 'BOBINA', value: 'bobina' }
                            ]}
                                onChange={(e) => { setModeloImpressao(e) }}
                                selectedValue={modeloImpressao} />

                        </Flex>
                        <Flex direction="column">
                            <SectionHeader title="O que exibir ? "
                                subtitle="Selecione as opções" />
                            <Fluid xs={[20]}>
                                <MiniCard checked={false} onChange={() => { }} description="Agrupar por produtos" />
                                <MiniCard checked={false} onChange={() => { }} description="Lucratividade" />
                                <MiniCard checked={false} onChange={() => { }} description="Qtd x Total" />
                                <MiniCard checked={false} onChange={() => { }} description="Cancelados" />
                                <MiniCard checked={false} onChange={() => { }} description="Separar por venda" />
                            </Fluid>

                        </Flex>

                    </Fluid>

                </Card.Body>
            </Card>

        </>
    )


}


export default SaidaPorProduto;
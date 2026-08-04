import type React from "react";
import { useEffect, useState } from "react";
import { useNavigation } from "../../../contexts/NavigationContext";
import { useNavigate } from "react-router-dom";


const SaidaPorProduto: React.FC = () => {
    const [preData, setPreData] = useState('hoje');
    const [modeloImpressao, setModeloImpressao] = useState('a4')
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


    return (
        // <>
        //     <Card>
        //         <Card.Body>

        //             <SectionHeader title="Filtros" icon={faFilter}
        //                 actions={
        //                     <>
        //                         <ButtonGroup
        //                             variant="toggle"
        //                             wrap
        //                             value={preData}
        //                             onChange={(e) => {
        //                                 setPreData(e)
        //                             }} options={[
        //                                 { label: 'Hoje', value: 'hoje' },
        //                                 { label: 'Ontem', value: 'otem' },
        //                                 { label: 'Esse mês', value: 'mes_atual' },
        //                                 { label: 'Mês passado', value: 'mes_passado' },

        //                             ]} />
        //                         <Button variant="primary" size="xs" >
        //                             <FontAwesomeIcon icon={faPrint} />
        //                             Gerar Relatório
        //                         </Button>
        //                     </>
        //                 }
        //             />
        //         </Card.Body>
        //     </Card>

        //     <Card className="mt-5">
        //         <Card.Body>
        //             <Fluid>
        //                 <Flex direction="column">
        //                     <SectionHeader title="Modelo"
        //                         subtitle="Selecione o modelo de impressão" />
        //                     <SelectCard direction="row" options={[
        //                         { label: 'A4', value: 'a4' },
        //                         { label: 'BOBINA', value: 'bobina' }
        //                     ]}
        //                         onChange={(e) => { setModeloImpressao(e) }}
        //                         selectedValue={modeloImpressao} />

        //                 </Flex>
        //                 <Flex direction="column">
        //                     <SectionHeader title="O que exibir ? "
        //                         subtitle="Selecione as opções" />
        //                     <Fluid xs={[20]}>
        //                         <MiniCard checked={false} onChange={() => { }} description="Agrupar por produtos" />
        //                         <MiniCard checked={false} onChange={() => { }} description="Lucratividade" />
        //                         <MiniCard checked={false} onChange={() => { }} description="Qtd x Total" />
        //                         <MiniCard checked={false} onChange={() => { }} description="Cancelados" />
        //                         <MiniCard checked={false} onChange={() => { }} description="Separar por venda" />
        //                     </Fluid>

        //                 </Flex>

        //             </Fluid>

        //         </Card.Body>
        //     </Card>

        // </>
        <p>Construindo</p>
    )


}


export default SaidaPorProduto;
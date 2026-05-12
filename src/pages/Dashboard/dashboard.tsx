import { faFilter } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Card from '../../components/Card/Card';
import { DateRangePicker } from '../../components/DatePicker/DateRangePicker';
import { FormButton } from '../../components/Inputs/Button/FormButton';
import { TextSearch } from '../../components/Inputs/TextSearch/TextSearch';
import Fluid from '../../components/Layout/Fluid';
import { useApp } from '../../contexts/AppContext';
import ComparacaoMesAMesCard from './components/ComparacaoMesAMesCard';
import ContasPagarReceber from './components/ContasPagarReceberCard';
import FormasPagamentoCard from './components/FormaPagamentoCard';
import MetaVsReceitaCard from './components/MetaVsReceitaCard';



const Dashboard: React.FC = () => {
    const { primaryColor } = useApp();
    const dados = {
        items: [
            ["12/2025", 12500, 15320],
            ["01/2026", 14300, 16780],
            ["02/2026", 13800, 15900],
            ["03/2026", 15200, 18250],
            ["04/2026", 14800, 17500],
            ["05/2026", 15600, 19120],
            ["01/2026", 14300, 16780],
            ["02/2026", 13800, 15900],
            ["03/2026", 15200, 18250],
            ["04/2026", 14800, 17500],
            ["12/2025", 12500, 15320],
            ["01/2026", 14300, 16780],
            ["02/2026", 13800, 15900],
            ["03/2026", 15200, 18250],

        ] as [string, number, number][],
        period: "12/2025 a 05/2026"
    };





    return (
        <div>

            <Card>
                <Card.Body>
                    <Fluid
                        xs={['auto', 'expand', 'auto']}
                    >
                        <DateRangePicker endDate={new Date()} startDate={new Date()} onChange={() => { }} />
                        <TextSearch placeholder='Filtre por um turno específico' />
                        <FormButton >
                            <FontAwesomeIcon icon={faFilter} />
                            Filtrar
                        </FormButton>
                    </Fluid>
                </Card.Body>
            </Card>
            <Fluid
                className='mt-4'
                xs={[50, 50]}>
                <FormasPagamentoCard dados={[
                    { nome: 'Cartão de Crédito', valor: 5000, percentual: 50, cor: '#2C7BE5', icon: faFilter, id: '1' },
                    { nome: 'Dinheiro', valor: 3000, percentual: 30, cor: '#2C7BE5', icon: faFilter, id: '2' },
                    { nome: 'Pix', valor: 2000, percentual: 20, cor: '#2C7BE5', icon: faFilter, id: '3' },
                ]} />
                <Fluid xs={[100]}>

                    <MetaVsReceitaCard
                        data={{
                            goal: 50,
                            revenue: 100,
                            period: "mai/2026"
                        }}
                    />
                    <ContasPagarReceber data={{
                        toPay: 5000,
                        toReceive: 8000,
                        period: "mai/2026"
                    }
                    } />
                </Fluid>
                <ComparacaoMesAMesCard
                    items={dados.items}
                    period={dados.period}
                    titulo="Comparativo: Mês x Mês Anterior"
                    label1="Mês"
                    label2="Mês Anterior"
                    cor1=" #2C7BE5"
                    cor2=" #FE8B43"
                />
                <ComparacaoMesAMesCard
                    items={dados.items}
                    period={dados.period}
                    titulo="Total de vendas"
                    label1="Pedido"
                    label2="Delivery"
                    cor1="2C7BE5"
                    cor2="#FE8B43"
                />
            </Fluid>
        </div>
    );
};
export default Dashboard;
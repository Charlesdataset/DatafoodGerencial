import { faBullseye, faChartLine, faCreditCard, faFilter, faMoneyBill, faQrcode, faReceipt, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
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
import InfoCards from './components/InfoCards';
import MetaVsReceitaCard from './components/MetaVsReceitaCard';
import ProdutosCanceladosCard from './components/ProdutosCanceladosCard';
import TopProdutosCard from './components/TopProdutosCard';
import VendasPorHoraCard from './components/VendasPorHoraCard';
import VendasPorVendedorCard from './components/VendasPorVendedorCard';



const Dashboard: React.FC = () => {
    const { primaryColor } = useApp();

    const dadosMesAMes = {
        items: [
            ["12/2025", 12500, 15320],
            ["01/2026", 14300, 16780],
            ["02/2026", 13800, 15900],
            ["03/2026", 15200, 18250],
            ["04/2026", 14800, 17500],
            ["05/2026", 15600, 19120],
        ] as [string, number, number][],
        period: "12/2025 a 05/2026"
    };

    const dadosCanal = {
        items: [
            ["12/2025", 7200, 5300],
            ["01/2026", 8100, 6200],
            ["02/2026", 7900, 5900],
            ["03/2026", 8800, 6400],
            ["04/2026", 8500, 6300],
            ["05/2026", 9100, 6500],
        ] as [string, number, number][],
        period: "12/2025 a 05/2026"
    };
    const dadosComparacaoMetaXVendas = {
        items: [
            ["12/2025", 7200, 5300],
            ["01/2026", 8100, 6200],
            ["02/2026", 7900, 5900],
            ["03/2026", 8800, 6400],
            ["04/2026", 8500, 6300],
            ["05/2026", 9100, 6500],
        ] as [string, number, number][],
        period: "12/2025 a 05/2026"
    };

    const dadosCancelados = [
        { id: 7124, product: 'SELF SERVICE KG', user: 'COSME F.', datetime: '12/05/2026 11:17', motivo: 'DESABILITADO PELO USUARIO' },
        { id: 7125, product: 'SELF SERVICE KG', user: 'COSME F.', datetime: '12/05/2026 11:17', motivo: 'DESABILITADO PELO USUARIO' },
        { id: 7126, product: 'SELF SERVICE KG', user: 'COSME F.', datetime: '12/05/2026 12:15', motivo: 'DESABILITADO PELO USUARIO' },
        { id: 7127, product: 'SELF SERVICE KG', user: 'COSME F.', datetime: '12/05/2026 12:15', motivo: 'DESABILITADO PELO USUARIO' },
        { id: 7128, product: 'MARMITEX N°8-750ML  G', user: 'COSME F.', datetime: '12/05/2026 12:15', motivo: 'DESABILITADO PELO USUARIO' },
        { id: 7129, product: 'SELF SERVICE KG', user: 'COSME F.', datetime: '12/05/2026 12:24', motivo: 'DESABILITADO PELO USUARIO' },
        { id: 7130, product: 'PRATO FEITO COMPLETO UN', user: 'COSME F.', datetime: '12/05/2026 12:48', motivo: 'DESABILITADO PELO USUARIO' },
        { id: 7131, product: 'SABORES SUCO 450ML', user: 'COSME F.', datetime: '12/05/2026 12:48', motivo: 'DESABILITADO PELO USUARIO' },
        { id: 7132, product: 'SELF SERVICE KG', user: 'COSME F.', datetime: '12/05/2026 12:54', motivo: 'DESABILITADO PELO USUARIO' },
        { id: 7133, product: 'SELF SERVICE KG', user: 'COSME F.', datetime: '12/05/2026 12:54', motivo: 'DESABILITADO PELO USUARIO' },
        { id: 7134, product: 'Coca Cola Ks 290ml', user: 'COSME F.', datetime: '12/05/2026 12:54', motivo: 'DESABILITADO PELO USUARIO' },
        { id: 7135, product: 'Refri coca 1l ultra retornavel', user: 'COSME F.', datetime: '12/05/2026 13:05', motivo: 'DESABILITADO PELO USUARIO' },
        { id: 7136, product: 'Cerveja Antarctica Pilsen Retornável 600ml un', user: 'COSME F.', datetime: '12/05/2026 13:40', motivo: 'DESABILITADO PELO USUARIO' },
        { id: 7137, product: 'MARMITEX N°6-500ML M 01', user: 'COSME F.', datetime: '12/05/2026 13:53', motivo: 'DESABILITADO PELO USUARIO' },
        { id: 7138, product: 'PRATO FEITO COMPLETO UN', user: 'COSME F.', datetime: '12/05/2026 14:09', motivo: 'DESABILITADO PELO USUARIO' },
        { id: 7139, product: 'Refri coca 1l ultra retornavel', user: 'COSME F.', datetime: '12/05/2026 14:09', motivo: 'DESABILITADO PELO USUARIO' },
        { id: 7140, product: 'SELF SERVICE KG', user: 'COSME F.', datetime: '12/05/2026 14:09', motivo: 'DESABILITADO PELO USUARIO' },
        { id: 7141, product: 'COCA COLA LATA 350ML', user: 'COSME F.', datetime: '12/05/2026 14:09', motivo: 'DESABILITADO PELO USUARIO' },
    ];

    const topProdutos = [
        { id: 10, name: 'SELF SERVICE KG', revenue: 2466.52, percentage: '40.51' },
        { id: 241, name: 'MARMITEX N°8-750ML  G', revenue: 876, percentage: '14.39' },
        { id: 240, name: 'MARMITEX N°6-500ML M 01', revenue: 828, percentage: '13.60' },
        { id: 6, name: '03-MARMITEX N°6-500ML M', revenue: 450, percentage: '7.39' },
        { id: 97, name: 'PRATO FEITO COMPLETO UN', revenue: 384, percentage: '6.31' },
        { id: 7, name: '02-MARMITEX N°8-750ML  G TAMANHO PADRAO', revenue: 100, percentage: '1.64' },
        { id: 3, name: 'Refrigerante Pet 600ml Coca Cola', revenue: 88, percentage: '1.45' },
        { id: 4, name: 'SABORES SUCO 450ML', revenue: 80, percentage: '1.31' },
        { id: 11, name: 'Refri coca 1l ultra retornavel', revenue: 72, percentage: '1.18' },
        { id: 285, name: 'MARMITEX 500ML - CARNES NOBRES.', revenue: 70, percentage: '1.15' },
    ];


    const vendasVendedor = [
        { name: 'COSME F.', value: 4020.7, percentage: 89 },
        { name: 'JHONATAN GARÇOM', value: 513, percentage: 11 },
    ];

    return (
        <div>
            {/* Filtros */}
            <Card>
                <Card.Body>
                    <Fluid xs={['auto', 'expand', 'auto']}>
                        <DateRangePicker endDate={new Date()} startDate={new Date()} onChange={() => { }} />
                        <TextSearch placeholder='Filtre por um turno específico' />
                        <FormButton>
                            <FontAwesomeIcon icon={faFilter} />
                            Filtrar
                        </FormButton>
                    </Fluid>
                </Card.Body>
            </Card>

            {/* KPIs */}
            <Fluid className='mt-4' xs={[25, 25, 25, 25]}>
                <InfoCards
                    titulo="Total de Vendas"
                    valor="R$ 91.200,00"
                    tendencia={8.4}
                    subtitulo="vs. período anterior"
                    icon={faChartLine}
                    cor="#2C7BE5"
                />
                <InfoCards
                    titulo="Nº de Pedidos"
                    valor="1.248"
                    tendencia={5.2}
                    subtitulo="vs. período anterior"
                    icon={faShoppingCart}
                    cor="#10b981"
                />
                <InfoCards
                    titulo="Ticket Médio"
                    valor="R$ 73,08"
                    tendencia={3.1}
                    subtitulo="vs. período anterior"
                    icon={faReceipt}
                    cor="#f59e0b"
                />
                <InfoCards
                    titulo="Meta Mensal"
                    valor="182%"
                    tendencia={82}
                    subtitulo="acima da meta"
                    icon={faBullseye}
                    cor="#8b5cf6"
                />
            </Fluid>

            {/* Recebimentos + Meta + Contas */}
            <Fluid className='mt-4' xs={[50, 50]}>
                <FormasPagamentoCard dados={[
                    { nome: 'Cartão de Crédito', valor: 45500, percentual: 49.9, cor: '#2C7BE5', icon: faCreditCard, id: '1' },
                    { nome: 'Dinheiro', valor: 27360, percentual: 30.0, cor: '#10b981', icon: faMoneyBill, id: '2' },
                    { nome: 'Pix', valor: 18340, percentual: 20.1, cor: '#f59e0b', icon: faQrcode, id: '3' },
                ]} />
                <Fluid xs={[100]}>
                    <MetaVsReceitaCard
                        data={{
                            goal: 50000,
                            revenue: 91200,
                            period: "mai/2026"
                        }}
                    />
                    <ContasPagarReceber data={{
                        toPay: 12400,
                        toReceive: 23800,
                        period: "mai/2026"
                    }} />
                </Fluid>
            </Fluid>

            {/* Vendas por hora */}
            <Fluid className='mt-4' xs={[100, 50, 50, 100, 50, 50]}>
                <VendasPorHoraCard
                    data={{
                        hours: [
                            "2026-05-11 17:43:28", "2026-05-11 18:43:28", "2026-05-11 19:43:28",
                            "2026-05-11 20:43:28", "2026-05-11 21:43:28", "2026-05-11 22:43:28",
                            "2026-05-11 23:43:28", "2026-05-12 00:43:28", "2026-05-12 01:43:28",
                            "2026-05-12 02:43:28", "2026-05-12 03:43:28", "2026-05-12 04:43:28",
                            "2026-05-12 05:43:28", "2026-05-12 06:43:28", "2026-05-12 07:43:28",
                            "2026-05-12 08:43:28", "2026-05-12 09:43:28", "2026-05-12 10:43:28",
                            "2026-05-12 11:43:28", "2026-05-12 12:43:28", "2026-05-12 13:43:28",
                            "2026-05-12 14:43:28", "2026-05-12 15:43:28", "2026-05-12 16:43:28",
                            "2026-05-12 17:43:28",
                        ],
                        values: [0, 0, 0, 0, 366, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 637.35, 1717.95, 2424.975, 1054.85, 235.4, 0, 0, 0],
                        period: "Hoje",
                    }}
                />
                <ComparacaoMesAMesCard
                    items={dadosMesAMes.items}
                    period={dadosMesAMes.period}
                    titulo="Comparativo: Mês x Mês Anterior"
                    label1="Mês Atual"
                    label2="Mês Anterior"
                    cor1="#2C7BE5"
                    cor2="#FE8B43"
                />
                <VendasPorVendedorCard data={vendasVendedor} period="Hoje" />
                <ProdutosCanceladosCard data={dadosCancelados} period="Hoje" />
                <TopProdutosCard data={topProdutos} period="Hoje" />

                <ComparacaoMesAMesCard
                    items={dadosCanal.items}
                    period={dadosCanal.period}
                    titulo="Vendas por Canal"
                    label1="Pedido Balcão"
                    label2="Delivery"
                    cor1="#2C7BE5"
                    cor2="#FE8B43"
                />
            </Fluid>


        </div>
    );
};
export default Dashboard;
import { faBullseye, faChartLine, faCreditCard, faMoneyBill, faQrcode, faReceipt, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import GlobalLoading from '../../components/GlobalLoading/GlobalLoading';
import Fluid from '../../components/Layout/Fluid';
import { useApp } from '../../contexts/AppContext';
import { api } from '../../services/api';
import ComparacaoMesAMesCard from './components/ComparacaoMesAMesCard';
import ContasPagarReceber from './components/ContasPagarReceberCard';
import FormasPagamentoCard from './components/FormaPagamentoCard';
import InfoCards from './components/InfoCards';
import MetaVsReceitaCard from './components/MetaVsReceitaCard';
import ProdutosCanceladosCard from './components/ProdutosCanceladosCard';
import TopClientesCard from './components/TopClientesCard';
import TopProdutosCard from './components/TopProdutosCard';
import type { TopProduto } from './components/TopProdutosCard';
import type { TopCliente } from './components/TopClientesCard';
import type { VendedorData } from './components/VendasPorVendedorCard';
import VendasPorHoraCard from './components/VendasPorHoraCard';
import VendasPorVendedorCard from './components/VendasPorVendedorCard';

interface VendasPorHoraData {
    hours: string[];
    values: number[];
    period: string;
}

interface RecebimentoResponse {
    type: string;
    value: number;
    id_turno: number;
    name: string;
    percentage: string;
}

interface FormaPagamentoItem {
    id: string;
    nome: string;
    valor: number;
    percentual: number;
    cor?: string;
    icon: any;
}

interface ProdutoCancelado {
    id: number;
    product: string;
    user: string;
    datetime: string;
    motivo: string;
}

interface TopProdutoResponse {
    idProduto: number;
    nomeProduto: string;
    valorTotal: number;
    participacao: string;
}

interface TopClienteResponse {
    idCliente: number;
    nomeCliente: string;
    valorTotal: number;
    participacao: string;
}

interface VendasPorCanalItem {
    posicao: number;
    canal: string;
    nome: string;
    cor?: string;
    valorTotal: number;
    quantidadePedidos: number;
    ticketMedio: number;
    participacao: string;
}

const VENDAS_POR_HORA_EMPTY: VendasPorHoraData = {
    hours: [],
    values: [],
    period: ""
};

const getRecebimentoIcon = (type: string) => {
    if (type === "DIN") return faMoneyBill;
    if (type === "CRE" || type === "DEB") return faCreditCard;
    if (type === "PIX") return faQrcode;
    if (type === "COR") return faReceipt;
    return faMoneyBill;
};

const getRecebimentoColor = (type: string) => {
    if (type === "DIN") return '#10b981';
    if (type === "CRE" || type === "DEB") return '#2C7BE5';
    if (type === "PIX") return '#f59e0b';
    if (type === "COR") return '#8b5cf6';
    return '#6b7280';
};

const normalizeVendedor = (item: any): VendedorData => ({
    name: item.nomeVendedor ?? item.nome ?? '—',
    value: Number(item.valorTotal ?? item.valor ?? 0),
    percentage: Number(item.participacao ?? item.percentual ?? 0),
});

const normalizeTopProduto = (item: any): TopProduto => ({
    id: item.idProduto ?? item.id ?? 0,
    name: item.nomeProduto ?? item.name ?? '—',
    revenue: Number(item.valorTotal ?? item.revenue ?? 0),
    percentage: item.participacao ?? item.percentage ?? '0',
});

const normalizeTopCliente = (item: any): TopCliente => ({
    clientId: item.idCliente ?? item.id ?? 0,
    client: item.nomeCliente ?? item.client ?? '—',
    value: Number(item.valorTotal ?? item.value ?? 0),
});

const normalizeVendasPorCanal = (item: any): VendasPorCanalItem => ({
    posicao: Number(item.posicao ?? 0),
    canal: item.canal ?? item.name ?? '—',
    nome: item.nome ?? item.canal ?? '—',
    cor: item.cor,
    valorTotal: Number(item.valorTotal ?? item.value ?? 0),
    quantidadePedidos: Number(item.quantidadePedidos ?? 0),
    ticketMedio: Number(item.ticketMedio ?? 0),
    participacao: item.participacao ?? '0',
});

const mapRecebimentoToFormaPagamento = (item: RecebimentoResponse): FormaPagamentoItem => ({
    id: `${item.type}-${item.id_turno}`,
    nome: item.name,
    valor: item.value,
    percentual: Number(item.percentage) || 0,
    cor: getRecebimentoColor(item.type),
    icon: getRecebimentoIcon(item.type),
});

const Dashboard: React.FC = () => {
    const [resumo, setResumo] = useState<any>(null);
    const [vendasPorHora, setVendasPorHora] = useState<VendasPorHoraData>(VENDAS_POR_HORA_EMPTY);
    const [vendasPorFormaPagto, setVendasPorFormaPagto] = useState<FormaPagamentoItem[]>([]);
    const [ganhoClientes, setGanhoClientes] = useState<VendasPorHoraData>(VENDAS_POR_HORA_EMPTY);
    const [vendasPorVendedor, setVendasPorVendedor] = useState<VendedorData[]>([]);
    const [vendasPorEntregador, setVendasPorEntregador] = useState<VendedorData[]>([]);
    const [produtosCancelados, setProdutosCancelados] = useState<ProdutoCancelado[]>([]);
    const [topProdutos, setTopProdutos] = useState<TopProduto[]>([]);
    const [topClientes, setTopClientes] = useState<TopCliente[]>([]);
    const [vendasPorCanal, setVendasPorCanal] = useState<VendasPorCanalItem[]>([]);
    const [hasLoaded, setHasLoaded] = useState(false);

    const { dataInicial, dataFinal, turnosSelecionados } = useApp();

    const findAllData = async () => {
        try {
            const turnosIds = turnosSelecionados.map(t => t.id);
            const tipoTurnoParam = turnosIds.length > 0 ? turnosIds : undefined;
            const params = {
                dataInicio: dataInicial?.toISOString(),
                dataFim: dataFinal?.toISOString(),
                tipoTurno: tipoTurnoParam
            };

            const [
                resumoResult,
                vendasPorHoraResult,
                vendasPorFormaPagtoResult,
                ganhoClientesResult,
                vendasPorVendedorResult,
                vendasPorEntregadorResult,
                produtosCanceladosResult,
                topProdutosResult,
                topClientesResult,
                vendasPorCanalResult
            ] = await Promise.allSettled([
                api.get(`/dashboard/resumo`, { params }),
                api.get(`/dashboard/vendas-por-hora`, { params }),
                api.get(`/dashboard/vendas-por-recebimento`, { params }),
                api.get(`/dashboard/ganho-clientes`, { params }),
                api.get(`/dashboard/top-vendedores`, { params }),
                api.get(`/dashboard/top-entregadores`, { params }),
                api.get(`/dashboard/produtos-cancelados`, { params }),
                api.get(`/dashboard/top-produtos-vendidos`, { params }),
                api.get(`/dashboard/top-clientes`, { params }),
                api.get(`/dashboard/vendas-canais`, { params }),
            ]);

            if (resumoResult.status === 'fulfilled' && resumoResult.value.status === 200) {
                setResumo(resumoResult.value.data);
            }

            if (vendasPorHoraResult.status === 'fulfilled' && vendasPorHoraResult.value.status === 200) {
                setVendasPorHora(vendasPorHoraResult.value.data ?? VENDAS_POR_HORA_EMPTY);
            }

            if (vendasPorFormaPagtoResult.status === 'fulfilled' && vendasPorFormaPagtoResult.value.status === 200) {
                const receipts = vendasPorFormaPagtoResult.value.data?.receipts ?? [];
                setVendasPorFormaPagto(receipts.map(mapRecebimentoToFormaPagamento));
            }

            if (ganhoClientesResult.status === 'fulfilled' && ganhoClientesResult.value.status === 200) {
                setGanhoClientes(ganhoClientesResult.value.data ?? VENDAS_POR_HORA_EMPTY);
            }

            if (vendasPorVendedorResult.status === 'fulfilled' && vendasPorVendedorResult.value.status === 200) {
                setVendasPorVendedor((vendasPorVendedorResult.value.data ?? []).map(normalizeVendedor));
            }

            if (vendasPorEntregadorResult.status === 'fulfilled' && vendasPorEntregadorResult.value.status === 200) {
                setVendasPorEntregador((vendasPorEntregadorResult.value.data ?? []).map(normalizeVendedor));
            }

            if (produtosCanceladosResult.status === 'fulfilled' && produtosCanceladosResult.value.status === 200) {
                setProdutosCancelados(produtosCanceladosResult.value.data ?? []);
            }

            if (topProdutosResult.status === 'fulfilled' && topProdutosResult.value.status === 200) {
                setTopProdutos((topProdutosResult.value.data ?? []).map(normalizeTopProduto));
            }

            if (topClientesResult.status === 'fulfilled' && topClientesResult.value.status === 200) {
                setTopClientes((topClientesResult.value.data ?? []).map(normalizeTopCliente));
            }

            if (vendasPorCanalResult.status === 'fulfilled' && vendasPorCanalResult.value.status === 200) {
                setVendasPorCanal((vendasPorCanalResult.value.data ?? []).map(normalizeVendasPorCanal));
            }

            setHasLoaded(true);
        }
        catch (error: any) {
            console.log("Erro ao buscar dados do dashboard:", error);
            setHasLoaded(true);
        }
    };

    useEffect(() => {
    findAllData();
}, [dataInicial, dataFinal, turnosSelecionados]);

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

const vendasCanalItems = vendasPorCanal.length > 0
    ? vendasPorCanal.map((item) => [item.nome, item.valorTotal, item.quantidadePedidos] as [string, number, number])
    : dadosCanal.items;

return (
    <>
        {!hasLoaded && <GlobalLoading />}
        {hasLoaded && (
            <div>


                {/* KPIs */}
                <Fluid xs={[25, 25, 25, 25]}>
                    <InfoCards
                        titulo="Total de Vendas"
                        valor={resumo?.vendas.atual}
                        tendencia={resumo?.vendas.crescimento}
                        subtitulo="vs. período anterior"
                        icon={faChartLine}
                        cor="#2C7BE5"
                    />
                    <InfoCards
                        titulo="Nº de Pedidos"
                        valor={resumo?.pedidos.atual}
                        tendencia={resumo?.pedidos.crescimento}
                        subtitulo="vs. período anterior"
                        icon={faShoppingCart}
                        cor="#10b981"
                    />
                    <InfoCards
                        titulo="Ticket Médio"
                        valor={resumo?.ticketMedio.atual}
                        tendencia={resumo?.ticketMedio.crescimento}
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
                <Fluid className='mt-4' xs={[100, 50, 50]}>
                    <VendasPorHoraCard data={vendasPorHora} />
                    <FormasPagamentoCard dados={vendasPorFormaPagto} />
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
                <Fluid className='mt-4' xs={[100, 50, 50, 50, 50, 100, 50]}>

                    <VendasPorHoraCard
                        data={ganhoClientes}
                        titulo="Ganho de Clientes"
                        cor="#10b981"
                        labelFormatter={(l) => l}
                        valueFormatter={(v) => `${v} cliente${v !== 1 ? 's' : ''}`}
                        yAxisFormatter={(v) => String(v)}
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
                    <VendasPorVendedorCard data={vendasPorVendedor} period="Hoje" />
                    <VendasPorVendedorCard data={vendasPorEntregador} titulo="Vendas por Entregador" period="Hoje" />
                    <ProdutosCanceladosCard data={produtosCancelados} period="Hoje" />
                    <TopProdutosCard data={topProdutos} period="Hoje" />
                    <TopClientesCard data={topClientes} period="Hoje" />
                    <ComparacaoMesAMesCard
                        items={vendasCanalItems}
                        period={vendasPorCanal.length > 0 ? 'Período selecionado' : dadosCanal.period}
                        titulo="Vendas por Canal"
                        label1="Valor Total"
                        label2="Pedidos"
                        cor1="#2C7BE5"
                        cor2="#FE8B43"
                    />
                    <MetaVsReceitaCard
                        data={{
                            goal: 0,
                            revenue: 9,
                            period: "mai de 2026"
                        }}
                        titulo="Meta de Clientes"
                        metaLabel="Meta"
                        receitaLabel="Conquistados"
                        formatter={(v) => `${v} cliente${v !== 1 ? 's' : ''}`}
                    />
                </Fluid>


            </div>
        )}
    </>

);
};
export default Dashboard;
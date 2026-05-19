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
import type { MultiSeriesBarData } from './components/MultiSeriesBarCard';
import MultiSeriesBarCard from './components/MultiSeriesBarCard';
import ProdutosCanceladosCard from './components/ProdutosCanceladosCard';
import type { TopCliente } from './components/TopClientesCard';
import type { TopProduto } from './components/TopProdutosCard';
import TopProdutosCard from './components/TopProdutosCard';
import VendasPorHoraCard from './components/VendasPorHoraCard';

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
interface ProdutoCanceladoResponse {
    itens: Array<ProdutoCancelado>
    period: string;
}


interface TopResonse {
    itens: Array<TopProduto>;
    period: string;
}





interface TopClienteResponse {
    idCliente: number;
    nomeCliente: string;
    valorTotal: number;
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

const getRecebimentoColor = (type: string, primaryColor: string) => {
    if (type === "DIN") return '#10b981';
    if (type === "CRE" || type === "DEB") return primaryColor;
    if (type === "PIX") return '#f59e0b';
    if (type === "COR") return '#8b5cf6';
    return '#6b7280';
};

const normalizeVendedor = (item: any) => ({
    name: item.nomeVendedor ?? item.nome ?? '—',
    revenue: Number(item.valorTotal ?? item.valor ?? 0),
    percentage: Number(item.participacao ?? item.percentual ?? 0),
});
const normalizeEntregador = (item: any) => ({
    name: item.nomeEntregador ?? '—',
    revenue: Number(item.valorTotal ?? item.valor ?? 0),
    percentage: Number(item.participacao ?? item.percentual ?? 0),
});



const normalizeTopCliente = (item: any): TopCliente => ({
    clientId: item.idCliente ?? item.id ?? 0,
    client: item.nomeCliente ?? item.client ?? '—',
    value: Number(item.valorTotal ?? item.value ?? 0),
});

const mapRecebimentoToFormaPagamento = (item: RecebimentoResponse, primaryColor: string): FormaPagamentoItem => ({
    id: `${item.type}-${item.id_turno}`,
    nome: item.name,
    valor: item.value,
    percentual: Number(item.percentage) || 0,
    cor: getRecebimentoColor(item.type, primaryColor),
    icon: getRecebimentoIcon(item.type),
});

const Dashboard: React.FC = () => {
    const [resumo, setResumo] = useState<any>(null);
    const [vendasPorHora, setVendasPorHora] = useState<VendasPorHoraData>(VENDAS_POR_HORA_EMPTY);
    const [vendasPorFormaPagto, setVendasPorFormaPagto] = useState<FormaPagamentoItem[]>([]);
    const [ganhoClientes, setGanhoClientes] = useState<VendasPorHoraData>(VENDAS_POR_HORA_EMPTY);
    const [vendasPorVendedor, setVendasPorVendedor] = useState<TopResonse>(null);
    const [vendasPorEntregador, setVendasPorEntregador] = useState<TopResonse>(null);
    const [produtosCancelados, setProdutosCancelados] = useState<ProdutoCanceladoResponse>(null);
    const [topProdutos, setTopProdutos] = useState<TopResonse>(null);
    const [topClientes, setTopClientes] = useState<TopResonse>(null);
    const [vendasPorCanal, setVendasPorCanal] = useState<MultiSeriesBarData | null>(null);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [comparacaoMes, setComparacaoMes] = useState<any>(null);

    const { dataInicial, dataFinal, turnosSelecionados, primaryColor } = useApp();

    const findAllData = async () => {
        try {
            const turnosIds = turnosSelecionados.map(t => t.id);
            console.log('Turnos selecionados IDs:', turnosIds);

            // Construir URLSearchParams para garantir o formato correto
            const searchParams = new URLSearchParams();

            if (dataInicial) {
                searchParams.append('dataInicio', dataInicial.toISOString());
            }
            if (dataFinal) {
                searchParams.append('dataFim', dataFinal.toISOString());
            }

            // Adiciona cada turno como parâmetro separado
            if (turnosIds.length > 0) {
                turnosIds.forEach(id => {
                    searchParams.append('tipoTurnos', id.toString());
                });
            }

            const queryString = searchParams.toString();
            console.log('Query string:', queryString);

            // // Usar a query string diretamente
            // const baseUrl = `/dashboard/resumo${queryString ? `?${queryString}` : ''}`;

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
                vendasPorCanalResult,
                comparacaoMesResult,
            ] = await Promise.allSettled([
                api.get(`/dashboard/resumo${queryString ? `?${queryString}` : ''}`),
                api.get(`/dashboard/vendas-por-hora${queryString ? `?${queryString}` : ''}`),
                api.get(`/dashboard/vendas-por-recebimento${queryString ? `?${queryString}` : ''}`),
                api.get(`/dashboard/ganho-clientes${queryString ? `?${queryString}` : ''}`),
                api.get(`/dashboard/top-vendedores${queryString ? `?${queryString}` : ''}`),
                api.get(`/dashboard/top-entregadores${queryString ? `?${queryString}` : ''}`),
                api.get(`/dashboard/produtos-cancelados${queryString ? `?${queryString}` : ''}`),
                api.get(`/dashboard/top-produtos-vendidos${queryString ? `?${queryString}` : ''}`),
                api.get(`/dashboard/top-clientes${queryString ? `?${queryString}` : ''}`),
                api.get(`/dashboard/vendas-canais${queryString ? `?${queryString}` : ''}`),
                api.get(`/dashboard/comparacao-mes${queryString ? `?${queryString}` : ''}`),
            ]);

            if (resumoResult.status === 'fulfilled' && resumoResult.value.status === 200) {
                setResumo(resumoResult.value.data);
            }

            if (vendasPorHoraResult.status === 'fulfilled' && vendasPorHoraResult.value.status === 200) {
                setVendasPorHora(vendasPorHoraResult.value.data ?? VENDAS_POR_HORA_EMPTY);
            }

            if (vendasPorFormaPagtoResult.status === 'fulfilled' && vendasPorFormaPagtoResult.value.status === 200) {
                const receipts = vendasPorFormaPagtoResult.value.data?.receipts ?? [];
                setVendasPorFormaPagto(receipts.map(item => mapRecebimentoToFormaPagamento(item, primaryColor)));
            }

            if (ganhoClientesResult.status === 'fulfilled' && ganhoClientesResult.value.status === 200) {
                setGanhoClientes(ganhoClientesResult.value.data && ganhoClientesResult.value.data?.values.length ?
                    ganhoClientesResult.value.data : VENDAS_POR_HORA_EMPTY);
            }

            if (vendasPorVendedorResult.status === 'fulfilled' && vendasPorVendedorResult.value.status === 200) {
                setVendasPorVendedor((vendasPorVendedorResult.value.data ?? []));
            }

            if (vendasPorEntregadorResult.status === 'fulfilled' && vendasPorEntregadorResult.value.status === 200) {
                setVendasPorEntregador((vendasPorEntregadorResult.value.data ?? []));
            }

            if (produtosCanceladosResult.status === 'fulfilled' && produtosCanceladosResult.value.status === 200) {
                setProdutosCancelados(produtosCanceladosResult.value.data ?? null);
            }

            if (topProdutosResult.status === 'fulfilled' && topProdutosResult.value.status === 200) {
                setTopProdutos((topProdutosResult.value.data));
            }

            if (topClientesResult.status === 'fulfilled' && topClientesResult.value.status === 200) {
                setTopClientes((topClientesResult.value.data ?? []));
            }

            if (vendasPorCanalResult.status === 'fulfilled' && vendasPorCanalResult.value.status === 200) {
                setVendasPorCanal(vendasPorCanalResult.value.data ?? null);
            }
            if (comparacaoMesResult.status === 'fulfilled' && comparacaoMesResult.value.status === 200) {
                setComparacaoMes(comparacaoMesResult.value.data);
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
                            cor={primaryColor}
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
                        <VendasPorHoraCard data={vendasPorHora} cor={primaryColor} />
                        <FormasPagamentoCard dados={vendasPorFormaPagto} primaryColor={primaryColor} />
                        <Fluid xs={[100]}>
                            <MetaVsReceitaCard
                                data={{
                                    goal: 50000,
                                    revenue: 91200,
                                    period: "mai/2026"
                                }}
                                primaryColor={primaryColor}
                            />

                            <ContasPagarReceber data={{
                                toPay: 12400,
                                toReceive: 23800,
                                period: "mai/2026"
                            }} primaryColor={primaryColor} />
                        </Fluid>
                    </Fluid>

                    {/* Vendas por hora */}
                    <Fluid className='mt-4' xs={[50, 50, 100, 50, 50, 50, 50, 50, 50]}>

                        <VendasPorHoraCard
                            data={ganhoClientes}
                            titulo="Ganho de Clientes"
                            cor={primaryColor}
                            labelFormatter={(l) => l}
                            valueFormatter={(v) => `${v} cliente${v !== 1 ? 's' : ''}`}
                            yAxisFormatter={(v) => String(v)}
                        />
                        <ComparacaoMesAMesCard
                            items={comparacaoMes?.items}
                            period={comparacaoMes?.period}
                            titulo="Comparativo: Mês x Mês Anterior"
                            label1="Mês Atual"
                            label2="Mês Anterior"
                            cor1={primaryColor}
                            cor2="#FE8B43"
                        />

                        <ProdutosCanceladosCard data={produtosCancelados.itens ?? []} period={produtosCancelados.period} primaryColor={primaryColor} />
                        <TopProdutosCard data={topProdutos.itens ?? []} period={topProdutos.period} cor={primaryColor}  />
                        <TopProdutosCard data={topClientes.itens ?? []} period="Hoje" cor={primaryColor} titulo='Top Clientes' />
                        <TopProdutosCard data={vendasPorVendedor.itens ?? []} period="Hoje" titulo='Top Vendedores' cor={primaryColor} />
                        <TopProdutosCard data={vendasPorEntregador.itens ?? []} titulo="Top Entregadores" period="Hoje" cor={primaryColor} />
                        <MultiSeriesBarCard
                            data={vendasPorCanal}
                            titulo="Vendas por Canal"
                            cor={primaryColor}
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
                            primaryColor={primaryColor}
                        />

                    </Fluid>


                </div>
            )}
        </>

    );
};
export default Dashboard;
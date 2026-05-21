import { faFileAlt } from '@fortawesome/free-solid-svg-icons';
import React, { useEffect } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../../components/Card/Card';
import Fluid from '../../components/Layout/Fluid';
import { useApp } from '../../contexts/AppContext';
import ListViewBairro from './components/ListViewBairro';
import ListViewCliente from './components/ListViewCliente';
import { ListViewNotaEntreda } from './components/ListViewNotaEntrada';
import ListViewProduto from './components/ListViewProduto';
import ReportList from './components/ReportList';



const Relatorios: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setCanShowTurnoTipo } = useApp();

    // Pega o parâmetro 'listing' da URL
    const searchParams = new URLSearchParams(location.search);
    const listing = searchParams.get('listing');

    // Função para navegar com o parâmetro listing
    const handleNavigateToListing = (tipo: string) => {
        navigate(`/reports?listing=${tipo}`);
    };
    useEffect(() => {
        setCanShowTurnoTipo(false)
    }, [])

    // Decide qual componente de listagem renderizar baseado no parâmetro
    const renderListView = () => {
        switch (listing) {
            case 'cliente':
                return <ListViewCliente />;
            case 'bairro':
                return <ListViewBairro />;
            case 'produto':
                return <ListViewProduto />;
            case 'nota-entrada':
                return <ListViewNotaEntreda />;
            default:
                return null;
        }
    };

    return (
        <>
            {!listing && (
                <Card>
                    <Card.Body>
                        <Fluid xs={[50, 50]}>
                            <ReportList
                                icon={faFileAlt}
                                title="Cadastros"
                                accentColor="#185FA5"
                                accentBg="rgba(24, 95, 165, 0.12)"
                                reports={[
                                    {
                                        name: "Clientes",
                                        onClick: () => handleNavigateToListing('cliente')
                                    },
                                    {
                                        name: "Bairros",
                                        onClick: () => handleNavigateToListing('bairro')
                                    },
                                    {
                                        name: "Produtos",
                                        onClick: () => handleNavigateToListing('produto')
                                    },
                                ]}
                            />
                            <ReportList
                                icon={faFileAlt}
                                title="Fiscais"
                                accentColor="#185FA5"
                                accentBg="rgba(24, 95, 165, 0.12)"
                                reports={[
                                    {
                                        name: "Nota Entrada",
                                        onClick: () => handleNavigateToListing('nota-entrada')
                                    },
                                    {
                                        name: "Bairros",
                                        onClick: () => handleNavigateToListing('bairro')
                                    },
                                    {
                                        name: "Produtos",
                                        onClick: () => handleNavigateToListing('produto')
                                    },
                                ]}
                            />
                        </Fluid>
                    </Card.Body>
                </Card>

            )}

            {/* Renderiza a listagem selecionada */}
            {renderListView()}
        </>
    );
};

export default Relatorios;
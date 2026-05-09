import { faFileAlt } from '@fortawesome/free-solid-svg-icons';
import React from 'react';

import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../../components/Card/Card';
import Fluid from '../../components/Layout/Fluid';
import ListViewBairro from './components/ListViewBairro';
import ListViewCliente from './components/ListViewCliente';
import ListViewProduto from './components/ListViewProduto';
import ReportList from './components/ReportList';



const Relatorios: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Pega o parâmetro 'listing' da URL
    const searchParams = new URLSearchParams(location.search);
    const listing = searchParams.get('listing');

    // Função para navegar com o parâmetro listing
    const handleNavigateToListing = (tipo: string) => {
        navigate(`/reports?listing=${tipo}`);
    };

    // Decide qual componente de listagem renderizar baseado no parâmetro
    const renderListView = () => {
        switch (listing) {
            case 'cliente':
                return <ListViewCliente />;
            case 'bairro':
                return <ListViewBairro />;
            case 'produto':
                return <ListViewProduto />;
            default:
                return null;
        }
    };

    return (
        <>
            {!listing && (
                <Card>
                    <Card.Body>
                        <Fluid>
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
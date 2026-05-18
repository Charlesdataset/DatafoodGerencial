// ProdutosCanceladosCard.tsx
import { faBan, faBoxOpen, faClock, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import Card from "../../../components/Card/Card";
import styles from "./ProdutosCanceladosCard.module.scss";

export interface ProdutoCancelado {
    id: number;
    product: string;
    user: string;
    datetime: string;
    motivo: string;
}

interface ProdutosCanceladosCardProps {
    data: ProdutoCancelado[];
    titulo?: string;
    period?: string;
    primaryColor?: string;
}

const PAGE_SIZE = 7;

export default function ProdutosCanceladosCard({
    data,
    titulo = "Produtos Cancelados",
    period,
    primaryColor = "#2C7BE5",
}: ProdutosCanceladosCardProps) {
    const [page, setPage] = useState(0);
    const totalPages = Math.ceil(data.length / PAGE_SIZE);
    const slice = data.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

    return (
        <Card className={styles.card}>
            <Card.Header className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                    <span className={styles.icon} style={{ background: `${primaryColor}1a`, color: primaryColor }}>
                        <FontAwesomeIcon icon={faBan} />
                    </span>
                    <span className={styles.title}>{titulo}</span>
                    <span className={styles.badge}>{data.length}</span>
                </div>
                {period && <span className={styles.period}>{period}</span>}
            </Card.Header>

            <Card.Body className={styles.cardBody}>
                {data.length === 0 ? (
                    <div className={styles.empty}>
                        <FontAwesomeIcon icon={faBoxOpen} />
                        <span>Nenhum produto cancelado</span>
                    </div>
                ) : (
                    <>
                        {/* Tabela */}
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.thId}>#</th>
                                        <th>Produto</th>
                                        <th className={styles.thUser}>Usuário</th>
                                        <th className={styles.thDate}>Data/Hora</th>
                                        <th className={styles.thMotivo}>Motivo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {slice.map((item) => (
                                        <tr key={item.id} className={styles.row}>
                                            <td className={styles.tdId}>{item.id}</td>
                                            <td className={styles.tdProduct}>
                                                <span className={styles.productName}>{item.product}</span>
                                            </td>
                                            <td className={styles.tdUser}>
                                                <span className={styles.userChip}>
                                                    <FontAwesomeIcon icon={faUser} />
                                                    {item.user}
                                                </span>
                                            </td>
                                            <td className={styles.tdDate}>
                                                <span className={styles.dateChip}>
                                                    <FontAwesomeIcon icon={faClock} />
                                                    {item.datetime}
                                                </span>
                                            </td>
                                            <td className={styles.tdMotivo}>
                                                <span className={styles.motivoBadge}>{item.motivo}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginação */}
                        {totalPages > 1 && (
                            <div className={styles.pagination}>
                                <span className={styles.paginationInfo}>
                                    {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, data.length)} de {data.length}
                                </span>
                                <div className={styles.paginationButtons}>
                                    <button
                                        className={styles.pageBtn}
                                        onClick={() => setPage(p => Math.max(p - 1, 0))}
                                        disabled={page === 0}
                                    >
                                        ‹
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => (
                                        <button
                                            key={i}
                                            className={`${styles.pageBtn} ${i === page ? styles.pageBtnActive : ''}`}
                                            onClick={() => setPage(i)}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        className={styles.pageBtn}
                                        onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))}
                                        disabled={page === totalPages - 1}
                                    >
                                        ›
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card.Body>
        </Card>
    );
}

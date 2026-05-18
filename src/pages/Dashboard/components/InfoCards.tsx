import { faArrowTrendDown, faArrowTrendUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useRef } from "react";
import { useCountUp } from "react-countup";
import Card from "../../../components/Card/Card";
import styles from './InfoCards.module.scss';

interface KPICardProps {
    titulo: string;
    valor: string | number | undefined;
    subtitulo?: string;
    tendencia?: number;
    icon: any;
    cor?: string;
}

interface ParsedValor {
    num: number;
    prefix: string;
    suffix: string;
    decimals: number;
}

function parseValor(valor: string | number | undefined): ParsedValor | null {
    if (valor === undefined || valor === null) return null;

    if (typeof valor === 'number') {
        const isDecimal = valor % 1 !== 0;
        return { num: valor, prefix: isDecimal ? 'R$ ' : '', suffix: '', decimals: isDecimal ? 2 : 0 };
    }

    // "R$ 15.320,50" ou "R$ 15.320"
    const currencyMatch = valor.match(/^R\$\s*([\d.]+(?:,\d+)?)/);
    if (currencyMatch) {
        const num = parseFloat(currencyMatch[1].replace(/\./g, '').replace(',', '.'));
        if (!isNaN(num)) return { num, prefix: 'R$ ', suffix: '', decimals: 2 };
    }

    // "182%" ou "8,2%"
    const percentMatch = valor.match(/^([\d.,]+)%$/);
    if (percentMatch) {
        const num = parseFloat(percentMatch[1].replace(',', '.'));
        if (!isNaN(num)) return { num, prefix: '', suffix: '%', decimals: num % 1 !== 0 ? 1 : 0 };
    }

    // número puro "1234"
    const plainMatch = valor.match(/^[\d.]+$/);
    if (plainMatch) {
        const num = parseFloat(valor);
        if (!isNaN(num)) return { num, prefix: '', suffix: '', decimals: 0 };
    }

    return null;
}

function AnimatedNumber({ parsed }: { parsed: ParsedValor }) {
    const ref = useRef<HTMLSpanElement>(null) as React.RefObject<HTMLElement>;
    const { update } = useCountUp({
        ref,
        start: 0,
        end: parsed.num,
        duration: 1.4,
        decimals: parsed.decimals,
        separator: '.',
        decimal: ',',
        prefix: parsed.prefix,
        suffix: parsed.suffix,
    });

    useEffect(() => { update(parsed.num); }, [parsed.num]);

    return <span ref={ref} />;
}

export default function InfoCards({
    titulo,
    valor,
    subtitulo,
    tendencia,
    icon,
    cor = '#2C7BE5',
}: KPICardProps) {
    const tendenciaPositiva = tendencia !== undefined && tendencia >= 0;
    const parsed = parseValor(valor);

    return (
        <Card className={styles.kpiCard} style={{ borderTop: `3px solid ${cor}` }}>
            <Card.Body className={styles.cardBody}>
                <div className={styles.header}>
                    <span className={styles.titulo}>{titulo}</span>
                    <span
                        className={styles.icon}
                        style={{ backgroundColor: `${cor}1a`, color: cor }}
                    >
                        <FontAwesomeIcon icon={icon} />
                    </span>
                </div>
                <div className={styles.valor}>
                    {parsed ? <AnimatedNumber parsed={parsed} /> : (valor ?? '—')}
                </div>
                {(subtitulo || tendencia !== undefined) && (
                    <div className={styles.footer}>
                        {tendencia !== undefined && (
                            <span
                                className={styles.tendencia}
                                style={
                                    tendenciaPositiva
                                        ? { color: cor, background: `${cor}1a` }
                                        : { color: '#dc2626', background: '#fef2f2' }
                                }
                            >
                                <FontAwesomeIcon
                                    icon={tendenciaPositiva ? faArrowTrendUp : faArrowTrendDown}
                                />
                                {Math.abs(tendencia)}%
                            </span>
                        )}
                        {subtitulo && (
                            <span className={styles.subtitulo}>{subtitulo}</span>
                        )}
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}
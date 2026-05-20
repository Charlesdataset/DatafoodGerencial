import { faFile } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type React from "react";
import { formatValue } from "../../../utils/format";
import styles from './InfoCard.module.scss';

export interface InfoCardProps {
    title: string;
    accent?: string;
    accentPill?: string;
    value: number;
    icone?: any;
}

export const InfoCard: React.FC<InfoCardProps> = (
    { title = 'Total ICMS ST',
        accent = 'rgb(238, 136, 40)',
        accentPill = 'rgba(238, 136, 40, 0.2)',
        value = 0,
        icone = faFile }: InfoCardProps
) => {


    return (
        <>
            <div className={styles.card} style={{ '--acccent': accent, '--accent-pill': accentPill } as React.CSSProperties}>
                <div className={styles.content}>
                    <div className={styles.values}>
                        <span className={styles.title}>{title}</span>
                        <span className={styles.value}>R$ {formatValue(value)}</span>

                    </div>
                    <div className={styles.iconContainer}>
                        <div className={styles.pill}>
                            <FontAwesomeIcon icon={icone} color={accent} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}



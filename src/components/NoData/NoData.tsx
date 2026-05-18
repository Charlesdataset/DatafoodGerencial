import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faInbox } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from './NoData.module.scss';

interface NoDataProps {
    message?: string;
    subtext?: string;
    icon?: IconDefinition;
}

export default function NoData({
    message  = 'Sem dados',
    subtext  = 'Nenhum registro encontrado para o período selecionado.',
    icon     = faInbox,
}: NoDataProps) {
    return (
        <div className={styles.container}>
            <div className={styles.iconWrap}>
                <FontAwesomeIcon icon={icon} className={styles.icon} />
            </div>
            <span className={styles.message}>{message}</span>
            {subtext && <span className={styles.subtext}>{subtext}</span>}
        </div>
    );
}

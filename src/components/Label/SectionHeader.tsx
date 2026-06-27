// components/SectionHeader/SectionHeader.tsx
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ReactNode } from "react";
import { Flex } from "../Layout";
import Pill from "../Pill/Pill";
import styles from "./SectionHeader.module.scss";

export interface SectionHeaderProps {
    /** Título principal */
    title: string;
    /** Subtítulo / descrição */
    subtitle?: string;
    /** Ícone à esquerda do título */
    icon?: IconDefinition;
    /** Ações/botões à direita */
    actions?: ReactNode;
    /** Posição das ações: "side" (ao lado do título), "below" (abaixo do subtítulo), "both" (ambas) */
    actionsPosition?: "side" | "below" | "both";
    /** Ações que ficam abaixo do subtítulo (usado com actionsPosition="both") */
    actionsBelow?: ReactNode;
    /** Badge/pill ao lado do título */
    badge?: string | number;
    /** Cor do badge */
    badgeColor?: string;
    /** Variante visual */
    variant?: "default" | "bordered" | "card" | "minimal";
    /** Tamanho do título */
    size?: "sm" | "md" | "lg" | "xl";
    /** Alinhamento do conteúdo */
    align?: "left" | "center" | "right";
    /** Classe adicional */
    className?: string;
    /** Cor do ícone */
    iconColor?: string;
    /** Separador abaixo do título */
    divider?: boolean;
    /** Tag HTML do título */
    titleAs?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const SectionHeader = ({
    title,
    subtitle,
    icon,
    actions,
    actionsPosition = "side",
    actionsBelow,
    badge,
    badgeColor = "#1c8d74",
    variant = "default",
    size = "md",
    align = "left",
    className = "",
    iconColor,
    divider = false,
    titleAs: TitleTag = "h2",
}: SectionHeaderProps) => {
    const sizeMap = {
        sm: styles.sizeSm,
        md: styles.sizeMd,
        lg: styles.sizeLg,
        xl: styles.sizeXl,
    };

    const variantMap = {
        default: styles.variantDefault,
        bordered: styles.variantBordered,
        card: styles.variantCard,
        minimal: styles.variantMinimal,
    };

    const alignMap = {
        left: styles.alignLeft,
        center: styles.alignCenter,
        right: styles.alignRight,
    };

    const showActionsSide = actionsPosition === "side" || actionsPosition === "both";
    const showActionsBelow = actionsPosition === "below" || actionsPosition === "both";

    return (
        <div className={`
            ${styles.sectionHeader}
            ${variantMap[variant]}
            ${alignMap[align]}
            ${divider ? styles.withDivider : ""}
            ${className}
            ${actionsPosition === "below" ? styles.actionsBelow : ""}
        `}>
            <div className={styles.headerContent}>
                <Flex align="center" gap="sm" wrap="wrap" className={styles.headerTop}>
                    {icon && (
                        <span
                            className={styles.iconWrapper}
                            style={iconColor ? { color: iconColor } : undefined}
                        >
                            <FontAwesomeIcon icon={icon} />
                        </span>
                    )}

                    <TitleTag className={`
                        ${styles.title}
                        ${sizeMap[size]}
                    `}>
                        {title}
                    </TitleTag>

                    {badge && (
                        <Pill
                            label={String(badge)}
                            color={badgeColor}
                            size="sm"
                            variant="solid"
                            className={styles.badge}
                        />
                    )}

                    {showActionsSide && actions && (
                        <div className={styles.actionsSide}>
                            {actions}
                        </div>
                    )}
                </Flex>

                {subtitle && (
                    <div className={styles.subtitleRow}>
                        <p className={styles.subtitle}>{subtitle}</p>
                        {showActionsBelow && (actionsBelow || actions) && (
                            <div className={styles.actionsBelowWrapper}>
                                {actionsBelow || actions}
                            </div>
                        )}
                    </div>
                )}

                {!subtitle && showActionsBelow && (actionsBelow || actions) && (
                    <div className={styles.actionsBelowWrapper}>
                        {actionsBelow || actions}
                    </div>
                )}
            </div>

            {divider && <div className={styles.divider} />}
        </div>
    );
};

export default SectionHeader;
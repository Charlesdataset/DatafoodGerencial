// ButtonGroup.tsx
import { type ReactNode, useState } from "react";
import styles from "./ButtonGroup.module.scss";

export interface ButtonGroupOption<T = string> {
    value: T;
    label: ReactNode;
    disabled?: boolean;
    icon?: ReactNode;
}

interface ButtonGroupProps<T = string> {
    options: ButtonGroupOption<T>[];
    value?: T;
    defaultValue?: T;
    onChange?: (value: T) => void;
    variant?: "primary" | "secondary" | "outline" | "danger" | "success" | "info" | "ghost" | "toggle";
    size?: "sm" | "md" | "lg";
    shape?: "default" | "pill";
    fullWidth?: boolean;
    /** Permite que os botões quebrem para a próxima linha quando não couberem */
    wrap?: boolean;
}

export const ButtonGroup = <T extends string = string>({
    options,
    value: controlledValue,
    defaultValue,
    onChange,
    variant = "primary",
    size = "md",
    shape = "default",
    fullWidth = false,
    wrap = false,
}: ButtonGroupProps<T>) => {
    const [internalValue, setInternalValue] = useState<T | undefined>(defaultValue);

    const activeValue = controlledValue !== undefined ? controlledValue : internalValue;

    const handleClick = (optionValue: T) => {
        if (controlledValue === undefined) {
            setInternalValue(optionValue);
        }
        onChange?.(optionValue);
    };

    return (
        <div
            className={`
                ${styles.buttonGroup} 
                ${styles[variant]} 
                ${styles[size]} 
                ${shape === "pill" ? styles.pill : ""}
                ${fullWidth ? styles.fullWidth : ""}
                ${wrap ? styles.wrap : ""}
            `.trim()}
            role="group"
        >
            {options.map((option, index) => {
                const isActive = activeValue === option.value;
                return (
                    <button
                        key={String(option.value)}
                        className={`${styles.groupButton} ${isActive ? styles.active : ""}`}
                        onClick={() => handleClick(option.value)}
                        disabled={option.disabled}
                        type="button"
                        data-index={index}
                    >
                        {option.icon && <span className={styles.icon}>{option.icon}</span>}
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
};
import styles from "./FormButton.module.scss";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "danger"
    | "success"
    | "text"
    | "outline-secondary"
    | "text-secondary"
    | "link"
    | "link-secondary"
    | "link-danger"
    | "link-info"
    | "icon"
    | "info"
    | "outline-success"
    | "outline-danger"
    | "outline-info";
  isLoading?: boolean;
  fullWidth?: boolean;
  loadAlone?: boolean;
}

export const FormButton: React.FC<ButtonProps> = ({ fullWidth = false, variant = "primary", children, isLoading, className = "", loadAlone, disabled, ...props }) => {
  const buttonClasses = [fullWidth ? styles["btn--full"] : "", isLoading ? styles["btn--loading"] : "", className].filter(Boolean).join(" ");

  const currStyle: Record<string, string> = {
    primary: styles.buttonForm,
    secondary: styles.buttonSecondary,
    outline: styles.buttonOutline,
    danger: styles.buttonDanger,
    success: styles.buttonSuccess,
    text: styles.buttonText,
    "outline-secondary": styles.buttonOutlineSecondary,
    "text-secondary": styles.buttonTextSecondary,
    link: styles.buttonLink,
    "link-secondary": styles.buttonLinkSecondary,
    "link-danger": styles.buttonLinkDanger,
    "link-info": styles.buttonLinkInfo,
    icon: styles.buttonIcon,
    info: styles.buttonInfo,
    "outline-success": styles.buttonOutlineSuccess,
    "outline-danger": styles.buttonOutlineDanger,
    "outline-info": styles.buttonOutlineInfo,
  };

  const currStyleSpiner: Record<string, string> = {
    primary: styles.Spiner,
    secondary: styles.SpinerSecondary,
    outline: styles.SpinerOutline,
    danger: styles.SpinerDanger,
    success: styles.Spiner,
    text: styles.SpinerOutline,
    "outline-secondary": styles.SpinerOutlineSecondary,
    "text-secondary": styles.SpinerTextSecondary,
    link: styles.SpinerLink,
    "link-secondary": styles.SpinerLinkSecondary,
    "link-danger": styles.SpinerLinkDanger,
    "link-info": styles.SpinerLinkInfo,
    icon: styles.SpinerIcon,
    info: styles.Spiner, // mesmo spinner de primary (branco)
    "outline-success": styles.SpinerOutlineSuccess,
    "outline-danger": styles.SpinerOutlineDanger,
    "outline-info": styles.SpinerOutlineInfo,
  };

  return (
    <button className={`${currStyle[variant]} ${buttonClasses}`} disabled={disabled || isLoading} {...props}>
      {isLoading && <span className={currStyleSpiner[variant]} />}
      {!(isLoading && loadAlone) && children}
    </button>
  );
};

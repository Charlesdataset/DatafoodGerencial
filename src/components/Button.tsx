import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "success" | "text";
  size?: "sm" | "md" | "lg" | 'xs';
  fullWidth?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = "primary", size = "md", fullWidth = false, isLoading = false, children, disabled, className = "", ...props }) => {
  const buttonClasses = ["btn", `btn--${variant}`, `btn--${size}`, fullWidth ? "btn--full" : "", isLoading ? "btn--loading" : "", className].filter(Boolean).join(" ");

  return (
    <button className={buttonClasses} disabled={disabled || isLoading} {...props}>
      {isLoading && <span className="btn__spinner" />}
      {children}
    </button>
  );
};

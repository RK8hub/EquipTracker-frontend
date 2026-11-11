import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";
import "./button.css";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "destructive"
  | "success";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  variant?: ButtonVariant;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /** El componente original ocultaba el texto por defecto y salía vacío. */
  showText?: boolean;
  showLeftIcon?: boolean;
  showRightIcon?: boolean;
}

export function Button({
  text,
  variant = "secondary",
  leftIcon,
  rightIcon,
  showText = true,
  showLeftIcon = false,
  showRightIcon = false,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn("eq-button", `eq-button--${variant}`, className)}
      {...props}
    >
      {showLeftIcon && leftIcon && (
        <span className="eq-button__icon">{leftIcon}</span>
      )}
      {showText && text && <span>{text}</span>}
      {showRightIcon && rightIcon && (
        <span className="eq-button__icon">{rightIcon}</span>
      )}
    </button>
  );
}

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import "./navigation-button.css";

export interface NavigationButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  direction?: "next" | "previous";
  label?: string;
}

export function NavigationButton({
  direction = "next",
  label,
  className,
  type = "button",
  ...props
}: NavigationButtonProps) {
  const text = label ?? (direction === "next" ? "Siguiente" : "Retroceder");

  return (
    <button
      type={type}
      className={cn("eq-navigation-button", className)}
      {...props}
    >
      <span>{text}</span>
      {direction === "previous" ? (
        <ChevronLeft aria-hidden="true" strokeWidth={1.5} className="eq-navigation-button__chevron" />
      ) : (
        <ChevronRight aria-hidden="true" strokeWidth={1.5} className="eq-navigation-button__chevron" />
      )}
    </button>
  );
}

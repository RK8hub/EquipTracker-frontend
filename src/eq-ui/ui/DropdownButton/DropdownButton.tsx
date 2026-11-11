import { ChevronDown } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import "./dropdown-button.css";

export interface DropdownButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  label?: string;
  open?: boolean;
}

export function DropdownButton({
  label = "Text",
  open = false,
  className,
  type = "button",
  ...props
}: DropdownButtonProps) {
  return (
    <button
      type={type}
      aria-expanded={open}
      className={cn("eq-dropdown-button", className)}
      {...props}
    >
      <span>{label}</span>
      <ChevronDown
        aria-hidden="true"
        strokeWidth={1.5}
        className={cn("eq-dropdown-button__chevron", open && "rotate-180")}
      />
    </button>
  );
}

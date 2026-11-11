import { Check } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import "./checkbox.css";

export interface CheckboxProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Etiqueta accesible; no se muestra. */
  label: string;
}

export function Checkbox({
  checked,
  onCheckedChange,
  label,
  className,
  type = "button",
  ...props
}: CheckboxProps) {
  return (
    <button
      type={type}
      role="checkbox"
      aria-label={label}
      aria-checked={checked}
      className={cn("eq-checkbox", className)}
      onClick={() => onCheckedChange?.(!checked)}
      {...props}
    >
      {checked && <Check aria-hidden="true" strokeWidth={3} />}
    </button>
  );
}

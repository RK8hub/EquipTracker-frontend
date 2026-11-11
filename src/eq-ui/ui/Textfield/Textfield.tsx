import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import "./textfield.css";

export interface TextfieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  icon?: ReactNode;
  showIcon?: boolean;
  containerClassName?: string;
}

export function Textfield({
  label,
  icon,
  showIcon = true,
  id,
  className,
  containerClassName,
  ...props
}: TextfieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className={cn("eq-textfield", containerClassName)}>
      <label htmlFor={inputId}>{label}</label>
      <div className="eq-textfield__input">
        {showIcon && icon && <span className="eq-textfield__icon">{icon}</span>}
        <input id={inputId} className={cn("eq-textfield__control", className)} {...props} />
      </div>
    </div>
  );
}

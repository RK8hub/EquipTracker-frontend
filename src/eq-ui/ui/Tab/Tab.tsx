import { ChevronRight, ChevronDown } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";
import "./tab.css";

export interface TabProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  label: string;
  icon?: ReactNode;
  active?: boolean;
  showChevron?: boolean;
}

export function Tab({
  label,
  icon,
  active = false,
  showChevron = true,
  className,
  type = "button",
  ...props
}: TabProps) {
  const Chevron = active ? ChevronDown : ChevronRight;

  return (
    <button
      type={type}
      aria-current={active ? "page" : undefined}
      className={cn("eq-tab", active && "eq-tab--active", className)}
      {...props}
    >
      <span className="eq-tab__label">
        {icon && <span className="eq-tab__icon">{icon}</span>}
        {label}
      </span>
      {showChevron && (
        <Chevron
          aria-hidden="true"
          strokeWidth={1.5}
          className="eq-tab__chevron"
        />
      )}
    </button>
  );
}

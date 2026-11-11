import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";
import "./info-card.css";

export interface InfoCardProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  quantity?: string | number;
  label: string;
}

export function InfoCard({
  icon,
  quantity = 0,
  label,
  className,
  ...props
}: InfoCardProps) {
  return (
    <div className={cn("eq-info-card", className)} {...props}>
      <span className="eq-info-card__icon">{icon}</span>
      <span className="eq-info-card__quantity">{quantity}</span>
      <span className="eq-info-card__label">{label}</span>
    </div>
  );
}

import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import "./tag.css";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  /** En Figma se llama "Data". */
  label: string;
  quantity?: string | number;
}

export function Tag({ label, quantity, className, ...props }: TagProps) {
  return (
    <span className={cn("eq-tag", className)} {...props}>
      <span>{label}</span>
      {quantity != null && <span>{quantity}</span>}
    </span>
  );
}

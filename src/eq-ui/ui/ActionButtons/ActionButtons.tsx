import { Plus, Trash2 } from "lucide-react";
import type { ButtonHTMLAttributes, HTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import "./action-buttons.css";

export interface ActionButtonsProps extends HTMLAttributes<HTMLDivElement> {
  onAdd?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  onDelete?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  showDelete?: boolean;
}

export function ActionButtons({
  onAdd,
  onDelete,
  showDelete = true,
  className,
  ...props
}: ActionButtonsProps) {
  return (
    <div className={cn("eq-action-buttons", className)} {...props}>
      <button type="button" aria-label="Agregar" onClick={onAdd}>
        <Plus aria-hidden="true" strokeWidth={1.5} />
      </button>
      {showDelete && (
        <button type="button" aria-label="Eliminar" onClick={onDelete}>
          <Trash2 aria-hidden="true" strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}

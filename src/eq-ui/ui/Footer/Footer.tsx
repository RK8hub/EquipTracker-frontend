import type { HTMLAttributes } from "react";
import { NavigationButton } from "../NavigationButton";
import { cn } from "../../lib/cn";
import "./footer.css";

export interface FooterProps extends HTMLAttributes<HTMLElement> {
  count?: number;
  total?: number;
  summary?: string;
  onPrevious?: () => void;
  onNext?: () => void;
}

export function Footer({
  count,
  total = 0,
  summary,
  onPrevious,
  onNext,
  className,
  ...props
}: FooterProps) {
  return (
    <footer className={cn("eq-footer", className)} {...props}>
      <span className="eq-footer__summary">
        {summary ??
          (count !== undefined
            ? `${count} de ${total} fila(s) seleccionadas.`
            : `${total} fila(s).`)}
        {summary && count !== undefined ? ` · ${count} seleccionada(s)` : ""}
      </span>
      <div className="eq-footer__actions">
        <NavigationButton direction="previous" onClick={onPrevious} />
        <NavigationButton direction="next" onClick={onNext} />
      </div>
    </footer>
  );
}

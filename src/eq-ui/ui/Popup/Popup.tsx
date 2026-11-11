import { TriangleAlert } from "lucide-react";
import { useId, type HTMLAttributes, type ReactNode } from "react";
import { Button, type ButtonVariant } from "../Button";
import { cn } from "../../lib/cn";
import "./popup.css";

export interface PopupProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  acceptLabel?: string;
  acceptVariant?: ButtonVariant;
  cancelLabel?: string;
  onAccept?: () => void;
  onCancel?: () => void;
  icon?: ReactNode;
}

export function Popup({
  title,
  description,
  acceptLabel = "Aceptar",
  acceptVariant = "primary",
  cancelLabel = "Cancelar",
  onAccept,
  onCancel,
  icon,
  className,
  ...props
}: PopupProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <div
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className={cn("eq-popup", className)}
      {...props}
    >
      <div className="eq-popup__avatar">
        {icon ?? <TriangleAlert aria-hidden="true" strokeWidth={2} />}
      </div>

      <div className="eq-popup__text">
        <p id={titleId} className="eq-popup__title">
          {title}
        </p>
        <p id={descriptionId} className="eq-popup__description">
          {description}
        </p>
      </div>

      <div className="eq-popup__actions">
        <Button
          text={acceptLabel}
          variant={acceptVariant}
          onClick={onAccept}
        />
        <Button text={cancelLabel} onClick={onCancel} />
      </div>
    </div>
  );
}

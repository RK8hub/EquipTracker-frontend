import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Overlay } from "./Overlay";

export interface ModalCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  widthClassName?: string;
}

export function ModalCard({
  title,
  description,
  children,
  footer,
  onClose,
  widthClassName = "max-w-[560px]",
}: ModalCardProps) {
  return (
    <Overlay onClose={onClose}>
      <div
        className={`w-full ${widthClassName} rounded-[24px] border-2 border-stroke bg-object p-5 text-primary`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="flex size-9 cursor-pointer items-center justify-center rounded-[10px] text-primary transition-colors hover:bg-border/60"
          >
            <X aria-hidden="true" strokeWidth={1.5} className="size-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3">{children}</div>
        {footer && <div className="mt-5 flex justify-end gap-3">{footer}</div>}
      </div>
    </Overlay>
  );
}

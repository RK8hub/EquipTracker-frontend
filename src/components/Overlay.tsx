import { useEffect, type ReactNode } from "react";

export interface OverlayProps {
  children: ReactNode;
  onClose?: () => void;
}

export function Overlay({ children, onClose }: OverlayProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-6"
      onMouseDown={onClose}
    >
      <div onMouseDown={(event) => event.stopPropagation()}>{children}</div>
    </div>
  );
}

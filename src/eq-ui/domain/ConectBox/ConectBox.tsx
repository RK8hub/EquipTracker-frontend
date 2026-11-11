import type { FormHTMLAttributes } from "react";
import { Button } from "../../ui/Button";
import { Textfield } from "../../ui/Textfield";
import { cn } from "../../lib/cn";
import "./conect-box.css";

export interface ConectBoxProps
  extends Omit<FormHTMLAttributes<HTMLFormElement>, "title" | "onSubmit" | "onChange"> {
  title?: string;
  description?: string;
  fieldLabel?: string;
  placeholder?: string;
  submitLabel?: string;
  cancelLabel?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  busy?: boolean;
  onSubmit?: FormHTMLAttributes<HTMLFormElement>["onSubmit"];
  onCancel?: () => void;
}

export function ConectBox({
  title = "Conectar servidor",
  description = "Ingresa la dirección IP del servidor para conectar el backend de EquipTracker",
  fieldLabel = "Backend IP",
  placeholder = "192.168.0.120",
  submitLabel = "Conectar",
  cancelLabel = "Probar Conexion",
  value,
  onChange,
  error,
  busy = false,
  onSubmit,
  onCancel,
  className,
  ...props
}: ConectBoxProps) {
  return (
    <form className={cn("eq-conect-box", className)} onSubmit={onSubmit} {...props}>
      <div className="eq-conect-box__text">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <Textfield
        label={fieldLabel}
        placeholder={placeholder}
        showIcon={false}
        containerClassName="self-stretch"
        name="backend"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        disabled={busy}
        autoFocus
        required
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="eq-conect-box__actions">
        <Button
          type="submit"
          text={busy ? "Conectando..." : submitLabel}
          className="w-full"
          disabled={busy}
        />
        <Button
          type="button"
          text={cancelLabel}
          className="w-full"
          onClick={onCancel}
          disabled={busy}
        />
      </div>
    </form>
  );
}

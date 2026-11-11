import { Briefcase, Building, Save, IdCard, X } from "lucide-react";
import type { FormHTMLAttributes } from "react";

import { Button } from "../../ui/Button";
import { Tag, type TagProps } from "../../ui/Tag";
import { Textfield } from "../../ui/Textfield";
import { cn } from "../../lib/cn";
import "./modal-operator.css";

export interface ModalOperatorProps
  extends Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
  initials: string;
  tags?: Array<Pick<TagProps, "label" | "quantity">>;
  name: string;
  department: string;
  position: string;
  saveLabel?: string;
  cancelLabel?: string;
  values?: { name: string; department: string; position: string };
  onValueChange?: (
    field: "name" | "department" | "position",
    value: string,
  ) => void;
  busy?: boolean;
  onSubmit?: FormHTMLAttributes<HTMLFormElement>["onSubmit"];
  onCancel?: () => void;
}

export function ModalOperator({
  initials,
  tags = [],
  name,
  department,
  position,
  saveLabel = "Guardar",
  cancelLabel = "Cancelar",
  values,
  onValueChange,
  busy = false,
  onSubmit,
  onCancel,
  className,
  ...props
}: ModalOperatorProps) {
  const visibleTags = tags.filter((tag) => Number(tag.quantity) > 0);

  return (
    <form
      className={cn("eq-modal-operator", className)}
      onSubmit={onSubmit}
      {...props}
    >
      <div className="eq-modal-operator__header">
        <div className="eq-modal-operator__avatar">{initials}</div>
        {visibleTags.map((tag) => (
          <Tag key={tag.label} label={tag.label} quantity={tag.quantity} />
        ))}
      </div>

      <div className="eq-modal-operator__body">
        <div className="eq-modal-operator__fields">
          <Textfield
            label="Nombre"
            name="name"
            placeholder="Nombre del operador"
            icon={<IdCard aria-hidden="true" strokeWidth={1.5} className="size-4" />}
            showIcon
            defaultValue={values ? undefined : name}
            value={values?.name}
            onChange={(event) => onValueChange?.("name", event.target.value)}
            disabled={busy}
            required
          />
          <Textfield
            label="Departamento"
            name="department"
            placeholder="Departamento"
            icon={<Building aria-hidden="true" strokeWidth={1.5} className="size-4" />}
            showIcon
            defaultValue={values ? undefined : department}
            value={values?.department}
            onChange={(event) =>
              onValueChange?.("department", event.target.value)
            }
            disabled={busy}
            required
          />
          <Textfield
            label="Puesto"
            name="position"
            placeholder="Puesto"
            icon={<Briefcase aria-hidden="true" strokeWidth={1.5} className="size-4" />}
            showIcon
            defaultValue={values ? undefined : position}
            value={values?.position}
            onChange={(event) => onValueChange?.("position", event.target.value)}
            disabled={busy}
            required
          />
        </div>
        <div className="eq-modal-operator__actions">
          <Button
            type="submit"
            text={busy ? "Guardando..." : saveLabel}
            leftIcon={<Save aria-hidden="true" strokeWidth={1.5} className="size-4" />}
            showLeftIcon
            disabled={busy}
          />
          <Button
            type="button"
            text={cancelLabel}
            leftIcon={<X aria-hidden="true" strokeWidth={1.5} className="size-4" />}
            showLeftIcon
            onClick={onCancel}
            disabled={busy}
          />
        </div>
      </div>
    </form>
  );
}

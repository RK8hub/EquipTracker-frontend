import { EllipsisVertical } from "lucide-react";
import type { HTMLAttributes } from "react";
import { Checkbox } from "../../ui/Checkbox";
import { Tag, type TagProps } from "../../ui/Tag";
import { cn } from "../../lib/cn";
import "./card-operador.css";

export interface CardOperadorProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  area: string;
  /** Iniciales del avatar. */
  initials: string;
  tags?: Array<Pick<TagProps, "label" | "quantity">>;
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  onMore?: () => void;
}

export function CardOperador({
  name,
  area,
  initials,
  tags = [],
  selected = false,
  onSelectedChange,
  onMore,
  className,
  ...props
}: CardOperadorProps) {
  const visibleTags = tags.filter((tag) => Number(tag.quantity) > 0);
  const parts = name.trim().split(/\s+/);
  const shortName =
    parts.length > 2 ? `${parts[0]} ${parts[parts.length - 1]}` : name;

  return (
    <div className={cn("eq-card-operador", className)} {...props}>
      <div className="eq-card-operador__actions">
        <Checkbox
          label="Seleccionar operador"
          checked={selected}
          onCheckedChange={onSelectedChange}
        />
        <button
          type="button"
          aria-label="Más opciones"
          onClick={onMore}
          className="eq-card-operador__more"
        >
          <EllipsisVertical aria-hidden="true" strokeWidth={1.5} />
        </button>
      </div>

      <div className="eq-card-operador__avatar">{initials}</div>

      <div className="eq-card-operador__info">
        <span className="eq-card-operador__name" title={name}>{shortName}</span>
        <span className="eq-card-operador__area">{area}</span>
      </div>

      {visibleTags.map((tag) => (
        <Tag key={tag.label} className="mt-auto" {...tag} />
      ))}
    </div>
  );
}

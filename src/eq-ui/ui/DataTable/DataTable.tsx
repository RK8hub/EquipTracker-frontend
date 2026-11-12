import type { HTMLAttributes, ReactNode } from "react";
import { Checkbox } from "../Checkbox";
import { Footer } from "../Footer";
import { Header } from "../Header";
import { cn } from "../../lib/cn";
import "./data-table.css";

export interface DataTableColumn {
  key: string;
  header: string;
  className?: string;
}

export interface DataTableRow {
  id: string;
  [key: string]: ReactNode;
}

export interface DataTableProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  columns: DataTableColumn[];
  rows: DataTableRow[];
  selectedIds?: string[];
  onSelectedChange?: (ids: string[]) => void;
  onAdd?: () => void;
  onDelete?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  summary?: string;
  toolbar?: ReactNode;
  selectable?: boolean;
  showToolbar?: boolean;
}

export function DataTable({
  columns,
  rows,
  selectedIds = [],
  onSelectedChange,
  onAdd,
  onDelete,
  onPrevious,
  onNext,
  summary,
  toolbar,
  selectable = true,
  showToolbar = true,
  className,
  ...props
}: DataTableProps) {
  const allSelected =
    rows.length > 0 && rows.every((row) => selectedIds.includes(row.id));

  const toggle = (id: string) => {
    onSelectedChange?.(
      selectedIds.includes(id)
        ? selectedIds.filter((selected) => selected !== id)
        : [...selectedIds, id],
    );
  };

  return (
    <div className={cn("eq-data-table", className)} {...props}>
      {showToolbar &&
        (toolbar ?? (
          <Header
            variant="crud"
            actionProps={{ onAdd, onDelete }}
            searchProps={{ placeholder: "Buscar..." }}
            dropdownProps={{ label: "Opciones" }}
          />
        ))}

      <div className="eq-data-table__scroll">
        <div className="eq-data-table__table" role="table">
          <div className="eq-data-table__row eq-data-table__head" role="row">
            {selectable && (
              <div className="eq-data-table__check">
                <Checkbox
                  label="Seleccionar todo"
                  checked={allSelected}
                  onCheckedChange={() =>
                    onSelectedChange?.(allSelected ? [] : rows.map((row) => row.id))
                  }
                />
              </div>
            )}
            {columns.map((column) => (
              <div
                key={column.key}
                role="columnheader"
                className={cn("eq-data-table__cell", column.className)}
              >
                {column.header}
              </div>
            ))}
          </div>

          {rows.map((row) => (
            <div
              key={row.id}
              role="row"
              data-selected={selectedIds.includes(row.id) || undefined}
              className="eq-data-table__row"
            >
              {selectable && (
                <div className="eq-data-table__check">
                  <Checkbox
                    label={`Seleccionar ${row.id}`}
                    checked={selectedIds.includes(row.id)}
                    onCheckedChange={() => toggle(row.id)}
                  />
                </div>
              )}
              {columns.map((column) => {
                const value = row[column.key];
                const title = typeof value === "string" ? value : undefined;
                return (
                  <div
                    key={column.key}
                    role="cell"
                    title={title}
                    className={cn("eq-data-table__cell", column.className)}
                  >
                    {value}
                  </div>
                );
              })}
            </div>
          ))}

          {rows.length === 0 && (
            <div className="eq-data-table__empty">Sin resultados</div>
          )}
        </div>
      </div>

      <Footer
        count={selectedIds.length}
        total={rows.length}
        summary={summary}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    </div>
  );
}

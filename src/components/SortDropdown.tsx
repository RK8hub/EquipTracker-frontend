import { DropdownButton } from "../eq-ui";

export interface SortOption<T extends string> {
  value: T;
  label: string;
}

export interface SortDropdownProps<T extends string> {
  options: readonly SortOption<T>[];
  value: T;
  open: boolean;
  onToggle: () => void;
  onSelect: (value: T) => void;
}

export function SortDropdown<T extends string>({
  options,
  value,
  open,
  onToggle,
  onSelect,
}: SortDropdownProps<T>) {
  const current = options.find((option) => option.value === value);
  return (
    <div className="relative">
      <DropdownButton
        label={current?.label ?? ""}
        title="Ordenar por este criterio (no filtra)"
        open={open}
        onClick={onToggle}
      />
      {open && (
        <div className="absolute right-0 top-11.5 z-10 w-40 rounded-[8px] border border-stroke bg-object p-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className="flex w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm text-primary transition-colors hover:bg-border/60"
              onClick={() => onSelect(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { DropdownButton } from "../DropdownButton/DropdownButton";
import { cn } from "../../lib/cn";
import "./select.css";

// Registro global para que solo un Select esté abierto a la vez.
const openSelects = new Set<() => void>();

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  /** Muestra un campo de búsqueda dentro del dropdown para filtrar escribiendo. */
  searchable?: boolean;
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  required = false,
  className,
  searchable = false,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const closeRef = useRef<() => void>(() => setOpen(false));

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected ? selected.label : (placeholder ?? "");

  const term = query.trim().toLowerCase();
  const filtered =
    searchable && term
      ? options.filter((o) => o.label.toLowerCase().includes(term))
      : options;
  const items =
    placeholder && !(searchable && term)
      ? [{ value: "", label: placeholder }, ...filtered]
      : filtered;

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    const close = () => setOpen(false);
    closeRef.current = close;
    openSelects.add(close);
    return () => {
      openSelects.delete(close);
    };
  }, []);

  const updatePos = useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 4, left: r.left, width: r.width });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
    };
  }, [open, updatePos]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (listRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const openList = () => {
    openSelects.forEach((c) => {
      if (c !== closeRef.current) c();
    });
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    setOpen(true);
    setHighlight(items.findIndex((o) => o.value === value));
  };

  const moveHighlight = (delta: number) => {
    setHighlight((h) => Math.min(items.length - 1, Math.max(0, h + delta)));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (open) moveHighlight(1);
      else openList();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (open) moveHighlight(-1);
      else openList();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!open) openList();
      else if (items[highlight]) choose(items[highlight].value);
    }
  };

  const id = useId();

  return (
    <label className={cn("flex flex-col gap-1", className)}>
      <span className="text-base font-normal text-primary">{label}</span>
      <div ref={triggerRef} className="w-full">
        <DropdownButton
          label={displayLabel}
          open={open}
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            if (!open) openList();
            else setOpen(false);
          }}
          onKeyDown={onKeyDown}
          className="w-full justify-between"
        />
      </div>
      {required && <input type="hidden" value={value} required />}
      {open &&
        createPortal(
          <div
            ref={listRef}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              minWidth: pos.width,
              maxWidth: "min(420px, calc(100vw - 16px))",
              zIndex: 9999,
            }}
            className="eq-select__panel"
          >
            {searchable && (
              <input
                type="search"
                autoFocus
                value={query}
                placeholder="Buscar..."
                className="eq-select__search"
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlight(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    moveHighlight(1);
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    moveHighlight(-1);
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    if (items[highlight]) choose(items[highlight].value);
                  }
                }}
              />
            )}
            <ul role="listbox" aria-labelledby={id} className="eq-select__list">
              {items.map((o, i) => (
                <li
                  key={o.value === "" ? "__placeholder__" : o.value}
                  role="option"
                  aria-selected={o.value === value}
                  className={cn(
                    "eq-select__option",
                    o.value === value && "eq-select__option--selected",
                    i === highlight && "eq-select__option--highlight",
                  )}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => choose(o.value)}
                  title={o.label}
                >
                  <span className="block truncate">{o.label}</span>
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )}
    </label>
  );
}
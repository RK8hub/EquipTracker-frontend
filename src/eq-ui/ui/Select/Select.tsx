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
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const triggerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected ? selected.label : (placeholder ?? "");

  const items = placeholder
    ? [{ value: "", label: placeholder }, ...options]
    : options;

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

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setHighlight(items.findIndex((o) => o.value === value));
      } else {
        setHighlight((h) => Math.min(items.length - 1, h + 1));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setHighlight(items.findIndex((o) => o.value === value));
      } else {
        setHighlight((h) => Math.max(0, h - 1));
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setHighlight(items.findIndex((o) => o.value === value));
      } else if (highlight >= 0) {
        choose(items[highlight].value);
      }
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
          onClick={() => !disabled && setOpen((o) => !o)}
          onKeyDown={onKeyDown}
          className="w-full justify-between"
        />
      </div>
      {required && <input type="hidden" value={value} required />}
      {open &&
        createPortal(
          <ul
            ref={listRef}
            role="listbox"
            aria-labelledby={id}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              minWidth: pos.width,
              zIndex: 9999,
            }}
            className="eq-select__list"
          >
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
              >
                {o.label}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </label>
  );
}
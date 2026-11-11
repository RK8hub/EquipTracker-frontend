import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import "./searchbar.css";

export interface SearchBarProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  containerClassName?: string;
}

export function SearchBar({
  placeholder = "Buscar...",
  className,
  containerClassName,
  ...props
}: SearchBarProps) {
  return (
    <div className={cn("eq-searchbar", containerClassName)}>
      <Search aria-hidden="true" className="eq-searchbar__icon" />
      <input
        type="search"
        placeholder={placeholder}
        className={cn("eq-searchbar__control", className)}
        {...props}
      />
    </div>
  );
}

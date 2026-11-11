import type { HTMLAttributes, ReactNode } from "react";
import { ActionButtons, type ActionButtonsProps } from "../ActionButtons";
import { DropdownButton, type DropdownButtonProps } from "../DropdownButton";
import { SearchBar, type SearchBarProps } from "../SearchBar";
import { cn } from "../../lib/cn";
import "./header.css";

export interface HeaderProps extends HTMLAttributes<HTMLElement> {
  variant?: "search" | "crud";
  left?: ReactNode;
  right?: ReactNode;
  searchProps?: SearchBarProps;
  actionProps?: ActionButtonsProps;
  dropdownProps?: DropdownButtonProps;
}

export function Header({
  variant = "search",
  left,
  right,
  searchProps,
  actionProps,
  dropdownProps,
  className,
  ...props
}: HeaderProps) {
  return (
    <header className={cn("eq-header", className)} {...props}>
      {left ??
        (variant === "crud" ? (
          <div className="eq-header__group">
            <SearchBar {...searchProps} />
            <ActionButtons {...actionProps} />
          </div>
        ) : (
          <SearchBar {...searchProps} />
        ))}
      {right ?? <DropdownButton {...dropdownProps} />}
    </header>
  );
}

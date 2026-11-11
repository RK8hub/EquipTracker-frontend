import type { HTMLAttributes, ReactNode } from "react";
import { ChevronsUpDown,Settings } from "lucide-react";
import { Tab } from "../Tab";
import { cn } from "../../lib/cn";
import "./sidebar.css";

export interface SidebarItem {
  id: string;
  label: string;
  icon?: ReactNode;
  active?: boolean;
}

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  user?: { name: string; email: string };
  workspace?: { name: string; company: string };
  workspaceIcon?: ReactNode;
  items: SidebarItem[];
  onNavigate?: (id: string) => void;
  onUserClick?: () => void;
}

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export function Sidebar({
  user,
  workspace,
  workspaceIcon,
  items,
  onNavigate,
  onUserClick,
  className,
  ...props
}: SidebarProps) {
  const chevrons = (
    <ChevronsUpDown
      aria-hidden="true"
      strokeWidth={1.5}
      className="eq-sidebar__chevrons"
    />
  );

  return (
    <aside className={cn("eq-sidebar", className)} {...props}>
      {workspace && (
        <button type="button" className="eq-sidebar__workspace">
          <span className="eq-sidebar__workspace-icon">
            {workspaceIcon ?? initials(workspace.name)}
          </span>
          <span className="eq-sidebar__workspace-text">
            <span className="eq-sidebar__workspace-name">{workspace.name}</span>
            <span className="eq-sidebar__workspace-company">
              {workspace.company}
            </span>
          </span>
        </button>
      )}

      <div className="eq-sidebar__tabs">
        <span className="eq-sidebar__section">Pestañas</span>
        <nav className="eq-sidebar__nav">
          {items.map((item) => (
            <Tab
              key={item.id}
              label={item.label}
              icon={item.icon}
              active={item.active}
              onClick={() => onNavigate?.(item.id)}
            />
          ))}
        </nav>
      </div>

      {user && (
        <button type="button" className="eq-sidebar__user" onClick={onUserClick}>
          <span className="eq-sidebar__avatar">{initials(user.name)}</span>
          <span className="eq-sidebar__user-text">
            <span className="eq-sidebar__user-name">{user.name}</span>
            <span className="eq-sidebar__user-email">{user.email}</span>
          </span>
          {<Settings aria-hidden="true" strokeWidth={1.5} className="eq-sidebar__chevrons"/>}
        </button>
      )}
    </aside>
  );
}

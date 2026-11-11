import { ChartPie, Handshake, Monitor, Users, Wrench } from "lucide-react";
import type { SidebarItem } from "../ui/Sidebar";

export const equiptrackerNavigation: SidebarItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <ChartPie strokeWidth={1.5} /> },
  { id: "operadores", label: "Operadores", icon: <Users strokeWidth={1.5} /> },
  { id: "equipos", label: "Equipos", icon: <Monitor strokeWidth={1.5} /> },
  {
    id: "asignaciones",
    label: "Asignaciones",
    icon: <Handshake strokeWidth={1.5} />,
  },
  { id: "incidencias", label: "Incidencias", icon: <Wrench strokeWidth={1.5} /> },
];

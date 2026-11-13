import type { DataTableColumn, DataTableRow } from "../eq-ui";
import type { Equipment, Incident, User } from "../types";
import { equipmentLabel, formatDate, userLabel } from "../lib/format";

export const incidentColumns: DataTableColumn[] = [
  { key: "equipo", header: "Equipo" },
  { key: "serial", header: "Serial" },
  { key: "tipo", header: "Tipo" },
  { key: "motivo", header: "Motivo" },
  { key: "tecnico", header: "Técnico" },
  { key: "estado", header: "Estado" },
  { key: "fecha", header: "Fecha" },
];

export function incidentRow(
  incident: Incident,
  lookups: {
    equipmentById: Map<number, Equipment>;
    userById: Map<number, User>;
  },
): DataTableRow {
  const equipment = lookups.equipmentById.get(incident.equipment_id);
  return {
    id: String(incident.id),
    equipo: equipmentLabel(equipment, incident.equipment_id),
    serial: equipment?.serial ?? "",
    tipo: incident.type,
    motivo: (
      <span className="block w-full truncate" title={incident.reason}>
        {incident.reason}
      </span>
    ),
    tecnico: userLabel(lookups.userById.get(incident.technician_id), incident.technician_id),
    estado: incident.status === "open" ? "Abierta" : "Cerrada",
    fecha: formatDate(incident.created_at),
  };
}

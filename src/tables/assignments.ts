import type { DataTableColumn, DataTableRow } from "../eq-ui";
import type { Assignment, Equipment, Operator, User } from "../types";
import { displayName, equipmentLabel, formatDate, operatorLabel } from "../lib/format";

export const assignmentColumns: DataTableColumn[] = [
  { key: "equipo", header: "Equipo" },
  { key: "serial", header: "Serial" },
  { key: "operador", header: "Operador" },
  { key: "asignador", header: "Asignador" },
  { key: "estado", header: "Estado" },
  { key: "fecha", header: "Fecha" },
];

export function assignmentRow(
  assignment: Assignment,
  lookups: {
    equipmentById: Map<number, Equipment>;
    operatorById: Map<number, Operator>;
    userById: Map<number, User>;
  },
): DataTableRow {
  const equipment = lookups.equipmentById.get(assignment.equipment_id);
  return {
    id: String(assignment.id),
    equipo: equipmentLabel(equipment, assignment.equipment_id),
    serial: equipment?.serial ?? "",
    operador: operatorLabel(lookups.operatorById.get(assignment.operator_id), assignment.operator_id),
    asignador: lookups.userById.get(assignment.assigned_by)?.email
      ? displayName(lookups.userById.get(assignment.assigned_by)!.email)
      : `Usuario #${assignment.assigned_by}`,
    estado: assignment.status === "active" ? "Activo" : "Devuelto",
    fecha: formatDate(assignment.assigned_at),
  };
}

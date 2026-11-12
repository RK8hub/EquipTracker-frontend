import { Monitor, Users, Wrench,FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { Button, DataTable, DropdownButton, Header, InfoCard, type DataTableColumn, type DataTableRow } from "../eq-ui";
import { api } from "../api/client";
import { errorMessage, useAsync } from "../hooks";
import { formatDate, operatorLabel, equipmentLabel } from "../lib/format";
import { exportToCsv } from "../lib/csv";
import { ErrorState, Loading } from "../components/Feedback";
import { Page } from "../components/Page";
import type { Operator, Specs } from "../types";

type View = "assignments" | "operators" | "equipment" | "incidents";

const viewLabels: Record<View, string> = {
  assignments: "Asignaciones",
  operators: "Operadores",
  equipment: "Equipos",
  incidents: "Incidencias",
};

export function DashboardScreen() {
  const { data, loading, error, reload } = useAsync(async () => {
    const [operators, equipment, assignments, incidents, specs] = await Promise.all([
      api.operators.list(0, 1000),
      api.equipment.list(0, 1000),
      api.assignments.list(0, 1000),
      api.incidents.list(0, 1000),
      api.specs.list(0, 1000),
    ]);
    return { operators, equipment, assignments, incidents, specs };
  }, []);

  const [view, setView] = useState<View>("assignments");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const operatorById = new Map<number, Operator>(
    data.operators.map((operator) => [operator.id, operator]),
  );
  const equipmentById = new Map(
    data.equipment.map((item) => [item.id, item]),
  );
  const specsById = new Map<number, Specs>(
    data.specs.map((spec) => [spec.id, spec]),
  );

  const term = search.trim().toLowerCase();

  let columns: DataTableColumn[] = [];
  let rows: DataTableRow[] = [];

  if (view === "assignments") {
    columns = [
      { key: "equipo", header: "Equipo" },
      { key: "serial", header: "Serial" },
      { key: "operador", header: "Operador" },
      { key: "asignador", header: "Asignador" },
      { key: "estado", header: "Estado" },
      { key: "fecha", header: "Fecha" },
    ];
    rows = data.assignments
      .filter((assignment) => {
        const equipment = equipmentById.get(assignment.equipment_id);
        const operator = operatorById.get(assignment.operator_id);
        return `${equipment?.brand ?? ""} ${equipment?.model ?? ""} ${operator?.name ?? ""}`
          .toLowerCase()
          .includes(term);
      })
      .map((assignment) => ({
        id: String(assignment.id),
        equipo: equipmentLabel(equipmentById.get(assignment.equipment_id), assignment.equipment_id),
        serial: equipmentById.get(assignment.equipment_id)?.serial ?? "",
        operador: operatorLabel(operatorById.get(assignment.operator_id), assignment.operator_id),
        asignador: operatorLabel(operatorById.get(assignment.assigned_by), assignment.assigned_by),
        estado: assignment.status === "active" ? "Activo" : "Devuelto",
        fecha: formatDate(assignment.assigned_at),
      }));
  } else if (view === "operators") {
    columns = [
      { key: "nombre", header: "Nombre" },
      { key: "departamento", header: "Departamento" },
      { key: "puesto", header: "Puesto" },
    ];
    rows = data.operators
      .filter((operator) =>
        `${operator.name} ${operator.department} ${operator.position}`.toLowerCase().includes(term),
      )
      .map((operator) => ({
        id: String(operator.id),
        nombre: operator.name,
        departamento: operator.department,
        puesto: operator.position,
      }));
  } else if (view === "equipment") {
    columns = [
      { key: "equipo", header: "Equipo" },
      { key: "serial", header: "Serial" },
      { key: "cpu", header: "CPU" },
      { key: "ram", header: "RAM" },
      { key: "almacenamiento", header: "Almacenamiento" },
      { key: "graficos", header: "Graficos" },
      { key: "estado", header: "Estado" },
    ];
    rows = data.equipment
      .filter((item) =>
        `${item.brand} ${item.model} ${item.serial}`.toLowerCase().includes(term),
      )
      .map((item) => {
        const spec = item.specs_id != null ? specsById.get(item.specs_id) : undefined;
        return {
        id: String(item.id),
        equipo: `${item.brand} ${item.model}`,
        serial: item.serial,
        cpu: spec ? `${spec.cpu.brand} ${spec.cpu.model}` : "",
        ram: spec ? `${spec.ram.capacity.value} ${spec.ram.capacity.unit} ${spec.ram.mode}` : "",
        almacenamiento: spec ? `${spec.storage.capacity.value} ${spec.storage.capacity.unit} ${spec.storage.type}` : "",
        graficos: spec ? `${spec.graphics.brand} ${spec.graphics.model} (${spec.graphics.type})` : "",
        estado: data.assignments.some(
          (assignment) => assignment.equipment_id === item.id && assignment.status === "active",
        )
          ? "Asignado"
          : "Disponible",
        };
      });
  } else {
    columns = [
      { key: "equipo", header: "Equipo" },
      { key: "serial", header: "Serial" },
      { key: "tipo", header: "Tipo" },
      { key: "motivo", header: "Motivo" },
      { key: "tecnico", header: "Técnico" },
      { key: "estado", header: "Estado" },
      { key: "fecha", header: "Fecha" },
    ];
    rows = data.incidents
      .filter((incident) => {
        const equipment = equipmentById.get(incident.equipment_id);
        const technician = operatorById.get(incident.technician_id);
        return `${equipment?.brand ?? ""} ${equipment?.model ?? ""} ${incident.type} ${incident.reason} ${technician?.name ?? ""}`
          .toLowerCase()
          .includes(term);
      })
      .map((incident) => ({
        id: String(incident.id),
        equipo: equipmentLabel(equipmentById.get(incident.equipment_id), incident.equipment_id),
        serial: equipmentById.get(incident.equipment_id)?.serial ?? "",
        tipo: incident.type,
        motivo: incident.reason,
        tecnico: operatorLabel(operatorById.get(incident.technician_id), incident.technician_id),
        estado: incident.status === "open" ? "Abierta" : "Cerrada",
        fecha: formatDate(incident.created_at),
      }));
  }

  const selectedRows = rows.filter((row) => selectedIds.includes(row.id));

  function exportCsv() {
    if (selectedRows.length === 0) return;
    exportToCsv(selectedRows, columns, `${view}.csv`);
  }

  return (
    <Page
      title="Dashboard"
      subtitle="Resumen del inventario y las asignaciones registradas."
    >
      <div className="flex flex-wrap items-center justify-center gap-16">
        <InfoCard
          icon={<Monitor aria-hidden="true" strokeWidth={1.5} className="size-8" />}
          quantity={data.equipment.length}
          label="Equipos"
        />
        <InfoCard
          icon={<Users aria-hidden="true" strokeWidth={1.5} className="size-8" />}
          quantity={data.operators.length}
          label="Operadores"
        />
        <InfoCard
          icon={<Wrench aria-hidden="true" strokeWidth={1.5} className="size-8" />}
          quantity={data.incidents.filter((item) => item.status === "open").length}
          label="Incidencias activas"
        />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        selectable
        selectedIds={selectedIds}
        onSelectedChange={setSelectedIds}
        toolbar={
          <Header
            variant="search"
            searchProps={{
              placeholder: "Buscar...",
              value: search,
              onChange: (event) => setSearch(event.target.value),
            }}
            right={
              <div className="flex items-center gap-2">
                <Button
                  leftIcon={<FileSpreadsheet aria-hidden="true" strokeWidth={1.5} className="size-4" />}
                  showLeftIcon={true}
                  text="Exportar CSV"
                  disabled={selectedIds.length === 0}
                  onClick={exportCsv}
                />
                <div className="relative">
                  <DropdownButton
                  label={viewLabels[view]}
                  open={open}
                  onClick={() => setOpen((value) => !value)}
                />
                {open && (
                  <div className="absolute right-0 top-[46px] z-10 w-44 rounded-[8px] border border-stroke bg-object p-1 shadow-lg">
                    {(Object.keys(viewLabels) as View[]).map((option) => (
                      <button
                        key={option}
                        type="button"
                        className="flex w-full cursor-pointer rounded-[6px] px-3 py-2 text-left text-sm text-primary transition-colors hover:bg-border/60"
                        onClick={() => {
                          setView(option);
                          setOpen(false);
                        }}
                      >
                        {viewLabels[option]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              </div>
            }
          />
        }
        summary={`${rows.length} registros`}
      />
    </Page>
  );
}

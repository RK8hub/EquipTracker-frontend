import { useState } from "react";
import { toast } from "sonner";
import { Button, DataTable, DropdownButton, Header, type DataTableColumn, type DataTableRow } from "../eq-ui";
import { api } from "../api/client";
import { errorMessage, useAsync } from "../hooks";
import { equipmentLabel, formatDate, operatorLabel } from "../lib/format";
import { ErrorState, Loading } from "../components/Feedback";
import { ModalCard } from "../components/ModalCard";
import { Page } from "../components/Page";
import { SelectField } from "../components/SelectField";

interface AssignmentForm {
  equipment_id: string;
  operator_id: string;
  assigned_by: string;
}

const emptyForm: AssignmentForm = {
  equipment_id: "",
  operator_id: "",
  assigned_by: "",
};

export function AssignmentsScreen() {
  const { data, loading, error, reload } = useAsync(async () => {
    const [assignments, equipment, operators] = await Promise.all([
      api.assignments.list(0, 1000),
      api.equipment.list(0, 1000),
      api.operators.list(0, 1000),
    ]);
    let users: { id: number; email: string; role: string; created_at: string }[] = [];
    try {
      users = await api.users.list();
    } catch {
      users = [];
    }
    return { assignments, equipment, operators, users };
  }, []);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"equipo" | "operador" | "estado" | "fecha">("fecha");
  const [sortOpen, setSortOpen] = useState(false);
  const [form, setForm] = useState<AssignmentForm | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const equipmentById = new Map(data.equipment.map((item) => [item.id, item]));
  const operatorById = new Map(data.operators.map((item) => [item.id, item]));
  const userById = new Map(data.users.map((item) => [item.id, item]));

  const assignedEquipmentIds = new Set(
    data.assignments
      .filter((assignment) => assignment.status === "active")
      .map((assignment) => assignment.equipment_id),
  );

  const term = search.trim().toLowerCase();
  const visible = data.assignments
    .filter((assignment) => {
      const equipment = equipmentById.get(assignment.equipment_id);
      const operator = operatorById.get(assignment.operator_id);
      const assigner = userById.get(assignment.assigned_by);
      return `${equipment?.brand ?? ""} ${equipment?.model ?? ""} ${equipment?.serial ?? ""} ${operator?.name ?? ""} ${assigner?.email ?? ""}`
        .toLowerCase()
        .includes(term);
    })
    .sort((a, b) => {
      const av =
        sortBy === "equipo"
          ? equipmentLabel(equipmentById.get(a.equipment_id), a.equipment_id)
          : sortBy === "operador"
            ? operatorLabel(operatorById.get(a.operator_id), a.operator_id)
            : sortBy === "estado"
              ? a.status
              : a.assigned_at;
      const bv =
        sortBy === "equipo"
          ? equipmentLabel(equipmentById.get(b.equipment_id), b.equipment_id)
          : sortBy === "operador"
            ? operatorLabel(operatorById.get(b.operator_id), b.operator_id)
            : sortBy === "estado"
              ? b.status
              : b.assigned_at;
      return String(av).localeCompare(String(bv), "es", { sensitivity: "base" });
    });

  const columns: DataTableColumn[] = [
    { key: "equipo", header: "Equipo" },
    { key: "serial", header: "Serial" },
    { key: "operador", header: "Operador" },
    { key: "asignador", header: "Asignador" },
    { key: "estado", header: "Estado" },
    { key: "fecha", header: "Fecha" },
    { key: "accion", header: "Acción", className: "justify-center" },
  ];

  const rows: DataTableRow[] = visible.map((assignment) => ({
    id: String(assignment.id),
    equipo: equipmentLabel(equipmentById.get(assignment.equipment_id), assignment.equipment_id),
    serial: equipmentById.get(assignment.equipment_id)?.serial ?? "",
    operador: operatorLabel(operatorById.get(assignment.operator_id), assignment.operator_id),
    asignador:
      (userById.get(assignment.assigned_by)?.email ?? "")
        .split("@")[0]
        .split(".")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ") || `Usuario #${assignment.assigned_by}`,
    estado: assignment.status === "active" ? "Activo" : "Devuelto",
    fecha: formatDate(assignment.assigned_at),
    accion:
      assignment.status === "active" ? (
        <Button
          text="Devolver"
          variant="ghost"
          className="h-8 px-3"
          disabled={busy}
          onClick={() => giveBack(assignment.id)}
        />
      ) : (
        "—"
      ),
  }));

  async function save() {
    if (!form || busy) return;
    const equipmentId = Number(form.equipment_id);
    const operatorId = Number(form.operator_id);
    const assignedBy = Number(form.assigned_by);
    if (!equipmentId || !operatorId || !assignedBy) {
      toast.error("Selecciona equipo, operador y asignador.");
      return;
    }

    setBusy(true);
    try {
      await api.assignments.create({
        equipment_id: equipmentId,
        operator_id: operatorId,
        assigned_by: assignedBy,
      });
      toast.success("Equipo asignado");
      setForm(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function giveBack(id: number) {
    if (busy) return;
    setBusy(true);
    try {
      await api.assignments.update(id, {
        returned_at: new Date().toISOString(),
        status: "inactive",
      });
      toast.success("Equipo devuelto");
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const operatorOptions = data.operators.map((operator) => ({
    value: String(operator.id),
    label: operator.name,
  }));

  return (
    <Page title="Asignaciones" subtitle="Equipos entregados y su historial de devolución.">
      <DataTable
        columns={columns}
        rows={rows}
        selectable={false}
        toolbar={
          <Header
            variant="crud"
            searchProps={{
              placeholder: "Buscar asignaciones...",
              value: search,
              onChange: (event) => setSearch(event.target.value),
            }}
            actionProps={{
              onAdd: () => setForm({ ...emptyForm }),
              showDelete: false,
            }}
            right={
              <div className="relative">
                <DropdownButton
                  label={
                    sortBy === "equipo"
                      ? "Equipo"
                      : sortBy === "operador"
                        ? "Operador"
                        : sortBy === "estado"
                          ? "Estado"
                          : "Fecha"
                  }
                  title="Ordenar por este criterio (no filtra)" open={sortOpen}
                  onClick={() => setSortOpen((value) => !value)}
                />
                {sortOpen && (
                  <div className="absolute right-0 top-[46px] z-10 w-40 rounded-[8px] border border-stroke bg-object p-1 shadow-lg">
                    {[
                      { value: "equipo", label: "Equipo" },
                      { value: "operador", label: "Operador" },
                      { value: "estado", label: "Estado" },
                      { value: "fecha", label: "Fecha" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className="flex w-full cursor-pointer rounded-[6px] px-3 py-2 text-left text-sm text-primary transition-colors hover:bg-border/60"
                        onClick={() => {
                          setSortBy(option.value as "equipo" | "operador" | "estado" | "fecha");
                          setSortOpen(false);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            }
          />
        }
        summary={`${rows.length} asignaciones`}
      />

      {form && (
        <ModalCard
          title="Asignar equipo"
          description="Un equipo solo puede tener una asignación activa a la vez."
          onClose={busy ? undefined : () => setForm(null)}
          footer={
            <>
              <Button text="Cancelar" onClick={() => setForm(null)} disabled={busy} />
              <Button
                text={busy ? "Guardando..." : "Asignar"}
                variant="primary"
                onClick={save}
                disabled={busy}
              />
            </>
          }
        >
          <SelectField
            label="Equipo"
            value={form.equipment_id}
            onChange={(value) =>
              setForm((current) => (current ? { ...current, equipment_id: value } : current))
            }
            options={data.equipment
              .filter((item) => !assignedEquipmentIds.has(item.id))
              .map((item) => ({
                value: String(item.id),
                label: `${item.brand} ${item.model} · ${item.serial}`,
              }))}
            placeholder={
              data.equipment.length === assignedEquipmentIds.size
                ? "Todos los equipos están asignados"
                : "Selecciona un equipo"
            }
          />
          <SelectField
            label="Operador"
            value={form.operator_id}
            onChange={(value) =>
              setForm((current) => (current ? { ...current, operator_id: value } : current))
            }
            options={operatorOptions}
            placeholder="Selecciona un operador"
          />
          <SelectField
            label="Asignador"
            value={form.assigned_by}
            onChange={(value) =>
              setForm((current) => (current ? { ...current, assigned_by: value } : current))
            }
            options={data.users.map((user) => ({
              value: String(user.id),
              label:
                user.email
                  .split("@")[0]
                  .split(".")
                  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(" ") || user.email,
            }))}
            placeholder={
              data.users.length === 0
                ? "No se pudieron cargar los usuarios"
                : "Selecciona quién entrega"
            }
          />
        </ModalCard>
      )}
    </Page>
  );
}

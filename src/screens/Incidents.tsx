import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, DataTable, Header, type DataTableColumn, type DataTableRow } from "../eq-ui";
import { SortDropdown } from "../components/SortDropdown";
import { incidentColumns, incidentRow } from "../tables/incidents";
import { api } from "../api/client";
import { errorMessage, useAsync, useScrollPreserve, useSort } from "../hooks";
import { displayName, equipmentLabel, userLabel } from "../lib/format";
import { toMap } from "../lib/lookups";
import { ErrorState, Loading } from "../components/Feedback";
import { ModalCard } from "../components/ModalCard";
import { Page } from "../components/Page";
import { SelectField } from "../components/SelectField";
import { Textfield } from "../eq-ui";

interface IncidentForm {
  equipment_id: string;
  type: string;
  reason: string;
  reported_by: string;
  technician_id: string;
}

const emptyForm: IncidentForm = {
  equipment_id: "",
  type: "",
  reason: "",
  reported_by: "",
  technician_id: "",
};

export function IncidentsScreen() {
  const { data, loading, error, reload } = useAsync(async () => {
    const [incidents, equipment, operators, assignments] = await Promise.all([
      api.incidents.list(0, 1000),
      api.equipment.list(0, 1000),
      api.operators.list(0, 1000),
      api.assignments.list(0, 1000),
    ]);
    const users = await api.users.list().catch(() => []);
    return { incidents, equipment, operators, assignments, users };
  }, []);

  const [search, setSearch] = useState("");
  const { sortBy, sortOpen, select: selectSort, toggle: toggleSort } = useSort<"equipo" | "tipo" | "tecnico" | "estado" | "fecha">("fecha");
  const [page, setPage] = useState(0);
  const [form, setForm] = useState<IncidentForm | null>(null);
  const [busy, setBusy] = useState(false);

  const { capture: captureScroll, restore: restoreScroll } = useScrollPreserve();
  useEffect(() => {
    restoreScroll();
  }, [page, restoreScroll]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const equipmentById = toMap(data.equipment);
  const userById = toMap(data.users);

  const term = search.trim().toLowerCase();
  const visible = data.incidents
    .filter((incident) => {
      const equipment = equipmentById.get(incident.equipment_id);
      const technician = userById.get(incident.technician_id);
      return `${equipment?.brand ?? ""} ${equipment?.model ?? ""} ${incident.type} ${incident.reason} ${technician ? displayName(technician.email) : ""}`
        .toLowerCase()
        .includes(term);
    })
    .sort((a, b) => {
      const av =
        sortBy === "equipo"
          ? equipmentLabel(equipmentById.get(a.equipment_id), a.equipment_id)
          : sortBy === "tipo"
            ? a.type
            : sortBy === "tecnico"
              ? userLabel(userById.get(a.technician_id), a.technician_id)
              : sortBy === "estado"
                ? a.status
                : a.created_at;
      const bv =
        sortBy === "equipo"
          ? equipmentLabel(equipmentById.get(b.equipment_id), b.equipment_id)
          : sortBy === "tipo"
            ? b.type
            : sortBy === "tecnico"
              ? userLabel(userById.get(b.technician_id), b.technician_id)
              : sortBy === "estado"
                ? b.status
                : b.created_at;
      return String(av).localeCompare(String(bv), "es", { sensitivity: "base" });
    });

  const columns: DataTableColumn[] = [
    ...incidentColumns,
    { key: "accion", header: "Acción", className: "justify-center" },
  ];

  const rows: DataTableRow[] = visible.map((incident) => ({
    ...incidentRow(incident, { equipmentById, userById }),
    accion:
      incident.status === "open" ? (
        <Button
          text="Cerrar"
          variant="ghost"
          className="h-8 px-3"
          disabled={busy}
          onClick={() => closeIncident(incident.id)}
        />
      ) : (
        "—"
      ),
  }));

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = rows.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const handlePrev = () => {
    captureScroll();
    setPage((value) => (value - 1 + totalPages) % totalPages);
  };
  const handleNext = () => {
    captureScroll();
    setPage((value) => (value + 1) % totalPages);
  };

  const operatorOptions = data.operators
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }))
    .map((operator) => ({
      value: String(operator.id),
      label: operator.name,
    }));
  const technicianOptions = data.users.map((user) => ({
    value: String(user.id),
    label: displayName(user.email),
  }));

  const reporterEquipmentIds = form?.reported_by
    ? data.assignments
        .filter(
          (assignment) =>
            assignment.status === "active" &&
            assignment.operator_id === Number(form.reported_by),
        )
        .map((assignment) => assignment.equipment_id)
    : [];
  const equipmentOptions = (reporterEquipmentIds.length > 0
    ? data.equipment.filter((item) => reporterEquipmentIds.includes(item.id))
    : data.equipment
  ).map((item) => ({
    value: String(item.id),
    label: `${item.brand} ${item.model} · ${item.serial}`,
  }));

  const chooseEquipment = (value: string) => {
    const assignment = data.assignments.find(
      (item) => item.status === "active" && item.equipment_id === Number(value),
    );
    setForm((current) =>
      current
        ? {
            ...current,
            equipment_id: value,
            reported_by: assignment ? String(assignment.operator_id) : current.reported_by,
          }
        : current,
    );
  };

  const chooseReporter = (value: string) => {
    const ids = data.assignments
      .filter(
        (assignment) =>
          assignment.status === "active" &&
          assignment.operator_id === Number(value),
      )
      .map((assignment) => assignment.equipment_id);
    setForm((current) =>
      current
        ? {
            ...current,
            reported_by: value,
            equipment_id: ids.length === 1 ? String(ids[0]) : "",
          }
        : current,
    );
  };

  async function save() {
    if (!form || busy) return;
    const equipmentId = Number(form.equipment_id);
    const reporterId = Number(form.reported_by);
    const technicianId = Number(form.technician_id);
    if (!equipmentId || !form.type.trim() || !form.reason.trim() || !reporterId || !technicianId) {
      toast.error("Completa todos los campos.");
      return;
    }

    setBusy(true);
    try {
      await api.incidents.create({
        equipment_id: equipmentId,
        type: form.type.trim(),
        reason: form.reason.trim(),
        reported_by: reporterId,
        technician_id: technicianId,
      });
      toast.success("Incidencia registrada");
      setForm(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function closeIncident(id: number) {
    if (busy) return;
    setBusy(true);
    try {
      await api.incidents.update(id, {
        status: "closed",
        resolved_at: new Date().toISOString(),
      });
      toast.success("Incidencia cerrada");
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <Page title="Incidencias" subtitle="Reportes de fallas y su seguimiento hasta el cierre.">
      <DataTable
        columns={columns}
        rows={pageRows}
        selectable={false}
        onPrevious={handlePrev}
        onNext={handleNext}
        toolbar={
          <Header
            variant="crud"
            searchProps={{
              placeholder: "Buscar incidencias...",
              value: search,
              onChange: (event) => setSearch(event.target.value),
            }}
            actionProps={{
              onAdd: () => setForm({ ...emptyForm }),
              showDelete: false,
            }}
            right={
              <div className="relative">
                <SortDropdown
                  options={[
                    { value: "equipo", label: "Equipo" },
                    { value: "tipo", label: "Tipo" },
                    { value: "tecnico", label: "Técnico" },
                    { value: "estado", label: "Estado" },
                    { value: "fecha", label: "Fecha" },
                  ]}
                  value={sortBy}
                  open={sortOpen}
                  onToggle={toggleSort}
                  onSelect={selectSort}
                />
              </div>
            }
          />
        }
        summary={`${rows.length} incidencias · pág. ${safePage + 1}/${totalPages}`}
      />

      {form && (
        <ModalCard
          title="Reportar incidencia"
          description="Las incidencias no se eliminan; se cierran cuando se resuelven."
          widthClassName="w-[840px] max-w-[calc(100vw-3rem)]"
          onClose={busy ? undefined : () => setForm(null)}
          footer={
            <>
              <Button text="Cancelar" onClick={() => setForm(null)} disabled={busy} />
              <Button
                text={busy ? "Guardando..." : "Registrar"}
                variant="primary"
                onClick={save}
                disabled={busy}
              />
            </>
          }
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectField
              label="Reportado por"
              searchable
              value={form.reported_by}
              onChange={chooseReporter}
              options={operatorOptions}
              placeholder="Selecciona el operador"
            />
            <SelectField
              label="Equipo"
              searchable
              value={form.equipment_id}
              onChange={chooseEquipment}
              options={equipmentOptions}
              placeholder={
                reporterEquipmentIds.length > 1
                  ? "Selecciona uno de sus equipos"
                  : "Selecciona un equipo"
              }
            />
            <Textfield
              label="Tipo"
              placeholder="Falla de hardware"
              value={form.type}
              onChange={(event) =>
                setForm((current) =>
                  current ? { ...current, type: event.target.value } : current,
                )
              }
              showIcon={false}
            />
            <SelectField
              label="Técnico asignado"
              searchable
              value={form.technician_id}
              onChange={(value) =>
                setForm((current) =>
                  current ? { ...current, technician_id: value } : current,
                )
              }
              options={technicianOptions}
              placeholder={
                data.users.length === 0
                  ? "No se pudieron cargar los usuarios"
                  : "Selecciona el técnico"
              }
            />
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-base font-normal text-primary">Motivo</span>
            <textarea
              placeholder="Describe el problema"
              value={form.reason}
              onChange={(event) =>
                setForm((current) =>
                  current ? { ...current, reason: event.target.value } : current,
                )
              }
              className="min-h-24 w-full resize-y rounded-[8px] border border-stroke bg-transparent p-2 text-base font-normal text-primary outline-none placeholder:text-primary/45 focus:ring-[1px] focus:ring-zinc-400/40"
            />
          </label>
        </ModalCard>
      )}
    </Page>
    <div className="flex-1" />
  </div>
  );
}

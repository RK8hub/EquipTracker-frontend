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
    const [incidents, equipment, operators] = await Promise.all([
      api.incidents.list(0, 1000),
      api.equipment.list(0, 1000),
      api.operators.list(0, 1000),
    ]);
    return { incidents, equipment, operators };
  }, []);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"equipo" | "tipo" | "tecnico" | "estado" | "fecha">("fecha");
  const [sortOpen, setSortOpen] = useState(false);
  const [form, setForm] = useState<IncidentForm | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const equipmentById = new Map(data.equipment.map((item) => [item.id, item]));
  const operatorById = new Map(data.operators.map((item) => [item.id, item]));

  const term = search.trim().toLowerCase();
  const visible = data.incidents
    .filter((incident) => {
      const equipment = equipmentById.get(incident.equipment_id);
      const technician = operatorById.get(incident.technician_id);
      return `${equipment?.brand ?? ""} ${equipment?.model ?? ""} ${incident.type} ${incident.reason} ${technician?.name ?? ""}`
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
              ? operatorLabel(operatorById.get(a.technician_id), a.technician_id)
              : sortBy === "estado"
                ? a.status
                : a.created_at;
      const bv =
        sortBy === "equipo"
          ? equipmentLabel(equipmentById.get(b.equipment_id), b.equipment_id)
          : sortBy === "tipo"
            ? b.type
            : sortBy === "tecnico"
              ? operatorLabel(operatorById.get(b.technician_id), b.technician_id)
              : sortBy === "estado"
                ? b.status
                : b.created_at;
      return String(av).localeCompare(String(bv), "es", { sensitivity: "base" });
    });

  const columns: DataTableColumn[] = [
    { key: "equipo", header: "Equipo" },
    { key: "tipo", header: "Tipo" },
    { key: "motivo", header: "Motivo" },
    { key: "tecnico", header: "Técnico" },
    { key: "estado", header: "Estado" },
    { key: "fecha", header: "Fecha" },
    { key: "accion", header: "Acción" },
  ];

  const rows: DataTableRow[] = visible.map((incident) => ({
    id: String(incident.id),
    equipo: equipmentLabel(equipmentById.get(incident.equipment_id), incident.equipment_id),
    tipo: incident.type,
    motivo: incident.reason,
    tecnico: operatorLabel(operatorById.get(incident.technician_id), incident.technician_id),
    estado: incident.status === "open" ? "Abierta" : "Cerrada",
    fecha: formatDate(incident.created_at),
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

  const operatorOptions = data.operators.map((operator) => ({
    value: String(operator.id),
    label: operator.name,
  }));

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
    <Page title="Incidencias" subtitle="Reportes de fallas y su seguimiento hasta el cierre.">
      <DataTable
        columns={columns}
        rows={rows}
        selectable={false}
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
                <DropdownButton
                  label={
                    sortBy === "equipo"
                      ? "Equipo"
                      : sortBy === "tipo"
                        ? "Tipo"
                        : sortBy === "tecnico"
                          ? "Técnico"
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
                      { value: "tipo", label: "Tipo" },
                      { value: "tecnico", label: "Técnico" },
                      { value: "estado", label: "Estado" },
                      { value: "fecha", label: "Fecha" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className="flex w-full cursor-pointer rounded-[6px] px-3 py-2 text-left text-sm text-primary transition-colors hover:bg-border/60"
                        onClick={() => {
                          setSortBy(option.value as "equipo" | "tipo" | "tecnico" | "estado" | "fecha");
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
        summary={`${rows.length} incidencias`}
      />

      {form && (
        <ModalCard
          title="Reportar incidencia"
          description="Las incidencias no se eliminan; se cierran cuando se resuelven."
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
          <SelectField
            label="Equipo"
            value={form.equipment_id}
            onChange={(value) =>
              setForm((current) => (current ? { ...current, equipment_id: value } : current))
            }
            options={data.equipment.map((item) => ({
              value: String(item.id),
              label: `${item.brand} ${item.model} · ${item.serial}`,
            }))}
            placeholder="Selecciona un equipo"
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
          <Textfield
            label="Motivo"
            placeholder="Describe el problema"
            value={form.reason}
            onChange={(event) =>
              setForm((current) =>
                current ? { ...current, reason: event.target.value } : current,
              )
            }
            showIcon={false}
          />
          <SelectField
            label="Reportado por"
            value={form.reported_by}
            onChange={(value) =>
              setForm((current) =>
                current ? { ...current, reported_by: value } : current,
              )
            }
            options={operatorOptions}
            placeholder="Selecciona el operador"
          />
          <SelectField
            label="Técnico asignado"
            value={form.technician_id}
            onChange={(value) =>
              setForm((current) =>
                current ? { ...current, technician_id: value } : current,
              )
            }
            options={operatorOptions}
            placeholder="Selecciona el técnico"
          />
        </ModalCard>
      )}
    </Page>
  );
}

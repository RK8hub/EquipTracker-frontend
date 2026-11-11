import { useState } from "react";
import { toast } from "sonner";
import {
  Button,
  CardEquipment,
  DropdownButton,
  Header,
  Popup,
  Textfield,
} from "../eq-ui";
import { api } from "../api/client";
import { errorMessage, useAsync } from "../hooks";
import { ErrorState, Loading } from "../components/Feedback";
import { ModalCard } from "../components/ModalCard";
import { Overlay } from "../components/Overlay";
import { Page } from "../components/Page";
import { SelectField } from "../components/SelectField";
import { SpecsModal } from "../components/SpecsModal";
import type { Specs } from "../types";

interface EquipmentForm {
  id?: number;
  serial: string;
  brand: string;
  model: string;
  specs_id: string;
}

const emptyForm: EquipmentForm = {
  serial: "",
  brand: "",
  model: "",
  specs_id: "",
};

function specsLabel(spec: Specs): string {
  return `#${spec.id} · ${spec.cpu.brand} ${spec.cpu.model} · ${spec.ram.capacity.value}${spec.ram.capacity.unit}`;
}

export function EquipmentScreen() {
  const { data, loading, error, reload } = useAsync(async () => {
    const [equipment, specs, operators, assignments, incidents] =
      await Promise.all([
        api.equipment.list(0, 1000),
        api.specs.list(0, 1000),
        api.operators.list(0, 1000),
        api.assignments.list(0, 1000),
        api.incidents.list(0, 1000),
      ]);
    return { equipment, specs, operators, assignments, incidents };
  }, []);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"modelo" | "serial" | "estado">("modelo");
  const [sortOpen, setSortOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState<EquipmentForm | null>(null);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const operatorById = new Map(
    data.operators.map((operator) => [operator.id, operator]),
  );
  const activeAssignmentByEquipment = new Map(
    data.assignments
      .filter((assignment) => assignment.status === "active")
      .map((assignment) => [assignment.equipment_id, assignment]),
  );
  const openIncidentsByEquipment = new Map<number, number>();
  for (const incident of data.incidents) {
    if (incident.status !== "open") continue;
    openIncidentsByEquipment.set(
      incident.equipment_id,
      (openIncidentsByEquipment.get(incident.equipment_id) ?? 0) + 1,
    );
  }

  const term = search.trim().toLowerCase();
  const filtered = data.equipment
    .filter((equipment) =>
      `${equipment.serial} ${equipment.brand} ${equipment.model}`
        .toLowerCase()
        .includes(term),
    )
    .sort((a, b) => {
      const av =
        sortBy === "modelo"
          ? `${a.brand} ${a.model}`
          : sortBy === "serial"
            ? a.serial
            : data.assignments.some(
                (assignment) =>
                  assignment.equipment_id === a.id && assignment.status === "active",
              )
              ? "Asignado"
              : "Disponible";
      const bv =
        sortBy === "modelo"
          ? `${b.brand} ${b.model}`
          : sortBy === "serial"
            ? b.serial
            : data.assignments.some(
                (assignment) =>
                  assignment.equipment_id === b.id && assignment.status === "active",
              )
              ? "Asignado"
              : "Disponible";
      return String(av).localeCompare(String(bv), "es", { sensitivity: "base" });
    });

  function toggleSelected(id: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...current, id] : current.filter((item) => item !== id),
    );
  }

  async function save() {
    if (!form || busy) return;
    const specsId = Number(form.specs_id);
    if (!form.serial.trim() || !form.brand.trim() || !form.model.trim()) {
      toast.error("Completa serial, marca y modelo.");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        serial: form.serial.trim().toUpperCase(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        specs_id: specsId || null,
      };
      if (form.id) {
        await api.equipment.update(form.id, payload);
        toast.success("Equipo actualizado");
      } else {
        await api.equipment.create(payload);
        toast.success("Equipo creado");
      }
      setForm(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function deleteSelected() {
    if (busy) return;
    setBusy(true);
    try {
      for (const id of selected) {
        await api.equipment.remove(Number(id));
      }
      toast.success("Equipos eliminados");
      setSelected([]);
      setConfirmDelete(false);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
      reload();
    }
  }

  return (
    <Page
      title="Equipos"
      subtitle="Inventario de equipos registrados y su asignación actual."
    >
      <Header
        variant="crud"
        searchProps={{
          placeholder: "Buscar equipos...",
          value: search,
          onChange: (event) => setSearch(event.target.value),
        }}
        actionProps={{
          onAdd: () => setForm({ ...emptyForm }),
          onDelete: () =>
            selected.length
              ? setConfirmDelete(true)
              : toast.error("Selecciona al menos un equipo."),
        }}
        right={
          <div className="relative">
            <DropdownButton
              label={
                sortBy === "modelo"
                  ? "Modelo"
                  : sortBy === "serial"
                    ? "Serial"
                    : "Estado"
              }
              open={sortOpen}
              onClick={() => setSortOpen((value) => !value)}
            />
            {sortOpen && (
              <div className="absolute right-0 top-[46px] z-10 w-40 rounded-[8px] border border-stroke bg-object p-1 shadow-lg">
                {[
                  { value: "modelo", label: "Modelo" },
                  { value: "serial", label: "Serial" },
                  { value: "estado", label: "Estado" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="flex w-full cursor-pointer rounded-[6px] px-3 py-2 text-left text-sm text-primary transition-colors hover:bg-border/60"
                    onClick={() => {
                      setSortBy(option.value as "modelo" | "serial" | "estado");
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

      {filtered.length === 0 ? (
        <p className="p-10 text-center text-sm text-muted-foreground">
          Sin equipos registrados.
        </p>
      ) : (
        <div className="flex flex-wrap gap-4">
          {filtered.map((equipment) => {
            const active = activeAssignmentByEquipment.get(equipment.id);
            const operatorName = active
              ? operatorById.get(active.operator_id)?.name ?? "Sin asignar"
              : "Sin asignar";
            return (
              <CardEquipment
                key={equipment.id}
                name={`${equipment.model}`}
                operator={`${operatorName}`}
                incidents={openIncidentsByEquipment.get(equipment.id) ?? 0}
                selected={selected.includes(String(equipment.id))}
                onSelectedChange={(checked) =>
                  toggleSelected(String(equipment.id), checked)
                }
                onMore={() =>
                  setForm({
                    id: equipment.id,
                    serial: equipment.serial,
                    brand: equipment.brand,
                    model: equipment.model,
                    specs_id: equipment.specs_id
                      ? String(equipment.specs_id)
                      : "",
                  })
                }
              />
            );
          })}
        </div>
      )}

      {form && (
        <ModalCard
          title={form.id ? "Editar equipo" : "Nuevo equipo"}
          description="El serial debe usar mayúsculas, números y guiones."
          onClose={busy ? undefined : () => setForm(null)}
          footer={
            <>
              <Button
                text="Cancelar"
                onClick={() => setForm(null)}
                disabled={busy}
              />
              <Button
                text={busy ? "Guardando..." : "Guardar"}
                variant="primary"
                onClick={save}
                disabled={busy}
              />
            </>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <Textfield
              label="Serial"
              placeholder="SN-001"
              value={form.serial}
              onChange={(event) =>
                setForm((current) =>
                  current ? { ...current, serial: event.target.value } : current,
                )
              }
              showIcon={false}
            />
            <Textfield
              label="Marca"
              placeholder="Dell"
              value={form.brand}
              onChange={(event) =>
                setForm((current) =>
                  current ? { ...current, brand: event.target.value } : current,
                )
              }
              showIcon={false}
            />
            <Textfield
              label="Modelo"
              placeholder="Latitude 5440"
              value={form.model}
              onChange={(event) =>
                setForm((current) =>
                  current ? { ...current, model: event.target.value } : current,
                )
              }
              showIcon={false}
            />
          </div>

          <SelectField
            label="Especificación"
            value={form.specs_id}
            onChange={(value) =>
              setForm((current) =>
                current ? { ...current, specs_id: value } : current,
              )
            }
            options={data.specs.map((spec) => ({
              value: String(spec.id),
              label: specsLabel(spec),
            }))}
            placeholder={
              data.specs.length ? "Sin especificación" : "Sin especificaciones"
            }
          />

          <div className="flex justify-end">
            <Button
              text="Nueva especificación"
              onClick={() => setSpecsOpen(true)}
              disabled={busy}
            />
          </div>
        </ModalCard>
      )}

      {specsOpen && (
        <SpecsModal
          onClose={() => setSpecsOpen(false)}
          onCreated={(spec) => {
            setSpecsOpen(false);
            setForm((current) =>
              current ? { ...current, specs_id: String(spec.id) } : current,
            );
            reload();
          }}
        />
      )}

      {confirmDelete && (
        <Overlay onClose={() => !busy && setConfirmDelete(false)}>
          <Popup
            title="¿Eliminar equipos?"
            description={`Se eliminarán ${selected.length} equipo(s). La operación falla si tienen asignaciones o incidencias.`}
            acceptLabel={busy ? "Eliminando..." : "Eliminar"}
            acceptVariant="destructive"
            onAccept={deleteSelected}
            onCancel={() => setConfirmDelete(false)}
          />
        </Overlay>
      )}
    </Page>
  );
}

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CardOperador, DropdownButton, Header, ModalOperator, Popup } from "../eq-ui";
import { api } from "../api/client";
import { errorMessage, useAsync } from "../hooks";
import { initials } from "../lib/format";
import { ErrorState, Loading } from "../components/Feedback";
import { Overlay } from "../components/Overlay";
import { Page } from "../components/Page";

interface OperatorForm {
  id?: number;
  name: string;
  department: string;
  position: string;
}

const emptyForm: OperatorForm = { name: "", department: "", position: "" };

export function OperatorsScreen() {
  const { data, loading, error, reload } = useAsync(async () => {
    const [operators, assignments, incidents] = await Promise.all([
      api.operators.list(0, 1000),
      api.assignments.list(0, 1000),
      api.incidents.list(0, 1000),
    ]);
    return { operators, assignments, incidents };
  }, []);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "department" | "position">("name");
  const [sortOpen, setSortOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState<OperatorForm | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const activeByOperator = new Map<number, number>();
  for (const assignment of data.assignments) {
    if (assignment.status !== "active") continue;
    activeByOperator.set(
      assignment.operator_id,
      (activeByOperator.get(assignment.operator_id) ?? 0) + 1,
    );
  }

  const incidentsByOperator = new Map<number, number>();
  for (const incident of data.incidents) {
    if (incident.status !== "open") continue;
    for (const id of [incident.reported_by, incident.technician_id]) {
      incidentsByOperator.set(id, (incidentsByOperator.get(id) ?? 0) + 1);
    }
  }

  const term = search.trim().toLowerCase();
  const filtered = data.operators
    .filter((operator) =>
      `${operator.name} ${operator.department} ${operator.position}`
        .toLowerCase()
        .includes(term),
    )
    .sort((a, b) =>
      a[sortBy].localeCompare(b[sortBy], "es", { sensitivity: "base" }),
    );

  function tagsFor(operatorId: number) {
    return [
      { label: "Equipos Activos", quantity: activeByOperator.get(operatorId) ?? 0 },
      { label: "Incidencias", quantity: incidentsByOperator.get(operatorId) ?? 0 },
    ];
  }

  function toggleSelected(id: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...current, id] : current.filter((item) => item !== id),
    );
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || busy) return;
    if (!form.name.trim() || !form.department.trim() || !form.position.trim()) {
      toast.error("Completa nombre, departamento y puesto.");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        department: form.department.trim(),
        position: form.position.trim(),
      };
      if (form.id) {
        await api.operators.update(form.id, payload);
        toast.success("Operador actualizado");
      } else {
        await api.operators.create(payload);
        toast.success("Operador creado");
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
        await api.operators.remove(Number(id));
      }
      toast.success("Operadores eliminados");
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
      title="Operadores"
      subtitle="Personas que reciben equipos y reportan incidencias."
    >
      <Header
        variant="crud"
        searchProps={{
          placeholder: "Buscar operadores...",
          value: search,
          onChange: (event) => setSearch(event.target.value),
        }}
        actionProps={{
          onAdd: () => setForm({ ...emptyForm }),
          onDelete: () =>
            selected.length
              ? setConfirmDelete(true)
              : toast.error("Selecciona al menos un operador."),
        }}
        right={
          <div className="relative">
            <DropdownButton
              label={
                sortBy === "name"
                  ? "Nombre"
                  : sortBy === "department"
                    ? "Departamento"
                    : "Puesto"
              }
              open={sortOpen}
              onClick={() => setSortOpen((value) => !value)}
            />
            {sortOpen && (
              <div className="absolute right-0 top-[46px] z-10 w-40 rounded-[8px] border border-stroke bg-object p-1 shadow-lg">
                {[
                  { value: "name", label: "Nombre" },
                  { value: "department", label: "Departamento" },
                  { value: "position", label: "Puesto" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="flex w-full cursor-pointer rounded-[6px] px-3 py-2 text-left text-sm text-primary transition-colors hover:bg-border/60"
                    onClick={() => {
                      setSortBy(option.value as "name" | "department" | "position");
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
          Sin operadores registrados.
        </p>
      ) : (
        <div className="flex flex-wrap gap-4">
          {filtered.map((operator) => (
            <CardOperador
              key={operator.id}
              name={operator.name}
              area={operator.department}
              initials={initials(operator.name)}
              tags={tagsFor(operator.id)}
              selected={selected.includes(String(operator.id))}
              onSelectedChange={(checked) =>
                toggleSelected(String(operator.id), checked)
              }
              onMore={() =>
                setForm({
                  id: operator.id,
                  name: operator.name,
                  department: operator.department,
                  position: operator.position,
                })
              }
            />
          ))}
        </div>
      )}

      {form && (
        <Overlay onClose={() => !busy && setForm(null)}>
          <ModalOperator
            initials={initials(form.name)}
            name={form.name}
            department={form.department}
            position={form.position}
            values={{
              name: form.name,
              department: form.department,
              position: form.position,
            }}
            onValueChange={(field, value) =>
              setForm((current) =>
                current ? { ...current, [field]: value } : current,
              )
            }
            tags={form.id ? tagsFor(form.id) : []}
            busy={busy}
            saveLabel={form.id ? "Guardar" : "Crear"}
            onSubmit={save}
            onCancel={() => setForm(null)}
          />
        </Overlay>
      )}

      {confirmDelete && (
        <Overlay onClose={() => !busy && setConfirmDelete(false)}>
          <Popup
            title="¿Eliminar operadores?"
            description={`Se eliminarán ${selected.length} operador(es). La operación falla si tienen asignaciones o incidencias.`}
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

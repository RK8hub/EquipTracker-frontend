import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CardOperador, Header, ModalOperator, Popup } from "../eq-ui";
import { SortDropdown } from "../components/SortDropdown";
import { api } from "../api/client";
import { errorMessage, useAsync, useSort } from "../hooks";
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
  const { sortBy, sortOpen, select: selectSort, toggle: toggleSort } = useSort<"name" | "department" | "position" | "equipos">("name");
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

  const term = search.trim().toLowerCase();
  const filtered = data.operators
    .filter((operator) =>
      `${operator.name} ${operator.department} ${operator.position}`
        .toLowerCase()
        .includes(term),
    )
    .sort((a, b) => {
      if (sortBy === "equipos") {
        return (activeByOperator.get(a.id) ?? 0) - (activeByOperator.get(b.id) ?? 0);
      }
      return a[sortBy].localeCompare(b[sortBy], "es", { sensitivity: "base" });
    });

  function tagsFor(operatorId: number) {
    return [
      { label: "Equipos Activos", quantity: activeByOperator.get(operatorId) ?? 0 },
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
            <SortDropdown
              options={[
                { value: "name", label: "Nombre" },
                { value: "department", label: "Departamento" },
                { value: "position", label: "Puesto" },
                { value: "equipos", label: "Equipos activos" },
              ]}
              value={sortBy}
              open={sortOpen}
              onToggle={toggleSort}
              onSelect={selectSort}
            />
          </div>
        }
      />

      {filtered.length === 0 ? (
        <p className="p-10 text-center text-sm text-muted-foreground">
          Sin operadores registrados.
        </p>
      ) : (
        <div className="flex flex-wrap gap-15 justify-start items-center ">
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

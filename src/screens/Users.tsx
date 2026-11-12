import { useState } from "react";
import { toast } from "sonner";
import { Button, Textfield } from "../eq-ui";
import { api } from "../api/client";
import { errorMessage, useAsync } from "../hooks";
import { formatDate } from "../lib/format";
import { ErrorState, Loading } from "../components/Feedback";
import { ModalCard } from "../components/ModalCard";
import { Page } from "../components/Page";

interface UserForm {
  email: string;
  password: string;
}

const emptyForm: UserForm = { email: "", password: "" };

const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,64}$/;

function validPassword(value: string): boolean {
  return PASSWORD_RE.test(value) && new TextEncoder().encode(value).length <= 72;
}

export function UsersScreen() {
  const { data, loading, error, reload } = useAsync(async () => {
    const users = await api.users.list();
    return { users };
  }, []);

  const [form, setForm] = useState<UserForm>({ ...emptyForm });
  const [busy, setBusy] = useState(false);

  const [changingId, setChangingId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");

  if (loading && !data) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!form.email.trim() || !form.password.trim()) {
      toast.error("Completa correo y contraseña.");
      return;
    }
    if (!validPassword(form.password)) {
      toast.error("Contraseña inválida: 8-64 chars, letras, numeros y symbol, sin espacios.");
      return;
    }
    setBusy(true);
    try {
      await api.users.create({ email: form.email.trim(), password: form.password });
      toast.success("Usuario creado");
      setForm({ ...emptyForm });
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Eliminar este usuario?")) return;
    setBusy(true);
    try {
      await api.users.delete(id);
      toast.success("Usuario eliminado");
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    if (!changingId) return;
    if (!validPassword(newPassword)) {
      toast.error("Contraseña inválida: 8-64 chars, letras, numeros y symbol, sin espacios.");
      return;
    }
    setBusy(true);
    try {
      await api.users.changePassword(changingId, newPassword);
      toast.success("Contraseña actualizada");
      setChangingId(null);
      setNewPassword("");
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page title="Usuarios" subtitle="Cuentas con acceso al sistema.">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-[24px] border border-stroke bg-card p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Nuevo usuario</h2>
          <form className="flex flex-col gap-4" onSubmit={save}>
            <Textfield
              label="Correo"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="correo@ejemplo.com"
            />
            <Textfield
              label="Contraseña"
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
              placeholder="Contraseña"
            />
            <p className="text-xs text-muted-foreground">
              8-64 caracteres, letras, números y symbol, sin espacios.
            </p>
            <Button text={busy ? "Guardando..." : "Crear"} variant="primary" type="submit" disabled={busy} />
          </form>
        </section>

        <section className="rounded-[24px] border border-stroke bg-card p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Usuarios registrados</h2>
          <div className="flex flex-col gap-3">
            {data.users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-[12px] border border-stroke/60 bg-object px-4 py-3"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.email}</span>
                  <span className="text-xs text-muted-foreground">
                    {user.role} · {formatDate(user.created_at)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    text="Contraseña"
                    variant="ghost"
                    className="h-8 px-3"
                    disabled={busy}
                    onClick={() => {
                      setChangingId(user.id);
                      setNewPassword("");
                    }}
                  />
                  <Button
                    text="Eliminar"
                    variant="ghost"
                    className="h-8 px-3"
                    disabled={busy}
                    onClick={() => remove(user.id)}
                  />
                </div>
              </div>
            ))}
            {data.users.length === 0 && <p className="text-sm text-muted-foreground">Sin usuarios.</p>}
          </div>
          <p className="text-xs text-muted-foreground">{data.users.length} usuarios</p>
        </section>
      </div>

      {changingId !== null && (
        <ModalCard
          title="Cambiar contraseña"
          description="Solo se puede cambiar cada 48 horas."
          onClose={busy ? undefined : () => setChangingId(null)}
          footer={
            <>
              <Button text="Cancelar" onClick={() => setChangingId(null)} disabled={busy} />
              <Button
                text={busy ? "Guardando..." : "Actualizar"}
                variant="primary"
                onClick={changePassword}
                disabled={busy}
              />
            </>
          }
        >
          <Textfield
            label="Nueva contraseña"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Nueva contraseña"
          />
        </ModalCard>
      )}
    </Page>
  );
}

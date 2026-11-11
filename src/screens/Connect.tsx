import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ConectBox } from "../eq-ui";
import { checkHealth } from "../api/client";
import { errorMessage } from "../hooks";

export interface ConnectScreenProps {
  onConnected: (url: string) => Promise<void> | void;
}

function normalize(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
}

export function ConnectScreen({ onConnected }: ConnectScreenProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function test(): Promise<string | null> {
    const target = normalize(url);
    if (!target) {
      setError("Ingresa la dirección del servidor.");
      return null;
    }
    setBusy(true);
    setError(null);
    try {
      const health = await checkHealth(target);
      if (health.database !== "connected") {
        setError("El servidor responde, pero la base de datos no está conectada.");
        return null;
      }
      return target;
    } catch (err) {
      setError(errorMessage(err));
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = await test();
    if (!target) return;
    await onConnected(target);
    toast.success("Servidor conectado");
  }

  async function handleTest() {
    const target = await test();
    if (target) toast.success("Conexión correcta");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-[452px]">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-[24px] bg-brand text-2xl font-semibold text-brand-foreground">
            EQ
          </div>
          <h1 className="text-2xl font-semibold">EquipTracker</h1>
          <p className="text-sm text-muted-foreground">
            Configura el servidor antes de iniciar sesión.
          </p>
        </div>
        <ConectBox
          value={url}
          onChange={setUrl}
          error={error ?? undefined}
          busy={busy}
          onSubmit={handleSubmit}
          onCancel={handleTest}
        />
      </div>
    </div>
  );
}

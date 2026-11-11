import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, Textfield } from "../eq-ui";
import { checkHealth } from "../api/client";
import { getStored } from "../lib/storage";
import { Page } from "../components/Page";

export interface SettingsScreenProps {
  baseUrl: string;
  companyName: string;
  accent: string;
  onCompanyChange: (value: string) => Promise<void> | void;
  onAccentChange: (value: string) => Promise<void> | void;
  onLogout: () => Promise<void> | void;
}

export function SettingsScreen({
  baseUrl,
  companyName,
  accent,
  onCompanyChange,
  onAccentChange,
  onLogout,
}: SettingsScreenProps) {
  const [testing, setTesting] = useState(false);
  const [health, setHealth] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [companyInput, setCompanyInput] = useState(companyName);
  const [savingCompany, setSavingCompany] = useState(false);
  const [accentInput, setAccentInput] = useState(accent);
  const [savingAccent, setSavingAccent] = useState(false);

  useEffect(() => {
    setCompanyInput(companyName);
  }, [companyName]);

  useEffect(() => {
    setAccentInput(accent);
  }, [accent]);

  useEffect(() => {
    (async () => {
      const stored = await getStored<"dark" | "light">("theme");
      const next = stored ?? "dark";
      setTheme(next);
      document.documentElement.classList.toggle("dark", next === "dark");
    })();
  }, []);

  async function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    await (await import("../lib/storage")).setStored("theme", next);
    toast.success(`Tema ${next === "dark" ? "oscuro" : "claro"} activado`);
  }

  async function testConnection() {
    setTesting(true);
    setError(null);
    setHealth(null);
    try {
      const result = await checkHealth(baseUrl);
      setHealth(`OK · BD ${result.database} · v${result.version}`);
      toast.success("Conexión correcta");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setTesting(false);
    }
  }

  return (
    <Page title="Ajustes" subtitle="Preferencias de la aplicación y del servidor.">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-[24px] border border-stroke bg-card p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Apariencia</h2>
          <p className="text-sm text-muted-foreground">
            Tema actual: {theme === "dark" ? "Oscuro" : "Claro"}
          </p>
          <Button
            text={theme === "dark" ? "Cambiar a claro" : "Cambiar a oscuro"}
            onClick={toggleTheme}
          />
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accentInput}
              onChange={(event) => setAccentInput(event.target.value)}
              className="h-[42px] w-[60px] cursor-pointer rounded-[8px] border border-stroke bg-object"
            />
            <span className="text-sm text-muted-foreground flex-1">{accentInput}</span>
            <Button
              text={savingAccent ? "Aplicando..." : "Aplicar"}
              disabled={savingAccent}
              onClick={async () => {
                setSavingAccent(true);
                try {
                  await onAccentChange(accentInput);
                  toast.success("Color de acento actualizado");
                } finally {
                  setSavingAccent(false);
                }
              }}
            />
          </div>
        </section>

        <section className="rounded-[24px] border border-stroke bg-card p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Empresa</h2>
          <Textfield
            label="Nombre de la empresa"
            placeholder="Mi empresa"
            value={companyInput}
            onChange={(event) => setCompanyInput(event.target.value)}
            showIcon={false}
          />
          <Button
            text={savingCompany ? "Guardando..." : "Guardar"}
            disabled={savingCompany}
            onClick={async () => {
              setSavingCompany(true);
              try {
                await onCompanyChange(companyInput.trim());
                toast.success("Empresa actualizada");
              } finally {
                setSavingCompany(false);
              }
            }}
          />
        </section>

        <section className="rounded-[24px] border border-stroke bg-card p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Servidor</h2>
          <p className="text-sm text-muted-foreground break-all">{baseUrl}</p>
          <Button
            text={testing ? "Probando..." : "Probar conexión"}
            onClick={testConnection}
            disabled={testing}
          />
          {health && <p className="text-sm text-success">{health}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </section>

        <section className="rounded-[24px] border border-stroke bg-card p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Sesión</h2>
          <p className="text-sm text-muted-foreground">
            Cierra tu sesión actual.
          </p>
          <Button text="Cerrar sesión" onClick={onLogout} />
        </section>
      </div>
    </Page>
  );
}

import { useState, type FormEvent } from "react";
import { LoginPanel } from "../eq-ui";
import { api } from "../api/client";
import { errorMessage } from "../hooks";

export interface LoginScreenProps {
  baseUrl: string;
  onLoggedIn: (token: string, email: string) => Promise<void> | void;
  onChangeServer: () => Promise<void> | void;
}

export function LoginScreen({
  baseUrl,
  onLoggedIn,
  onChangeServer,
}: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await api.login(email.trim(), password);
      await onLoggedIn(response.access_token, email.trim());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
      <LoginPanel
        email={email}
        password={password}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        error={error ?? undefined}
        busy={busy}
        onSubmit={handleSubmit}
      />
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
        <span>Servidor: {baseUrl}</span>
        <button
          type="button"
          className="cursor-pointer underline"
          onClick={onChangeServer}
        >
          Cambiar servidor
        </button>
      </div>
    </div>
  );
}

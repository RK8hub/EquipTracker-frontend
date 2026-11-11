import type { FormHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { Button } from "../Button";
import { Textfield } from "../Textfield";
import { cn } from "../../lib/cn";
import "./login-panel.css";

export interface LoginPanelProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onSubmit"> {
  title?: string;
  description?: string;
  emailLabel?: string;
  emailPlaceholder?: string;
  passwordLabel?: string;
  passwordPlaceholder?: string;
  submitLabel?: string;
  legal?: string;
  logo?: ReactNode;
  email?: string;
  password?: string;
  onEmailChange?: (value: string) => void;
  onPasswordChange?: (value: string) => void;
  error?: string;
  busy?: boolean;
  onSubmit?: FormHTMLAttributes<HTMLFormElement>["onSubmit"];
  /** Atributos del formulario interno. */
  formProps?: Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit">;
}

export function LoginPanel({
  title = "Bienvenido",
  description = "Usa tu correo corporativo para iniciar sesión o solicita al administrador una cuenta.",
  emailLabel = "Correo",
  emailPlaceholder = "Usuario@empresa.com",
  passwordLabel = "Contraseña",
  passwordPlaceholder = "***********",
  submitLabel = "Iniciar sesión",
  legal = "Al continuar, aceptas nuestros Términos de servicio y Política de privacidad.",
  logo,
  email,
  password,
  onEmailChange,
  onPasswordChange,
  error,
  busy = false,
  onSubmit,
  formProps,
  className,
  ...props
}: LoginPanelProps) {
  return (
    <div className={cn("eq-login-panel", className)} {...props}>
      <form className="eq-login-panel__panel" onSubmit={onSubmit} {...formProps}>
        <div className="eq-login-panel__action">
          <div className="eq-login-panel__welcome">
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <Textfield
            label={emailLabel}
            type="email"
            placeholder={emailPlaceholder}
            showIcon={false}
            autoComplete="email"
            name="email"
            value={email}
            onChange={(event) => onEmailChange?.(event.target.value)}
            disabled={busy}
            required
          />
          <Textfield
            label={passwordLabel}
            type="password"
            placeholder={passwordPlaceholder}
            showIcon={false}
            autoComplete="current-password"
            name="password"
            value={password}
            onChange={(event) => onPasswordChange?.(event.target.value)}
            disabled={busy}
            required
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            text={busy ? "Ingresando..." : submitLabel}
            className="w-full"
            disabled={busy}
          />
        </div>
        <div className="eq-login-panel__logo">
          {logo ?? <span className="eq-login-panel__logo-mark">EQ</span>}
        </div>
      </form>
      <p className="eq-login-panel__legal">{legal}</p>
    </div>
  );
}

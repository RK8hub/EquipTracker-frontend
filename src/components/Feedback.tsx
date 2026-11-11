import { Button } from "../eq-ui";

export function Loading() {
  return (
    <div className="p-10 text-center text-sm text-muted-foreground">
      Cargando…
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[24px] border border-destructive/40 bg-destructive/10 p-8 text-center">
      <p className="text-sm text-primary">{message}</p>
      {onRetry && <Button text="Reintentar" onClick={onRetry} />}
    </div>
  );
}

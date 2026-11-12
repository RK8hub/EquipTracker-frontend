export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return letters.toUpperCase() || "??";
}

export function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-NI", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function equipmentLabel(
  equipment: { brand: string; model: string; serial: string } | undefined,
  id: number,
): string {
  return equipment
    ? `${equipment.brand} ${equipment.model}`
    : `Equipo #${id}`;
}

export function operatorLabel(
  operator: { name: string } | undefined,
  id: number,
): string {
  return operator?.name ?? `Operador #${id}`;
}

export function displayName(email: string): string {
  return (
    (email.split("@")[0] || "")
      .split(".")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ") || email
  );
}

export function contrastColor(hex: string): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "#ffffff";
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

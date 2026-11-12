export function roleFromToken(token: string | null): string {
  if (!token) return "staff";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.role === "string" ? payload.role : "staff";
  } catch {
    return "staff";
  }
}
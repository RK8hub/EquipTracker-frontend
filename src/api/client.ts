import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import type {
  Assignment,
  AssignmentInput,
  AssignmentUpdate,
  Equipment,
  EquipmentInput,
  Health,
  Incident,
  IncidentInput,
  IncidentUpdate,
  Operator,
  OperatorInput,
  Specs,
  SpecsInput,
  TokenResponse,
  User,
} from "../types";

const isTauri = () =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let baseUrl = "";
let token: string | null = null;

export function configureApi(next: {
  baseUrl?: string;
  token?: string | null;
}): void {
  if (next.baseUrl !== undefined) baseUrl = next.baseUrl.replace(/\/+$/, "");
  if (next.token !== undefined) token = next.token;
}

function resolve(path: string): string {
  return isTauri() ? `${baseUrl}${path}` : `/api${path}`;
}

async function rawFetch(url: string, init?: RequestInit): Promise<Response> {
  if (isTauri()) return tauriFetch(url, init);
  return window.fetch(url, init);
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: unknown };
    const detail = data.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (item && typeof item === "object" && "msg" in item) {
            return String((item as { msg: unknown }).msg);
          }
          return JSON.stringify(item);
        })
        .join("; ");
    }
  } catch {
    // El cuerpo no era JSON; se usa el código HTTP.
  }
  return `Error ${response.status}`;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  withAuth = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body != null) headers.set("Content-Type", "application/json");
  if (withAuth && token) headers.set("Authorization", `Bearer ${token}`);

  const response = await rawFetch(resolve(path), { ...init, headers });

  if (response.status === 401 && withAuth) {
    window.dispatchEvent(new Event("eq:unauthorized"));
  }
  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

const list = <T>(path: string, skip = 0, limit = 100) =>
  request<T[]>(`${path}?skip=${skip}&limit=${limit}`);

const create = <T, B>(path: string, body: B) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body) });

const update = <T, B>(path: string, body: B) =>
  request<T>(path, { method: "PUT", body: JSON.stringify(body) });

const remove = (path: string) => request<void>(path, { method: "DELETE" });

export async function checkHealth(url: string): Promise<Health> {
  const clean = url.replace(/\/+$/, "");
  const response = await rawFetch(`${clean}/health`, { method: "GET" });
  if (!response.ok) {
    throw new ApiError(`El servidor respondió ${response.status}`, response.status);
  }
  return (await response.json()) as Health;
}

export const api = {
  login: (email: string, password: string) =>
    request<TokenResponse>(
      "/auth/token",
      { method: "POST", body: JSON.stringify({ email, password }) },
      false,
    ),

  users: {
    list: () => list<User>("/auth/users", 0, 100),
  },

  operators: {
    list: (skip = 0, limit = 100) => list<Operator>("/operators", skip, limit),
    create: (input: OperatorInput) => create<Operator, OperatorInput>("/operators", input),
    update: (id: number, input: Partial<OperatorInput>) =>
      update<Operator, Partial<OperatorInput>>(`/operators/${id}`, input),
    remove: (id: number) => remove(`/operators/${id}`),
  },

  equipment: {
    list: (skip = 0, limit = 100) => list<Equipment>("/equipment", skip, limit),
    create: (input: EquipmentInput) =>
      create<Equipment, EquipmentInput>("/equipment", input),
    update: (id: number, input: Partial<EquipmentInput>) =>
      update<Equipment, Partial<EquipmentInput>>(`/equipment/${id}`, input),
    remove: (id: number) => remove(`/equipment/${id}`),
  },

  specs: {
    list: (skip = 0, limit = 100) => list<Specs>("/specs", skip, limit),
    create: (input: SpecsInput) => create<Specs, SpecsInput>("/specs", input),
  },

  assignments: {
    list: (skip = 0, limit = 100) => list<Assignment>("/assignments", skip, limit),
    create: (input: AssignmentInput) =>
      create<Assignment, AssignmentInput>("/assignments", input),
    update: (id: number, input: AssignmentUpdate) =>
      update<Assignment, AssignmentUpdate>(`/assignments/${id}`, input),
  },

  incidents: {
    list: (skip = 0, limit = 100) => list<Incident>("/incidents", skip, limit),
    create: (input: IncidentInput) =>
      create<Incident, IncidentInput>("/incidents", input),
    update: (id: number, input: IncidentUpdate) =>
      update<Incident, IncidentUpdate>(`/incidents/${id}`, input),
  },
};

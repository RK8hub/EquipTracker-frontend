import { invoke } from "@tauri-apps/api/core";
import { Store } from "@tauri-apps/plugin-store";

const FILE = "equiptracker.json";

const isTauri = () =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

let storePromise: Promise<Store> | null = null;

function store() {
  storePromise ??= Store.load(FILE);
  return storePromise;
}

export async function getStored<T>(key: string): Promise<T | null> {
  if (isTauri()) {
    const value = await (await store()).get<T>(key);
    return value ?? null;
  }
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setStored<T>(key: string, value: T): Promise<void> {
  if (isTauri()) {
    const instance = await store();
    await instance.set(key, value);
    await instance.save();
    return;
  }
  localStorage.setItem(key, JSON.stringify(value));
}

// El token va al almacén de credenciales del SO; nunca al JSON de preferencias.
export async function getAuthToken(): Promise<string | null> {
  if (isTauri()) {
    try {
      return await invoke<string | null>("load_token");
    } catch {
      return null;
    }
  }
  return sessionStorage.getItem("token");
}

export async function setAuthToken(token: string): Promise<void> {
  if (isTauri()) {
    try {
      await invoke("save_token", { token });
    } catch {
      // Sin keyring disponible la sesión sigue en memoria hasta cerrar la app.
    }
    return;
  }
  sessionStorage.setItem("token", token);
}

export async function removeAuthToken(): Promise<void> {
  if (isTauri()) {
    try {
      await invoke("delete_token");
    } catch {
      // Nada que borrar.
    }
    return;
  }
  sessionStorage.removeItem("token");
}

export async function removeStored(key: string): Promise<void> {
  if (isTauri()) {
    const instance = await store();
    await instance.delete(key);
    await instance.save();
    return;
  }
  localStorage.removeItem(key);
}

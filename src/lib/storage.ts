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

export async function removeStored(key: string): Promise<void> {
  if (isTauri()) {
    const instance = await store();
    await instance.delete(key);
    await instance.save();
    return;
  }
  localStorage.removeItem(key);
}

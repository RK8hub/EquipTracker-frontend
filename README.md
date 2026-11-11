# EquipTracker — Frontend

Cliente de escritorio para EquipTracker. Tauri v2 + React 19 + TypeScript + Tailwind CSS v4.

## Requisitos

- Node 22+ y pnpm
- Rust (stable)
- Linux: `webkit2gtk-4.1`, `libayatana-appindicator3`, `librsvg2`, `patchelf`

## Desarrollo

```bash
pnpm install
pnpm dev
```

Abre `http://localhost:5173`. En el navegador las peticiones van a `/api` y Vite las
reenvía al backend (`VITE_API_PROXY`, por defecto `http://localhost:8000`).

```bash
VITE_API_PROXY=http://172.16.120.163:8000 pnpm dev
```

## Build de escritorio

```bash
pnpm tauri build
```

Los paquetes quedan en `src-tauri/target/release/bundle/` (`.deb`, `.rpm`, `.AppImage`
en Linux; `.msi`/`.exe` en Windows; `.dmg` en macOS).

## CI

`.github/workflows/build.yml` compila en Ubuntu, Windows y macOS al hacer push a `main`
o manualmente desde Actions. Los bundles se descargan como artifacts de cada ejecución.

## Uso

1. **Connect**: escribe la URL del backend (ej. `http://172.16.120.163:8000`).
2. **Login**: correo y contraseña.
3. La URL y el token se guardan en el almacenamiento local de la app.

El binario no lleva ninguna dirección de backend hardcodeada.

## Estructura

```
src/
├── api/         # cliente HTTP y transporte (Tauri / navegador)
├── components/  # componentes de la aplicación
├── eq-ui/       # copia local de la librería de UI
├── lib/         # storage, formato, CSV
└── screens/     # Connect, Login, Dashboard, Operadores, Equipos,
                 # Asignaciones, Incidencias, Ajustes
src-tauri/       # configuración y código Rust de Tauri
```

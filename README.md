# EquipTracker — Cliente de escritorio

Aplicación de escritorio para **EquipTracker**, el sistema de control de
inventario de TI: equipos, operadores, asignaciones e incidencias.

Este repositorio es una parte del proyecto EquipTracker. El servidor
(API y base de datos) se distribuye por separado y no forma parte de este
repositorio.

## Tecnología

| Capa | Tecnología |
|---|---|
| Escritorio | Tauri v2 (Rust) |
| Interfaz | React 19 + TypeScript |
| Estilos | Tailwind CSS v4 con tokens propios (`src/eq-ui`) |
| Empaquetado | Vite |
| Iconos | lucide-react |
| Notificaciones | sonner |

El cliente no incluye ninguna dirección de servidor: se configura al abrir
la aplicación.

## Requisitos del sistema

- **Linux** x86_64 con WebKitGTK 4.1 (paquetes `.deb`, `.rpm` o `.AppImage`)
- **Windows** 10 u 11 (instalador `.msi`)

## Instalación

1. Instala el paquete correspondiente a tu sistema.
2. Abre EquipTracker.
3. En **Conectar**, escribe la dirección del servidor, por ejemplo
   `https://equiptracker.miempresa.local`.
4. Inicia sesión con el correo y la contraseña que te haya proporcionado
   el administrador.

La dirección del servidor y la sesión se guardan en el almacenamiento local
de la aplicación.

## Funciones

- **Dashboard**: resumen de asignaciones, operadores, equipos e incidencias.
- **Operadores**: personas que reciben los equipos.
- **Equipos**: inventario con número de serie, marca, modelo y
  especificaciones (CPU, RAM, almacenamiento, gráficos).
- **Asignaciones**: qué equipo tiene cada operador y desde cuándo.
- **Incidencias**: problemas reportados sobre un equipo.
- **Usuarios**: cuentas y roles (solo administradores).
- **Ajustes**: tema visual y color de acento.

## Estructura

```
src/
├── api/         # cliente HTTP y transporte
├── components/  # componentes de la aplicación
├── eq-ui/       # librería de interfaz y tokens de diseño
├── lib/         # almacenamiento, formato, CSV
└── screens/     # Conectar, Login, Dashboard, Operadores, Equipos,
                 # Asignaciones, Incidencias, Usuarios, Ajustes
src-tauri/       # configuración y código Rust de Tauri
```

## Licencia y marca

El código se distribuye bajo la licencia PolyForm Strict 1.0.0; consulta
`LICENSE`. La marca, los iconos y la librería `src/eq-ui` tienen su propio
aviso en `ASSETS.md`. Las dependencias de terceros se detallan en `NOTICE`.

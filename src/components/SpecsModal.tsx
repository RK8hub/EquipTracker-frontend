import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button, Textfield } from "../eq-ui";
import { api } from "../api/client";
import { errorMessage } from "../hooks";
import type { CapacityUnit, Specs } from "../types";
import { ModalCard } from "./ModalCard";
import { SelectField } from "./SelectField";

const units = [
  { value: "GB", label: "GB" },
  { value: "TB", label: "TB" },
  { value: "MB", label: "MB" },
];

const ramModes = [
  { value: "single", label: "Single" },
  { value: "dual", label: "Dual" },
];

const storageTypes = [
  { value: "SSD", label: "SSD" },
  { value: "NVMe", label: "NVMe" },
  { value: "HDD", label: "HDD" },
];

const graphicsTypes = [
  { value: "integrated", label: "Integrada" },
  { value: "dedicated", label: "Dedicada" },
];

const ramPresets = [
  { value: "8", unit: "GB" },
  { value: "16", unit: "GB" },
  { value: "32", unit: "GB" },
  { value: "64", unit: "GB" },
];

const storagePresets = [
  { value: "256", unit: "GB" },
  { value: "512", unit: "GB" },
  { value: "1", unit: "TB" },
  { value: "2", unit: "TB" },
];

type ErrorKey =
  | "cpuBrand"
  | "cpuModel"
  | "ram"
  | "storage"
  | "gpuBrand"
  | "gpuModel"
  | "gpuMemory";
type Errors = Partial<Record<ErrorKey, string>>;

/* ---------- Piezas pequeñas de UI ---------- */

function Presets({
  presets,
  value,
  unit,
  onPick,
  disabled,
}: {
  presets: { value: string; unit: string }[];
  value: string;
  unit: string;
  onPick: (value: string, unit: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {presets.map((preset) => {
        const active = preset.value === value && preset.unit === unit;
        return (
          <button
            key={`${preset.value}${preset.unit}`}
            type="button"
            disabled={disabled}
            onClick={() => onPick(preset.value, preset.unit)}
            className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors disabled:opacity-50 ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input hover:bg-muted"
            }`}
          >
            {preset.value} {preset.unit}
          </button>
        );
      })}
    </div>
  );
}

function SectionHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
      <p className="text-sm font-semibold">{title}</p>
      {children}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p data-field-error className="mt-1 text-xs text-destructive">
      {message}
    </p>
  );
}

/* ---------- Modal ---------- */

export interface SpecsModalProps {
  onClose: () => void;
  onCreated: (spec: Specs) => void;
}

export function SpecsModal({ onClose, onCreated }: SpecsModalProps) {
  const [cpuBrand, setCpuBrand] = useState("");
  const [cpuModel, setCpuModel] = useState("");
  const [ramValue, setRamValue] = useState("8");
  const [ramUnit, setRamUnit] = useState("GB");
  const [ramMode, setRamMode] = useState("single");
  const [storageValue, setStorageValue] = useState("256");
  const [storageUnit, setStorageUnit] = useState("GB");
  const [storageType, setStorageType] = useState("SSD");
  const [gpuBrand, setGpuBrand] = useState("");
  const [gpuModel, setGpuModel] = useState("");
  const [gpuType, setGpuType] = useState("integrated");
  const [gpuMemory, setGpuMemory] = useState("");
  const [gpuMemoryUnit, setGpuMemoryUnit] = useState("GB");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const isDedicated = gpuType === "dedicated";

  function clearError(key: ErrorKey) {
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }

  function validate(): Errors {
    const next: Errors = {};
    const ram = Number(ramValue);
    const storage = Number(storageValue);

    if (!cpuBrand.trim()) next.cpuBrand = "Requerido";
    if (!cpuModel.trim()) next.cpuModel = "Requerido";
    if (!gpuBrand.trim()) next.gpuBrand = "Requerido";
    if (!gpuModel.trim()) next.gpuModel = "Requerido";
    if (!Number.isFinite(ram) || ram <= 0) next.ram = "Debe ser mayor que cero";
    if (!Number.isFinite(storage) || storage <= 0) {
      next.storage = "Debe ser mayor que cero";
    }
    if (isDedicated && gpuMemory.trim()) {
      const memory = Number(gpuMemory);
      if (!Number.isFinite(memory) || memory <= 0) {
        next.gpuMemory = "Debe ser mayor que cero o quedar vacía";
      }
    }
    return next;
  }

  function scrollToFirstError() {
    requestAnimationFrame(() => {
      bodyRef.current
        ?.querySelector("[data-field-error]")
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }

  async function save() {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      scrollToFirstError();
      return;
    }

    const memory = isDedicated && gpuMemory.trim() ? Number(gpuMemory) : null;

    setBusy(true);
    setError(null);
    try {
      const spec = await api.specs.create({
        cpu: { brand: cpuBrand.trim(), model: cpuModel.trim() },
        ram: {
          capacity: { value: Number(ramValue), unit: ramUnit as CapacityUnit },
          mode: ramMode as "single" | "dual",
        },
        storage: {
          capacity: {
            value: Number(storageValue),
            unit: storageUnit as CapacityUnit,
          },
          type: storageType as "HDD" | "SSD" | "NVMe",
        },
        graphics: {
          brand: gpuBrand.trim(),
          model: gpuModel.trim(),
          type: gpuType as "integrated" | "dedicated",
          memory:
            memory === null
              ? null
              : { value: memory, unit: gpuMemoryUnit as CapacityUnit },
        },
      });
      toast.success("Especificación creada");
      onCreated(spec);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (event.key === "Enter" && target.tagName === "INPUT" && !busy) {
      event.preventDefault();
      save();
    }
  }

  return (
    <ModalCard
      title="Nueva especificación"
      description="Los equipos necesitan una especificación para poder registrarse."
      onClose={busy ? undefined : onClose}
      widthClassName="max-w-[640px]"
      footer={
        <>
          <Button text="Cancelar" onClick={onClose} disabled={busy} />
          <Button
            text={busy ? "Guardando..." : "Guardar"}
            variant="primary"
            onClick={save}
            disabled={busy}
          />
        </>
      }
    >
      <div
        ref={bodyRef}
        className="flex max-h-[calc(100dvh-16rem)] flex-col gap-4 overflow-y-auto pr-1"
        onKeyDown={handleKeyDown}
      >
        {/* Procesador */}
        <section className="flex flex-col gap-2">
          <SectionHeader title="Procesador" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Textfield
                label="Marca"
                placeholder="Intel"
                value={cpuBrand}
                onChange={(event) => {
                  setCpuBrand(event.target.value);
                  clearError("cpuBrand");
                }}
                showIcon={false}
              />
              <FieldError message={errors.cpuBrand} />
            </div>
            <div>
              <Textfield
                label="Modelo"
                placeholder="Core i7-1265U"
                value={cpuModel}
                onChange={(event) => {
                  setCpuModel(event.target.value);
                  clearError("cpuModel");
                }}
                showIcon={false}
              />
              <FieldError message={errors.cpuModel} />
            </div>
          </div>
        </section>

        {/* RAM */}
        <section className="flex flex-col gap-2">
          <SectionHeader title="Memoria RAM">
            <Presets
              presets={ramPresets}
              value={ramValue}
              unit={ramUnit}
              disabled={busy}
              onPick={(value, unit) => {
                setRamValue(value);
                setRamUnit(unit);
                clearError("ram");
              }}
            />
          </SectionHeader>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <Textfield
                label="Capacidad"
                type="number"
                min={1}
                value={ramValue}
                onChange={(event) => {
                  setRamValue(event.target.value);
                  clearError("ram");
                }}
                showIcon={false}
              />
              <FieldError message={errors.ram} />
            </div>
            <SelectField
              label="Unidad"
              value={ramUnit}
              onChange={setRamUnit}
              options={units}
            />
            <div className="col-span-2 sm:col-span-1">
              <SelectField
                label="Modo"
                value={ramMode}
                onChange={setRamMode}
                options={ramModes}
              />
            </div>
          </div>
        </section>

        {/* Almacenamiento */}
        <section className="flex flex-col gap-2">
          <SectionHeader title="Almacenamiento">
            <Presets
              presets={storagePresets}
              value={storageValue}
              unit={storageUnit}
              disabled={busy}
              onPick={(value, unit) => {
                setStorageValue(value);
                setStorageUnit(unit);
                clearError("storage");
              }}
            />
          </SectionHeader>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <Textfield
                label="Capacidad"
                type="number"
                min={1}
                value={storageValue}
                onChange={(event) => {
                  setStorageValue(event.target.value);
                  clearError("storage");
                }}
                showIcon={false}
              />
              <FieldError message={errors.storage} />
            </div>
            <SelectField
              label="Unidad"
              value={storageUnit}
              onChange={setStorageUnit}
              options={units}
            />
            <div className="col-span-2 sm:col-span-1">
              <SelectField
                label="Tipo"
                value={storageType}
                onChange={setStorageType}
                options={storageTypes}
              />
            </div>
          </div>
        </section>

        {/* Gráficos */}
        <section className="flex flex-col gap-2">
          <SectionHeader title="Gráficos" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SelectField
              label="Tipo"
              value={gpuType}
              onChange={setGpuType}
              options={graphicsTypes}
            />
            <div>
              <Textfield
                label="Marca"
                placeholder={isDedicated ? "NVIDIA" : "Intel"}
                value={gpuBrand}
                onChange={(event) => {
                  setGpuBrand(event.target.value);
                  clearError("gpuBrand");
                }}
                showIcon={false}
              />
              <FieldError message={errors.gpuBrand} />
            </div>
            <div>
              <Textfield
                label="Modelo"
                placeholder={isDedicated ? "RTX 3050" : "Iris Xe"}
                value={gpuModel}
                onChange={(event) => {
                  setGpuModel(event.target.value);
                  clearError("gpuModel");
                }}
                showIcon={false}
              />
              <FieldError message={errors.gpuModel} />
            </div>
          </div>
          {isDedicated && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <Textfield
                  label="Memoria"
                  type="number"
                  min={1}
                  placeholder="Opcional"
                  value={gpuMemory}
                  onChange={(event) => {
                    setGpuMemory(event.target.value);
                    clearError("gpuMemory");
                  }}
                  showIcon={false}
                />
                <FieldError message={errors.gpuMemory} />
              </div>
              <SelectField
                label="Unidad"
                value={gpuMemoryUnit}
                onChange={setGpuMemoryUnit}
                options={units}
              />
            </div>
          )}
        </section>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </ModalCard>
  );
}

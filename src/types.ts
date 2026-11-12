export interface Health {
  status: string;
  database: string;
  version: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Operator {
  id: number;
  name: string;
  department: string;
  position: string;
}

export interface User {
  id: number;
  email: string;
  role: string;
  created_at: string;
}

export interface UserInput {
  email: string;
  password: string;
  role?: string;
}

export interface OperatorInput {
  name: string;
  department: string;
  position: string;
}

export type CapacityUnit = "MB" | "GB" | "TB";

export interface Capacity {
  value: number;
  unit: CapacityUnit;
}

export interface CpuSpec {
  brand: string;
  model: string;
}

export interface RamSpec {
  capacity: Capacity;
  mode: "single" | "dual";
}

export interface StorageSpec {
  capacity: Capacity;
  type: "HDD" | "SSD" | "NVMe";
}

export interface GraphicsSpec {
  brand: string;
  model: string;
  type: "integrated" | "dedicated";
  memory: Capacity | null;
}

export interface Specs {
  id: number;
  cpu: CpuSpec;
  ram: RamSpec;
  storage: StorageSpec;
  graphics: GraphicsSpec;
}

export type SpecsInput = Omit<Specs, "id">;

export interface Equipment {
  id: number;
  serial: string;
  brand: string;
  model: string;
  specs_id: number | null;
  created_at: string;
}

export interface EquipmentInput {
  serial: string;
  brand: string;
  model: string;
  specs_id: number | null;
}

export interface Assignment {
  id: number;
  equipment_id: number;
  operator_id: number;
  assigned_by: number;
  assigned_at: string;
  returned_at: string | null;
  status: "active" | "inactive";
}

export interface AssignmentInput {
  equipment_id: number;
  operator_id: number;
  assigned_by?: number;
  assigned_at?: string | null;
}

export interface AssignmentUpdate {
  returned_at?: string | null;
  status?: "active" | "inactive";
}

export interface Incident {
  id: number;
  equipment_id: number;
  type: string;
  reason: string;
  status: "open" | "closed";
  reported_by: number;
  technician_id: number;
  created_at: string;
  resolved_at: string | null;
}

export interface IncidentInput {
  equipment_id: number;
  type: string;
  reason: string;
  reported_by: number;
  technician_id: number;
}

export type IncidentUpdate = Partial<
  Pick<Incident, "type" | "reason" | "status" | "technician_id" | "resolved_at">
>;

// ============================================================
// Department registry
// ============================================================
//
// Each department is backed by its own Dify chat app + knowledge
// base. The department id is included in every chat / document
// request so the server can route to the correct Dify resources.
// ============================================================

export type DepartmentId = "company" | "sales" | "finance";

export interface Department {
  id: DepartmentId;
  label: string;
}

export const DEPARTMENTS: readonly Department[] = [
  { id: "company", label: "全社" },
  { id: "sales", label: "営業部" },
  { id: "finance", label: "経理部" },
] as const;

export const DEFAULT_DEPARTMENT_ID: DepartmentId = "company";

export function isDepartmentId(value: unknown): value is DepartmentId {
  return DEPARTMENTS.some((d) => d.id === value);
}

export function getDepartmentLabel(id: DepartmentId): string {
  return DEPARTMENTS.find((d) => d.id === id)?.label ?? id;
}

// ============================================================
// Server-only: Dify config lookup
// ============================================================

export interface DepartmentDifyConfig {
  appApiKey: string;
  knowledgeApiKey: string;
  datasetId: string;
}

const ENV_PREFIX: Record<DepartmentId, string> = {
  company: "DIFY_DEPT_COMPANY",
  sales: "DIFY_DEPT_SALES",
  finance: "DIFY_DEPT_FINANCE",
};

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Environment variable "${name}" is not set. ` +
        "Please add it to your .env.local file."
    );
  }
  return value;
}

export function getDepartmentConfig(id: DepartmentId): DepartmentDifyConfig {
  const prefix = ENV_PREFIX[id];
  return {
    appApiKey: getEnv(`${prefix}_APP_API_KEY`),
    knowledgeApiKey: getEnv(`${prefix}_KNOWLEDGE_API_KEY`),
    datasetId: getEnv(`${prefix}_DATASET_ID`),
  };
}

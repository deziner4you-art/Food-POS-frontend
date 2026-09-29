export type ModuleKey =
  | 'BASE_POS'
  | 'KOT_PRINT'
  | 'ACCOUNTING'
  | 'KDS'
  | 'MARKETING'
  | 'ONLINE_WEBSITE'
  | 'CMS'
  | 'CRM'
  | 'LOYALTY'
  | 'RIDER'
  | 'TV_BOARD'
  | 'INVENTORY'
  | 'RECIPES'
  | 'VENDORS'
  | 'ANALYTICS'
  | 'HR_PAYROLL';

export type ModuleDefinition = {
  key: ModuleKey;
  label: string;
  requires: readonly ModuleKey[];
  includedInBasePos?: boolean;
};

/**
 * The only canonical module registry. Package data may contain the legacy
 * ACCOUNTING_POS spelling; it is normalized here without changing the DB.
 */
export const MODULE_REGISTRY: readonly ModuleDefinition[] = [
  { key: 'BASE_POS', label: 'Base POS', requires: [] },
  { key: 'KOT_PRINT', label: 'KOT Printing', requires: ['BASE_POS'], includedInBasePos: true },
  { key: 'ACCOUNTING', label: 'POS Accounting', requires: ['BASE_POS'] },
  { key: 'KDS', label: 'Kitchen Display System', requires: ['BASE_POS'] },
  { key: 'MARKETING', label: 'Marketing Hub', requires: ['BASE_POS'] },
  { key: 'ONLINE_WEBSITE', label: 'Online Ordering Website', requires: ['BASE_POS'] },
  { key: 'CMS', label: 'Website CMS', requires: ['ONLINE_WEBSITE'] },
  { key: 'CRM', label: 'CRM', requires: ['BASE_POS'] },
  { key: 'LOYALTY', label: 'Loyalty', requires: ['BASE_POS'] },
  { key: 'RIDER', label: 'Rider Delivery', requires: ['BASE_POS'] },
  { key: 'TV_BOARD', label: 'Customer TV Board', requires: ['BASE_POS'] },
  { key: 'INVENTORY', label: 'Inventory', requires: ['BASE_POS'] },
  { key: 'RECIPES', label: 'Recipes', requires: ['BASE_POS'] },
  { key: 'VENDORS', label: 'Vendors', requires: ['BASE_POS'] },
  { key: 'ANALYTICS', label: 'Analytics', requires: ['BASE_POS'] },
  { key: 'HR_PAYROLL', label: 'HR & Payroll', requires: ['BASE_POS'] },
] as const;

const DEFINITIONS_BY_KEY = new Map(MODULE_REGISTRY.map((definition) => [definition.key, definition]));

export function normalizeModuleKey(value: unknown): ModuleKey | null {
  const key = String(value ?? '').trim().toUpperCase();
  if (key === 'ACCOUNTING_POS') return 'ACCOUNTING';
  return DEFINITIONS_BY_KEY.has(key as ModuleKey) ? key as ModuleKey : null;
}

export function getModuleDefinition(key: ModuleKey): ModuleDefinition {
  return DEFINITIONS_BY_KEY.get(key)!;
}

export function getMissingDependencies(key: ModuleKey, installed: ReadonlySet<ModuleKey>): ModuleKey[] {
  return getModuleDefinition(key).requires.filter((dependency) => !installed.has(dependency));
}

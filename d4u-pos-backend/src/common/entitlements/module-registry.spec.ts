import {
  MODULE_REGISTRY,
  getMissingDependencies,
  normalizeModuleKey,
} from './module-registry';

describe('module registry', () => {
  it('has one unique canonical definition for every module key', () => {
    const keys = MODULE_REGISTRY.map((definition) => definition.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('normalizes the legacy accounting spelling without inventing a second module', () => {
    expect(normalizeModuleKey('ACCOUNTING_POS')).toBe('ACCOUNTING');
    expect(normalizeModuleKey('unknown')).toBeNull();
  });

  it('requires BASE_POS before KDS', () => {
    expect(getMissingDependencies('KDS', new Set())).toEqual(['BASE_POS']);
    expect(getMissingDependencies('KDS', new Set(['BASE_POS']))).toEqual([]);
  });
});

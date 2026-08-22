import * as fs from 'fs';
import * as path from 'path';

// seed-rbac.ts (prisma/seed-rbac.ts, outside jest's rootDir:"src" so it's
// never auto-discovered) defines its permissionsData/rolePermissionAssignments
// as local variables inside seedRbac(prisma), not exported for direct import
// -- consistent with how this file has been verified throughout the #2R
// series (source-level parsing), these tests parse the same literal
// structure rather than mocking a full PrismaClient through every
// sequential upsert call. Placed under src/ specifically so it's
// discoverable by `npx jest` at all -- prisma/seed-rbac.spec.ts would
// silently never run.
const SEED_PATH = path.join(__dirname, '..', '..', 'prisma', 'seed-rbac.ts');
const seedSrc = fs.readFileSync(SEED_PATH, 'utf8');

function extractCatalogKeys(): string[] {
  const start = seedSrc.indexOf('const permissionsData');
  const arrStart = seedSrc.indexOf('[', start);
  let depth = 0;
  let end = -1;
  for (let i = arrStart; i < seedSrc.length; i++) {
    if (seedSrc[i] === '[') depth++;
    if (seedSrc[i] === ']') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const body = seedSrc.slice(arrStart, end + 1);
  return [...body.matchAll(/\{ group: '([^']+)', resource: '([^']+)', action: '([^']+)'/g)].map(
    (m) => `${m[1]}.${m[2]}.${m[3]}`,
  );
}

function extractDescriptionFor(key: string): string | undefined {
  const [group, resource, action] = key.split('.');
  const re = new RegExp(
    `\\{ group: '${group}', resource: '${resource}', action: '${action}', description: (.+?) \\},?\\n`,
  );
  const m = seedSrc.match(re);
  if (!m) return undefined;
  const raw = m[1].trim();
  if (raw.startsWith("'") && raw.endsWith("'")) return raw.slice(1, -1);
  if (raw.startsWith('"') && raw.endsWith('"')) return raw.slice(1, -1);
  return raw;
}

function extractRoleBlocks(): Record<string, string[]> {
  const rpaStart = seedSrc.indexOf('const rolePermissionAssignments');
  const rpaArrStart = seedSrc.indexOf('{', rpaStart);
  let depth = 0;
  let end = -1;
  for (let i = rpaArrStart; i < seedSrc.length; i++) {
    if (seedSrc[i] === '{') depth++;
    if (seedSrc[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const body = seedSrc.slice(rpaArrStart, end + 1);
  const roleBlocks: Record<string, string[]> = {};
  const roleNameRe = /'([^']+)':\s*\[/g;
  let rm: RegExpExecArray | null;
  while ((rm = roleNameRe.exec(body))) {
    const roleName = rm[1];
    const bracketStart = body.indexOf('[', rm.index);
    const bracketEnd = body.indexOf(']', bracketStart);
    const inner = body.slice(bracketStart + 1, bracketEnd);
    roleBlocks[roleName] = [...inner.matchAll(/'([a-zA-Z_.]+)'/g)].map((x) => x[1]);
  }
  return roleBlocks;
}

function extractRolesToSeed(): string[] {
  const start = seedSrc.indexOf('const rolesToSeed');
  const arrStart = seedSrc.indexOf('[', start);
  const arrEnd = seedSrc.indexOf('];', arrStart);
  const body = seedSrc.slice(arrStart, arrEnd);
  return [...body.matchAll(/name: '([^']+)'/g)].map((m) => m[1]);
}

describe('seed-rbac.ts — Task #2R-E3: pos.cash_drawer.record', () => {
  const catalogKeys = extractCatalogKeys();
  const roleBlocks = extractRoleBlocks();

  it('pos.cash_drawer.record exists exactly once in permissionsData', () => {
    const matches = catalogKeys.filter((k) => k === 'pos.cash_drawer.record');
    expect(matches.length).toBe(1);
  });

  it('has exactly the approved description', () => {
    expect(extractDescriptionFor('pos.cash_drawer.record')).toBe(
      "Record an operational cash-in or cash-out transaction and view the current shift's cash-drawer history.",
    );
  });

  it('Cashier receives pos.cash_drawer.record', () => {
    expect(roleBlocks['Cashier']).toContain('pos.cash_drawer.record');
  });

  it('Manager receives pos.cash_drawer.record', () => {
    expect(roleBlocks['Manager']).toContain('pos.cash_drawer.record');
  });

  it('Branch Manager receives pos.cash_drawer.record', () => {
    expect(roleBlocks['Branch Manager']).toContain('pos.cash_drawer.record');
  });

  it('Business Admin does NOT receive it -- pre-flight found no direct evidence of real POS-terminal usage', () => {
    expect(roleBlocks['Business Admin']).not.toContain('pos.cash_drawer.record');
  });

  it('Business Owner does NOT receive it -- same reason', () => {
    expect(roleBlocks['Business Owner']).not.toContain('pos.cash_drawer.record');
  });

  it('Branch Owner does NOT receive it -- same reason', () => {
    expect(roleBlocks['Branch Owner']).not.toContain('pos.cash_drawer.record');
  });

  it('Finance Manager does NOT receive it', () => {
    expect(roleBlocks['Finance Manager']).not.toContain('pos.cash_drawer.record');
  });

  it('Accountant does NOT receive it', () => {
    expect(roleBlocks['Accountant']).not.toContain('pos.cash_drawer.record');
  });

  it('Auditor does NOT receive it', () => {
    expect(roleBlocks['Auditor']).not.toContain('pos.cash_drawer.record');
  });

  it('Read Only does not literally list it (dynamically derived; the resource itself is not .read-suffixed anyway)', () => {
    // Read Only's grant is `Array.from(permissionMap.keys()).filter(k => k.endsWith('.read'))`,
    // computed dynamically, not a literal array in source -- confirm the
    // action name itself would never match that filter.
    expect('pos.cash_drawer.record'.endsWith('.read')).toBe(false);
  });

  it('no other role gained pos.cash_drawer.record', () => {
    const grantedTo = Object.entries(roleBlocks)
      .filter(([, perms]) => perms.includes('pos.cash_drawer.record'))
      .map(([role]) => role)
      .sort();
    expect(grantedTo).toEqual(['Branch Manager', 'Cashier', 'Manager']);
  });

  it('existing pos.cash_drawer.open is unchanged', () => {
    expect(extractDescriptionFor('pos.cash_drawer.open')).toBe('Manual drawer open');
    expect(catalogKeys.filter((k) => k === 'pos.cash_drawer.open').length).toBe(1);
  });

  it('existing pos.cash_drawer.reconcile is unchanged', () => {
    expect(extractDescriptionFor('pos.cash_drawer.reconcile')).toBe('Close and balance shift');
    expect(catalogKeys.filter((k) => k === 'pos.cash_drawer.reconcile').length).toBe(1);
  });

  it('rolesToSeed remains exactly 25 entries', () => {
    expect(extractRolesToSeed().length).toBe(25);
  });

  it('no duplicate permission keys anywhere in the catalog', () => {
    const seen = new Map<string, number>();
    for (const k of catalogKeys) seen.set(k, (seen.get(k) || 0) + 1);
    const dupes = [...seen.entries()].filter(([, count]) => count > 1);
    expect(dupes).toEqual([]);
  });

  it('catalog now has exactly 170 entries (174 + 1 from #2R-E3, - 5 from #2R-E6)', () => {
    expect(catalogKeys.length).toBe(170);
  });

  // Task #2R-E6: the coarse 'finance.accounting.{view,create,update,approve,
  // export}' permissions were removed from the catalog after #2R-E5's audit
  // found zero executable usages, zero role grants, zero live-user
  // dependency, and zero PermissionsGuard bridge dependency. Replaces the
  // old "are untouched" assertion above (#2R-E3), which is no longer true.
  describe('Task #2R-E6: legacy finance.accounting.* permissions removed', () => {
    it('none of the five legacy permissions remain in the catalog', () => {
      const legacy = catalogKeys.filter((k) => k.startsWith('finance.accounting.'));
      expect(legacy).toEqual([]);
    });

    it('no duplicate permission keys exist after removal', () => {
      const seen = new Map<string, number>();
      for (const k of catalogKeys) seen.set(k, (seen.get(k) || 0) + 1);
      const dupes = [...seen.entries()].filter(([, count]) => count > 1);
      expect(dupes).toEqual([]);
    });

    it('catalog count is exactly 170 (175 - 5)', () => {
      expect(catalogKeys.length).toBe(170);
    });
  });
});

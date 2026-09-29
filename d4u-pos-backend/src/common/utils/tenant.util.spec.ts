import { ForbiddenException } from '@nestjs/common';
import { assertOwnStore } from './tenant.util';
import { assertTenantBrandAccess, assertTenantStoreAccess } from './tenant.util';

// Task #2R-G1a: assertOwnStore is the strict active-store replacement for
// validateTenantAccess on pos-orders/tables. #2R-G1-D found the real JWT
// payload (AuthService.buildTokenPayload) never carries `role` or bare
// `store_id` -- only `active_store_id`/`active_brand_id` -- and
// validateTenantAccess's `user.sub` bypass made it a no-op for every real
// session. This suite pins the corrected semantics directly, independent of
// any controller.
describe('assertOwnStore (Task #2R-G1a)', () => {
  it('1. same active store -> allowed, no throw', () => {
    const user = { sub: 88, active_store_id: 67 };
    expect(() => assertOwnStore(user, 67)).not.toThrow();
  });

  it('2. different store -> rejected', () => {
    const user = { sub: 88, active_store_id: 67 };
    expect(() => assertOwnStore(user, 99)).toThrow(ForbiddenException);
  });

  it('3. missing active_store_id -> rejected', () => {
    const user = { sub: 88 };
    expect(() => assertOwnStore(user, 67)).toThrow(ForbiddenException);
  });

  it('3b. invalid (non-numeric/zero/negative) active_store_id -> rejected', () => {
    expect(() => assertOwnStore({ sub: 88, active_store_id: 'abc' }, 67)).toThrow(ForbiddenException);
    expect(() => assertOwnStore({ sub: 88, active_store_id: 0 }, 67)).toThrow(ForbiddenException);
    expect(() => assertOwnStore({ sub: 88, active_store_id: -1 }, 67)).toThrow(ForbiddenException);
  });

  it('4. invalid requested store -> rejected', () => {
    const user = { sub: 88, active_store_id: 67 };
    expect(() => assertOwnStore(user, undefined)).toThrow(ForbiddenException);
    expect(() => assertOwnStore(user, NaN)).toThrow(ForbiddenException);
    expect(() => assertOwnStore(user, 0)).toThrow(ForbiddenException);
  });

  it('5. presence of user.sub does NOT bypass a store mismatch', () => {
    // validateTenantAccess's exact bug: `|| user.sub` short-circuited to
    // true for any real session. assertOwnStore must never do this.
    const user = { sub: 88, active_store_id: 67 };
    expect(() => assertOwnStore(user, 99)).toThrow(ForbiddenException);
  });

  it('6. absence of user.role does NOT bypass a store mismatch', () => {
    // Real staff JWTs never carry `role` at all (AuthService deliberately
    // omits it) -- validateTenantAccess's `!user.role` check made that the
    // most common real-world bypass path. assertOwnStore must never read
    // `role` at all.
    const user = { sub: 88, active_store_id: 67 }; // no role field, matches a real token
    expect(() => assertOwnStore(user, 99)).toThrow(ForbiddenException);
  });

  it('7. a Super Admin-named user is NOT special-cased inside this helper -- still strictly checked', () => {
    const user = { sub: 1, role: 'Super Admin', active_store_id: 1 };
    expect(() => assertOwnStore(user, 99)).toThrow(ForbiddenException);
  });

  it('8. missing user -> rejected', () => {
    expect(() => assertOwnStore(undefined, 67)).toThrow(ForbiddenException);
  });

  it('9. never falls back to active_brand_id when store mismatches', () => {
    const user = { sub: 88, active_store_id: 67, active_brand_id: 1 };
    expect(() => assertOwnStore(user, 99)).toThrow(ForbiddenException);
  });
});

describe('assertTenantStoreAccess (P0.4-C)', () => {
  const makePrisma = (brandId = 10, roleName = 'Cashier') => ({
    store: { findUnique: jest.fn().mockResolvedValue({ id: 7, brand_id: brandId }) },
    user: { findUnique: jest.fn().mockResolvedValue({ role: { name: roleName } }) },
  }) as any;

  it('allows a normal user in the active store and brand', async () => {
    await expect(assertTenantStoreAccess(makePrisma(), { sub: 5, active_store_id: 7, active_brand_id: 10 }, 7)).resolves.toBeUndefined();
  });

  it('rejects a cross-store request for a normal user', async () => {
    await expect(assertTenantStoreAccess(makePrisma(), { sub: 5, active_store_id: 8, active_brand_id: 10 }, 7)).rejects.toThrow(ForbiddenException);
  });

  it('allows Head Office within its active brand but rejects another brand', async () => {
    await expect(assertTenantStoreAccess(makePrisma(10, 'HeadOffice'), { sub: 5, active_store_id: 8, active_brand_id: 10 }, 7)).resolves.toBeUndefined();
    await expect(assertTenantStoreAccess(makePrisma(99, 'HeadOffice'), { sub: 5, active_store_id: 8, active_brand_id: 10 }, 7)).rejects.toThrow(ForbiddenException);
  });

  it('allows Super Admin only for an existing requested store', async () => {
    await expect(assertTenantStoreAccess(makePrisma(99, 'Super Admin'), { sub: 1 }, 7)).resolves.toBeUndefined();
    const prisma = makePrisma();
    prisma.store.findUnique.mockResolvedValue(null);
    await expect(assertTenantStoreAccess(prisma, { sub: 1 }, 7)).rejects.toThrow(ForbiddenException);
  });

  it('fails closed when authenticated tenant context is missing', async () => {
    await expect(assertTenantStoreAccess(makePrisma(), { sub: 5 }, 7)).rejects.toThrow(ForbiddenException);
    await expect(assertTenantStoreAccess(makePrisma(), { sub: 5, active_store_id: 7, active_brand_id: 10 }, undefined)).rejects.toThrow(ForbiddenException);
  });
});

describe('assertTenantBrandAccess (P0.4-D2)', () => {
  const makePrisma = (brandExists = true, roleName = 'Cashier') => ({
    brand: { findUnique: jest.fn().mockImplementation(({ where }: any) => Promise.resolve(brandExists ? { id: where.id } : null)) },
    user: { findUnique: jest.fn().mockResolvedValue({ role: { name: roleName } }) },
  }) as any;

  it('allows a normal user to access the active brand report', async () => {
    await expect(assertTenantBrandAccess(makePrisma(), { sub: 5, active_brand_id: 10 }, 10)).resolves.toBeUndefined();
  });

  it('rejects a cross-brand report', async () => {
    await expect(assertTenantBrandAccess(makePrisma(), { sub: 5, active_brand_id: 10 }, 99)).rejects.toThrow(ForbiddenException);
  });

  it('allows Super Admin only for an existing brand', async () => {
    await expect(assertTenantBrandAccess(makePrisma(true, 'Super Admin'), { sub: 1 }, 99)).resolves.toBeUndefined();
    await expect(assertTenantBrandAccess(makePrisma(false, 'Super Admin'), { sub: 1 }, 99)).rejects.toThrow(ForbiddenException);
  });

  it('fails closed when brand identity or authenticated context is missing', async () => {
    await expect(assertTenantBrandAccess(makePrisma(), undefined, 10)).rejects.toThrow(ForbiddenException);
    await expect(assertTenantBrandAccess(makePrisma(), { sub: 5, active_brand_id: 10 }, 0)).rejects.toThrow(ForbiddenException);
  });
});

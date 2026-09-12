import * as fs from 'fs';
import * as path from 'path';

const SEED_PATH = path.join(__dirname, '..', '..', 'prisma', 'seed.ts');
const seedSrc = fs.readFileSync(SEED_PATH, 'utf8');

describe('seed.ts — Production Safety', () => {
  it('wraps Demo Users creation in NODE_ENV !== production', () => {
    const demoUsersIdx = seedSrc.indexOf('// 4. Create/Upsert Demo Users');
    const nodeEnvIdx = seedSrc.indexOf("if (process.env.NODE_ENV !== 'production') {", demoUsersIdx);
    const usersPushIdx = seedSrc.indexOf("users.push(", nodeEnvIdx);
    
    expect(demoUsersIdx).toBeGreaterThan(-1);
    expect(nodeEnvIdx).toBeGreaterThan(demoUsersIdx);
    expect(usersPushIdx).toBeGreaterThan(nodeEnvIdx);
  });

  it('wraps Test Products creation in NODE_ENV !== production', () => {
    const testProductsIdx = seedSrc.indexOf('// 5. Create test products idempotently');
    const nodeEnvIdx = seedSrc.indexOf("if (process.env.NODE_ENV !== 'production') {", testProductsIdx);
    const zingerBurgerIdx = seedSrc.indexOf("'Zinger Burger'", nodeEnvIdx);

    expect(testProductsIdx).toBeGreaterThan(-1);
    expect(nodeEnvIdx).toBeGreaterThan(testProductsIdx);
    expect(zingerBurgerIdx).toBeGreaterThan(nodeEnvIdx);
  });

  it('keeps seedRbac, Brand, Store, and Super Admin in production', () => {
    const seedRbacIdx = seedSrc.indexOf('await seedRbac(prisma);');
    const brandIdx = seedSrc.indexOf("name: 'D4U Enterprise'");
    const storeIdx = seedSrc.indexOf("name: 'Head Office HQ'");
    const superAdminEnvIdx = seedSrc.indexOf("if (process.env.SUPER_ADMIN_PIN) {");

    expect(seedRbacIdx).toBeGreaterThan(-1);
    expect(brandIdx).toBeGreaterThan(-1);
    expect(storeIdx).toBeGreaterThan(-1);
    expect(superAdminEnvIdx).toBeGreaterThan(-1);
  });
});

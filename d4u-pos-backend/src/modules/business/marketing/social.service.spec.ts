import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SocialService } from './social.service';
import { PrismaService } from '../../../database/prisma/prisma.service';

describe('SocialService', () => {
  let service: SocialService;
  let prisma: any;

  // Two branches in the same brand (A1, A2), one branch in a different brand (B).
  const STORE_A1 = { id: 67, brand_id: 1 };
  const STORE_A2 = { id: 70, brand_id: 1 };
  const STORE_B = { id: 68, brand_id: 2 };
  const USER_A = { sub: 88, active_brand_id: 1 };

  beforeEach(async () => {
    prisma = {
      store: { findUnique: jest.fn() },
      branchSocialAccount: { findUnique: jest.fn(), upsert: jest.fn(), update: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SocialService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<SocialService>(SocialService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Task #2R-F2c: branch-boundary tenant isolation for getSocialStatus /
  // saveFacebookPage / saveInstagramAccount / disconnectFacebook /
  // disconnectInstagram. #2R-F2b established BranchSocialAccount is
  // single-branch-owned (branch_id @unique, no M2M sharing) -- unlike
  // catalog/marketing there is no "omitted branch -> brand-wide" case, a
  // concrete branchId is always required and validated against the caller's
  // own active_brand_id.
  describe('getSocialStatus — branch-boundary tenant isolation + credential exposure fix (Task #2R-F2c)', () => {
    it('1. same-brand branch -> allowed', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_A1);
      prisma.branchSocialAccount.findUnique.mockResolvedValue({
        is_facebook_connected: true,
        is_instagram_connected: false,
        facebook_page_name: 'Main Branch',
        instagram_username: null,
      });

      const result = await service.getSocialStatus(STORE_A1.id, USER_A);

      expect(prisma.store.findUnique).toHaveBeenCalledWith({ where: { id: STORE_A1.id }, select: { brand_id: true } });
      expect(result.is_facebook_connected).toBe(true);
    });

    it('2. cross-brand branch -> rejected, no BranchSocialAccount query attempted', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_B);

      await expect(service.getSocialStatus(STORE_B.id, USER_A)).rejects.toThrow(BadRequestException);
      expect(prisma.branchSocialAccount.findUnique).not.toHaveBeenCalled();
    });

    it('3. nonexistent branch -> rejected safely, no crash, no BranchSocialAccount query attempted', async () => {
      prisma.store.findUnique.mockResolvedValue(null);

      await expect(service.getSocialStatus(9999, USER_A)).rejects.toThrow(BadRequestException);
      expect(prisma.branchSocialAccount.findUnique).not.toHaveBeenCalled();
    });

    it('4. NEVER selects or returns access_token', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_A1);
      prisma.branchSocialAccount.findUnique.mockResolvedValue({
        is_facebook_connected: true,
        is_instagram_connected: true,
        facebook_page_name: 'Main Branch',
        instagram_username: '@main',
      });

      const result = await service.getSocialStatus(STORE_A1.id, USER_A);

      const actualSelect = prisma.branchSocialAccount.findUnique.mock.calls[0][0].select;
      expect(actualSelect.access_token).toBeUndefined();
      expect(actualSelect).toEqual({
        is_facebook_connected: true,
        is_instagram_connected: true,
        facebook_page_name: true,
        instagram_username: true,
      });
      expect((result as any).access_token).toBeUndefined();
    });

    it('5. response contains only the approved safe fields, nothing else', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_A1);
      prisma.branchSocialAccount.findUnique.mockResolvedValue({
        is_facebook_connected: false,
        is_instagram_connected: false,
        facebook_page_name: null,
        instagram_username: null,
      });

      const result = await service.getSocialStatus(STORE_A1.id, USER_A);

      expect(Object.keys(result).sort()).toEqual(
        ['facebook_page_name', 'instagram_username', 'is_facebook_connected', 'is_instagram_connected'].sort(),
      );
    });

    it('no BranchSocialAccount row yet (never connected) -> safe all-false/null default, still brand-checked first', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_A1);
      prisma.branchSocialAccount.findUnique.mockResolvedValue(null);

      const result = await service.getSocialStatus(STORE_A1.id, USER_A);

      expect(result).toEqual({
        is_facebook_connected: false,
        is_instagram_connected: false,
        facebook_page_name: null,
        instagram_username: null,
      });
    });

    it('rejects when there is no usable authenticated brand context, no query attempted', async () => {
      await expect(service.getSocialStatus(STORE_A1.id, undefined)).rejects.toThrow(BadRequestException);
      await expect(service.getSocialStatus(STORE_A1.id, {})).rejects.toThrow(BadRequestException);
      expect(prisma.store.findUnique).not.toHaveBeenCalled();
      expect(prisma.branchSocialAccount.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('saveFacebookPage / disconnectFacebook — branch-boundary tenant isolation (Task #2R-F2c)', () => {
    it('6. selectFacebookPage (saveFacebookPage): same-brand branch -> allowed, upsert proceeds unchanged', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_A1);
      prisma.branchSocialAccount.upsert.mockResolvedValue({ id: 'x' });

      await service.saveFacebookPage(STORE_A1.id, 'page1', 'Page One', 'tok', USER_A);

      expect(prisma.branchSocialAccount.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { branch_id: STORE_A1.id },
          update: expect.objectContaining({ facebook_page_id: 'page1', access_token: 'tok' }),
          create: expect.objectContaining({ branch_id: STORE_A1.id, facebook_page_id: 'page1', access_token: 'tok' }),
        }),
      );
    });

    it('7. selectFacebookPage (saveFacebookPage): cross-brand branch -> rejected, no upsert attempted', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_B);

      await expect(
        service.saveFacebookPage(STORE_B.id, 'page1', 'Page One', 'tok', USER_A),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.branchSocialAccount.upsert).not.toHaveBeenCalled();
    });

    it('10. disconnectFacebook: same-brand branch -> allowed, update proceeds unchanged', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_A1);
      prisma.branchSocialAccount.update.mockResolvedValue({ id: 'x' });

      await service.disconnectFacebook(STORE_A1.id, USER_A);

      expect(prisma.branchSocialAccount.update).toHaveBeenCalledWith({
        where: { branch_id: STORE_A1.id },
        data: { facebook_page_id: null, facebook_page_name: null, is_facebook_connected: false },
      });
    });

    it('11. disconnectFacebook: cross-brand branch -> rejected, no update attempted', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_B);

      await expect(service.disconnectFacebook(STORE_B.id, USER_A)).rejects.toThrow(BadRequestException);
      expect(prisma.branchSocialAccount.update).not.toHaveBeenCalled();
    });
  });

  describe('saveInstagramAccount / disconnectInstagram — branch-boundary tenant isolation (Task #2R-F2c)', () => {
    it('8. selectInstagramAccount (saveInstagramAccount): same-brand branch -> allowed, upsert proceeds unchanged', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_A1);
      prisma.branchSocialAccount.upsert.mockResolvedValue({ id: 'x' });

      await service.saveInstagramAccount(STORE_A1.id, 'ig1', '@one', 'tok', USER_A);

      expect(prisma.branchSocialAccount.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { branch_id: STORE_A1.id },
          update: expect.objectContaining({ instagram_user_id: 'ig1', access_token: 'tok' }),
          create: expect.objectContaining({ branch_id: STORE_A1.id, instagram_user_id: 'ig1', access_token: 'tok' }),
        }),
      );
    });

    it('9. selectInstagramAccount (saveInstagramAccount): cross-brand branch -> rejected, no upsert attempted', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_B);

      await expect(
        service.saveInstagramAccount(STORE_B.id, 'ig1', '@one', 'tok', USER_A),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.branchSocialAccount.upsert).not.toHaveBeenCalled();
    });

    it('12. disconnectInstagram: same-brand branch -> allowed, update proceeds unchanged', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_A1);
      prisma.branchSocialAccount.update.mockResolvedValue({ id: 'x' });

      await service.disconnectInstagram(STORE_A1.id, USER_A);

      expect(prisma.branchSocialAccount.update).toHaveBeenCalledWith({
        where: { branch_id: STORE_A1.id },
        data: { instagram_user_id: null, instagram_username: null, is_instagram_connected: false },
      });
    });

    it('13. disconnectInstagram: cross-brand branch -> rejected, no update attempted', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_B);

      await expect(service.disconnectInstagram(STORE_B.id, USER_A)).rejects.toThrow(BadRequestException);
      expect(prisma.branchSocialAccount.update).not.toHaveBeenCalled();
    });
  });

  // 14. Same-brand multi-branch access must remain possible -- the boundary
  // is the caller's brand, not a single hardcoded branch. Business Owner/
  // Admin legitimately switch between several of their own brand's branches
  // (WorkspaceSwitcher, #2R-F2b) -- this must keep working exactly the same
  // for every branch in that brand, not just the first one tried.
  describe('same-brand multi-branch access remains possible (Task #2R-F2c)', () => {
    it('the same authenticated brand context can operate on more than one of its own branches', async () => {
      prisma.store.findUnique.mockResolvedValueOnce(STORE_A1).mockResolvedValueOnce(STORE_A2);
      prisma.branchSocialAccount.findUnique.mockResolvedValue({
        is_facebook_connected: false,
        is_instagram_connected: false,
        facebook_page_name: null,
        instagram_username: null,
      });

      await expect(service.getSocialStatus(STORE_A1.id, USER_A)).resolves.toBeDefined();
      await expect(service.getSocialStatus(STORE_A2.id, USER_A)).resolves.toBeDefined();
    });
  });
});

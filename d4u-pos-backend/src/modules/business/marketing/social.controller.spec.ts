import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';

describe('SocialController', () => {
  let controller: SocialController;
  let service: any;

  beforeEach(async () => {
    service = {
      getSocialStatus: jest.fn(),
      saveFacebookPage: jest.fn(),
      disconnectFacebook: jest.fn(),
      getFacebookPages: jest.fn(),
      saveInstagramAccount: jest.fn(),
      disconnectInstagram: jest.fn(),
      getInstagramAccounts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SocialController],
      providers: [{ provide: SocialService, useValue: service }],
    }).compile();

    controller = module.get<SocialController>(SocialController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-F2c: confirms the controller wires @CurrentUser() through to
  // the service for every route touched by the branch-boundary fix -- the
  // security-relevant query-shape assertions live in social.service.spec.ts,
  // this just confirms the plumbing.
  describe('@CurrentUser() wiring (Task #2R-F2c)', () => {
    const AUTH_USER = { sub: 1, active_brand_id: 1 };

    it('getStatus passes authenticatedUser through', async () => {
      await controller.getStatus('67', AUTH_USER);
      expect(service.getSocialStatus).toHaveBeenCalledWith(67, AUTH_USER);
    });

    it('getStatus still short-circuits on a missing branchId, without calling the service', async () => {
      const result = await controller.getStatus('', AUTH_USER);
      expect(result).toEqual({});
      expect(service.getSocialStatus).not.toHaveBeenCalled();
    });

    it('selectFacebookPage passes authenticatedUser through', async () => {
      await controller.selectFacebookPage(
        { branchId: '67', pageId: 'p1', pageName: 'Page One', token: 'tok' },
        AUTH_USER,
      );
      expect(service.saveFacebookPage).toHaveBeenCalledWith(67, 'p1', 'Page One', 'tok', AUTH_USER);
    });

    it('disconnectFacebook passes authenticatedUser through', async () => {
      await controller.disconnectFacebook('67', AUTH_USER);
      expect(service.disconnectFacebook).toHaveBeenCalledWith(67, AUTH_USER);
    });

    it('selectInstagramAccount passes authenticatedUser through', async () => {
      await controller.selectInstagramAccount(
        { branchId: '67', accountId: 'ig1', username: '@one', token: 'tok' },
        AUTH_USER,
      );
      expect(service.saveInstagramAccount).toHaveBeenCalledWith(67, 'ig1', '@one', 'tok', AUTH_USER);
    });

    it('disconnectInstagram passes authenticatedUser through', async () => {
      await controller.disconnectInstagram('67', AUTH_USER);
      expect(service.disconnectInstagram).toHaveBeenCalledWith(67, AUTH_USER);
    });
  });

  // 15. OAuth/connect routes must remain byte-for-byte unchanged -- #2R-F2c
  // explicitly leaves these untouched (a separate, already-flagged follow-up
  // task). Regression-tested here so any future accidental edit to these
  // signatures/behavior is caught.
  describe('OAuth/connect routes remain unchanged (Task #2R-F2c must not touch these)', () => {
    it('connectFacebook still redirects using only branchId, no authenticatedUser param', async () => {
      const res = { redirect: jest.fn() };
      await controller.connectFacebook('67', res as any);
      expect(res.redirect).toHaveBeenCalled();
    });

    it('connectInstagram still redirects using only branchId, no authenticatedUser param', async () => {
      const res = { redirect: jest.fn() };
      await controller.connectInstagram('67', res as any);
      expect(res.redirect).toHaveBeenCalled();
    });

    it('metaCallback still redirects using only code/state, no authenticatedUser param', async () => {
      const res = { redirect: jest.fn() };
      const state = encodeURIComponent(JSON.stringify({ branchId: '67', platform: 'facebook' }));
      await controller.metaCallback('dummy_code', state, res as any);
      expect(res.redirect).toHaveBeenCalled();
    });

    it('getFacebookPages remains unchanged -- called with only the token, no authenticatedUser threaded', async () => {
      await controller.getFacebookPages('some_token');
      expect(service.getFacebookPages).toHaveBeenCalledWith('some_token');
    });

    it('getInstagramAccounts remains unchanged -- called with only the token, no authenticatedUser threaded', async () => {
      await controller.getInstagramAccounts('some_token');
      expect(service.getInstagramAccounts).toHaveBeenCalledWith('some_token');
    });
  });

  // 16. No permission/RBAC changes were introduced -- every route's
  // @RequirePermissions decorator must carry the exact same crm.* string as
  // before #2R-F2c (permission migration is explicitly out of scope).
  it('permission decorators are unchanged for every social route (Task #2R-F2c must not touch RBAC)', () => {
    const expected: Record<string, string[]> = {
      getStatus: ['crm.view'],
      connectFacebook: ['crm.view'],
      connectInstagram: ['crm.view'],
      metaCallback: ['crm.view'],
      getFacebookPages: ['crm.view'],
      selectFacebookPage: ['crm.create'],
      disconnectFacebook: ['crm.delete'],
      getInstagramAccounts: ['crm.view'],
      selectInstagramAccount: ['crm.create'],
      disconnectInstagram: ['crm.delete'],
    };

    for (const [method, perms] of Object.entries(expected)) {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, (SocialController.prototype as any)[method])).toEqual(perms);
    }
  });
});

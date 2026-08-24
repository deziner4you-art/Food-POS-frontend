import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class SocialService {
  constructor(private prisma: PrismaService) {}

  // Task #2R-F2c: same brand-boundary helper pattern as
  // CatalogService.resolveBrandStoreScope (#2R-F1) / MarketingService.
  // resolveBrandStoreScope (#2R-F2a) -- resolves the caller's own brand_id
  // server-side (never trusts a client-supplied brand_id) and verifies the
  // requested branch actually belongs to it. Unlike those two, social data
  // is single-branch-owned (BranchSocialAccount.branch_id is @unique, no
  // M2M sharing) -- #2R-F2b established there is no legitimate "omitted
  // branch -> brand-wide" case here, so a concrete branchId is always
  // required; there is no storeIds-list return like the catalog/marketing
  // helpers, only a pass/reject on the one branch supplied.
  private async resolveBranchScope(authenticatedUser: any, branchId: number): Promise<{ brand_id: number }> {
    const brand_id = Number(authenticatedUser?.active_brand_id);
    if (!authenticatedUser || !Number.isFinite(brand_id) || brand_id <= 0) {
      throw new BadRequestException('A valid authenticated brand context is required.');
    }
    if (!branchId || !Number.isFinite(branchId)) {
      throw new BadRequestException('A valid branchId is required.');
    }

    const store = await this.prisma.store.findUnique({
      where: { id: branchId },
      select: { brand_id: true },
    });
    if (!store || store.brand_id !== brand_id) {
      throw new BadRequestException('Store not found for authenticated brand.');
    }

    return { brand_id };
  }

  async getFacebookPages(accessToken: string) {
    try {
      // Dummy implementation for development if real access token isn't provided
      if (accessToken === 'dummy_token' || !accessToken) {
        return [
          { id: '123', name: 'Masjid e Taqwa' },
          { id: '124', name: 'IMSA Official' },
          { id: '125', name: 'Main Branch' },
        ];
      }

      const res = await axios.get(`https://graph.facebook.com/me/accounts`, {
        params: { access_token: accessToken },
      });
      return res.data.data.map((page: any) => ({
        id: page.id,
        name: page.name,
      }));
    } catch (err) {
      console.error('[Meta API] Failed to fetch pages:', err.message);
      return [];
    }
  }

  // Task #2R-F2c: branchId was previously trusted with zero ownership check
  // -- any caller could attach a page/token to any branch, cross-brand
  // included. resolveBranchScope now verifies it belongs to the caller's own
  // brand before the upsert runs. Token handling and the upsert shape are
  // otherwise unchanged.
  async saveFacebookPage(
    branchId: number,
    pageId: string,
    pageName: string,
    accessToken: string,
    authenticatedUser?: any,
  ) {
    await this.resolveBranchScope(authenticatedUser, branchId);
    return this.prisma.branchSocialAccount.upsert({
      where: { branch_id: branchId },
      update: {
        facebook_page_id: pageId,
        facebook_page_name: pageName,
        is_facebook_connected: true,
        access_token: accessToken,
      },
      create: {
        branch_id: branchId,
        facebook_page_id: pageId,
        facebook_page_name: pageName,
        is_facebook_connected: true,
        access_token: accessToken,
      },
    });
  }

  // Task #2R-F2c: same ownership gap as saveFacebookPage -- any caller could
  // sever another brand's connection by branch id alone.
  async disconnectFacebook(branchId: number, authenticatedUser?: any) {
    await this.resolveBranchScope(authenticatedUser, branchId);
    return this.prisma.branchSocialAccount.update({
      where: { branch_id: branchId },
      data: {
        facebook_page_id: null,
        facebook_page_name: null,
        is_facebook_connected: false,
      },
    });
  }

  async getInstagramAccounts(accessToken: string) {
    try {
      // Dummy implementation
      if (accessToken === 'dummy_token' || !accessToken) {
        return [
          { id: 'ig_123', username: '@masjidetaqwa' },
          { id: 'ig_124', username: '@imsaofficial' },
        ];
      }

      // Graph API logic would typically fetch accounts linked to the FB Page
      return [];
    } catch (err) {
      console.error('[Meta API] Failed to fetch IG accounts:', err.message);
      return [];
    }
  }

  // Task #2R-F2c: same ownership gap as saveFacebookPage.
  async saveInstagramAccount(
    branchId: number,
    igAccountId: string,
    igUsername: string,
    accessToken: string,
    authenticatedUser?: any,
  ) {
    await this.resolveBranchScope(authenticatedUser, branchId);
    return this.prisma.branchSocialAccount.upsert({
      where: { branch_id: branchId },
      update: {
        instagram_user_id: igAccountId,
        instagram_username: igUsername,
        is_instagram_connected: true,
        access_token: accessToken, // Shared token in most cases
      },
      create: {
        branch_id: branchId,
        instagram_user_id: igAccountId,
        instagram_username: igUsername,
        is_instagram_connected: true,
        access_token: accessToken,
      },
    });
  }

  // Task #2R-F2c: same ownership gap as disconnectFacebook.
  async disconnectInstagram(branchId: number, authenticatedUser?: any) {
    await this.resolveBranchScope(authenticatedUser, branchId);
    return this.prisma.branchSocialAccount.update({
      where: { branch_id: branchId },
      data: {
        instagram_user_id: null,
        instagram_username: null,
        is_instagram_connected: false,
      },
    });
  }

  // Task #2R-F2c: previously returned the entire row unfiltered, including
  // the raw access_token (a real OAuth credential) to any caller who could
  // reach crm.view, with zero ownership check on branchId. resolveBranchScope
  // now enforces the caller's own brand, and the Prisma `select` is
  // restricted to exactly the fields MarketingHub.tsx actually reads
  // (is_facebook_connected/is_instagram_connected) plus the two display
  // fields (facebook_page_name/instagram_username) -- access_token, id, and
  // every other internal field are never selected, so they can't leak here
  // regardless of what's added to the response later.
  async getSocialStatus(branchId: number, authenticatedUser?: any) {
    await this.resolveBranchScope(authenticatedUser, branchId);

    const account = await this.prisma.branchSocialAccount.findUnique({
      where: { branch_id: branchId },
      select: {
        is_facebook_connected: true,
        is_instagram_connected: true,
        facebook_page_name: true,
        instagram_username: true,
      },
    });

    if (!account) {
      return {
        is_facebook_connected: false,
        is_instagram_connected: false,
        facebook_page_name: null,
        instagram_username: null,
      };
    }
    return account;
  }
}

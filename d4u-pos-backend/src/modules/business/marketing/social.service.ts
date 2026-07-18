import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class SocialService {
  constructor(private prisma: PrismaService) {}

  async getFacebookPages(accessToken: string) {
    try {
      // Dummy implementation for development if real access token isn't provided
      if (accessToken === 'dummy_token' || !accessToken) {
        return [
          { id: '123', name: 'Masjid e Taqwa' },
          { id: '124', name: 'IMSA Official' },
          { id: '125', name: 'Main Branch' }
        ];
      }

      const res = await axios.get(`https://graph.facebook.com/me/accounts`, {
        params: { access_token: accessToken }
      });
      return res.data.data.map((page: any) => ({
        id: page.id,
        name: page.name
      }));
    } catch (err) {
      console.error('[Meta API] Failed to fetch pages:', err.message);
      return [];
    }
  }

  async saveFacebookPage(branchId: number, pageId: string, pageName: string, accessToken: string) {
    return this.prisma.branchSocialAccount.upsert({
      where: { branch_id: branchId },
      update: {
        facebook_page_id: pageId,
        facebook_page_name: pageName,
        is_facebook_connected: true,
        access_token: accessToken
      },
      create: {
        branch_id: branchId,
        facebook_page_id: pageId,
        facebook_page_name: pageName,
        is_facebook_connected: true,
        access_token: accessToken
      }
    });
  }

  async disconnectFacebook(branchId: number) {
    return this.prisma.branchSocialAccount.update({
      where: { branch_id: branchId },
      data: { facebook_page_id: null, facebook_page_name: null, is_facebook_connected: false }
    });
  }

  async getInstagramAccounts(accessToken: string) {
    try {
      // Dummy implementation
      if (accessToken === 'dummy_token' || !accessToken) {
        return [
          { id: 'ig_123', username: '@masjidetaqwa' },
          { id: 'ig_124', username: '@imsaofficial' }
        ];
      }
      
      // Graph API logic would typically fetch accounts linked to the FB Page
      return [];
    } catch (err) {
      console.error('[Meta API] Failed to fetch IG accounts:', err.message);
      return [];
    }
  }

  async saveInstagramAccount(branchId: number, igAccountId: string, igUsername: string, accessToken: string) {
    return this.prisma.branchSocialAccount.upsert({
      where: { branch_id: branchId },
      update: {
        instagram_user_id: igAccountId,
        instagram_username: igUsername,
        is_instagram_connected: true,
        access_token: accessToken // Shared token in most cases
      },
      create: {
        branch_id: branchId,
        instagram_user_id: igAccountId,
        instagram_username: igUsername,
        is_instagram_connected: true,
        access_token: accessToken
      }
    });
  }

  async disconnectInstagram(branchId: number) {
    return this.prisma.branchSocialAccount.update({
      where: { branch_id: branchId },
      data: { instagram_user_id: null, instagram_username: null, is_instagram_connected: false }
    });
  }

  async getSocialStatus(branchId: number) {
    let account = await this.prisma.branchSocialAccount.findUnique({
      where: { branch_id: branchId }
    });
    if (!account) {
      account = { is_facebook_connected: false, is_instagram_connected: false } as any;
    }
    return account;
  }
}

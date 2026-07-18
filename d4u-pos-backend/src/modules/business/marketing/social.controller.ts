import { Controller, Post, Get, Body, Patch, Delete, Param, Query, Req, Res } from '@nestjs/common';
import { SocialService } from './social.service';

@Controller('marketing/social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('status')
  async getStatus(@Query('branchId') branchId: string) {
    if (!branchId) return {};
    return this.socialService.getSocialStatus(parseInt(branchId, 10));
  }

  // META OAUTH FLOW
  @Get('facebook/connect')
  async connectFacebook(@Query('branchId') branchId: string, @Res() res: any) {
    // Ideally store branchId in state, then redirect to Meta OAuth
    const state = JSON.stringify({ branchId, platform: 'facebook' });
    const redirectUri = process.env.META_REDIRECT_URI || 'http://localhost:3000/api/marketing/social/meta/callback';
    const clientId = process.env.META_APP_ID || 'dummy_client_id';
    
    // Using a dummy redirect for development testing since we don't have a real Meta App right now
    if (clientId === 'dummy_client_id') {
      return res.redirect(`http://localhost:3001/api/marketing/social/meta/callback?code=dummy_code&state=${encodeURIComponent(state)}`);
    }

    const authUrl = `https://www.facebook.com/v17.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&state=${encodeURIComponent(state)}&scope=pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish`;
    return res.redirect(authUrl);
  }

  @Get('instagram/connect')
  async connectInstagram(@Query('branchId') branchId: string, @Res() res: any) {
    const state = JSON.stringify({ branchId, platform: 'instagram' });
    const redirectUri = process.env.META_REDIRECT_URI || 'http://localhost:3000/api/marketing/social/meta/callback';
    const clientId = process.env.META_APP_ID || 'dummy_client_id';
    
    if (clientId === 'dummy_client_id') {
      return res.redirect(`http://localhost:3001/api/marketing/social/meta/callback?code=dummy_code&state=${encodeURIComponent(state)}`);
    }

    const authUrl = `https://www.facebook.com/v17.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&state=${encodeURIComponent(state)}&scope=pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish`;
    return res.redirect(authUrl);
  }

  @Get('meta/callback')
  async metaCallback(@Query('code') code: string, @Query('state') stateParam: string, @Res() res: any) {
    const state = JSON.parse(decodeURIComponent(stateParam || '{}'));
    const branchId = state.branchId;
    const platform = state.platform;
    
    // Here you would exchange the code for an access token.
    // For dummy implementation:
    const accessToken = 'dummy_token';
    
    // Redirect back to Admin UI to let user select page/account
    return res.redirect(`http://localhost:5300/marketing-hub?oauth=success&platform=${platform}&branchId=${branchId}&token=${accessToken}`);
  }

  // FACEBOOK SPECIFIC
  @Get('facebook/pages')
  async getFacebookPages(@Query('token') token: string) {
    return this.socialService.getFacebookPages(token);
  }

  @Post('facebook/select')
  async selectFacebookPage(@Body() body: { branchId: string, pageId: string, pageName: string, token: string }) {
    return this.socialService.saveFacebookPage(parseInt(body.branchId, 10), body.pageId, body.pageName, body.token);
  }

  @Delete('facebook/disconnect')
  async disconnectFacebook(@Query('branchId') branchId: string) {
    return this.socialService.disconnectFacebook(parseInt(branchId, 10));
  }

  // INSTAGRAM SPECIFIC
  @Get('instagram/accounts')
  async getInstagramAccounts(@Query('token') token: string) {
    return this.socialService.getInstagramAccounts(token);
  }

  @Post('instagram/select')
  async selectInstagramAccount(@Body() body: { branchId: string, accountId: string, username: string, token: string }) {
    return this.socialService.saveInstagramAccount(parseInt(body.branchId, 10), body.accountId, body.username, body.token);
  }

  @Delete('instagram/disconnect')
  async disconnectInstagram(@Query('branchId') branchId: string) {
    return this.socialService.disconnectInstagram(parseInt(branchId, 10));
  }
}

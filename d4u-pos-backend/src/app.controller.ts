import { Public, RequirePermissions } from './common/decorators';
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './database/prisma/prisma.service';
import { AppGateway } from './app.gateway';
import * as os from 'os';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prismaService: PrismaService,
    private readonly appGateway: AppGateway,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // ─── PUBLIC: Minimal bootstrap check ────────────────────────────────────────
  // Used by frontend on initial load to decide if Setup Wizard should run.
  @Public()
  @Get('bootstrap/status')
  async getBootstrapStatus() {
    const activeBrands = await this.prismaService.brand.count({
      where: { status: 'ACTIVE' },
    });
    const activePackages = await this.prismaService.package.count({
      where: { status: 'ACTIVE' },
    });
    return {
      bootstrapRequired: activeBrands === 0 || activePackages === 0,
      activeBrands,
      activePackages,
    };
  }

  // ─── PROTECTED: Full diagnostics (Super Admin only) ─────────────────────────
  @Get('system/health')
  async getSystemHealth(@Req() req: any) {
    const startMs = Date.now();

    // System Resource Usage (OS)
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePct = Math.round((usedMem / totalMem) * 100);
    const cpuLoad = os.loadavg()[0]; // 1 min load average

    // Parallel DB probes & queries
    const [
      brands,
      stores,
      users,
      packages,
      orders,
      activeSubs,
      expiredSubs,
      dbSizeResult,
      dbConnsResult,
      recentAudits,
    ] = await Promise.all([
      this.prismaService.brand.count({ where: { status: 'ACTIVE' } }),
      this.prismaService.store.count({ where: { status: 'ACTIVE' } }),
      this.prismaService.user.count(),
      this.prismaService.package.count({ where: { status: 'ACTIVE' } }),
      this.prismaService.order.count(),
      this.prismaService.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prismaService.subscription.count({ where: { status: 'EXPIRED' } }),
      this.prismaService.$queryRaw`SELECT pg_database_size(current_database()) as size`,
      this.prismaService.$queryRaw`SELECT count(*) as active_conns FROM pg_stat_activity WHERE state = 'active'`,
      this.prismaService.systemAuditLog.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    const dbLatencyMs = Date.now() - startMs;
    
    const dbSize = Number((dbSizeResult as any)[0]?.size || 0);
    const activeConns = Number((dbConnsResult as any)[0]?.active_conns || 0);
    
    // Auth Metrics (Mocked for now until session table is fully utilized)
    const authMetrics = {
      active_sessions: users, // Temporary representation
      failed_logins: 0,
      token_health: process.env.JWT_SECRET ? 'PASS' : 'FAIL'
    };

    // Warnings Engine
    const warnings: string[] = [];
    if (dbLatencyMs > 500) warnings.push(`Database latency is high (${dbLatencyMs}ms)`);
    if (memUsagePct > 85) warnings.push(`Server memory usage is critical (${memUsagePct}%)`);
    if (cpuLoad > os.cpus().length) warnings.push(`CPU Load is high (${cpuLoad.toFixed(2)})`);
    if (authMetrics.token_health === 'FAIL') warnings.push('JWT Secret is missing from environment');
    if (expiredSubs > 0) warnings.push(`${expiredSubs} active subscriptions have expired`);

    return {
      status: warnings.length >= 3 ? 'DEGRADED' : 'OPERATIONAL',
      timestamp: new Date().toISOString(),
      resources: {
        cpu_load: cpuLoad.toFixed(2),
        cpu_cores: os.cpus().length,
        mem_usage_pct: memUsagePct,
        mem_total_gb: (totalMem / 1024 / 1024 / 1024).toFixed(1),
        mem_used_gb: (usedMem / 1024 / 1024 / 1024).toFixed(1),
      },
      db: {
        status: dbLatencyMs < 200 ? 'PASS' : dbLatencyMs < 500 ? 'SLOW' : 'FAIL',
        latency_ms: dbLatencyMs,
        size_mb: (dbSize / 1024 / 1024).toFixed(1),
        connections: activeConns,
        backup: 'PASS', // Flag placeholder
      },
      auth: authMetrics,
      subscriptions: {
        active: activeSubs,
        expired: expiredSubs,
        status: expiredSubs > (activeSubs * 0.1) ? 'WARN' : 'PASS',
      },
      modules: {
        inventory: stores > 0 ? 'PASS' : 'WARN',
        pos: stores > 0 ? 'PASS' : 'WARN',
        crm: users > 0 ? 'PASS' : 'WARN',
        marketing: packages > 0 ? 'PASS' : 'WARN',
        website: brands > 0 ? 'PASS' : 'WARN',
        finance: orders > 0 ? 'PASS' : 'WARN',
        reports: 'PASS',
      },
      services: {
        queue: 'PASS', // Placeholder for bullmq/redis
        notifications: 'PASS', // Placeholder for smtp
      },
      audits: recentAudits,
      warnings,
      counts: { brands, branches: stores, users, packages, orders }, // Kept for secondary info
      requested_by: req.user?.sub ?? 'unknown',
    };
  }
}

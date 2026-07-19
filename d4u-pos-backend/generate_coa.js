const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // DTOs
  'dto/create-account-group.dto.ts': `import { IsString, IsInt, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { AccountType } from '../enums/account-type.enum';

export class CreateAccountGroupDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsEnum(AccountType)
  root_type: AccountType;

  @IsOptional()
  @IsInt()
  parent_group_id?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
`,
  'dto/create-account.dto.ts': `import { IsString, IsInt, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsInt()
  account_group_id: number;

  @IsOptional()
  @IsInt()
  currency_id?: number;

  @IsOptional()
  @IsNumber()
  opening_balance?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
`,
  'dto/update-account.dto.ts': `import { IsString, IsInt, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsInt()
  account_group_id?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
`,
  'dto/move-account.dto.ts': `import { IsInt, IsNotEmpty } from 'class-validator';

export class MoveAccountDto {
  @IsNotEmpty()
  @IsInt()
  new_parent_id: number; // account_group_id for Account, parent_group_id for AccountGroup
}
`,

  // Repositories
  'repositories/account-group.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { CreateAccountGroupDto } from '../dto/create-account-group.dto';

@Injectable()
export class AccountGroupRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: number, data: CreateAccountGroupDto) {
    return this.prisma.accountGroup.create({
      data: {
        store_id: storeId,
        ...data,
      },
    });
  }

  async findByCode(storeId: number, code: string) {
    return this.prisma.accountGroup.findUnique({
      where: { store_id_code: { store_id: storeId, code } },
    });
  }

  async findById(storeId: number, id: number) {
    return this.prisma.accountGroup.findFirst({
      where: { id, store_id: storeId },
    });
  }

  async findChildren(storeId: number, parentId: number) {
    return this.prisma.accountGroup.findMany({
      where: { parent_group_id: parentId, store_id: storeId },
    });
  }

  async findAll(storeId: number) {
    return this.prisma.accountGroup.findMany({
      where: { store_id: storeId },
    });
  }

  async update(id: number, storeId: number, data: any) {
    return this.prisma.accountGroup.updateMany({
      where: { id, store_id: storeId },
      data,
    });
  }
}
`,
  'repositories/account.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { CreateAccountDto } from '../dto/create-account.dto';

@Injectable()
export class AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: number, data: CreateAccountDto) {
    return this.prisma.account.create({
      data: {
        store_id: storeId,
        name: data.name,
        code: data.code,
        account_group_id: data.account_group_id,
        currency_id: data.currency_id,
        opening_balance: data.opening_balance || 0.0,
        is_active: data.is_active ?? true,
      },
    });
  }

  async findByCode(storeId: number, code: string) {
    return this.prisma.account.findUnique({
      where: { store_id_code: { store_id: storeId, code } },
    });
  }

  async findById(storeId: number, id: number) {
    return this.prisma.account.findFirst({
      where: { id, store_id: storeId },
      include: { journal_lines: true, system_mappings: true },
    });
  }

  async findAll(storeId: number) {
    return this.prisma.account.findMany({
      where: { store_id: storeId },
      include: { account_group: true },
    });
  }

  async update(id: number, storeId: number, data: any) {
    return this.prisma.account.updateMany({
      where: { id, store_id: storeId },
      data,
    });
  }
}
`,

  // Service
  'services/chart-of-accounts.service.ts': `import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { AccountGroupRepository } from '../repositories/account-group.repository';
import { AccountRepository } from '../repositories/account.repository';
import { CreateAccountGroupDto } from '../dto/create-account-group.dto';
import { CreateAccountDto } from '../dto/create-account.dto';
import { MoveAccountDto } from '../dto/move-account.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';

@Injectable()
export class ChartOfAccountsService {
  constructor(
    private readonly groupRepo: AccountGroupRepository,
    private readonly accountRepo: AccountRepository,
  ) {}

  async createGroup(storeId: number, dto: CreateAccountGroupDto) {
    const existing = await this.groupRepo.findByCode(storeId, dto.code);
    if (existing) throw new BadRequestException('Account Group code already exists.');

    if (dto.parent_group_id) {
      const parent = await this.groupRepo.findById(storeId, dto.parent_group_id);
      if (!parent) throw new BadRequestException('Parent group not found.');
    }

    return this.groupRepo.create(storeId, dto);
  }

  async createAccount(storeId: number, dto: CreateAccountDto) {
    const existing = await this.accountRepo.findByCode(storeId, dto.code);
    if (existing) throw new BadRequestException('Account code already exists.');

    const parent = await this.groupRepo.findById(storeId, dto.account_group_id);
    if (!parent) throw new BadRequestException('Parent group not found.');

    return this.accountRepo.create(storeId, dto);
  }

  async updateAccount(storeId: number, id: number, dto: UpdateAccountDto) {
    const account = await this.accountRepo.findById(storeId, id);
    if (!account) throw new NotFoundException('Account not found');

    if (dto.code && dto.code !== account.code) {
      const existing = await this.accountRepo.findByCode(storeId, dto.code);
      if (existing) throw new BadRequestException('Account code already exists.');
    }

    return this.accountRepo.update(id, storeId, dto);
  }

  async disableAccount(storeId: number, id: number) {
    const account = await this.accountRepo.findById(storeId, id);
    if (!account) throw new NotFoundException('Account not found');

    if (account.system_mappings && account.system_mappings.length > 0) {
      throw new BadRequestException('Cannot disable a mapped System Account.');
    }

    return this.accountRepo.update(id, storeId, { is_active: false });
  }

  async moveAccount(storeId: number, id: number, dto: MoveAccountDto) {
    const account = await this.accountRepo.findById(storeId, id);
    if (!account) throw new NotFoundException('Account not found');

    const newParent = await this.groupRepo.findById(storeId, dto.new_parent_id);
    if (!newParent) throw new BadRequestException('New parent group not found.');

    return this.accountRepo.update(id, storeId, { account_group_id: dto.new_parent_id });
  }

  async moveGroup(storeId: number, id: number, dto: MoveAccountDto) {
    const group = await this.groupRepo.findById(storeId, id);
    if (!group) throw new NotFoundException('Group not found');

    const newParent = await this.groupRepo.findById(storeId, dto.new_parent_id);
    if (!newParent) throw new BadRequestException('New parent group not found.');

    if (id === dto.new_parent_id) throw new BadRequestException('Cannot move a group under itself.');

    // Circular dependency check (simple up-tree traversal)
    let currentParentId = newParent.parent_group_id;
    while (currentParentId) {
      if (currentParentId === id) {
        throw new BadRequestException('Cannot move parent under its own child (circular dependency).');
      }
      const parent = await this.groupRepo.findById(storeId, currentParentId);
      currentParentId = parent ? parent.parent_group_id : null;
    }

    return this.groupRepo.update(id, storeId, { parent_group_id: dto.new_parent_id });
  }

  async getTree(storeId: number) {
    const groups = await this.groupRepo.findAll(storeId);
    const accounts = await this.accountRepo.findAll(storeId);

    const groupMap = new Map();
    groups.forEach(g => groupMap.set(g.id, { ...g, children: [], accounts: [] }));

    const rootGroups = [];

    groups.forEach(g => {
      if (g.parent_group_id) {
        const parent = groupMap.get(g.parent_group_id);
        if (parent) parent.children.push(groupMap.get(g.id));
      } else {
        rootGroups.push(groupMap.get(g.id));
      }
    });

    accounts.forEach(a => {
      const parent = groupMap.get(a.account_group_id);
      if (parent) parent.accounts.push(a);
    });

    return rootGroups;
  }

  async search(storeId: number, query: string) {
    const q = query.toLowerCase();
    const groups = await this.groupRepo.findAll(storeId);
    const accounts = await this.accountRepo.findAll(storeId);

    return {
      groups: groups.filter(g => g.name.toLowerCase().includes(q) || g.code.toLowerCase().includes(q)),
      accounts: accounts.filter(a => a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q)),
    };
  }
}
`,

  // Controller
  'controllers/chart-of-accounts.controller.ts': `import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ChartOfAccountsService } from '../services/chart-of-accounts.service';
import { CreateAccountGroupDto } from '../dto/create-account-group.dto';
import { CreateAccountDto } from '../dto/create-account.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';
import { MoveAccountDto } from '../dto/move-account.dto';

@Controller('accounting/coa')
export class ChartOfAccountsController {
  constructor(private readonly coaService: ChartOfAccountsService) {}

  @Get('tree')
  async getTree(@Query('store_id', ParseIntPipe) store_id: number) {
    return this.coaService.getTree(store_id);
  }

  @Get('search')
  async search(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Query('q') query: string,
  ) {
    return this.coaService.search(store_id, query || '');
  }

  @Post('groups')
  async createGroup(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Body() dto: CreateAccountGroupDto,
  ) {
    return this.coaService.createGroup(store_id, dto);
  }

  @Post('accounts')
  async createAccount(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Body() dto: CreateAccountDto,
  ) {
    return this.coaService.createAccount(store_id, dto);
  }

  @Patch('accounts/:id')
  async updateAccount(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.coaService.updateAccount(store_id, id, dto);
  }

  @Patch('accounts/:id/disable')
  async disableAccount(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.coaService.disableAccount(store_id, id);
  }

  @Patch('accounts/:id/move')
  async moveAccount(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MoveAccountDto,
  ) {
    return this.coaService.moveAccount(store_id, id, dto);
  }

  @Patch('groups/:id/move')
  async moveGroup(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MoveAccountDto,
  ) {
    return this.coaService.moveGroup(store_id, id, dto);
  }
}
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(basePath, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', relativePath);
}

const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Enum update
  'enums/system-account-type.enum.ts': `export enum SystemAccountType {
  CASH = 'CASH',
  BANK = 'BANK',
  ACCOUNTS_RECEIVABLE = 'ACCOUNTS_RECEIVABLE',
  ACCOUNTS_PAYABLE = 'ACCOUNTS_PAYABLE',
  INVENTORY = 'INVENTORY',
  COGS = 'COGS',
  SALES_REVENUE = 'SALES_REVENUE',
  SALES_DISCOUNT = 'SALES_DISCOUNT',
  SALES_TAX = 'SALES_TAX',
  PURCHASE_TAX = 'PURCHASE_TAX',
  PAYROLL_EXPENSE = 'PAYROLL_EXPENSE',
  PAYROLL_PAYABLE = 'PAYROLL_PAYABLE',
  RETAINED_EARNINGS = 'RETAINED_EARNINGS',
  OPENING_BALANCE = 'OPENING_BALANCE',
  EXCHANGE_GAIN = 'EXCHANGE_GAIN',
  EXCHANGE_LOSS = 'EXCHANGE_LOSS',
}
`,

  // DTOs
  'dto/create-system-account-mapping.dto.ts': `import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { SystemAccountType } from '../enums/system-account-type.enum';

export class CreateSystemAccountMappingDto {
  @IsNotEmpty()
  @IsEnum(SystemAccountType)
  mapping_type: SystemAccountType;

  @IsNotEmpty()
  @IsInt()
  account_id: number;
}
`,
  'dto/update-system-account-mapping.dto.ts': `import { IsInt, IsNotEmpty } from 'class-validator';

export class UpdateSystemAccountMappingDto {
  @IsNotEmpty()
  @IsInt()
  account_id: number;
}
`,
  'dto/index.ts': `export * from './create-system-account-mapping.dto';
export * from './update-system-account-mapping.dto';
`,

  // Entity
  'entities/system-account-mapping.entity.ts': `import { SystemAccountType } from '../enums/system-account-type.enum';

export class SystemAccountMapping {
  id: number;
  store_id: number;
  mapping_type: SystemAccountType;
  account_id: number;
  created_at: Date;
  updated_at: Date;
}
`,
  'entities/index.ts': `export * from './system-account-mapping.entity';
`,

  // Repository
  'repositories/system-account-mapping.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { SystemAccountType } from '../enums/system-account-type.enum';

@Injectable()
export class SystemAccountMappingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: number, mappingType: SystemAccountType, accountId: number) {
    return this.prisma.systemAccountMapping.create({
      data: {
        store_id: storeId,
        mapping_type: mappingType,
        account_id: accountId,
      },
    });
  }

  async update(id: number, storeId: number, accountId: number) {
    return this.prisma.systemAccountMapping.updateMany({
      where: { id, store_id: storeId },
      data: { account_id: accountId },
    });
  }

  async findUnique(storeId: number, mappingType: SystemAccountType) {
    return this.prisma.systemAccountMapping.findUnique({
      where: {
        store_id_mapping_type: {
          store_id: storeId,
          mapping_type: mappingType,
        },
      },
      include: {
        account: true,
      },
    });
  }

  async findAll(storeId: number) {
    return this.prisma.systemAccountMapping.findMany({
      where: { store_id: storeId },
      include: {
        account: true,
      },
    });
  }

  async checkAccountActiveAndBelongsToTenant(storeId: number, accountId: number) {
    return this.prisma.account.findFirst({
      where: {
        id: accountId,
        store_id: storeId,
        is_active: true,
      },
    });
  }
}
`,
  'repositories/index.ts': `export * from './system-account-mapping.repository';
`,

  // Service
  'services/system-account-mapping.service.ts': `import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SystemAccountMappingRepository } from '../repositories/system-account-mapping.repository';
import { CreateSystemAccountMappingDto } from '../dto/create-system-account-mapping.dto';
import { UpdateSystemAccountMappingDto } from '../dto/update-system-account-mapping.dto';
import { SystemAccountType } from '../enums/system-account-type.enum';

@Injectable()
export class SystemAccountMappingService {
  constructor(private readonly repository: SystemAccountMappingRepository) {}

  async createMapping(storeId: number, dto: CreateSystemAccountMappingDto) {
    // Validate uniqueness
    const existing = await this.repository.findUnique(storeId, dto.mapping_type);
    if (existing) {
      throw new BadRequestException(\`Mapping for \${dto.mapping_type} already exists for this store.\`);
    }

    // Validate account
    const validAccount = await this.repository.checkAccountActiveAndBelongsToTenant(storeId, dto.account_id);
    if (!validAccount) {
      throw new BadRequestException('Account does not exist, belongs to another tenant, or is inactive.');
    }

    return this.repository.create(storeId, dto.mapping_type, dto.account_id);
  }

  async updateMapping(id: number, storeId: number, dto: UpdateSystemAccountMappingDto) {
    const validAccount = await this.repository.checkAccountActiveAndBelongsToTenant(storeId, dto.account_id);
    if (!validAccount) {
      throw new BadRequestException('Account does not exist, belongs to another tenant, or is inactive.');
    }

    const updated = await this.repository.update(id, storeId, dto.account_id);
    if (updated.count === 0) {
      throw new NotFoundException('Mapping not found for this store.');
    }
    return { success: true, message: 'Mapping updated successfully.' };
  }

  async findAll(storeId: number) {
    return this.repository.findAll(storeId);
  }

  async findByType(storeId: number, type: SystemAccountType) {
    const mapping = await this.repository.findUnique(storeId, type);
    if (!mapping) {
      throw new NotFoundException(\`Mapping for \${type} not found.\`);
    }
    return mapping;
  }
}
`,
  'services/index.ts': `export * from './system-account-mapping.service';
`,

  // Controller
  'controllers/system-account-mapping.controller.ts': `import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { SystemAccountMappingService } from '../services/system-account-mapping.service';
import { CreateSystemAccountMappingDto } from '../dto/create-system-account-mapping.dto';
import { UpdateSystemAccountMappingDto } from '../dto/update-system-account-mapping.dto';
import { SystemAccountType } from '../enums/system-account-type.enum';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../core/auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/auth/decorators/permissions.decorator';
import { GetUser } from '../../../core/auth/decorators/get-user.decorator';
import { User } from '@prisma/client';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('accounting/system-accounts')
export class SystemAccountMappingController {
  constructor(private readonly mappingService: SystemAccountMappingService) {}

  @Post()
  @RequirePermissions('accounting.system-accounts.create')
  async create(
    @GetUser() user: User,
    @Body() dto: CreateSystemAccountMappingDto,
  ) {
    return this.mappingService.createMapping(user.store_id, dto);
  }

  @Get()
  @RequirePermissions('accounting.system-accounts.read')
  async findAll(@GetUser() user: User) {
    return this.mappingService.findAll(user.store_id);
  }

  @Get('type/:type')
  @RequirePermissions('accounting.system-accounts.read')
  async findByType(
    @GetUser() user: User,
    @Param('type') type: SystemAccountType,
  ) {
    return this.mappingService.findByType(user.store_id, type);
  }

  @Patch(':id')
  @RequirePermissions('accounting.system-accounts.update')
  async update(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSystemAccountMappingDto,
  ) {
    return this.mappingService.updateMapping(id, user.store_id, dto);
  }
}
`,
  'controllers/index.ts': `export * from './system-account-mapping.controller';
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(basePath, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', relativePath);
}

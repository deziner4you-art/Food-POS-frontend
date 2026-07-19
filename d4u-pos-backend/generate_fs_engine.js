const fs = require('fs');
const path = require('path');

const prismaSchemaPath = path.join(__dirname, 'prisma/schema.prisma');
let schemaContent = fs.readFileSync(prismaSchemaPath, 'utf8');

if (!schemaContent.includes('model FinancialStatement {')) {
  schemaContent += `

model FinancialStatement {
  id                   Int      @id @default(autoincrement())
  store_id             Int
  name                 String
  type                 String
  description          String?
  is_active            Boolean  @default(true)
  created_at           DateTime @default(now())
  updated_at           DateTime @updatedAt
  
  sections             FinancialStatementSection[]
  
  store                Store    @relation(fields: [store_id], references: [id])
  
  @@unique([store_id, name])
  @@index([store_id])
}

model FinancialStatementSection {
  id                   Int      @id @default(autoincrement())
  statement_id         Int
  parent_section_id    Int?
  name                 String
  type                 String
  sort_order           Int      @default(0)
  is_active            Boolean  @default(true)
  created_at           DateTime @default(now())
  updated_at           DateTime @updatedAt
  
  statement            FinancialStatement           @relation(fields: [statement_id], references: [id])
  parent_section       FinancialStatementSection?   @relation("SectionToSection", fields: [parent_section_id], references: [id])
  sub_sections         FinancialStatementSection[]  @relation("SectionToSection")
  mappings             FinancialStatementMapping[]

  @@index([statement_id])
  @@index([parent_section_id])
}

model FinancialStatementMapping {
  id                   Int      @id @default(autoincrement())
  section_id           Int
  account_id           Int?
  account_group_id     Int?
  is_active            Boolean  @default(true)
  created_at           DateTime @default(now())
  updated_at           DateTime @updatedAt
  
  section              FinancialStatementSection    @relation(fields: [section_id], references: [id])
  account              Account?                     @relation(fields: [account_id], references: [id])
  account_group        AccountGroup?                @relation(fields: [account_group_id], references: [id])

  @@index([section_id])
  @@index([account_id])
  @@index([account_group_id])
}
`;

  // Add relations
  schemaContent = schemaContent.replace(
    /model Store \{[\s\S]*?(?=model )/,
    (match) => {
      if (match.includes('financial_statements')) return match;
      return match.replace(
        /}\s*$/,
        `  financial_statements FinancialStatement[]\n}\n\n`
      );
    }
  );

  schemaContent = schemaContent.replace(
    /model Account \{[\s\S]*?(?=model )/,
    (match) => {
      if (match.includes('financial_statement_mappings')) return match;
      return match.replace(
        /}\s*$/,
        `  financial_statement_mappings FinancialStatementMapping[]\n}\n\n`
      );
    }
  );

  schemaContent = schemaContent.replace(
    /model AccountGroup \{[\s\S]*?(?=model )/,
    (match) => {
      if (match.includes('financial_statement_mappings')) return match;
      return match.replace(
        /}\s*$/,
        `  financial_statement_mappings FinancialStatementMapping[]\n}\n\n`
      );
    }
  );

  fs.writeFileSync(prismaSchemaPath, schemaContent);
  console.log('Schema updated.');
} else {
  console.log('Schema already updated.');
}

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  'events/financial-statement-mapping-created.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class FinancialStatementMappingCreatedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'FINANCIAL_STATEMENT_MAPPING_CREATED';
  occurred_at = new Date();
  entity_type = 'FINANCIAL_STATEMENT_MAPPING';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/financial-statement-generated.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class FinancialStatementGeneratedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'FINANCIAL_STATEMENT_GENERATED';
  occurred_at = new Date();
  entity_type = 'FINANCIAL_STATEMENT';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'interfaces/financial-statement.interface.ts': `export interface FinancialStatementResult {
  statement_id: number;
  store_id: number;
  name: string;
  type: string;
  start_date: Date;
  end_date: Date;
  sections: StatementSectionResult[];
}

export interface StatementSectionResult {
  section_id: number;
  name: string;
  type: string;
  sort_order: number;
  total_amount: number;
  sub_sections: StatementSectionResult[];
  lines: StatementLineResult[];
}

export interface StatementLineResult {
  account_id?: number;
  account_group_id?: number;
  code: string;
  name: string;
  amount: number;
}
`,

  'interfaces/statement-section.interface.ts': `export interface CreateStatementSectionDto {
  statement_id: number;
  parent_section_id?: number;
  name: string;
  type: string;
  sort_order?: number;
}
`,

  'interfaces/mapping.interface.ts': `export interface CreateStatementMappingDto {
  section_id: number;
  account_id?: number;
  account_group_id?: number;
}
`,

  'repositories/financial-statement.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class FinancialStatementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createStatement(data: any) {
    return this.prisma.financialStatement.create({ data });
  }

  async getStatementStructure(statementId: number) {
    return this.prisma.financialStatement.findUnique({
      where: { id: statementId },
      include: {
        sections: {
          include: {
            sub_sections: true,
            mappings: true
          },
          orderBy: { sort_order: 'asc' }
        }
      }
    });
  }

  async getStatementByStoreAndId(storeId: number, statementId: number) {
    return this.prisma.financialStatement.findFirst({
      where: { store_id: storeId, id: statementId }
    });
  }

  async createSection(data: any) {
    return this.prisma.financialStatementSection.create({ data });
  }

  async getSection(sectionId: number) {
    return this.prisma.financialStatementSection.findUnique({ where: { id: sectionId } });
  }

  async createMapping(data: any) {
    return this.prisma.financialStatementMapping.create({ data });
  }

  async checkDuplicateMapping(statementId: number, accountId?: number, accountGroupId?: number) {
    const filters: any[] = [];
    if (accountId) filters.push({ account_id: accountId });
    if (accountGroupId) filters.push({ account_group_id: accountGroupId });

    return this.prisma.financialStatementMapping.findFirst({
      where: {
        section: { statement_id: statementId },
        OR: filters
      }
    });
  }
}
`,

  'validators/financial-statement.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { FinancialStatementRepository } from '../repositories/financial-statement.repository';

@Injectable()
export class FinancialStatementValidator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: FinancialStatementRepository
  ) {}

  async validateMapping(storeId: number, sectionId: number, accountId?: number, accountGroupId?: number) {
    if (!accountId && !accountGroupId) {
      throw new BadRequestException('Must provide either account_id or account_group_id');
    }

    const section = await this.repository.getSection(sectionId);
    if (!section) throw new BadRequestException('Section not found.');

    const statement = await this.repository.getStatementByStoreAndId(storeId, section.statement_id);
    if (!statement) throw new BadRequestException('Statement not found or belongs to another store.');

    if (accountId) {
      const account = await this.prisma.account.findFirst({ where: { id: accountId, store_id: storeId } });
      if (!account) throw new BadRequestException('Account not found in this store.');
    }

    if (accountGroupId) {
      const group = await this.prisma.accountGroup.findFirst({ where: { id: accountGroupId, store_id: storeId } });
      if (!group) throw new BadRequestException('Account group not found in this store.');
    }

    const duplicate = await this.repository.checkDuplicateMapping(section.statement_id, accountId, accountGroupId);
    if (duplicate) {
      throw new BadRequestException('Account or Group is already mapped in this statement.');
    }
  }
}
`,

  'services/financial-statement-mapping.service.ts': `import { Injectable } from '@nestjs/common';
import { FinancialStatementRepository } from '../repositories/financial-statement.repository';
import { FinancialStatementValidator } from '../validators/financial-statement.validator';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { FinancialStatementMappingCreatedEvent } from '../events/financial-statement-mapping-created.event';
import { CreateStatementSectionDto } from '../interfaces/statement-section.interface';
import { CreateStatementMappingDto } from '../interfaces/mapping.interface';

@Injectable()
export class FinancialStatementMappingService {
  constructor(
    private readonly repository: FinancialStatementRepository,
    private readonly validator: FinancialStatementValidator,
    private readonly eventBus: DomainEventBusService
  ) {}

  async createStatement(storeId: number, name: string, type: string, description?: string) {
    return this.repository.createStatement({ store_id: storeId, name, type, description });
  }

  async createSection(storeId: number, dto: CreateStatementSectionDto) {
    // Basic validations
    const statement = await this.repository.getStatementByStoreAndId(storeId, dto.statement_id);
    if (!statement) throw new Error('Statement not found');

    return this.repository.createSection(dto);
  }

  async mapAccount(storeId: number, dto: CreateStatementMappingDto, userId: number) {
    await this.validator.validateMapping(storeId, dto.section_id, dto.account_id, dto.account_group_id);

    const mapping = await this.repository.createMapping(dto);

    this.eventBus.publish(new FinancialStatementMappingCreatedEvent(storeId, 0, userId, mapping.id.toString(), 'mapAccount', { mapping }));

    return mapping;
  }
}
`,

  'services/financial-statement-builder.service.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { FinancialStatementRepository } from '../repositories/financial-statement.repository';
import { TrialBalanceService } from './trial-balance.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { FinancialStatementGeneratedEvent } from '../events/financial-statement-generated.event';
import { FinancialStatementResult, StatementSectionResult, StatementLineResult } from '../interfaces/financial-statement.interface';

@Injectable()
export class FinancialStatementBuilderService {
  constructor(
    private readonly repository: FinancialStatementRepository,
    private readonly tbService: TrialBalanceService,
    private readonly eventBus: DomainEventBusService
  ) {}

  async buildStatement(storeId: number, statementId: number, startDate: Date, endDate: Date, fiscalYearId: number, userId: number): Promise<FinancialStatementResult> {
    const statement = await this.repository.getStatementStructure(statementId);
    if (!statement || statement.store_id !== storeId) {
      throw new BadRequestException('Financial statement not found.');
    }

    // Get trial balance to populate values
    const tb = await this.tbService.generateTrialBalance({
      fiscal_year_id: fiscalYearId,
      start_date: startDate,
      end_date: endDate,
      store_id: storeId
    }, userId);

    const result: FinancialStatementResult = {
      statement_id: statement.id,
      store_id: storeId,
      name: statement.name,
      type: statement.type,
      start_date: startDate,
      end_date: endDate,
      sections: []
    };

    // Helper map for fast lookup
    const tbMap = new Map();
    for (const line of tb.lines) {
      tbMap.set(line.account_id, line);
    }
    const tbGroupMap = new Map();
    for (const line of tb.lines) {
      const gId = line.account_group_id;
      if (!tbGroupMap.has(gId)) tbGroupMap.set(gId, []);
      tbGroupMap.get(gId).push(line);
    }

    // Build hierarchical sections
    const buildSection = (section: any): StatementSectionResult => {
      let total = 0;
      const lines: StatementLineResult[] = [];

      for (const map of section.mappings) {
        if (!map.is_active) continue;

        if (map.account_id) {
          const tbLine = tbMap.get(map.account_id);
          if (tbLine) {
            lines.push({ account_id: map.account_id, code: tbLine.account_code, name: tbLine.account_name, amount: tbLine.closing_balance });
            total += tbLine.closing_balance;
          }
        } else if (map.account_group_id) {
          const tbLines = tbGroupMap.get(map.account_group_id) || [];
          let gTotal = 0;
          for (const tl of tbLines) {
             gTotal += tl.closing_balance;
          }
          if (tbLines.length > 0) {
             lines.push({ account_group_id: map.account_group_id, code: \`GRP-\${map.account_group_id}\`, name: tbLines[0].group_name, amount: gTotal });
             total += gTotal;
          }
        }
      }

      const subSections: StatementSectionResult[] = [];
      const children = statement.sections.filter(s => s.parent_section_id === section.id);
      for (const child of children) {
        const sub = buildSection(child);
        subSections.push(sub);
        total += sub.total_amount;
      }

      return {
        section_id: section.id,
        name: section.name,
        type: section.type,
        sort_order: section.sort_order,
        total_amount: total,
        sub_sections: subSections,
        lines
      };
    };

    // Root sections
    const rootSections = statement.sections.filter(s => !s.parent_section_id);
    for (const rs of rootSections) {
      result.sections.push(buildSection(rs));
    }

    this.eventBus.publish(new FinancialStatementGeneratedEvent(storeId, 0, userId, statement.id.toString(), 'build', { statementId }));

    return result;
  }
}
`,

  'controllers/financial-statement.controller.ts': `import { Controller, Post, Get, Body, Param, Query, Req, ParseIntPipe } from '@nestjs/common';
import { FinancialStatementMappingService } from '../services/financial-statement-mapping.service';
import { FinancialStatementBuilderService } from '../services/financial-statement-builder.service';
import { CreateStatementSectionDto } from '../interfaces/statement-section.interface';
import { CreateStatementMappingDto } from '../interfaces/mapping.interface';

@Controller('accounting/financial-statements')
export class FinancialStatementController {
  constructor(
    private readonly mappingService: FinancialStatementMappingService,
    private readonly builderService: FinancialStatementBuilderService
  ) {}

  @Post()
  async createStatement(@Body() body: any, @Req() req: any) {
    const storeId = body.store_id || 1;
    return this.mappingService.createStatement(storeId, body.name, body.type, body.description);
  }

  @Post('sections')
  async createSection(@Body() dto: CreateStatementSectionDto, @Body('store_id') storeId: number) {
    return this.mappingService.createSection(storeId || 1, dto);
  }

  @Post('mappings')
  async createMapping(@Body() dto: CreateStatementMappingDto, @Body('store_id') storeId: number, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.mappingService.mapAccount(storeId || 1, dto, userId);
  }

  @Get(':id/build')
  async buildStatement(
    @Param('id', ParseIntPipe) id: number,
    @Query('store_id', ParseIntPipe) storeId: number,
    @Query('fiscal_year_id', ParseIntPipe) fiscalYearId: number,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Req() req: any
  ) {
    const userId = req.user?.id || 1;
    return this.builderService.buildStatement(storeId, id, new Date(startDate), new Date(endDate), fiscalYearId, userId);
  }
}
`
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(basePath, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', relativePath);
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class BudgetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createBudget(data: any) {
    return this.prisma.budget.create({
      data: {
        store_id: data.store_id,
        fiscal_year_id: data.fiscal_year_id,
        name: data.name,
        type: data.type,
        status: 'DRAFT',
        created_by: data.user_id,
        versions: {
          create: [{
            version_number: 1,
            created_by: data.user_id,
            lines: {
              create: data.lines
            }
          }]
        }
      },
      include: {
        versions: { include: { lines: true } }
      }
    });
  }

  async approveBudget(budgetId: number, userId: number) {
    return this.prisma.budget.update({
      where: { id: budgetId },
      data: {
        status: 'APPROVED',
        updated_by: userId
      }
    });
  }

  async getActiveBudget(budgetId: number) {
    return this.prisma.budget.findUnique({
      where: { id: budgetId },
      include: {
        versions: {
          where: { is_active: true },
          include: {
            lines: {
              include: {
                account: true,
                account_group: true
              }
            }
          }
        }
      }
    });
  }
}

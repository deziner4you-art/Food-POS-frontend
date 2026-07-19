import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class JournalEntryLineRepository {
  constructor(private readonly prisma: PrismaService) {}
  // Handled mostly inside JournalEntry transactions
}

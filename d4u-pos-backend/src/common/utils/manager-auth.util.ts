import { ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma/prisma.service';

/**
 * Manager-PIN verification, extracted from the existing void-order pattern
 * (pos-orders.service.ts's voidOrder) so it isn't re-implemented a third time
 * for Kitchen "Manager Unlock". The caller names WHICH manager is
 * authorizing (`approved_by`, a User.id) and the PIN is re-verified here
 * server-side — never trust a client-side "is manager" flag alone.
 */
export async function verifyManagerPin(
  prisma: PrismaService,
  approved_by: number,
  manager_pin: string,
): Promise<void> {
  const manager = await prisma.user.findUnique({ where: { id: approved_by } });
  if (!manager) throw new ForbiddenException('Invalid manager');

  let isMatch: boolean;
  if (manager.hashedPin.startsWith('$2')) {
    isMatch = await bcrypt.compare(manager_pin, manager.hashedPin);
  } else {
    isMatch = manager.hashedPin === manager_pin;
  }
  if (!isMatch) throw new ForbiddenException('Invalid manager PIN');
}

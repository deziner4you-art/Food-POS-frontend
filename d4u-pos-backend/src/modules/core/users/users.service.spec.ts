import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

describe('UsersService & AuthService — Safe User Delete & Deactivation Lifecycle', () => {
  let usersService: UsersService;
  let authService: AuthService;
  let prisma: any;

  const RIDER_WITH_ORDERS = {
    id: 101,
    name: 'Tariq Rider',
    phone: '03001112223',
    hashedPin: '$2a$10$xyz',
    role_id: 4,
    store_id: 10,
    status: 'ACTIVE',
    role: { name: 'Rider' },
  };

  const UNUSED_STAFF = {
    id: 102,
    name: 'Temporary Staff',
    phone: '03009998877',
    hashedPin: '$2a$10$xyz',
    role_id: 5,
    store_id: 10,
    status: 'ACTIVE',
    role: { name: 'Staff' },
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      userAssignment: {
        count: jest.fn().mockResolvedValue(0),
      },
      refreshToken: {
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      store: { findUnique: jest.fn() },
      brand: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('token') } },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    authService = module.get<AuthService>(AuthService);
  });

  // 22. Rider with dependent order history receives HTTP 409.
  it('22. Rider with dependent order history receives HTTP 409 ConflictException on delete', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_WITH_ORDERS);

    // Simulate Prisma throwing foreign key constraint violation error (code P2003)
    const fkError: any = new Error(
      'Foreign key constraint failed on the field: `Order_rider_id_fkey (index)`',
    );
    fkError.code = 'P2003';
    prisma.user.delete.mockRejectedValue(fkError);

    await expect(usersService.deleteUser(RIDER_WITH_ORDERS.id)).rejects.toThrow(
      ConflictException,
    );
  });

  // 23. 409 message is actionable.
  it('23. 409 message is actionable (guides toward deactivate/suspend to preserve business history)', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_WITH_ORDERS);

    const fkError: any = new Error('Foreign key constraint failed');
    fkError.code = 'P2003';
    prisma.user.delete.mockRejectedValue(fkError);

    try {
      await usersService.deleteUser(RIDER_WITH_ORDERS.id);
      fail('Expected ConflictException to be thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ConflictException);
      expect(err.message).toContain('associated business history');
      expect(err.message).toContain('Deactivate or suspend');
      expect(err.message).toContain('preserve historical records');
    }
  });

  // 24. User record remains intact after failed delete.
  it('24. User record remains intact after failed delete', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_WITH_ORDERS);

    const fkError: any = new Error('Foreign key constraint failed');
    fkError.code = 'P2003';
    prisma.user.delete.mockRejectedValue(fkError);

    await expect(usersService.deleteUser(RIDER_WITH_ORDERS.id)).rejects.toThrow(
      ConflictException,
    );

    // Verify user was not modified or removed
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(RIDER_WITH_ORDERS.status).toBe('ACTIVE');
  });

  // 25. User with no blocking dependency can still be deleted if current policy permits.
  it('25. User with no blocking dependency can still be deleted', async () => {
    prisma.user.findUnique.mockResolvedValue(UNUSED_STAFF);
    prisma.user.delete.mockResolvedValue(UNUSED_STAFF);

    const result = await usersService.deleteUser(UNUSED_STAFF.id);

    expect(result).toEqual(UNUSED_STAFF);
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: UNUSED_STAFF.id } });
  });

  // 26. Deactivate still works.
  it('26. Deactivate sets user status to SUSPENDED', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_WITH_ORDERS);
    prisma.user.update.mockResolvedValue({ ...RIDER_WITH_ORDERS, status: 'SUSPENDED' });

    const result = await usersService.deactivateUser(RIDER_WITH_ORDERS.id);

    expect(result.status).toBe('SUSPENDED');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: RIDER_WITH_ORDERS.id },
      data: { status: 'SUSPENDED' },
      include: { role: true, store: true },
    });
  });

  // 27. Reactivate still works.
  it('27. Reactivate sets user status back to ACTIVE', async () => {
    const suspendedUser = { ...RIDER_WITH_ORDERS, status: 'SUSPENDED' };
    prisma.user.findUnique.mockResolvedValue(suspendedUser);
    prisma.user.update.mockResolvedValue({ ...suspendedUser, status: 'ACTIVE' });

    const result = await usersService.reactivateUser(suspendedUser.id);

    expect(result.status).toBe('ACTIVE');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: suspendedUser.id },
      data: { status: 'ACTIVE' },
      include: { role: true, store: true },
    });
  });

  // 28. SUSPENDED/TERMINATED users remain unable to log in.
  it('28. SUSPENDED/TERMINATED users remain unable to log in (rejected by AuthService)', async () => {
    const hashedPin = await bcrypt.hash('1234', 10);
    const suspendedUser = {
      ...RIDER_WITH_ORDERS,
      status: 'SUSPENDED',
      hashedPin,
    };
    prisma.user.findUnique.mockResolvedValue(suspendedUser);

    await expect(authService.login(suspendedUser.phone, '1234')).rejects.toThrow(
      new UnauthorizedException('Account is suspended or terminated.'),
    );

    const terminatedUser = {
      ...RIDER_WITH_ORDERS,
      status: 'TERMINATED',
      hashedPin,
    };
    prisma.user.findUnique.mockResolvedValue(terminatedUser);

    await expect(authService.login(terminatedUser.phone, '1234')).rejects.toThrow(
      new UnauthorizedException('Account is suspended or terminated.'),
    );
  });
});

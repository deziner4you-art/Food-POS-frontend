import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SaasPackageService {
  constructor(private prisma: PrismaService) {}

  async createPackage(data: any) {
    return this.prisma.saasPackage.create({
      data,
    });
  }

  async getAllPackages() {
    return this.prisma.saasPackage.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async getPackage(id: number) {
    const pkg = await this.prisma.saasPackage.findUnique({
      where: { id },
    });
    if (!pkg) throw new NotFoundException('Package not found');
    return pkg;
  }

  async updatePackage(id: number, data: any) {
    return this.prisma.saasPackage.update({
      where: { id },
      data,
    });
  }

  async deletePackage(id: number) {
    return this.prisma.saasPackage.delete({
      where: { id },
    });
  }
}

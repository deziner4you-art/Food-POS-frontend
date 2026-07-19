import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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
      throw new BadRequestException(`Mapping for ${dto.mapping_type} already exists for this store.`);
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
      throw new NotFoundException(`Mapping for ${type} not found.`);
    }
    return mapping;
  }
}

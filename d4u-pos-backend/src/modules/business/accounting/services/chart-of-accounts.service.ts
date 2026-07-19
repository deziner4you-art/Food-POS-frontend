import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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

    const rootGroups: any[] = [];

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

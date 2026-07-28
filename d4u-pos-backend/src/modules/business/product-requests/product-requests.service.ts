import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { join } from 'path';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CatalogService } from '../catalog/catalog.service';
import { generateThumbnail, deleteUploadedFile } from '../../../common/utils/image-upload.util';
import {
  CreateProductRequestDto,
  UpdateProductRequestDto,
} from './dto';
import {
  ApproveProductRequestDto,
  PublishProductRequestDto,
  RejectProductRequestDto,
  ReturnProductRequestDto,
  ReviewProductRequestDto,
  SubmitProductRequestDto,
} from './dto/workflow-actions.dto';

const PRODUCT_REQUESTS_DIR = join(process.cwd(), 'uploads', 'product-requests');

const EDITABLE_STATUSES = ['DRAFT'];
const REVIEWABLE_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'RECIPE_REVIEW', 'COSTING_REVIEW'];

@Injectable()
export class ProductRequestsService {
  constructor(
    private prisma: PrismaService,
    private catalogService: CatalogService,
  ) {}

  private async logAudit(product_request_id: number, action: string, user_id?: number, comments?: string) {
    await this.prisma.productRequestAuditLog.create({
      data: { product_request_id, action, user_id, comments },
    });
  }

  private async findOrThrow(id: number) {
    const request = await this.prisma.productRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException(`Product request #${id} not found`);
    return request;
  }

  async list(filters: { store_id?: number; status?: string; search?: string }) {
    return this.prisma.productRequest.findMany({
      where: {
        ...(filters.store_id ? { store_id: filters.store_id } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.search
          ? { name: { contains: filters.search, mode: 'insensitive' as const } }
          : {}),
      },
      orderBy: { id: 'desc' },
    });
  }

  async getById(id: number) {
    const request = await this.prisma.productRequest.findUnique({
      where: { id },
      include: { auditLog: { orderBy: { createdAt: 'asc' } } },
    });
    if (!request) throw new NotFoundException(`Product request #${id} not found`);
    return request;
  }

  async create(body: CreateProductRequestDto) {
    const { submit, ...data } = body;
    const request = await this.prisma.productRequest.create({
      data: { ...data, status: submit ? 'SUBMITTED' : 'DRAFT' },
    });
    await this.logAudit(request.id, 'CREATED', body.requested_by);
    if (submit) await this.logAudit(request.id, 'SUBMITTED', body.requested_by);
    return request;
  }

  async update(id: number, body: UpdateProductRequestDto) {
    const request = await this.findOrThrow(id);
    if (!EDITABLE_STATUSES.includes(request.status)) {
      throw new ConflictException(`Request #${id} can only be edited while in DRAFT (current: ${request.status})`);
    }
    return this.prisma.productRequest.update({ where: { id }, data: body });
  }

  async submit(id: number, body: SubmitProductRequestDto) {
    const request = await this.findOrThrow(id);
    if (!EDITABLE_STATUSES.includes(request.status)) {
      throw new ConflictException(`Request #${id} cannot be submitted from status ${request.status}`);
    }
    const updated = await this.prisma.productRequest.update({
      where: { id },
      data: { status: 'SUBMITTED' },
    });
    await this.logAudit(id, 'SUBMITTED', body.submitted_by);
    return updated;
  }

  async review(id: number, body: ReviewProductRequestDto) {
    const request = await this.findOrThrow(id);
    if (!REVIEWABLE_STATUSES.includes(request.status)) {
      throw new ConflictException(`Request #${id} cannot move to ${body.status} from status ${request.status}`);
    }
    const updated = await this.prisma.productRequest.update({
      where: { id },
      data: { status: body.status, hq_comments: body.comments },
    });
    await this.logAudit(id, 'REVIEWED', body.reviewed_by, body.comments);
    return updated;
  }

  /**
   * Approving a request creates the Menu Product via the existing
   * CatalogService.createProduct — reusing all existing product-creation
   * logic (categories, recipe link, store assignment) rather than
   * duplicating it. The original request row is kept for history and links
   * to the created product via created_product_id.
   */
  async approve(id: number, body: ApproveProductRequestDto) {
    const request = await this.findOrThrow(id);
    if (!REVIEWABLE_STATUSES.includes(request.status)) {
      throw new ConflictException(`Request #${id} cannot be approved from status ${request.status}`);
    }

    const product = await this.catalogService.createProduct({
      store_id: request.store_id,
      category_ids: request.category_id ? [request.category_id] : [],
      name: request.name,
      price: request.suggested_price,
      cost: body.cost ?? 0,
      margin_pct: body.margin_pct ?? 0,
      sku: request.sku ?? undefined,
      image_url: request.image_url ?? undefined,
      description: request.description ?? undefined,
      status: 'APPROVED',
      assigned_store_ids: body.target_store_ids,
      recipe_id: body.recipe_id ?? request.recipe_id ?? undefined,
      kitchen_station: request.kitchen_station ?? undefined,
    });

    const updated = await this.prisma.productRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approved_by: body.approved_by,
        approved_at: new Date(),
        hq_comments: body.comments,
        created_product_id: product.id,
      },
    });
    await this.logAudit(id, 'APPROVED', body.approved_by, body.comments);
    return updated;
  }

  async reject(id: number, body: RejectProductRequestDto) {
    const request = await this.findOrThrow(id);
    if (!REVIEWABLE_STATUSES.includes(request.status)) {
      throw new ConflictException(`Request #${id} cannot be rejected from status ${request.status}`);
    }
    const updated = await this.prisma.productRequest.update({
      where: { id },
      data: { status: 'REJECTED', hq_comments: body.comments },
    });
    await this.logAudit(id, 'REJECTED', body.rejected_by, body.comments);
    return updated;
  }

  async returnForRevision(id: number, body: ReturnProductRequestDto) {
    const request = await this.findOrThrow(id);
    if (!REVIEWABLE_STATUSES.includes(request.status)) {
      throw new ConflictException(`Request #${id} cannot be returned from status ${request.status}`);
    }
    const updated = await this.prisma.productRequest.update({
      where: { id },
      data: { status: 'DRAFT', hq_comments: body.comments },
    });
    await this.logAudit(id, 'RETURNED_FOR_REVISION', body.returned_by, body.comments);
    return updated;
  }

  /** Expands an already-approved request's product to additional branches. */
  async publish(id: number, body: PublishProductRequestDto) {
    const request = await this.findOrThrow(id);
    if (request.status !== 'APPROVED' || !request.created_product_id) {
      throw new ConflictException(`Request #${id} must be APPROVED before it can be published`);
    }

    await this.catalogService.updateProduct(request.created_product_id, {
      assigned_store_ids: body.target_store_ids,
    });

    const updated = await this.prisma.productRequest.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });
    await this.logAudit(id, 'PUBLISHED', body.published_by);
    return updated;
  }

  async setImage(id: number, file: Express.Multer.File) {
    const request = await this.findOrThrow(id);

    await deleteUploadedFile(PRODUCT_REQUESTS_DIR, request.image_url);
    await deleteUploadedFile(PRODUCT_REQUESTS_DIR, request.thumbnail_url);

    const thumbnailFilename = `thumb-${file.filename}`;
    await generateThumbnail(file.path, PRODUCT_REQUESTS_DIR, thumbnailFilename);

    return this.prisma.productRequest.update({
      where: { id },
      data: {
        image_url: `/uploads/product-requests/${file.filename}`,
        thumbnail_url: `/uploads/product-requests/${thumbnailFilename}`,
      },
    });
  }

  async removeImage(id: number) {
    const request = await this.findOrThrow(id);

    await deleteUploadedFile(PRODUCT_REQUESTS_DIR, request.image_url);
    await deleteUploadedFile(PRODUCT_REQUESTS_DIR, request.thumbnail_url);

    return this.prisma.productRequest.update({
      where: { id },
      data: { image_url: null, thumbnail_url: null },
    });
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { RequirePermissions, CurrentUser } from '../../../common/decorators';
import { assertTenantStoreAccess } from '../../../common/utils/tenant.util';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { ProductRequestsService } from './product-requests.service';
import { CreateProductRequestDto, UpdateProductRequestDto } from './dto';
import {
  ApproveProductRequestDto,
  PublishProductRequestDto,
  RejectProductRequestDto,
  ReturnProductRequestDto,
  ReviewProductRequestDto,
  SubmitProductRequestDto,
} from './dto/workflow-actions.dto';

const PRODUCT_REQUESTS_DIR = join(process.cwd(), 'uploads', 'product-requests');
const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB

@Controller('product-requests')
export class ProductRequestsController {
  constructor(
    private readonly service: ProductRequestsService,
    private readonly prisma: PrismaService,
  ) {}

  private async authorizeRequest(user: any, id: number) {
    const request = await this.service.getById(id);
    await assertTenantStoreAccess(this.prisma, user, request.store_id);
    return request;
  }

  // GET /product-requests?store_id=&status=&search=
  @RequirePermissions('product_requests.view')
  @Get()
  list(
    @CurrentUser() user: any,
    @Query('store_id') store_id?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const effectiveStoreId = store_id ? Number(store_id) : Number(user?.active_store_id);
    return assertTenantStoreAccess(this.prisma, user, effectiveStoreId).then(() => this.service.list({
      store_id: effectiveStoreId,
      status,
      search,
    }));
  }

  @RequirePermissions('product_requests.view')
  @Get(':id')
  getById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.authorizeRequest(user, Number(id));
  }

  // Chef / Branch Manager — create a Draft (or Draft+Submit in one step for the POS flow)
  @RequirePermissions('product_requests.create')
  @Post()
  async create(@CurrentUser() user: any, @Body() body: CreateProductRequestDto) {
    await assertTenantStoreAccess(this.prisma, user, body.store_id);
    console.log(`[PRODUCT REQUEST] New: ${body.name} — Store ${body.store_id}`);
    return this.service.create(body);
  }

  @RequirePermissions('product_requests.create')
  @Patch(':id')
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: UpdateProductRequestDto) {
    await this.authorizeRequest(user, Number(id));
    return this.service.update(Number(id), body);
  }

  @RequirePermissions('product_requests.submit')
  @Post(':id/submit')
  async submit(@CurrentUser() user: any, @Param('id') id: string, @Body() body: SubmitProductRequestDto) {
    await this.authorizeRequest(user, Number(id));
    console.log(`[PRODUCT REQUEST] Submit #${id}`);
    return this.service.submit(Number(id), body);
  }

  // HQ Product Manager — move through Under Review / Recipe Review / Costing Review
  @RequirePermissions('product_requests.review')
  @Patch(':id/review')
  async review(@CurrentUser() user: any, @Param('id') id: string, @Body() body: ReviewProductRequestDto) {
    await this.authorizeRequest(user, Number(id));
    console.log(`[PRODUCT REQUEST] Review #${id} -> ${body.status}`);
    return this.service.review(Number(id), body);
  }

  @RequirePermissions('product_requests.approve')
  @Post(':id/approve')
  async approve(@CurrentUser() user: any, @Param('id') id: string, @Body() body: ApproveProductRequestDto) {
    await this.authorizeRequest(user, Number(id));
    console.log(`[PRODUCT REQUEST] Approve #${id}`);
    return this.service.approve(Number(id), body);
  }

  @RequirePermissions('product_requests.reject')
  @Post(':id/reject')
  async reject(@CurrentUser() user: any, @Param('id') id: string, @Body() body: RejectProductRequestDto) {
    await this.authorizeRequest(user, Number(id));
    console.log(`[PRODUCT REQUEST] Reject #${id}`);
    return this.service.reject(Number(id), body);
  }

  @RequirePermissions('product_requests.review')
  @Post(':id/return')
  async returnForRevision(@CurrentUser() user: any, @Param('id') id: string, @Body() body: ReturnProductRequestDto) {
    await this.authorizeRequest(user, Number(id));
    console.log(`[PRODUCT REQUEST] Return for revision #${id}`);
    return this.service.returnForRevision(Number(id), body);
  }

  @RequirePermissions('product_requests.publish')
  @Post(':id/publish')
  async publish(@CurrentUser() user: any, @Param('id') id: string, @Body() body: PublishProductRequestDto) {
    await this.authorizeRequest(user, Number(id));
    console.log(`[PRODUCT REQUEST] Publish #${id}`);
    return this.service.publish(Number(id), body);
  }

  @RequirePermissions('product_requests.create')
  @Post(':id/image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          mkdirSync(PRODUCT_REQUESTS_DIR, { recursive: true });
          cb(null, PRODUCT_REQUESTS_DIR);
        },
        filename: (_req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
          cb(new BadRequestException('Unsupported file type. Only JPG, PNG, and WEBP are allowed.'), false);
          return;
        }
        cb(null, true);
      },
      limits: { fileSize: MAX_IMAGE_BYTES },
    }),
  )
  async uploadImage(@CurrentUser() user: any, @Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No image file received.');
    await this.authorizeRequest(user, Number(id));
    return this.service.setImage(Number(id), file);
  }

  @RequirePermissions('product_requests.create')
  @Delete(':id/image')
  async deleteImage(@CurrentUser() user: any, @Param('id') id: string) {
    await this.authorizeRequest(user, Number(id));
    return this.service.removeImage(Number(id));
  }
}

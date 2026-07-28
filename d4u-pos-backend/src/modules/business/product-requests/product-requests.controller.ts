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
import { validateTenantAccess } from '../../../common/utils/tenant.util';
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
  constructor(private readonly service: ProductRequestsService) {}

  // GET /product-requests?store_id=&status=&search=
  @RequirePermissions('product_requests.view')
  @Get()
  list(
    @Query('store_id') store_id?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.service.list({
      store_id: store_id ? Number(store_id) : undefined,
      status,
      search,
    });
  }

  @RequirePermissions('product_requests.view')
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(Number(id));
  }

  // Chef / Branch Manager — create a Draft (or Draft+Submit in one step for the POS flow)
  @RequirePermissions('product_requests.create')
  @Post()
  create(@CurrentUser() user: any, @Body() body: CreateProductRequestDto) {
    validateTenantAccess(user, body.store_id);
    console.log(`[PRODUCT REQUEST] New: ${body.name} — Store ${body.store_id}`);
    return this.service.create(body);
  }

  @RequirePermissions('product_requests.create')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateProductRequestDto) {
    return this.service.update(Number(id), body);
  }

  @RequirePermissions('product_requests.submit')
  @Post(':id/submit')
  submit(@Param('id') id: string, @Body() body: SubmitProductRequestDto) {
    console.log(`[PRODUCT REQUEST] Submit #${id}`);
    return this.service.submit(Number(id), body);
  }

  // HQ Product Manager — move through Under Review / Recipe Review / Costing Review
  @RequirePermissions('product_requests.review')
  @Patch(':id/review')
  review(@Param('id') id: string, @Body() body: ReviewProductRequestDto) {
    console.log(`[PRODUCT REQUEST] Review #${id} -> ${body.status}`);
    return this.service.review(Number(id), body);
  }

  @RequirePermissions('product_requests.approve')
  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() body: ApproveProductRequestDto) {
    console.log(`[PRODUCT REQUEST] Approve #${id}`);
    return this.service.approve(Number(id), body);
  }

  @RequirePermissions('product_requests.reject')
  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() body: RejectProductRequestDto) {
    console.log(`[PRODUCT REQUEST] Reject #${id}`);
    return this.service.reject(Number(id), body);
  }

  @RequirePermissions('product_requests.review')
  @Post(':id/return')
  returnForRevision(@Param('id') id: string, @Body() body: ReturnProductRequestDto) {
    console.log(`[PRODUCT REQUEST] Return for revision #${id}`);
    return this.service.returnForRevision(Number(id), body);
  }

  @RequirePermissions('product_requests.publish')
  @Post(':id/publish')
  publish(@Param('id') id: string, @Body() body: PublishProductRequestDto) {
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
  uploadImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No image file received.');
    return this.service.setImage(Number(id), file);
  }

  @RequirePermissions('product_requests.create')
  @Delete(':id/image')
  deleteImage(@Param('id') id: string) {
    return this.service.removeImage(Number(id));
  }
}

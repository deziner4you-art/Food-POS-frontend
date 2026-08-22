import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @RequirePermissions('auth.users.read')
  @Get()
  getAllUsers(
    @Query('brand_id') brand_id?: string,
    @Query('store_id') store_id?: string,
  ) {
    if (store_id) return this.usersService.getUsersByStore(Number(store_id));
    if (brand_id) return this.usersService.getUsersByBrand(Number(brand_id));
    return this.usersService.getAllUsers();
  }

  @RequirePermissions('auth.users.read')
  @Get('roles')
  getRoles() {
    return this.usersService.getRoles();
  }

  @RequirePermissions('auth.users.create')
  @Post()
  createUser(@Body() body: CreateUserDto) {
    console.log(`[NEW USER] ${body.name} → Store #${body.store_id || 'HQ'}`);
    return this.usersService.createUser(body);
  }

  @RequirePermissions('auth.users.update')
  @Patch(':id')
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
  ) {
    console.log(`[UPDATE USER] #${id}`);
    return this.usersService.updateUser(id, body);
  }

  @RequirePermissions('auth.users.delete')
  @Delete(':id')
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    console.log(`[DELETE USER] #${id}`);
    return this.usersService.deleteUser(id);
  }

  @RequirePermissions('auth.users.create')
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file: any) {
    return { url: `/uploads/${file.filename}` };
  }
}

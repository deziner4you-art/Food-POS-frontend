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

  @RequirePermissions('system.view')
  @Get()
  getAllUsers(@Query('store_id') store_id?: string) {
    if (store_id) return this.usersService.getUsersByStore(Number(store_id));
    return this.usersService.getAllUsers();
  }

  @RequirePermissions('system.view')
  @Get('roles')
  getRoles() {
    return this.usersService.getRoles();
  }

  @RequirePermissions('system.create')
  @Post()
  createUser(@Body() body: CreateUserDto) {
    console.log(`[NEW USER] ${body.name} → Store #${body.store_id || 'HQ'}`);
    return this.usersService.createUser(body);
  }

  @RequirePermissions('system.update')
  @Patch(':id')
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
  ) {
    console.log(`[UPDATE USER] #${id}`);
    return this.usersService.updateUser(id, body);
  }

  @RequirePermissions('system.delete')
  @Delete(':id')
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    console.log(`[DELETE USER] #${id}`);
    return this.usersService.deleteUser(id);
  }

  @RequirePermissions('system.create')
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

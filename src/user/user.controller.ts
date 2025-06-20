import {
  Controller,
  Get,
  Param,
  Query,
  Patch,
  Body,
  Delete,
  UseGuards,
  Req,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from 'dto/user.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'common/multer.config';
import { ImageUploadInterceptor } from 'common/upload-image.interceptor';
// import { ImageUploadInterceptor } from 'utils/upload-image.interceptor';

@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles('admin')
  @Get()
  async getUsers(@Query() query) {
    const { page, limit, search, sortBy, role, sortOrder } = query;
    return this.userService.findAll(
      'users',
      search,
      page,
      limit,
      sortBy,
      sortOrder,
      [],
      [],
      ['name'],
      { role: role },
    );
  }



  @Roles('admin')
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }



  @UseInterceptors( FileInterceptor('file', multerOptions), ImageUploadInterceptor, )
  @Patch('update-profile')
  async update(@Req() req: any, @Body() dto: UpdateUserDto , @UploadedFile() file: any ) {
    dto.avatar = req.body.image
    return this.userService.customUpdate(req.user.id, dto, req.user);
  }


  @Roles('admin')
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}

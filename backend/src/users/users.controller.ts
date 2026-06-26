import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // 🚀 Correction : Appel de findById (au lieu de findOne) avec conversion en number via '+'
    return this.usersService.findById(+id);
  }






  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  updateProfile(@Req() req: Request, @Body() updateProfileDto: any) {
    console.log("updateProfileDto", updateProfileDto);

    const userId = (req.user as any).id;
    console.log("userId", userId);

    // Clean empty strings so MySQL doesn't fail on DATE or nullable columns
    if (updateProfileDto.birthday === '') updateProfileDto.birthday = null;
    if (updateProfileDto.address === '') updateProfileDto.address = null;
    if (updateProfileDto.phoneNumber === '') updateProfileDto.phoneNumber = null;
    return this.usersService.update(userId, updateProfileDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('profile/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${(req.user as any).id}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async uploadAvatar(@Req() req: Request, @UploadedFile() file: Express.Multer.File) {
    const userId = (req.user as any).id;
    const profilePictureUrl = `/uploads/avatars/${file.filename}`;

    await this.usersService.update(userId, { profilePictureUrl });

    return { profilePictureUrl };
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    // 🚀 Conversion en number via '+' pour correspondre à la signature de la méthode update
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    // 🚀 Conversion en number via '+' pour correspondre à la signature de la méthode remove
    return this.usersService.remove(+id);
  }
}

import {
  Controller,
  Post,
  Body,
  Res,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
// 1. On sépare clairement l'import de type pour Response et Request
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginDto: any,
    // 2. On utilise le type Response d'Express ici
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.validateUser(loginDto);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken, user };
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  // 3. On applique la même correction ici pour la route de refresh
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const userId = req.user.sub;
    const currentRefreshToken = req.user.refreshToken;

    const tokens = await this.authService.refreshTokens(
      userId,
      currentRefreshToken,
    );

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken: tokens.accessToken };
  }
}

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
import { Get } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginDto: any,
    // 2. On utilise le type Response d'Express ici
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.validateUser(loginDto);

    // Set httpOnly cookies for both access and refresh tokens.
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('last_active', Date.now().toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    // We avoid returning tokens in the response body to keep them out of JS.
    return { user };
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

    // Rotate cookies: set new short-lived access token and new refresh token
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('last_active', Date.now().toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return { ok: true };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Req() req: Request) {
    // Return the user object directly without the { user: ... } wrapper
    return this.authService.getUserConnected(req);
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    // Supprime les cookies côté serveur
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.clearCookie('last_active');
    return { ok: true };
  }
}

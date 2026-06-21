import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // 🚀 CORRECTION : Ajout de la méthode attendue par le contrôleur
  async validateUser(loginDto: any) {
    console.log('🚀 ~ AuthService ~ validateUser ~ loginDto:', loginDto);
    const { email, password } = loginDto;

    // 1. Chercher l'utilisateur par son email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // 2. Vérifier si le mot de passe correspond au hash en BDD
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // 3. Générer la paire de tokens (Access + Refresh)
    const tokens = await this.generateTokens(user.id, user.email);

    // 4. Stocker le hash du refresh token pour le mécanisme de rotation sécurisé
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    // 5. Retourner les données attendues par le contrôleur
    return {
      user: { id: user.id, email: user.email },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // --- MÉTHODES DE GESTION DES TOKENS TOURNANTS ---

  async generateTokens(userId: number, email: string) {
    // Payload épuré sans propriété manquante (id + email)
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET || 'ACCESS_SECRET_KEY',
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'REFRESH_SECRET_KEY',
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async updateRefreshToken(userId: number, refreshToken: string) {
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(userId, hashedToken);
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.hashedRefreshToken) {
      throw new ForbiddenException('Accès refusé');
    }

    const matches = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
    if (!matches) {
      throw new ForbiddenException('Token invalide ou expiré');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }
}

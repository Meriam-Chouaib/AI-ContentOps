import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from '@/auth/auth.module';
import { ConfigModule } from '@nestjs/config'; // 🚀 Import

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3307,
      username: 'devuser',
      password: 'devpassword',
      database: 'contentops_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'], // Va scanner automatiquement toutes tes futures entités
      synchronize: true, // Crée et modifie les tables SQL automatiquement à la sauvegarde
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

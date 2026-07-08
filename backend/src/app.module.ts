import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from '@/auth/auth.module';
import { SessionInactivityMiddleware } from './auth/middlewares/session-inactivity.middleware';
import { ConfigModule } from '@nestjs/config'; // 🚀 Import
import { BullModule } from '@nestjs/bullmq';
import { AiModule } from './ai/ai.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';

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
    BullModule.forRoot({
      connection: {
        host: '127.0.0.1',
        port: 6379,
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SessionInactivityMiddleware).forRoutes('*');
  }
}

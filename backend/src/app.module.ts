import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';

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
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

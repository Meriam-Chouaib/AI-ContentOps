import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  // CORS hardening: restrict to your trusted frontend origin and enable credentials
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3001);

  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();

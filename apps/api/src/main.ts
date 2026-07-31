import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🔓 Habilitar CORS para permitir peticiones desde el Frontend (http://localhost:3001)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3005;
  const globalPrefix = process.env.API_PREFIX || 'api/v1';

  app.setGlobalPrefix(globalPrefix);

  await app.listen(port);
  Logger.log(
    `🚀 App backend corriendo en: http://localhost:${port}/${globalPrefix}`,
    'Bootstrap',
  );
}

bootstrap();
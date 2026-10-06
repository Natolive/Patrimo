import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Prod derrière Caddy puis le proxy Nuxt (adresses privées Docker) : `req.ip` = vraie IP du client pour les limites par IP.
  app.set('trust proxy', 'loopback, uniquelocal');
  app.enableCors({ origin: process.env.CORS_ORIGIN, credentials: true });
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();

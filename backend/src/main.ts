import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Prod derrière Caddy puis le proxy Nuxt (adresses privées Docker) : `req.ip` = vraie IP du client pour les limites par IP.
  app.set('trust proxy', 'loopback, uniquelocal');
  app.enableCors({ origin: process.env.CORS_ORIGIN, credentials: true });
  app.enableShutdownHooks();
  // WebSocket des cours en direct (`/stream`) sur le même port que l'API.
  app.useWebSocketAdapter(new WsAdapter(app));
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();

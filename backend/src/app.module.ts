import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { DatabaseModule } from './common/infrastructure/database/database.module.js';
import { DomainErrorFilter } from './common/infrastructure/http/domain-error.filter.js';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [AppController],
  providers: [{ provide: APP_FILTER, useClass: DomainErrorFilter }],
})
export class AppModule {}

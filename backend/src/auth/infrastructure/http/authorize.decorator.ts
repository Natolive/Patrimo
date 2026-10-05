import { SetMetadata } from '@nestjs/common';
import { AUTHORIZE } from './session.guard.js';

// Réserve une route aux personnes connectées : `@Authorize()`, puis `@CurrentUser() user` dans le handler.
// ponytail: pas de droits par rôle (footix les a dans shared/src/roles/permissions.ts), à ajouter s'il y a plusieurs profils.
export const Authorize = () => SetMetadata(AUTHORIZE, true);

import type { SavePurchaseDto, UserDto } from '@pea/shared';
import { CreatePurchaseService } from '@src/purchases/application/create-purchase.service.js';
import { DeletePurchaseService } from '@src/purchases/application/delete-purchase.service.js';
import { FindPurchasesService } from '@src/purchases/application/find-purchases.service.js';
import { FakeMarketData } from '@test/fakes/fake-market-data.js';
import { InMemoryPurchaseRepository } from '@test/fakes/in-memory-purchase.repository.js';

export const lea: UserDto = { id: 'lea', email: 'lea@example.com', firstName: 'Léa', lastName: 'Dupont' };
export const max: UserDto = { id: 'max', email: 'max@example.com', firstName: 'Max', lastName: 'Martin' };
export const purchase: SavePurchaseDto = { asset: 'FR0000120073', boughtAt: '2026-01-02', quantity: 10, unitPrice: 100, fees: 2 };

export function setupPurchases() {
  const purchases = new InMemoryPurchaseRepository();
  const market = new FakeMarketData();
  return {
    purchases,
    market,
    create: new CreatePurchaseService(purchases, market),
    find: new FindPurchasesService(purchases),
    delete: new DeletePurchaseService(purchases),
  };
}

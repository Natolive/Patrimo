import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { purchaseSchema, type PurchaseDto, type SavePurchaseDto, type UserDto } from '@patrimo/shared';
import { Authorize } from '../../../auth/infrastructure/http/authorize.decorator.js';
import { CurrentUser } from '../../../auth/infrastructure/http/current-user.decorator.js';
import { ZodValidationPipe } from '../../../common/infrastructure/http/pipes/zod-validation.pipe.js';
import { CreatePurchaseService } from '../../application/create-purchase.service.js';
import { DeletePurchaseService } from '../../application/delete-purchase.service.js';
import { FindPurchasesService } from '../../application/find-purchases.service.js';

@Controller('purchases')
export class PurchasesController {
  constructor(
    private readonly findPurchasesService: FindPurchasesService,
    private readonly createPurchaseService: CreatePurchaseService,
    private readonly deletePurchaseService: DeletePurchaseService,
  ) {}

  @Get()
  @Authorize()
  findAll(@CurrentUser() user: UserDto): Promise<PurchaseDto[]> {
    return this.findPurchasesService.execute(user);
  }

  @Post()
  @Authorize()
  create(@CurrentUser() user: UserDto, @Body(new ZodValidationPipe(purchaseSchema)) dto: SavePurchaseDto): Promise<PurchaseDto> {
    return this.createPurchaseService.execute(user, dto);
  }

  @Delete(':id')
  @Authorize()
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@CurrentUser() user: UserDto, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deletePurchaseService.execute(user, id);
  }
}

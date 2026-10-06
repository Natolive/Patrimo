import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { purchaseSchema, purchasesQuerySchema, type PageDto, type PurchaseDto, type PurchasesQueryDto, type SavePurchaseDto, type UserDto } from '@patrimo/shared';
import { Authorize } from '../../../auth/infrastructure/http/authorize.decorator.js';
import { CurrentUser } from '../../../auth/infrastructure/http/current-user.decorator.js';
import { ZodValidationPipe } from '../../../common/infrastructure/http/pipes/zod-validation.pipe.js';
import { CreatePurchaseService } from '../../application/create-purchase.service.js';
import { DeletePurchaseService } from '../../application/delete-purchase.service.js';
import { FindPurchasesService } from '../../application/find-purchases.service.js';
import { UpdatePurchaseService } from '../../application/update-purchase.service.js';

@Controller('purchases')
export class PurchasesController {
  constructor(
    private readonly findPurchasesService: FindPurchasesService,
    private readonly createPurchaseService: CreatePurchaseService,
    private readonly updatePurchaseService: UpdatePurchaseService,
    private readonly deletePurchaseService: DeletePurchaseService,
  ) {}

  @Get()
  @Authorize()
  findAll(@CurrentUser() user: UserDto, @Query(new ZodValidationPipe(purchasesQuerySchema)) query: PurchasesQueryDto): Promise<PageDto<PurchaseDto>> {
    return this.findPurchasesService.execute(user, query);
  }

  @Post()
  @Authorize()
  create(@CurrentUser() user: UserDto, @Body(new ZodValidationPipe(purchaseSchema)) dto: SavePurchaseDto): Promise<PurchaseDto> {
    return this.createPurchaseService.execute(user, dto);
  }

  @Put(':id')
  @Authorize()
  update(
    @CurrentUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(purchaseSchema)) dto: SavePurchaseDto,
  ): Promise<PurchaseDto> {
    return this.updatePurchaseService.execute(user, id, dto);
  }

  @Delete(':id')
  @Authorize()
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@CurrentUser() user: UserDto, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deletePurchaseService.execute(user, id);
  }
}

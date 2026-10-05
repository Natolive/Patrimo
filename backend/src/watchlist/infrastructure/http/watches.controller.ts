import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { watchSchema, type SaveWatchDto, type UserDto, type WatchDto } from '@pea/shared';
import { Authorize } from '../../../auth/infrastructure/http/authorize.decorator.js';
import { CurrentUser } from '../../../auth/infrastructure/http/current-user.decorator.js';
import { ZodValidationPipe } from '../../../common/infrastructure/http/pipes/zod-validation.pipe.js';
import { CreateWatchService } from '../../application/create-watch.service.js';
import { DeleteWatchService } from '../../application/delete-watch.service.js';
import { FindWatchesService } from '../../application/find-watches.service.js';

@Controller('watches')
export class WatchesController {
  constructor(
    private readonly findWatchesService: FindWatchesService,
    private readonly createWatchService: CreateWatchService,
    private readonly deleteWatchService: DeleteWatchService,
  ) {}

  @Get()
  @Authorize()
  findAll(@CurrentUser() user: UserDto): Promise<WatchDto[]> {
    return this.findWatchesService.execute(user);
  }

  @Post()
  @Authorize()
  create(@CurrentUser() user: UserDto, @Body(new ZodValidationPipe(watchSchema)) dto: SaveWatchDto): Promise<WatchDto> {
    return this.createWatchService.execute(user, dto);
  }

  @Delete(':id')
  @Authorize()
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@CurrentUser() user: UserDto, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deleteWatchService.execute(user, id);
  }
}

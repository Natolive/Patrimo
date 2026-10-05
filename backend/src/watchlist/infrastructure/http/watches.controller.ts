import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { updateWatchSchema, watchSchema, type SaveWatchDto, type FeedItemDto, type UpdateWatchDto, type UserDto, type WatchDto, type WatchNewsDto } from '@pea/shared';
import { Authorize } from '../../../auth/infrastructure/http/authorize.decorator.js';
import { CurrentUser } from '../../../auth/infrastructure/http/current-user.decorator.js';
import { ZodValidationPipe } from '../../../common/infrastructure/http/pipes/zod-validation.pipe.js';
import { CreateWatchService } from '../../application/create-watch.service.js';
import { DeleteWatchService } from '../../application/delete-watch.service.js';
import { FindNewsFeedService } from '../../application/find-news-feed.service.js';
import { FindWatchNewsService } from '../../application/find-watch-news.service.js';
import { FindWatchesService } from '../../application/find-watches.service.js';
import { UpdateWatchService } from '../../application/update-watch.service.js';

@Controller('watches')
export class WatchesController {
  constructor(
    private readonly findWatchesService: FindWatchesService,
    private readonly createWatchService: CreateWatchService,
    private readonly deleteWatchService: DeleteWatchService,
    private readonly updateWatchService: UpdateWatchService,
    private readonly findWatchNewsService: FindWatchNewsService,
    private readonly findNewsFeedService: FindNewsFeedService,
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

  // Avant `:id/news` : « news » n'est pas un identifiant.
  @Get('news')
  @Authorize()
  feed(@CurrentUser() user: UserDto): Promise<FeedItemDto[]> {
    return this.findNewsFeedService.execute(user);
  }

  @Get(':id/news')
  @Authorize()
  news(@CurrentUser() user: UserDto, @Param('id', ParseUUIDPipe) id: string): Promise<WatchNewsDto> {
    return this.findWatchNewsService.execute(user, id);
  }

  @Patch(':id')
  @Authorize()
  @HttpCode(HttpStatus.NO_CONTENT)
  update(
    @CurrentUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateWatchSchema)) dto: UpdateWatchDto,
  ): Promise<void> {
    return this.updateWatchService.execute(user, id, dto);
  }

  @Delete(':id')
  @Authorize()
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@CurrentUser() user: UserDto, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deleteWatchService.execute(user, id);
  }
}

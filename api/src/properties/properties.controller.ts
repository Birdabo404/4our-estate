import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import type { AuthUser } from '../auth/auth-user.js';
import { CurrentUser, Public, Roles } from '../auth/decorators.js';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard.js';
import { MAX_IMAGE_BYTES } from '../common/contracts.js';
import { ApiEnvelope, ApiErrorResponses } from '../openapi/envelope.js';
import {
  CityCount,
  FeaturedFlag,
  IdOnly,
  IdSlug,
  ListingTransitionResult,
  MarketStats,
  PropertyDetail,
  PropertyImage,
  PropertySummary,
} from '../openapi/models.dto.js';
import {
  FeaturedDto,
  ImageAltDto,
  LimitQuery,
  ListPropertiesQuery,
  PropertyContentDto,
  TransitionDto,
  UpdatePropertyDto,
} from './dto/property.dto.js';
import {
  imageFilePipe,
  ImagesService,
  type UploadedImage,
} from './images.service.js';
import { PropertiesService } from './properties.service.js';

@ApiTags('Properties')
@ApiErrorResponses()
@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly properties: PropertiesService,
    private readonly images: ImagesService,
  ) {}

  @Public()
  @ApiOperation({ summary: 'Public. List published listings.' })
  @ApiEnvelope(PropertySummary, { paginated: true })
  @Get()
  list(@Query() query: ListPropertiesQuery) {
    return this.properties.list(query);
  }

  @Public()
  @ApiOperation({ summary: 'Public. List featured published listings.' })
  @ApiEnvelope(PropertySummary, { array: true })
  @Get('featured')
  featured(@Query() query: LimitQuery) {
    return this.properties.featured(query.limit ?? 4);
  }

  @Public()
  @ApiOperation({ summary: 'Public. Count published listings by city.' })
  @ApiEnvelope(CityCount, { array: true })
  @Get('cities')
  cities() {
    return this.properties.cities();
  }

  @Public()
  @ApiOperation({
    summary: 'Public. Return published listing and sale-price stats.',
  })
  @ApiEnvelope(MarketStats)
  @Get('stats')
  stats() {
    return this.properties.stats();
  }

  @Roles('agent', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Agent or admin. Read a listing by id, including drafts.',
  })
  @ApiEnvelope(PropertyDetail)
  @Get('id/:id')
  byId(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.properties.byId(id, user);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Public. Optional bearer token. List similar published listings.',
  })
  @ApiEnvelope(PropertySummary, { array: true })
  @Get(':slug/similar')
  similar(@Param('slug') slug: string, @Query() query: LimitQuery) {
    return this.properties.similar(slug, query.limit ?? 3);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Public. Optional bearer token. Read a listing by slug.',
  })
  @ApiEnvelope(PropertyDetail)
  @Get(':slug')
  bySlug(@Param('slug') slug: string, @CurrentUser() user?: AuthUser) {
    return this.properties.bySlug(slug, user);
  }

  @Roles('agent', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agent or admin. Create a draft listing.' })
  @ApiEnvelope(IdSlug, { status: 201 })
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: PropertyContentDto) {
    return this.properties.create(user, dto);
  }

  @Roles('agent', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Agent or admin. Update listing copy. The status stays put.',
  })
  @ApiEnvelope(IdSlug)
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.properties.update(id, user, dto);
  }

  @Roles('agent', 'admin')
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Agent or admin. Move a listing to an allowed status.',
  })
  @ApiEnvelope(ListingTransitionResult)
  @Post(':id/transitions')
  transition(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: TransitionDto,
  ) {
    return this.properties.transition(id, user, dto.to);
  }

  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin only. Set whether a listing is featured.' })
  @ApiEnvelope(FeaturedFlag)
  @Patch(':id/featured')
  featuredFlag(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: FeaturedDto,
  ) {
    return this.properties.setFeatured(id, dto.featured);
  }

  @Roles('agent', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agent or admin. Upload a listing photo.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'alt'],
      properties: {
        file: { type: 'string', format: 'binary' },
        alt: { type: 'string', minLength: 3, maxLength: 300 },
      },
    },
  })
  @ApiEnvelope(PropertyImage, { status: 201 })
  @Post(':id/images')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES } }),
  )
  upload(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
    @UploadedFile(imageFilePipe) file: UploadedImage,
    @Body() body: ImageAltDto,
  ) {
    return this.images.save(id, user, file, body.alt);
  }

  @Roles('agent', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agent or admin. Delete a listing photo.' })
  @ApiEnvelope(IdOnly)
  @Delete(':id/images/:imageId')
  removeImage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('imageId', new ParseUUIDPipe()) imageId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.images.remove(id, imageId, user);
  }

  @Roles('agent', 'admin')
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Agent or admin. Make a photo the cover.' })
  @ApiEnvelope(PropertyImage)
  @Post(':id/images/:imageId/cover')
  cover(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('imageId', new ParseUUIDPipe()) imageId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.images.makeCover(id, imageId, user);
  }
}

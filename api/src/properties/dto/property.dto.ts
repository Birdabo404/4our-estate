import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

import {
  LISTING_SORTS,
  LISTING_TYPES,
  PROPERTY_TYPES,
  type ListingSort,
  type ListingType,
  type PropertyType,
} from '../../common/contracts.js';

function requiredNumber({ value }: { value: unknown }): unknown {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value.trim());
  return value;
}

function optionalNumber({ value }: { value: unknown }): unknown {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value.trim());
  return value;
}

function trim({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function readAmenities({ value }: { value: unknown }): unknown {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (typeof item !== 'string') return [];
      return item
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part.length > 0);
    });
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }
  return value;
}

function CoordinatesMatch(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'coordinatesMatch',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(_value: unknown, args: ValidationArguments) {
          const row = args.object as { latitude?: number | null; longitude?: number | null };
          const latMissing = row.latitude === undefined || row.latitude === null;
          const lngMissing = row.longitude === undefined || row.longitude === null;
          return latMissing === lngMissing;
        },
        defaultMessage() {
          return 'Enter both latitude and longitude.';
        },
      },
    });
  };
}

function PriceOrder(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'priceOrder',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(_value: unknown, args: ValidationArguments) {
          const row = args.object as { minPrice?: number; maxPrice?: number };
          if (row.minPrice === undefined || row.maxPrice === undefined) return true;
          return row.minPrice <= row.maxPrice;
        },
        defaultMessage() {
          return 'Maximum price must be at least the minimum price.';
        },
      },
    });
  };
}

export class PropertyContentDto {
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  })
  @IsOptional()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, { message: 'Use lowercase words separated by hyphens.' })
  @MaxLength(80)
  slug?: string;

  @Transform(trim)
  @IsString()
  @MinLength(4, { message: 'Enter a title.' })
  @MaxLength(140)
  title!: string;

  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Enter a description.' })
  @MaxLength(8000)
  description!: string;

  @IsIn(LISTING_TYPES)
  listingType!: ListingType;

  @IsIn(PROPERTY_TYPES)
  propertyType!: PropertyType;

  @Transform(requiredNumber)
  @IsInt()
  @Min(1)
  @Max(10_000_000_000)
  pricePhp!: number;

  @Transform(requiredNumber)
  @IsInt()
  @Min(0)
  @Max(30)
  bedrooms!: number;

  @Transform(requiredNumber)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(30)
  bathrooms!: number;

  @Transform(requiredNumber)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100_000)
  floorAreaSqm!: number;

  @Transform(optionalNumber)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(1_000_000)
  lotAreaSqm?: number | null;

  @Transform(requiredNumber)
  @IsInt()
  @Min(0)
  @Max(40)
  parkingSlots!: number;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  neighborhood!: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  city!: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  province!: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  address!: string;

  @Transform(optionalNumber)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-90)
  @Max(90)
  @CoordinatesMatch()
  latitude?: number | null;

  @Transform(optionalNumber)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-180)
  @Max(180)
  longitude?: number | null;

  @IsOptional()
  @Transform(readAmenities)
  @IsArray()
  @ArrayMaxSize(30)
  @MaxLength(40, { each: true })
  @IsString({ each: true })
  @MinLength(1, { each: true })
  amenities?: string[];

  @Transform(optionalNumber)
  @IsOptional()
  @IsInt()
  @Min(1800)
  @Max(2100)
  yearBuilt?: number | null;
}

export class UpdatePropertyDto {
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  })
  @IsOptional()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, { message: 'Use lowercase words separated by hyphens.' })
  @MaxLength(80)
  slug?: string;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(trim)
  @IsString()
  @MinLength(4, { message: 'Enter a title.' })
  @MaxLength(140)
  title?: string;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Enter a description.' })
  @MaxLength(8000)
  description?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsIn(LISTING_TYPES)
  listingType?: ListingType;

  @ValidateIf((_, value) => value !== undefined)
  @IsIn(PROPERTY_TYPES)
  propertyType?: PropertyType;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(requiredNumber)
  @IsInt()
  @Min(1)
  @Max(10_000_000_000)
  pricePhp?: number;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(requiredNumber)
  @IsInt()
  @Min(0)
  @Max(30)
  bedrooms?: number;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(requiredNumber)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(30)
  bathrooms?: number;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(requiredNumber)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100_000)
  floorAreaSqm?: number;

  @Transform(optionalNumber)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(1_000_000)
  lotAreaSqm?: number | null;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(requiredNumber)
  @IsInt()
  @Min(0)
  @Max(40)
  parkingSlots?: number;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  neighborhood?: string;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  city?: string;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  province?: string;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  address?: string;

  @Transform(optionalNumber)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-90)
  @Max(90)
  @CoordinatesMatch()
  latitude?: number | null;

  @Transform(optionalNumber)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-180)
  @Max(180)
  longitude?: number | null;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(readAmenities)
  @IsArray()
  @ArrayMaxSize(30)
  @MaxLength(40, { each: true })
  @IsString({ each: true })
  @MinLength(1, { each: true })
  amenities?: string[];

  @Transform(optionalNumber)
  @IsOptional()
  @IsInt()
  @Min(1800)
  @Max(2100)
  yearBuilt?: number | null;
}

export class ListPropertiesQuery {
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim().slice(0, 120);
    return trimmed === '' ? undefined : trimmed;
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsIn(LISTING_TYPES)
  listingType?: ListingType;

  @IsOptional()
  @IsIn(PROPERTY_TYPES)
  propertyType?: PropertyType;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @Transform(optionalNumber)
  @IsOptional()
  @IsInt()
  @Min(0)
  minPrice?: number;

  @Transform(optionalNumber)
  @IsOptional()
  @IsInt()
  @Min(0)
  @PriceOrder()
  maxPrice?: number;

  @Transform(optionalNumber)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(30)
  minBeds?: number;

  @IsOptional()
  @IsIn(LISTING_SORTS)
  sort?: ListingSort;

  @Transform(optionalNumber)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;
}

export class LimitQuery {
  @Transform(optionalNumber)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  limit?: number;
}

export class ImageAltDto {
  @Transform(trim)
  @IsString({ message: 'Describe the photo.' })
  @MinLength(3, { message: 'Describe the photo.' })
  @MaxLength(300)
  alt!: string;
}

export class TransitionDto {
  @IsIn(['draft', 'pending', 'published', 'sold', 'archived'] as const)
  to!: 'draft' | 'pending' | 'published' | 'sold' | 'archived';
}

export class FeaturedDto {
  @Transform(({ value }) => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return value;
  })
  @IsIn([true, false], { message: 'Choose whether the listing is featured.' })
  featured!: boolean;
}

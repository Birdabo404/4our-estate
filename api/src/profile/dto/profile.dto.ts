import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

import { nullablePhone } from '../../common/phone.js';

function nullableText({ value }: { value: unknown }): unknown {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export class UpdateProfileDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2, { message: 'Enter your name.' })
  @MaxLength(80)
  fullName!: string;

  @Transform(({ value }) => nullablePhone(value))
  @IsOptional()
  @Matches(/^\+63 9\d{2} \d{3} \d{4}$/, { message: 'Use +63 9XX XXX XXXX or 09XXXXXXXXX.' })
  phone?: string | null;

  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Matches(/^https?:\/\//, { message: 'Use an http or https image address.' })
  avatarUrl?: string | null;

  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  agency?: string | null;

  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  licenseNo?: string | null;

  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(800)
  bio?: string | null;
}

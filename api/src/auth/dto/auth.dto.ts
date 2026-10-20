import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';

import { SIGNUP_ROLES, type SignupRole } from '../../common/contracts.js';
import { optionalPhone } from '../../common/phone.js';
import { IsEstatePassword } from '../password.js';

function trimString({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function emptyToUndefined({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export class SignupDto {
  @IsIn(SIGNUP_ROLES, { message: 'Choose buyer or agent.' })
  role!: SignupRole;

  @Transform(trimString)
  @IsString()
  @MinLength(2, { message: 'Enter your full name.' })
  @MaxLength(80)
  fullName!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Enter a valid email.' })
  @MaxLength(160)
  email!: string;

  @IsString()
  @IsEstatePassword()
  password!: string;

  @Transform(({ value }) => optionalPhone(value))
  @IsOptional()
  @Matches(/^\+63 9\d{2} \d{3} \d{4}$/, { message: 'Use +63 9XX XXX XXXX or 09XXXXXXXXX.' })
  phone?: string;

  @Transform(emptyToUndefined)
  @ValidateIf((dto: SignupDto) => dto.role === 'agent' || dto.agency !== undefined)
  @IsString({ message: 'Enter your agency.' })
  @MinLength(1, { message: 'Enter your agency.' })
  @MaxLength(120)
  agency?: string;

  @Transform(emptyToUndefined)
  @ValidateIf((dto: SignupDto) => dto.role === 'agent' || dto.licenseNo !== undefined)
  @IsString({ message: 'Enter your license number.' })
  @MinLength(1, { message: 'Enter your license number.' })
  @MaxLength(40)
  licenseNo?: string;
}

export class LoginDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Enter a valid email.' })
  @MaxLength(160)
  email!: string;

  @IsString()
  @MinLength(1, { message: 'Enter your password.' })
  @MaxLength(72, { message: 'That password is too long.' })
  password!: string;
}

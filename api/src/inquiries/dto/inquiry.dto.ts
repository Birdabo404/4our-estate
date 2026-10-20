import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

import { INQUIRY_STATUSES, type InquiryStatus } from '../../common/contracts.js';
import { optionalPhone } from '../../common/phone.js';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function manilaToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());
}

function IsViewingDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isViewingDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value === undefined || value === null || value === '') return true;
          if (typeof value !== 'string' || !DATE.test(value)) return false;
          if (Number.isNaN(Date.parse(`${value}T00:00:00Z`))) return false;
          return value >= manilaToday();
        },
        defaultMessage(args: ValidationArguments) {
          const value = args.value;
          if (typeof value !== 'string' || !DATE.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
            return 'Use a date like 2026-11-08.';
          }
          return 'Choose a date that has not passed.';
        },
      },
    });
  };
}

export class CreateInquiryDto {
  @IsUUID('all', { message: 'Choose a listing.' })
  propertyId!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2, { message: 'Enter your name.' })
  @MaxLength(80)
  name!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Enter a valid email.' })
  @MaxLength(160)
  email!: string;

  @Transform(({ value }) => optionalPhone(value))
  @IsOptional()
  @Matches(/^\+63 9\d{2} \d{3} \d{4}$/, { message: 'Use +63 9XX XXX XXXX or 09XXXXXXXXX.' })
  phone?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(20, { message: 'Write at least 20 characters.' })
  @MaxLength(2000)
  message!: string;

  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  })
  @IsOptional()
  @IsViewingDate()
  preferredViewingDate?: string;
}

export class InquiryStatusDto {
  @IsIn(INQUIRY_STATUSES)
  status!: InquiryStatus;
}

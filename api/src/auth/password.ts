import { registerDecorator, type ValidationOptions } from 'class-validator';

export const BCRYPT_COST = 12;

export function IsEstatePassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isEstatePassword',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;
          if (value.length < 8 || value.length > 72) return false;
          return /[A-Za-z]/.test(value) && /\d/.test(value);
        },
        defaultMessage() {
          return 'Use 8 to 72 characters, including a letter and a number.';
        },
      },
    });
  };
}

import { IsIn } from 'class-validator';

import { ROLES, type Role } from '../../common/contracts.js';

export class SetRoleDto {
  @IsIn(ROLES)
  role!: Role;
}

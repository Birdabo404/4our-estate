import type { MemberViewer, Role } from '../common/contracts.js';

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  fullName: string;
  avatarUrl: string | null;
};

export function toMember(user: AuthUser): MemberViewer {
  return {
    kind: 'member',
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
  };
}

import { forbidden, notFound } from '../common/api.exception.js';
import type { AuthUser } from '../auth/auth-user.js';
import type { PrismaService } from '../prisma/prisma.service.js';

export function canManageListing(user: AuthUser, agentId: string): boolean {
  return user.role === 'admin' || user.id === agentId;
}

export async function requireManagedProperty(prisma: PrismaService, id: string, user: AuthUser) {
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) throw notFound('Listing not found.');
  if (!canManageListing(user, property.agentId)) {
    throw forbidden('You cannot edit this listing.');
  }
  return property;
}

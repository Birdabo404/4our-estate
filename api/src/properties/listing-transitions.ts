import {
  type ListingStatus,
  type Role,
} from '../common/contracts.js';

export const LISTING_TRANSITIONS = {
  draft: { pending: ['agent', 'admin'], archived: ['agent', 'admin'] },
  pending: { published: ['admin'], draft: ['agent', 'admin'] },
  published: { sold: ['agent', 'admin'], archived: ['agent', 'admin'] },
  sold: { archived: ['agent', 'admin'] },
  archived: { draft: ['agent', 'admin'] },
} as const satisfies Record<ListingStatus, Partial<Record<ListingStatus, readonly Role[]>>>;

export function canTransition(from: ListingStatus, to: ListingStatus, role: Role): boolean {
  const moves: Partial<Record<ListingStatus, readonly Role[]>> = LISTING_TRANSITIONS[from];
  const allowed = moves[to] as readonly Role[] | undefined;
  return allowed?.includes(role) ?? false;
}

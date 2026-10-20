import { join } from 'node:path';

export function uploadsDir(): string {
  return join(import.meta.dirname, '..', '..', 'uploads');
}

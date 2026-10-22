const MOBILE = /^9\d{9}$/;
const STORED = /^\+63 9\d{2} \d{3} \d{4}$/;

export function normalizePhPhone(input: string): string | null {
  const compact = input.replace(/[\s()-]/g, '');
  let national = '';
  if (compact.startsWith('+63')) national = compact.slice(3);
  else if (compact.startsWith('63') && compact.length === 12) national = compact.slice(2);
  else if (compact.startsWith('0')) national = compact.slice(1);
  else return null;
  if (!MOBILE.test(national)) return null;
  return `+63 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
}

export function isStoredPhPhone(value: string): boolean {
  return STORED.test(value);
}

export function optionalPhone(value: unknown): unknown {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  return normalizePhPhone(trimmed) ?? trimmed;
}

export function nullablePhone(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  return normalizePhPhone(trimmed) ?? trimmed;
}

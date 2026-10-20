import "server-only";

export function failQuery(label: string, message: string): never {
  console.error(`${label}: ${message}`);
  throw new Error(`Could not load ${label}.`);
}

import { normalizePhPhone } from '../common/phone.js';
import { percentileCont } from './median.js';
import { slugify } from './slug.js';
import { canTransition } from './listing-transitions.js';

describe('phone', () => {
  it('stores a local mobile as +63 9XX XXX XXXX', () => {
    expect(normalizePhPhone('0917 123 4567')).toBe('+63 917 123 4567');
    expect(normalizePhPhone('+63 917 123 4567')).toBe('+63 917 123 4567');
    expect(normalizePhPhone('639171234567')).toBe('+63 917 123 4567');
    expect(normalizePhPhone('123')).toBeNull();
  });
});

describe('slugify', () => {
  it('keeps lowercase words and drops accents', () => {
    expect(slugify('Acacia House')).toBe('acacia-house');
    expect(slugify('Niño Villa')).toBe('nino-villa');
    expect(slugify('***')).toBe('listing');
  });
});

describe('percentileCont', () => {
  it('interpolates the middle the way percentile_cont does', () => {
    expect(percentileCont([1, 2, 3, 4], 0.5)).toBe(2.5);
    expect(percentileCont([1, 2, 3], 0.5)).toBe(2);
    expect(percentileCont([], 0.5)).toBe(0);
  });
});

describe('listing transitions', () => {
  it('lets an admin publish and stops everyone from jumping draft to sold', () => {
    expect(canTransition('pending', 'published', 'admin')).toBe(true);
    expect(canTransition('pending', 'published', 'agent')).toBe(false);
    expect(canTransition('draft', 'sold', 'admin')).toBe(false);
    expect(canTransition('draft', 'sold', 'agent')).toBe(false);
    expect(canTransition('draft', 'pending', 'agent')).toBe(true);
  });
});

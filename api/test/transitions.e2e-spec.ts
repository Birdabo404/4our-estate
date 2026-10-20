import { LISTING_TRANSITIONS as frontend } from '../../src/lib/domain/types';
import { LISTING_TRANSITIONS as api } from '../src/properties/listing-transitions.js';

describe('listing transitions', () => {
  it('matches the frontend LISTING_TRANSITIONS table', () => {
    expect(api).toEqual(frontend);
  });
});

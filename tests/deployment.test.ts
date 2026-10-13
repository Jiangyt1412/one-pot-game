import { describe, it, expect } from 'vitest';
import { assetUrl } from '../src/config/assetUrl';
// # Exercise root development and repository deployment addresses that formerly broke food loading.
describe('deployment asset addresses', () => {
  it('keeps root assets reachable', () => { expect(assetUrl('assets/items/shrimp.webp', '/')).toBe('/assets/items/shrimp.webp'); });
  it('keeps food and worker inside the project', () => { expect(assetUrl('/assets/items/shrimp.webp', '/one-pot-game/')).toBe('/one-pot-game/assets/items/shrimp.webp'); expect(assetUrl('sw.js', '/one-pot-game/')).toBe('/one-pot-game/sw.js'); });
  it('normalizes a missing trailing slash', () => { expect(assetUrl('assets/icon.svg', '/one-pot-game')).toBe('/one-pot-game/assets/icon.svg'); });
});

/**
 * Elliot simulator — brand registry.
 * Each brand maps to a MongoDB ObjectId used as `currentBrandId` header.
 */

export interface ElliotBrand {
  id: string;
  name: string;
}

export const ELLIOT_BRANDS: ElliotBrand[] = [
  { id: '607fe6f7879db1c48df247b4', name: 'Testbusters' },
  { id: '60acfd593ad3392d9e5a164d', name: 'Peer4Med' },
  { id: '6839a7df6aec09e10f636e60', name: 'TopSquad' },
];

export function getBrandById(id: string): ElliotBrand | undefined {
  return ELLIOT_BRANDS.find((b) => b.id === id);
}

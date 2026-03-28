// src/hooks/useFormSeed.js
//
// Centralizes the pattern of seeding form state from fetched API data.
// Replaces the repeated useEffect blocks in each tab component.
//
// Usage:
//   useFormSeed(data, update, [
//     { key: 'productCategoryCode' },
//     { key: 'active', transform: v => v === 'Y' },
//     { key: 'displayOrder', transform: v => v ?? null },
//   ]);
//
// Fields:
//   key       — the key in both `data` and `form` to seed (required)
//   transform — optional function to convert the raw API value before calling update()
//               defaults to: String(value ?? '') for string fields
//               use transform: v => v === 'Y' for boolean Y/N fields
//               use transform: v => v ?? null for nullable numeric fields

import { useEffect } from 'react';

/**
 * @param {object|null} data       - The fetched API row (from useModalCachedFetch)
 * @param {function}    update     - The form update function: (key, value) => void
 * @param {Array}       fields     - Array of { key, transform? } descriptors
 */
/* Commented out 3/28/26 for the below
export function useFormSeed(data, update, fields) {
  useEffect(() => {
    if (!data) return;
    fields.forEach(({ key, transform }) => {
      update(key, transform ? transform(data[key]) : (data[key] ?? ''));
    });
  }, [data]);
}
*/
/* Added 3/28/26*/
export function useFormSeed(data, update, fields) {
  useEffect(() => {
    if (!data) return;
    fields.forEach(({ key, transform }) => {
      const raw = data[key];
      const value = transform ? transform(raw) : String(raw ?? '');
      update(key, value);
    });
  }, [data]);
}

// Convenience transform helpers — import alongside useFormSeed as needed
export const asString  = v => String(v ?? '');
export const asBoolean = v => v === 'Y';
export const asNumber  = v => v ?? null;
/* End of Added 3/28/26*/

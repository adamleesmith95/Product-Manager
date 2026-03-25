// hooks/useFormSeed.js
import { useEffect } from 'react';

export function useFormSeed(data, update, fields) {
  useEffect(() => {
    if (!data) return;
    fields.forEach(({ key, transform }) => {
      update(key, transform ? transform(data[key]) : (data[key] ?? ''));
    });
  }, [data]);
}
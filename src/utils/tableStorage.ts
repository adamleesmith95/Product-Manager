export const getTableWidthsStorageKey = (storageKey: string) =>
  `table-widths:${storageKey}`;

export function resetTableColumns(storageKey: string) {
  try {
    // current sizing hook key
    localStorage.removeItem(`colw:${storageKey}`);
    // legacy key (keep for compatibility)
    localStorage.removeItem(`table-widths:${storageKey}`);
  } catch {
    // no-op
  }
}
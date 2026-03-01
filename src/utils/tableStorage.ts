export const getTableWidthsStorageKey = (storageKey: string) =>
  `table-widths:${storageKey}`;

export const resetTableColumns = (storageKey: string) => {
  localStorage.removeItem(getTableWidthsStorageKey(storageKey));
};
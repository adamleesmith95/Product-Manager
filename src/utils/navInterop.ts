export type NavPayload = {
  focusGroupCode?: string;
  focusCategoryCode?: string;
  openGroupCode?: string;
  openCategoryCode?: string;
  description?: string;
  navTs: number;
};

export function normalizeCode(row: any, keys: string[]): string {
  for (const k of keys) {
    const v = String(row?.[k] ?? '').trim();
    if (v) return v;
  }
  return '';
}

export function normalizeDescription(row: any): string {
  return String(row?.label ?? row?.description ?? row?.name ?? '').trim();
}

export function withNavTs<T extends object>(payload: T): T & { navTs: number } {
  return { ...payload, navTs: Date.now() };
}
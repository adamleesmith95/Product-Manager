// src/utils/dates.ts
/** Return a YYYY-MM-DD value suitable for <input type="date"> or '' if invalid/empty */
export function toDateInput(v: string | Date | null | undefined): string {
  if (!v) return '';
  if (v instanceof Date && !isNaN(v.getTime())) {
    return v.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  // Already ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // US style: M/D/YYYY or MM/DD/YYYY -> convert to ISO
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const [, m, d, y] = mdy;
    const mm = m.padStart(2, '0');
    const dd = d.padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }

  // Fallback: try Date.parse
  const t = Date.parse(s);
  return isNaN(t) ? '' : new Date(t).toISOString().slice(0, 10);
}

/** Parse a date input value back to an ISO date string, or '' when empty */
export function fromDateInput(inputValue: string): string {
  const s = (inputValue || '').trim();
  if (!s) return '';
  // HTML date inputs always return YYYY-MM-DD
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : toDateInput(s);
}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useModalCachedFetch } from '../../../hooks/useModalCachedFetch';
import { useModalSession } from '../../../context/ModalSessionContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function SaleLocationsTab({ productPhc, onLocationsChanged }) {

const { tabForms, setTabForm, getDataCache } = useModalSession();
const sessionKey = `saleLocations:${productPhc ?? ''}`;

  const { data, loading, error } = useModalCachedFetch(
    `sale-locations-${productPhc}`,
    async () => {
      const res = await fetch(`${API_BASE}/api/products/${productPhc}/sale-locations`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    !!productPhc
  );

  const locations  = useMemo(() => {
  const raw = data?.locations ?? [];
  return [...raw].sort((a, b) => {
    const aOrder = a.display_order ?? Infinity;
    const bOrder = b.display_order ?? Infinity;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (a.location_desc ?? '').localeCompare(b.location_desc ?? '');
  });
  }, [data]);
  const currencies = data?.currencies ?? [];

  const [checked, setChecked] = useState(() => {
  const saved = tabForms[sessionKey]?.checked;
  if (saved) return new Set(saved);

  // If data is already cached, init synchronously to skip the null→effect→set cycle
  const cachedData = getDataCache(`sale-locations-${productPhc}`);
  if (cachedData?.locations) {
    return new Set(
      cachedData.locations
        .filter(l => l.assigned)
        .map(l => String(l.location_code))
    );
  }

  return null;
});
  
// Initialize from session if it exists, otherwise ''
const [currencyFilter, setCurrencyFilter] = useState(() => tabForms[sessionKey]?.currencyFilter ?? null);
useEffect(() => {
  if (checked !== null) {
    setTabForm(sessionKey, { ...(tabForms[sessionKey] ?? {}), checked: [...checked] });
  }
}, [checked, sessionKey]);

useEffect(() => {
  if (currencyFilter === null && data?.phcCurrency !== undefined) {
    setCurrencyFilter(data.phcCurrency ?? '');
  }
}, [data?.phcCurrency, currencyFilter]);

useEffect(() => {
  if (currencyFilter !== null) {
    setTabForm(sessionKey, { ...(tabForms[sessionKey] ?? {}), currencyFilter });
  }
}, [currencyFilter, sessionKey]);
  const [pendingRemove, setPendingRemove]   = useState(null);

  const checkboxRefs      = useRef([]);   // indexed by filteredLocations position
  const confirmBtnRef     = useRef(null);
  const lastFocusIdx      = useRef(0);    // row index that triggered the banner

  useEffect(() => {
  if (checked !== null) return;
  if (!locations.length) return;
  setChecked(new Set(
    locations.filter(l => l.assigned).map(l => String(l.location_code))
  ));
}, [locations, checked]);

  // Auto-focus Continue when the banner appears
  useEffect(() => {
    if (pendingRemove) confirmBtnRef.current?.focus();
  }, [pendingRemove]);

  const filteredLocations = useMemo(() => {
    if (!currencyFilter) return locations;
    return locations.filter(l => String(l.currency_code) === currencyFilter);
  }, [locations, currencyFilter]);

  const assignedCodes = useMemo(
    () => new Set(locations.filter(l => l.assigned).map(l => String(l.location_code))),
    [locations]
  );
  const effectiveChecked = checked ?? new Set();
  const addedLocations   = useMemo(() => [...effectiveChecked].filter(c => !assignedCodes.has(c)), [checked, assignedCodes]);
  const removedLocations = useMemo(() => [...assignedCodes].filter(c => !effectiveChecked.has(c)), [checked, assignedCodes]);
  const hasChanges   = addedLocations.length > 0 || removedLocations.length > 0;
  const checkedCount = effectiveChecked.size;

  function focusItem(idx) {
    const clamped = Math.max(0, Math.min(idx, filteredLocations.length - 1));
    lastFocusIdx.current = clamped;
    const el = checkboxRefs.current[clamped];
    if (el) { el.focus(); el.scrollIntoView({ block: 'nearest' }); }
  }

  function handleItemKeyDown(e, idx) {
    if (e.key === 'ArrowDown') { e.preventDefault(); focusItem(idx + 1); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); focusItem(idx - 1); }
  }

  function handleToggle(locationCode, idx) {
    const code = String(locationCode);
    if (effectiveChecked.has(code)) {
      lastFocusIdx.current = idx;
      setPendingRemove(code);
    } else {
      setChecked(prev => new Set(prev).add(code));
      onLocationsChanged?.();
    }
  }

  function confirmRemove() {
    const idx = lastFocusIdx.current;
    setChecked(prev => { const next = new Set(prev); next.delete(pendingRemove); return next; });
    setPendingRemove(null);
    onLocationsChanged?.();
    setTimeout(() => focusItem(idx), 0);
  }

  function cancelRemove() {
    const idx = lastFocusIdx.current;
    setPendingRemove(null);
    setTimeout(() => focusItem(idx), 0);
  }

  if (!productPhc) {
    return <div className="text-sm text-neutral-500 p-2">No product selected.</div>;
  }

  return (
    <div className="flex gap-4 h-full min-h-0">

      {/* ── Left: currency filter ── */}
      <div className="w-44 shrink-0 flex flex-col gap-3">
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Currency</label>
          <select
            value={currencyFilter ?? ''}
            onChange={e => setCurrencyFilter(e.target.value)}
            className="w-full h-8 px-2 text-sm border rounded"
          >
            <option value="">All Currencies</option>
            {currencies.map(c => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>
        {hasChanges && (
          <div className="text-xs text-neutral-500 space-y-1">
            {addedLocations.length > 0 && (
              <div className="text-green-700">+{addedLocations.length} to add</div>
            )}
            {removedLocations.length > 0 && (
              <div className="text-red-600">−{removedLocations.length} to remove</div>
            )}
          </div>
        )}
      </div>

      {/* ── Right: location checklist ── */}
      <div className="flex-1 min-h-0 flex flex-col border rounded overflow-hidden">

        <div className="px-3 py-2 bg-gray-50 border-b shrink-0 flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-600">Sale Locations</span>
          <span className="text-xs text-neutral-400">
            {checkedCount} selected
            {filteredLocations.length !== locations.length && ` (${filteredLocations.length} shown)`}
          </span>
        </div>

        {/* Inline confirmation banner */}
        {pendingRemove && (
          <div
            className="px-3 py-2 bg-amber-50 border-b border-amber-200 shrink-0"
            onKeyDown={e => { if (e.key === 'Escape') cancelRemove(); }}
          >
            <p className="text-xs text-amber-800 font-medium">
              Deselecting a Sale Location will remove all existing Product Price information for the Location!
            </p>
            <div className="flex gap-2 mt-1.5">
              <button
                ref={confirmBtnRef}
                onClick={confirmRemove}
                className="px-2 py-0.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                Continue
              </button>
              <button
                onClick={cancelRemove}
                className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-400" />
            </div>
          )}
          {error && (
            <div className="text-xs text-red-600 p-3">Failed to load sale locations.</div>
          )}
          {!loading && !error && filteredLocations.length === 0 && (
            <div className="text-xs text-neutral-500 p-3">No sale locations found.</div>
          )}

          {filteredLocations.map((loc, idx) => {
            const code        = String(loc.location_code);
            const isChecked = effectiveChecked.has(code);
            const wasAssigned = assignedCodes.has(code);
            const isNew       = isChecked && !wasAssigned;
            const isRemoved   = !isChecked && wasAssigned;
            const isPending   = pendingRemove === code;

            return (
              <label
                key={code}
                className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer select-none border-b border-gray-100 last:border-b-0 ${
                  isPending ? 'bg-amber-50' : 'hover:bg-gray-50'
                }`}
              >
                <input
                  ref={el => { checkboxRefs.current[idx] = el; }}
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggle(code, idx)}
                  onKeyDown={e => handleItemKeyDown(e, idx)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
                />
                <span className={`text-sm flex-1 ${isRemoved ? 'line-through text-neutral-400' : ''} ${isPending ? 'text-amber-800' : ''}`}>
                  {loc.location_desc}
                  <span className="ml-1.5 text-xs text-neutral-400">({code})</span>
                </span>
                {isNew && <span className="text-xs text-green-600 font-medium shrink-0">New</span>}
                {isPending && <span className="text-xs text-amber-600 font-medium shrink-0">Confirm above ↑</span>}
              </label>
            );
          })}
        </div>
      </div>

    </div>
  );
}
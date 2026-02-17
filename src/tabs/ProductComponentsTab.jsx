
import React, { useEffect, useMemo, useState } from 'react';
import Button from '../components/Button'; // If you prefer, replace with plain <button> (see inline notes)

// -------------------------------------------------------------
// ProductComponentsTab
// - Left: Available (Group -> Category -> Component)
// - Middle: Add/Remove
// - Right: Assigned (for current PHC)
// - Selection: single by default; CTRL/CMD & SHIFT enable multi-select
// - Right-click on Assigned: "Modify..." context menu (stubbed)
// -------------------------------------------------------------

export default function ProductComponentsTab({ productPhc, onComponentsChanged }) {
  const [tree, setTree] = useState([]);
  const [assigned, setAssigned] = useState([]);

  // expand/collapse state for groups/categories
  const [expanded, setExpanded] = useState(new Set());

  // selection state (indexes, not codes)
  const [availSelection, setAvailSelection] = useState([]);   // indexes into visibleComponents
  const [assignSelection, setAssignSelection] = useState([]); // indexes into assigned array

  // selection anchor for SHIFT ranges
  const [availAnchor, setAvailAnchor] = useState(null);
  const [assignAnchor, setAssignAnchor] = useState(null);

  // simple context menu for right-click on Assigned
  const [menu, setMenu] = useState({ open: false, x: 0, y: 0 });

  // -------------------- Data loading --------------------

  // Available components (hierarchical)
  useEffect(() => {
    fetch('/api/components/tree')
      .then(r => r.json())
      .then(setTree)
      .catch(err => console.error('[PC Tab] tree load failed', err));
  }, []);

  // Assigned components (for this PHC)
  useEffect(() => {
    if (!productPhc) {
      console.warn('[PC Tab] no productPhc; skipping assigned fetch');
      return;
    }
    const url = `/api/products/${encodeURIComponent(productPhc)}/components`;
    fetch(url)
      .then(r => r.json())
      .then(data => setAssigned(Array.isArray(data) ? data : (data?.rows ?? [])))
      .catch(err => console.error('[PC Tab] assigned load failed', err));
  }, [productPhc]);

  // Lookup of already-assigned component codes
  const assignedLookup = useMemo(
    () => new Set(assigned.map(a => a.component_code)),
    [assigned]
  );

  // Build a flat list of *visible* components (leaves only) based on expansion
  // Also build a map for O(1) code->visibleIndex
  const { visibleComponents, indexByCode } = useMemo(() => {
    const vis = [];
    const map = new Map();
    for (const g of tree) {
      const gOpen = expanded.has(g.groupCode);
      // We include only leaves (components) in this flat list.
      if (!gOpen) continue;
      for (const c of g.categories) {
        const cOpen = expanded.has(c.categoryCode);
        if (!cOpen) continue;
        for (const comp of c.components) {
          map.set(comp.code, vis.length);
          vis.push({ code: comp.code, label: comp.label });
        }
      }
    }
    return { visibleComponents: vis, indexByCode: map };
  }, [tree, expanded]);

  // -------------------- Expand/Collapse --------------------

  function toggleExpand(key) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // -------------------- Selection helpers --------------------

  function updateSelection(current, clickedIndex, e, anchorIndex) {
    const { metaKey, ctrlKey, shiftKey } = e;
    const isCtrl = ctrlKey || metaKey;

    if (shiftKey && anchorIndex != null) {
      const [a, b] = [anchorIndex, clickedIndex].sort((x, y) => x - y);
      const range = Array.from({ length: b - a + 1 }, (_, i) => a + i);
      return { next: range, anchor: anchorIndex };
    }

    if (isCtrl) {
      const set = new Set(current);
      if (set.has(clickedIndex)) set.delete(clickedIndex);
      else set.add(clickedIndex);
      const arr = Array.from(set).sort((x, y) => x - y);
      return { next: arr, anchor: anchorIndex ?? clickedIndex };
    }

    // Plain click => single-select
    return { next: [clickedIndex], anchor: clickedIndex };
  }

  // Available item click (component only)
  function handleAvailableClick(visibleIndex, e) {
    const { next, anchor } = updateSelection(availSelection, visibleIndex, e, availAnchor);
    setAvailSelection(next);
    setAvailAnchor(anchor);
    // Close context menu if open
    if (menu.open) setMenu(m => ({ ...m, open: false }));
  }

  // Assigned item click
  function handleAssignedClick(rowIndex, e) {
    const { next, anchor } = updateSelection(assignSelection, rowIndex, e, assignAnchor);
    setAssignSelection(next);
    setAssignAnchor(anchor);
    // Close context menu if open
    if (menu.open) setMenu(m => ({ ...m, open: false }));
  }

  // -------------------- Actions --------------------

  function addSelected() {
    if (availSelection.length === 0) return;

    // translate selected visible indexes -> codes
    const selectedCodes = availSelection
      .map(i => visibleComponents[i])
      .filter(Boolean)
      .map(x => x.code)
      .filter(code => !assignedLookup.has(code));

    if (!selectedCodes.length) return;

    setAssigned(prev => [
      ...prev,
      ...selectedCodes.map(code => ({
        component_code: code,
        component_desc:
          visibleComponents[indexByCode.get(code)]?.label || code,
      })),
    ]);

    // clear selection
    setAvailSelection([]);
    setAvailAnchor(null);
    onComponentsChanged?.();
  }

  function removeSelected() {
    if (assignSelection.length === 0) return;

    const toRemove = new Set(assignSelection);
    setAssigned(prev => prev.filter((_, idx) => !toRemove.has(idx)));

    // clear selection
    setAssignSelection([]);
    setAssignAnchor(null);
    onComponentsChanged?.();
  }

  // -------------------- Context menu (Assigned) --------------------

  useEffect(() => {
    function onDocClick() {
      setMenu(m => (m.open ? { ...m, open: false } : m));
    }
    function onEsc(e) {
      if (e.key === 'Escape') setMenu(m => (m.open ? { ...m, open: false } : m));
    }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  function openContextMenuForAssigned(e, index) {
    e.preventDefault();

    // If right-clicked row is not in selection, make it the active single selection
    if (!assignSelection.includes(index)) {
      setAssignSelection([index]);
      setAssignAnchor(index);
    }

    setMenu({ open: true, x: e.clientX, y: e.clientY });
  }

  function openModifyForAssignedSelection() {
    setMenu(m => ({ ...m, open: false }));
    if (assignSelection.length === 0) return;

    const targets = assignSelection.map(i => assigned[i]);
    // TODO: Replace with your real Product Component Management modal
    // Hook into your Modal context here if desired.
    alert(`Modify… for ${targets.length} component(s).\n\n${targets
      .map(t => `${t.component_desc} (${t.component_code})`)
      .join('\n')}`);
  }

  // -------------------- Render --------------------

  return (
    <div className="relative">
      {/* Context menu */}
      {menu.open && (
        <div
          className="fixed z-50 bg-white border-white rounded shadow-md text-sm"
          style={{ left: menu.x, top: menu.y }}
        >
          <button
            className="block w-full text-left px-3 py-2 hover:bg-blue-50"
            onClick={openModifyForAssignedSelection}
          >
            Modify
          </button>
        </div>
      )}

      <div className="grid grid-cols-[1fr_auto_1fr] gap-6 h-560px">
        {/* LEFT: AVAILABLE */}
        <div className="border rounded p-3 overflow-auto">
          <h3 className="font-semibold mb-2">Product Groups</h3>

          {tree.map(group => (
            <div key={group.groupCode}>
              <TreeHeader
                label={group.label}
                expanded={expanded.has(group.groupCode)}
                onClick={() => toggleExpand(group.groupCode)}
              />

              {expanded.has(group.groupCode) && group.categories.map(cat => (
                <div key={cat.categoryCode} className="ml-4">
                  <TreeHeader
                    label={cat.label}
                    expanded={expanded.has(cat.categoryCode)}
                    onClick={() => toggleExpand(cat.categoryCode)}
                  />

                  {expanded.has(cat.categoryCode) && cat.components.map(comp => {
                    const visIndex = indexByCode.get(comp.code);
                    const selected = visIndex != null && availSelection.includes(visIndex);
                    const disabled = assignedLookup.has(comp.code);
                    return (
                      <div
                        key={comp.code}
                        className={
                          'ml-4 cursor-pointer px-2 py-1 rounded ' +
                          (selected ? 'bg-blue-100 ' : '') +
                          (disabled ? 'opacity-40 ' : '')
                        }
                        title={disabled
                          ? 'Already assigned'
                          : 'Click to select. Use CTRL/CMD for multi-select toggle or SHIFT for ranges.'}
                        onClick={e => !disabled && handleAvailableClick(visIndex, e)}
                      >
                        {comp.label}{' '}
                        <span className="text-xs text-neutral-500">({comp.code})</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* MIDDLE BUTTONS */}
        <div className="flex flex-col justify-center gap-4">
          {/* If you prefer plain buttons, replace with:
              <button className="px-3 py-1.5 rounded border bg-blue-600 text-white hover:bg-blue-700" onClick={addSelected}>&gt;</button>
              <button className="px-3 py-1.5 rounded border bg-white text-blue-700 hover:bg-blue-50" onClick={removeSelected}>&lt;</button>
           */}
          <button className="px-3 py-1.5 rounded border bg-gray-50 text-gray-700 hover:bg-neutral-200" onClick={addSelected}>&gt;</button>
          <button className="px-3 py-1.5 rounded border bg-gray-50 text-gray-700 hover:bg-neutral-200" onClick={removeSelected}>&lt;</button>
        </div>

        {/* RIGHT: ASSIGNED */}
        <div className="border rounded p-3 overflow-auto">
          <h3 className="font-semibold mb-2">Assigned Products</h3>

          {assigned.length === 0 ? (
            <div className="text-xs text-neutral-500">No assigned products.</div>
          ) : (
            assigned.map((a, i) => {
              const selected = assignSelection.includes(i);
              return (
                <div
                  key={a.component_code}
                  className={`cursor-pointer px-2 py-1 rounded ${selected ? 'bg-blue-100' : ''}`}
                  title="Click to select. Use CTRL/CMD for multi-select toggle or SHIFT for ranges. Right‑click for actions."
                  onClick={e => handleAssignedClick(i, e)}
                  onContextMenu={e => openContextMenuForAssigned(e, i)}
                >
                  {a.component_desc}
                  <span className="ml-2 text-xs text-neutral-500">({a.component_code})</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// Small header row with disclosure triangle
function TreeHeader({ label, expanded, onClick }) {
  return (
    <div
      className="flex items-center gap-1 cursor-pointer font-medium select-none mb-1"
      onClick={onClick}
    >
      <span className="w-4">{expanded ? '▾' : '▸'}</span>
      <span className="text-neutral-800">{label}</span>
    </div>
  );
}

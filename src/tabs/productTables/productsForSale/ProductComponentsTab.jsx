import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import DualPane from '../../../components/shared/DualPane';
import { useModalCachedFetch } from '../../../hooks/useModalCachedFetch';
import { useModalSession } from '../../../context/ModalSessionContext';
import RowContextMenu from '../../../components/shared/RowContextMenu';
import { newTabLabel } from '../../../components/shared/contextMenuNavActions';
import PaneSearchBar from '../../../components/shared/PaneSearchBar';

// -------------------------------------------------------------
// ProductComponentsTab
// - Left: Available (Group -> Category -> Component)
// - Middle: Add/Remove
// - Right: Assigned (for current PHC)
// - Selection: single by default; CTRL/CMD & SHIFT enable multi-select
// - Right-click on Assigned: "Modify..." context menu (stubbed)
// -------------------------------------------------------------

function normalizeAssigned(payload) {
  if (!payload) return [];
  const arr = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.rows)
    ? payload.rows
    : Array.isArray(payload.assigned)
    ? payload.assigned
    : Array.isArray(payload.data)
    ? payload.data
    : [];

  return arr.map((x) => ({
    component_code: x.component_code ?? x.componentCode ?? x.code,
    component_desc: x.component_desc ?? x.componentDesc ?? x.description ?? x.code,
    ...x,
  }));
}

export default function ProductComponentsTab({ productPhc, onComponentsChanged }) {
  const { tabForms, setTabForm } = useModalSession();

  const sessionKey = `productComponents:${productPhc ?? ''}`;

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  const { data: componentData, loading } = useModalCachedFetch(
    `product-components-${productPhc}`,
    async () => {
      const res = await fetch(`${API_BASE}/api/products/${productPhc}/components`);
      if (!res.ok) throw new Error(`Failed to load components (${res.status})`);
      return res.json();
    },
    !!productPhc
  );

  const { data: treeData, loading: treeLoading } = useModalCachedFetch(
    'components-tree',
    async () => {
      const res = await fetch(`${API_BASE}/api/components/tree`);
      if (!res.ok) throw new Error(`Failed to load tree (${res.status})`);
      return res.json();
    },
    true
  );

  const tree = Array.isArray(treeData) ? treeData : (treeData?.tree ?? []);

  const [assigned, setAssigned] = useState([]);
  const didInitRef = useRef(false);

  // reset only when product changes
  useEffect(() => {
    didInitRef.current = false;
    setAssigned(tabForms[sessionKey]?.assigned ?? []);
  }, [sessionKey]);

  // initialize once when data is ready (BEFORE paint)
  useLayoutEffect(() => {
    if (didInitRef.current) return;
    if (loading) return;

    const cached = tabForms[sessionKey]?.assigned ?? [];
    const fromApi = normalizeAssigned(componentData);
    const seed = cached.length ? cached : fromApi;

    setAssigned(seed);
    didInitRef.current = true;
  }, [loading, componentData, sessionKey, tabForms]);

  // persist only after initialization
  useEffect(() => {
    if (!didInitRef.current) return;
    setTabForm(sessionKey, { assigned });
  }, [assigned, sessionKey, setTabForm]);

  const hydratedRef = useRef(false);

  // Reset hydration when opening a different product
  useEffect(() => {
    hydratedRef.current = false;
    setAssigned(tabForms[sessionKey]?.assigned ?? []);
  }, [sessionKey]);

  const updateAssigned = (nextOrUpdater) => {
    setAssigned((prev) =>
      typeof nextOrUpdater === 'function' ? nextOrUpdater(prev) : nextOrUpdater
    );
  };

  // hydrate once from API (do not overwrite user edits on later renders)
  useEffect(() => {
    if (hydratedRef.current) return;
    const fromApi = normalizeAssigned(componentData);
    if (fromApi.length > 0) {
      updateAssigned(fromApi);
    }
    hydratedRef.current = true;
  }, [componentData]);

  // expand/collapse state for groups/categories
  const [expanded, setExpanded] = useState(new Set());

  // selection state (indexes, not codes)
  const [availSelection, setAvailSelection] = useState([]);
  const [assignSelection, setAssignSelection] = useState([]);

  // selection anchor for SHIFT ranges
  const [availAnchor, setAvailAnchor] = useState(null);
  const [assignAnchor, setAssignAnchor] = useState(null);

  // simple context menu for right-click on Assigned
  const [menu, setMenu] = useState({ open: false, x: 0, y: 0 });

  // ── Search ───────────────────────────────────────────────────
  const [appliedSearch, setAppliedSearch] = useState({ code: '', desc: '' });
  const [pendingSelectCode, setPendingSelectCode] = useState(null);
  const isDescMode = !!appliedSearch.desc.trim();
  const hasActiveSearch = !!(appliedSearch.code || appliedSearch.desc);

  // -------------------- Derived data --------------------

  const assignedLookup = useMemo(
    () => new Set(assigned.map(a => a.component_code)),
    [assigned]
  );

  // In description mode, filter the tree to matching components only
  const displayTree = useMemo(() => {
    if (!appliedSearch.desc.trim()) return tree;
    const term = appliedSearch.desc.toLowerCase();
    const result = [];
    for (const g of tree) {
      const matchingCats = [];
      for (const cat of g.categories ?? []) {
        const matchingComps = (cat.components ?? []).filter(c =>
          String(c.label ?? '').toLowerCase().includes(term)
        );
        if (matchingComps.length) matchingCats.push({ ...cat, components: matchingComps });
      }
      if (matchingCats.length) result.push({ ...g, categories: matchingCats });
    }
    return result;
  }, [tree, appliedSearch.desc]);

  // In description mode, auto-expand everything in the filtered tree
  const expandedEffective = useMemo(() => {
    if (!isDescMode) return expanded;
    const all = new Set();
    for (const g of displayTree) {
      all.add(g.groupCode);
      for (const cat of g.categories ?? []) all.add(cat.categoryCode);
    }
    return all;
  }, [isDescMode, displayTree, expanded]);

  const { visibleComponents, indexByCode } = useMemo(() => {
    const vis = [];
    const map = new Map();
    for (const g of displayTree) {
      if (!expandedEffective.has(g.groupCode)) continue;
      for (const c of g.categories ?? []) {
        if (!expandedEffective.has(c.categoryCode)) continue;
        for (const comp of c.components ?? []) {
          map.set(comp.code, vis.length);
          vis.push({ code: comp.code, label: comp.label });
        }
      }
    }
    return { visibleComponents: vis, indexByCode: map };
  }, [displayTree, expandedEffective]);

  // -------------------- Expand/Collapse --------------------

  function toggleExpand(key) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // -------------------- Search --------------------

  function handleCodeSearch(code) {
    setAppliedSearch({ code, desc: '' });
    const codeLower = code.toLowerCase();
    for (const g of tree) {
      for (const cat of g.categories ?? []) {
        for (const comp of cat.components ?? []) {
          if (String(comp.code ?? '').toLowerCase() === codeLower) {
            setExpanded(prev => {
              const next = new Set(prev);
              next.add(g.groupCode);
              next.add(cat.categoryCode);
              return next;
            });
            setPendingSelectCode(String(comp.code));
            return;
          }
        }
      }
    }
  }

  function handleDescSearch(desc) {
    setAppliedSearch({ code: '', desc });
    setAvailSelection([]);
    setAvailAnchor(null);
  }

  function handleClearSearch() {
    setAppliedSearch({ code: '', desc: '' });
    setAvailSelection([]);
    setAvailAnchor(null);
    setPendingSelectCode(null);
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

    return { next: [clickedIndex], anchor: clickedIndex };
  }

  function handleAvailableClick(visibleIndex, e) {
    const { next, anchor } = updateSelection(availSelection, visibleIndex, e, availAnchor);
    setAvailSelection(next);
    setAvailAnchor(anchor);
    if (menu.open) setMenu(m => ({ ...m, open: false }));
  }

  function handleAssignedClick(rowIndex, e) {
    const { next, anchor } = updateSelection(assignSelection, rowIndex, e, assignAnchor);
    setAssignSelection(next);
    setAssignAnchor(anchor);
    if (menu.open) setMenu(m => ({ ...m, open: false }));
  }

  // -------------------- Actions --------------------

  function addSelected() {
    if (availSelection.length === 0) return;

    const selectedCodes = availSelection
      .map(i => visibleComponents[i])
      .filter(Boolean)
      .map(x => x.code)
      .filter(code => !assignedLookup.has(code));

    if (!selectedCodes.length) return;

    updateAssigned(prev => [
      ...prev,
      ...selectedCodes.map(code => ({
        component_code: code,
        component_desc: visibleComponents[indexByCode.get(code)]?.label || code,
      })),
    ]);

    setAvailSelection([]);
    setAvailAnchor(null);
    onComponentsChanged?.();
  }

  function removeSelected() {
    if (assignSelection.length === 0) return;

    const toRemove = new Set(assignSelection);
    updateAssigned(prev => prev.filter((_, idx) => !toRemove.has(idx)));

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
    if (!assignSelection.includes(index)) {
      setAssignSelection([index]);
      setAssignAnchor(index);
    }
    setMenu({ open: true, x: e.clientX, y: e.clientY });
  }

  function openModifyForAssignedSelection() {
    const targets = assignSelection.length
      ? assignSelection.map((i) => assigned[i]).filter(Boolean)
      : [];
    if (!targets.length) return;
    const code = targets[0].component_code;
    window.open(
      `/product-manager/manage-product-component?focusComponentCode=${encodeURIComponent(code)}`,
      '_blank'
    );
  }

  // -------------------- Scroll to pending code --------------------

  useEffect(() => {
    if (!pendingSelectCode) return;
    const visIndex = indexByCode.get(pendingSelectCode);
    if (visIndex == null) return;
    setAvailSelection([visIndex]);
    setAvailAnchor(visIndex);
    setPendingSelectCode(null);
    requestAnimationFrame(() => {
      document.getElementById(`pct-comp-${pendingSelectCode}`)
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }, [pendingSelectCode, indexByCode]);

  // -------------------- Render --------------------

  return (
    <div className="flex flex-col h-full min-h-0">
      {menu.open && (
        <RowContextMenu
          x={menu.x}
          y={menu.y}
          actions={[
            {
              key: 'modify-new-tab',
              label: newTabLabel('Modify'),
              onClick: () => {
                openModifyForAssignedSelection();
                setMenu(m => ({ ...m, open: false }));
              },
            },
          ]}
        />
      )}

      <DualPane
        leftTitle={
          isDescMode
            ? `Results (${displayTree.reduce((n, g) => n + g.categories.reduce((m, c) => m + c.components.length, 0), 0)})`
            : 'Product Groups'
        }
        leftHeader={
          <PaneSearchBar
            onCodeSearch={handleCodeSearch}
            onDescSearch={handleDescSearch}
            onClear={handleClearSearch}
            hasActiveSearch={hasActiveSearch}
          />
        }
        rightTitle="Assigned Products"
        onAdd={addSelected}
        onRemove={removeSelected}
        addDisabled={availSelection.length === 0}
        removeDisabled={assignSelection.length === 0}
        leftContent={
          <>
            {treeLoading && tree.length === 0 ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-400" />
              </div>
            ) : tree.length === 0 ? (
              <div className="text-xs text-neutral-500">No product groups.</div>
            ) : (
              displayTree.map(group => (
                <div key={group.groupCode}>
                  <TreeHeader
                    label={group.label}
                    expanded={expandedEffective.has(group.groupCode)}
                    onClick={() => toggleExpand(group.groupCode)}
                  />
                  {expandedEffective.has(group.groupCode) &&
                    group.categories.map((cat) => (
                      <div key={cat.categoryCode} className="ml-4">
                        <TreeHeader
                          label={cat.label}
                          expanded={expandedEffective.has(cat.categoryCode)}
                          onClick={() => toggleExpand(cat.categoryCode)}
                        />
                        {expandedEffective.has(cat.categoryCode) &&
                          cat.components.map((comp) => {
                            const visIndex = indexByCode.get(comp.code);
                            const selected = visIndex != null && availSelection.includes(visIndex);
                            const disabled = assignedLookup.has(comp.code);
                            return (
                              <div
                                key={comp.code}
                                id={`pct-comp-${comp.code}`}
                                className={
                                  'ml-4 cursor-pointer px-2 py-1 rounded ' +
                                  (selected ? 'bg-blue-100 ' : '') +
                                  (disabled ? 'opacity-40 ' : '')
                                }
                                title={
                                  disabled
                                    ? 'Already assigned'
                                    : 'Click to select. CTRL/CMD multi-select, SHIFT for ranges.'
                                }
                                onClick={(e) => !disabled && handleAvailableClick(visIndex, e)}
                              >
                                {comp.label}{' '}
                                <span className="text-xs text-neutral-500">({comp.code})</span>
                              </div>
                            );
                          })}
                      </div>
                    ))}
                </div>
              ))
            )}
          </>
        }
        rightContent={
          <>
            {assigned.length === 0 ? (
              <div className="text-xs text-neutral-500">No assigned products.</div>
            ) : (
              assigned.map((a, i) => {
                const selected = assignSelection.includes(i);
                return (
                  <div
                    key={a.component_code}
                    className={`cursor-pointer px-2 py-1 rounded ${selected ? 'bg-blue-100' : ''}`}
                    title="Click to select. CTRL/CMD multi-select, SHIFT for ranges. Right-click for actions."
                    onClick={(e) => handleAssignedClick(i, e)}
                    onContextMenu={(e) => openContextMenuForAssigned(e, i)}
                  >
                    {a.component_desc}
                    <span className="ml-2 text-xs text-neutral-500">
                      ({a.component_code})
                    </span>
                  </div>
                );
              })
            )}
          </>
        }
      />
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
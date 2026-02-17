// src/components/ProductComponentSearch.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTableColumnSizing } from '../hooks/useTableColumnSizing';

export default function ProductComponentSearch() {
  const [filters, setFilters] = useState({ pc: '', description: '' });

  // Loaded tree: [{ groupCode, label, categories: [{ categoryCode, label, components: [...] }] }]
  const [tree, setTree] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState(() => new Set());
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCompCode, setSelectedCompCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Results mode (like PHC "Results (N)")
  const [searchTitle, setSearchTitle] = useState(''); // empty = not in results mode
  const isResultsMode = !!searchTitle?.trim();
  const [resultRows, setResultRows] = useState([]); // rows for global description results

  // Anchor row after the table renders
  const [pendingAnchorCompCode, setPendingAnchorCompCode] = useState(null);

  // LEFT pane scroll ref + helpers
  const sidebarRef = useRef(null);
  const scrollCategoryIntoView = (categoryCode) => {
    const el = document.getElementById(`pc-cat-${categoryCode}`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  // RIGHT pane row scroll helper
  const scrollRowIntoView = (code) => {
    const el = document.getElementById(`pc-row-${code}`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  // Load components tree once
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/components/tree');
        const json = await res.json();
        if (!alive) return;
        const list = Array.isArray(json) ? json : [];
        setTree(list);

        // Initial expansion/selection like before
        if (list.length > 0) {
          const firstGroup = list[0];
          const next = new Set();
          next.add(firstGroup.groupCode);
          setExpandedGroups(next);
          const firstCat = (firstGroup.categories ?? [])[0];
          if (firstCat) {
            setSelectedCategory(String(firstCat.categoryCode));
            // Keep the left pane centered on first cat
            requestAnimationFrame(() => scrollCategoryIntoView(String(firstCat.categoryCode)));
          }
        }
      } catch (err) {
        console.error('[PC Search] tree load failed', err);
        setTree([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  function toggleGroup(code) {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function setCategoryAndResetSelection(code) {
    setSearchTitle('');           // exit results mode
    setResultRows([]);
    setSelectedCategory(code);
    setSelectedCompCode('');
    requestAnimationFrame(() => scrollCategoryIntoView(code));
  }

  const selectedCatObj = useMemo(() => {
    for (const g of tree) {
      const cat = (g.categories ?? []).find(c => String(c.categoryCode) === String(selectedCategory));
      if (cat) return cat;
    }
    return null;
  }, [tree, selectedCategory]);

  const components = useMemo(() => selectedCatObj?.components ?? [], [selectedCatObj]);

 
  // No inline filtering: show all components for the selected category (unless in results mode)
  const filteredComponents = useMemo(() => {
    if (isResultsMode) return [];
    return components ?? [];
  }, [components, isResultsMode]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(f => ({ ...f, [name]: value }));
  };

  const onKeyDownBasic = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      setFilters({ pc: '', description: '' });
    }
  };

  // Column sizing hook (PC)
  const pcTableRef = useRef(null);
  const { ColGroup, startResize, autoFitColumn } = useTableColumnSizing(pcTableRef, {
    storageKey: 'pc-table',
    sampleRows: 300,
    minPx: 80,
    maxPx: 520,
    autoSizeDeps: [isResultsMode ? resultRows.length : filteredComponents.length],
    columnCaps: {
      0: { min: 80, max: 140 }, // PC Code column tighter
    },
  });

  // ------- SEARCH behavior (mirror PHC semantics) -------
  const handleSearch = () => {
    const pc = (filters.pc || '').trim();
    const desc = (filters.description || '').trim();

    // Prefer PC code anchoring when provided
    if (pc) {
      // Find the component in the loaded tree (client-side)
      const pcLower = pc.toLowerCase();
      let found = null;
      let foundGroup = null;
      let foundCat = null;

      outer: for (const g of tree) {
        for (const cat of (g.categories ?? [])) {
          for (const comp of (cat.components ?? [])) {
            if (String(comp.code ?? '').toLowerCase() === pcLower) {
              found = comp;
              foundGroup = g;
              foundCat = cat;
              break outer;
            }
          }
        }
      }

      if (!found || !foundCat || !foundGroup) {
        setSelectedCompCode('');
        setSearchTitle(`No results for code ${pc}`);
        setResultRows([]);
        return;
      }

      // Expand group, select category, anchor to row
      setSearchTitle(''); // exit results mode
      setResultRows([]);
      setExpandedGroups(prev => {
        const next = new Set(prev);
        next.add(foundGroup.groupCode);
        return next;
      });
      setSelectedCategory(String(foundCat.categoryCode));
      setSelectedCompCode(String(found.code));
      setPendingAnchorCompCode(String(found.code));

      // Keep left pane centered on the category
      setTimeout(() => scrollCategoryIntoView(String(foundCat.categoryCode)), 0);
      return;
    }

    // Otherwise, if Description provided → global results (across all categories)
    if (desc) {
      const descTerm = desc.toLowerCase();
      const flattened = [];

      for (const g of tree) {
        const groupLabel = g.label;
        const groupCode = g.groupCode;
        for (const cat of (g.categories ?? [])) {
          const categoryLabel = cat.label;
          const categoryCode = cat.categoryCode;
          for (const comp of (cat.components ?? [])) {
            const label = String(comp.label ?? '');
            if (label.toLowerCase().includes(descTerm)) {
              flattened.push({
                ...comp,
                // add metadata so we can jump/anchor later
                categoryCode,
                categoryLabel,
                groupCode,
                groupLabel,
              });
            }
          }
        }
      }

      setSelectedCompCode('');
      setPendingAnchorCompCode(null);
      setResultRows(flattened);
      setSearchTitle(`Results (${flattened.length})`);
      // Left pane remains as-is (like PHC description results)
      return;
    }

    // No criteria
    // Optionally show a message; we’ll just clear results mode
    setSearchTitle('');
    setResultRows([]);
  };

  const handleClear = () => {
    setFilters({ pc: '', description: '' });
    setSearchTitle('');
    setResultRows([]);
    setSelectedCompCode('');
  };

  // After selecting a category (by click or anchor), keep left pane centered
  useEffect(() => {
    if (selectedCategory) {
      requestAnimationFrame(() => scrollCategoryIntoView(String(selectedCategory)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  // After components render for a selected category, anchor to pending row
  useEffect(() => {
    if (!pendingAnchorCompCode) return;
    // small defer so the DOM has the row
    requestAnimationFrame(() => {
      setSelectedCompCode(pendingAnchorCompCode);
      scrollRowIntoView(pendingAnchorCompCode);
      setPendingAnchorCompCode(null);
    });
  }, [pendingAnchorCompCode, components.length]);

  // Helper to jump from Results → anchor into the component's category (double-click)
  const jumpToComponentCategory = (row) => {
    const { categoryCode, groupCode, code } = row;
    if (!categoryCode || !groupCode || !code) return;

    // Expand the group, select the category, then anchor the row
    setSearchTitle('');
    setResultRows([]);
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.add(groupCode);
      return next;
    });
    setSelectedCategory(String(categoryCode));
    setSelectedCompCode(String(code));
    setPendingAnchorCompCode(String(code));

    setTimeout(() => scrollCategoryIntoView(String(categoryCode)), 0);
  };

  const headerTitle = isResultsMode
    ? searchTitle
    : selectedCatObj
    ? `${selectedCatObj.label} (${selectedCatObj.categoryCode})`
    : 'Choose a category';

  // Decide which rows the table should render
  const tableRows = isResultsMode ? resultRows : filteredComponents;

  return (
    <div className="flex flex-col gap-4">
      {/* Basic search row */}
      <div className="pm-section grid grid-cols-12 gap-4 items-center">
        <input
          type="text"
          name="pc"
          placeholder="PC"
          value={filters.pc}
          onChange={handleChange}
          onKeyDown={onKeyDownBasic}
          className="col-span-3 w-full h-10 px-3 py-2 pmsearch"
        />
        <input
          type="text"
          name="description"
          placeholder="Description"
          value={filters.description}
          onChange={handleChange}
          onKeyDown={onKeyDownBasic}
          className="col-span-7 w-full h-10 px-3 py-2 pmsearch"
        />
        <div className="pm-section-right">
          <button onClick={handleSearch} className="btn btn-light">Search</button>
          <button onClick={handleClear} className="btn btn-light">Clear</button>
        </div>
      </div>

      {/* Subtle divider under search */}
      <div className="pm-divider my-2 pm-divider-bleed" />

      {/* Two-column layout */}
      <div className="grid grid-cols-12 gap-4">
        {/* LEFT: Groups ▸ Categories */}
        <aside className="pm-sidebar col-span-3">
          <div className="pm-sidebar-title">Product Groups</div>
          <div className="pm-sidebar-scroll pr-3" ref={sidebarRef}>
            {tree.map(group => {
              const open = expandedGroups.has(group.groupCode);
              return (
                <div key={group.groupCode} className="mb-2">
                  <div className="pm-group-header">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-5 h-5 rounded border border-gray-200 bg-white hover:bg-gray-50 ml-0.5 shrink-0"
                      onClick={() => toggleGroup(group.groupCode)}
                      aria-label={open ? 'Collapse' : 'Expand'}
                      title={open ? 'Collapse' : 'Expand'}
                    >
                      <span className="text-sm">{open ? '▾' : '▸'}</span>
                    </button>
                    <span className="pm-group-label">{group.label}</span>
                    <span className="pm-group-code">({group.groupCode})</span>
                  </div>
                  {open && (group.categories ?? []).map(cat => {
                    const selected = String(selectedCategory) === String(cat.categoryCode);
                    return (
                      <button
                        key={cat.categoryCode}
                        id={`pc-cat-${cat.categoryCode}`} // <-- ID for left-pane anchoring
                        type="button"
                        onClick={() => setCategoryAndResetSelection(String(cat.categoryCode))}
                        className={`${selected ? 'pm-list-item-small pm-list-item--active' : 'pm-list-item-small'} pm-cat-indent block`}
                        title={cat.label}
                      >
                        <div className="truncate">
                          {cat.label}
                          <span className="ml-2 text-[11px] text-neutral-500">({cat.categoryCode})</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </aside>

        {/* RIGHT: Components table */}
        <section className="col-span-9 pm-pane pm-pane-right pm-pane-flex pm-pane--vh">
          <div className="pm-pane-header">
            <div className="pm-pane-title">
              {headerTitle}
            </div>
            <div className="text-sm text-gray-500">{loading ? 'Loading…' : null}</div>
          </div>

          <div className="pm-content">
            <table className="pm-table" ref={pcTableRef}>
              {ColGroup}
              <thead className="pm-thead pm-thead-sticky">
                <tr>
                  <th className="pm-th relative">
                    PC
                    <span
                      className="pm-col-resizer"
                      onMouseDown={(e) => startResize(e, 0)}
                      onDoubleClick={() => autoFitColumn(0)}
                    />
                  </th>
                  <th className="pm-th relative">
                    Description
                    <span
                      className="pm-col-resizer"
                      onMouseDown={(e) => startResize(e, 1)}
                      onDoubleClick={() => autoFitColumn(1)}
                    />
                  </th>
                  <th className="pm-th relative">
                    Order
                    <span
                      className="pm-col-resizer"
                      onMouseDown={(e) => startResize(e, 2)}
                      onDoubleClick={() => autoFitColumn(2)}
                    />
                  </th>
                  <th className="pm-th relative">
                    Active
                    <span
                      className="pm-col-resizer"
                      onMouseDown={(e) => startResize(e, 3)}
                      onDoubleClick={() => autoFitColumn(3)}
                    />
                  </th>
                  <th className="pm-th relative">
                    Display
                    <span
                      className="pm-col-resizer"
                      onMouseDown={(e) => startResize(e, 4)}
                      onDoubleClick={() => autoFitColumn(4)}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Empty states */}
                {!isResultsMode && !selectedCatObj && (
                  <tr><td colSpan={5} className="pm-td text-sm text-gray-500">Select a category to view components.</td></tr>
                )}
                {!isResultsMode && selectedCatObj && filteredComponents.length === 0 && (
                  <tr><td colSpan={5} className="pm-td text-sm text-gray-500">No components match your filters.</td></tr>
                )}
                {isResultsMode && tableRows.length === 0 && (
                  <tr><td colSpan={5} className="pm-td text-sm text-gray-500">{searchTitle || 'Results (0)'}</td></tr>
                )}

                {/* Rows */}
                {tableRows.map(row => {
                  const active = row.active_ind ?? row.active;
                  const display = row.display_ind ?? row.display;
                  const isSelected = selectedCompCode === row.code;

                  // In results mode we include category metadata on the row;
                  // double-click will jump/anchor into that category view.
                  const onDouble = () => {
                    if (isResultsMode) {
                      jumpToComponentCategory(row);
                    } else {
                      // (optional) you could open a detail here in the future
                    }
                  };

                  return (
                    <tr
                      key={row.code}
                      id={`pc-row-${row.code}`} // <-- ID for right-pane anchoring
                      className={`pm-row ${isSelected ? 'pm-row--selected' : ''} cursor-pointer`}
                      onClick={() => setSelectedCompCode(row.code)}
                      onDoubleClick={onDouble}
                      title={row.label}
                    >
                      <td className="pm-td font-mono">{row.code}</td>
                      <td className="pm-td">{row.label}</td>
                      <td className="pm-td text-right">{row.order ?? ''}</td>
                      <td className="pm-td">{active ?? ''}</td>
                      <td className="pm-td">{display ?? ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pm-pane-footer">
            <button className="btn btn-light">New</button>
            <button className="btn btn-light">Clone</button>
          </div>
        </section>
      </div>
    </div>
  );
}
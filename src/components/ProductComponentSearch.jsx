import React, { useEffect, useMemo, useRef, useState } from 'react';
import BrowserLayout from './shared/BrowserLayout';
import DataTable from './shared/DataTable';

const COMPONENT_COLUMNS = [
  { key: 'code', label: 'PC', className: 'font-mono', sortable: true, sortType: 'string' },
  { key: 'label', label: 'Description', sortable: true, sortType: 'string' },
  { key: 'order', label: 'Display Order', sortable: true, sortType: 'number' },
  { key: 'active_ind', label: 'Active', sortable: true, sortType: 'string' },
  { key: 'display_ind', label: 'Display', sortable: true, sortType: 'string' },
  { key: 'units', label: 'Units', sortable: true, sortType: 'string' },
  { key: 'sale_units', label: 'Sale Units', sortable: true, sortType: 'string' },
  { key: 'sales_statistic_code', label: 'Sales Stat Code', sortable: true, sortType: 'string' },
  { key: 'product_profile_type_code', label: 'Profile Type', sortable: true, sortType: 'string' },
];

export default function ProductComponentSearch() {
  const [filters, setFilters] = useState({ pc: '', description: '' });
  const [tree, setTree] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState(() => new Set());
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCompCode, setSelectedCompCode] = useState('');
  const [loading, setLoading] = useState(false);

  const [searchTitle, setSearchTitle] = useState('');
  const isResultsMode = !!searchTitle?.trim();
  const [resultRows, setResultRows] = useState([]);
  const [pendingAnchorCompCode, setPendingAnchorCompCode] = useState(null);

  const scrollCategoryIntoView = (categoryCode) => {
    const el = document.getElementById(`pc-cat-${categoryCode}`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  const scrollRowIntoView = (code) => {
    const el = document.getElementById(`pc-row-${code}`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/components/tree');
        const json = await res.json();
        if (!alive) return;
        const list = Array.isArray(json) ? json : [];
        
        // ADD THIS LOGGING
        if (list.length > 0 && list[0].categories?.length > 0) {
          const firstComp = list[0].categories[0].components?.[0];
          console.log('[PC Search] First component data:', firstComp);
          console.log('[PC Search] Available keys:', Object.keys(firstComp || {}));
        }
        
        setTree(list);

        if (list.length > 0) {
          const firstGroup = list[0];
          const next = new Set();
          next.add(firstGroup.groupCode);
          setExpandedGroups(next);
          const firstCat = (firstGroup.categories ?? [])[0];
          if (firstCat) {
            setSelectedCategory(String(firstCat.categoryCode));
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
    setSearchTitle('');
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

  const handleSearch = () => {
    const pc = (filters.pc || '').trim();
    const desc = (filters.description || '').trim();

    if (pc) {
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

      setSearchTitle('');
      setResultRows([]);
      setExpandedGroups(prev => {
        const next = new Set(prev);
        next.add(foundGroup.groupCode);
        return next;
      });
      setSelectedCategory(String(foundCat.categoryCode));
      setSelectedCompCode(String(found.code));
      setPendingAnchorCompCode(String(found.code));
      setTimeout(() => scrollCategoryIntoView(String(foundCat.categoryCode)), 0);
      return;
    }

    if (desc) {
      const descTerm = desc.toLowerCase();
      const flattened = [];

      for (const g of tree) {
        for (const cat of (g.categories ?? [])) {
          for (const comp of (cat.components ?? [])) {
            const label = String(comp.label ?? '');
            if (label.toLowerCase().includes(descTerm)) {
              flattened.push({
                ...comp,
                categoryCode: cat.categoryCode,
                categoryLabel: cat.label,
                groupCode: g.groupCode,
                groupLabel: g.label,
              });
            }
          }
        }
      }

      setSelectedCompCode('');
      setPendingAnchorCompCode(null);
      setResultRows(flattened);
      setSearchTitle(`Results (${flattened.length})`);
      return;
    }

    setSearchTitle('');
    setResultRows([]);
  };

  const handleClear = () => {
    setFilters({ pc: '', description: '' });
    setSearchTitle('');
    setResultRows([]);
    setSelectedCompCode('');
  };

  useEffect(() => {
    if (selectedCategory) {
      requestAnimationFrame(() => scrollCategoryIntoView(String(selectedCategory)));
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (!pendingAnchorCompCode) return;
    requestAnimationFrame(() => {
      setSelectedCompCode(pendingAnchorCompCode);
      scrollRowIntoView(pendingAnchorCompCode);
      setPendingAnchorCompCode(null);
    });
  }, [pendingAnchorCompCode, components.length]);

  const jumpToComponentCategory = (row) => {
    const { categoryCode, groupCode, code } = row;
    if (!categoryCode || !groupCode || !code) return;

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

  const tableRows = isResultsMode ? resultRows : filteredComponents;

  return (
    <BrowserLayout
      sidebar={
        <>
          <div className="pm-sidebar-title">Product Groups</div>
          <div className="pm-sidebar-scroll">
            {tree.map(group => {
              const open = expandedGroups.has(group.groupCode);
              return (
                <div key={group.groupCode} className="mb-2">
                  <div className="pm-group-header">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-5 h-5 rounded border border-gray-200 bg-white hover:bg-gray-50 ml-1 shrink-0"
                      onClick={() => toggleGroup(group.groupCode)}
                      aria-label={open ? 'Collapse' : 'Expand'}
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
                        id={`pc-cat-${cat.categoryCode}`}
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
        </>
      }
      searchPanel={
        <>
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
          <div className="pm-divider-bleed" />
        </>
      }
      paneHeader={
        <>
          <div className="pm-pane-title">{headerTitle}</div>
          <div className="flex items-center gap-2 grow justify-end">
            <button
              onClick={() => {
                localStorage.removeItem('colw:product-component-search');
                window.location.reload();
              }}
              className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
              title="Reset column widths"
            >
              Reset Columns
            </button>
          </div>
        </>
      }
      table={
        <DataTable
          columns={COMPONENT_COLUMNS}
          data={tableRows}
          rowKey="code"
          storageKey="product-component-search"
          selectedRowKey={selectedCompCode}
          onRowClick={(row) => setSelectedCompCode(row.code)}
          onRowDoubleClick={(row) => {
            if (isResultsMode) {
              jumpToComponentCategory(row);
            }
          }}
          emptyMessage={
            !isResultsMode && !selectedCatObj
              ? 'Select a category to view components.'
              : !isResultsMode && selectedCatObj && filteredComponents.length === 0
              ? 'No components match your filters.'
              : isResultsMode && tableRows.length === 0
              ? searchTitle || 'Results (0)'
              : 'No components found'
          }
          loading={loading}
        />
      }
      paneFooter={
        <>
          <button className="btn btn-light">New</button>
          <button className="btn btn-light">Clone</button>
        </>
      }
    />
  );
}
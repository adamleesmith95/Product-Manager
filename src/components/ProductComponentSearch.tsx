import React, { useEffect, useMemo, useState, ReactNode} from 'react';
import BrowserLayout from './shared/BrowserLayout';
import DataTable from './shared/DataTable';
import { useDataCache } from '../context/DataCacheContext';
import SearchBarAdvanced from './shared/SearchBarAdvanced';
import SearchActionButtons from './shared/SearchActionButtons';
import PaneHeader from './shared/PaneHeader';
import { useBrowserData } from '../hooks/useBrowserData';
import { resetTableColumns } from '../utils/tableStorage';

const COMPONENT_COLUMNS = [
  { key: 'code', label: 'Code', sortable: true },
  { key: 'label', label: 'Description', sortable: true },
  { key: 'active_ind', label: 'Active', sortable: true },
  { key: 'display_ind', label: 'Display', sortable: true },
  { key: 'order', label: 'Display Order', sortable: true },
  { key: 'product_category_code', label: 'Product Category Code', sortable: true },
  { key: 'product_category_desc', label: 'Product Category', sortable: true },
  { key: 'product_profile_type_code', label: 'Product Profile Type Code', sortable: true },
  { key: 'product_profile_type', label: 'Product Profile Type', sortable: true },
  { key: 'deferral_pattern_code', label: 'Deferral Pattern Code', sortable: true },
  { key: 'deferral_pattern', label: 'Deferral Pattern', sortable: true },
  { key: 'units', label: 'Units', sortable: true },
  { key: 'revenue_report_ind', label: 'Report Revenue', sortable: true },
  { key: 'change_revenue_location_ind', label: 'Change Revenue Location', sortable: true },
  { key: 'sale_units', label: 'Sale Units', sortable: true },
  { key: 'inventory_pool_code', label: 'Inventory Pool Code', sortable: true },
  { key: 'inventory_pool', label: 'Inventory Pool', sortable: true },
  { key: 'offline_freesell_ind', label: 'Offline Freesell', sortable: true },
  { key: 'sales_statistic_code', label: 'Sales Statistic Code', sortable: true },
  { key: 'sales_statistic', label: 'Sales Statistic', sortable: true },
  { key: 'roster_code', label: 'Roster Code', sortable: true },
  { key: 'roster', label: 'Roster', sortable: true },
  { key: 'lift_product_type_code', label: 'Lift Product Type Code', sortable: true },
  { key: 'lift_product_type', label: 'Lift Product Type', sortable: true },
  { key: 'scan_process_order_code', label: 'Scan Process Order Code', sortable: true },
  { key: 'scan_process_order', label: 'Scan Process Order', sortable: true },
  { key: 'lift_scan_type_code', label: 'Lift Scan Type Code', sortable: true },
  { key: 'lift_scan_type', label: 'Lift Scan Type', sortable: true },
  { key: 'lift_charge_ind', label: 'Lift Charging', sortable: true },
  { key: 'load_to_media_ind', label: 'Load To Media', sortable: true },
  { key: 'lift_effective_date', label: 'Lift Effective Date', sortable: true },
  { key: 'lift_expiration_type', label: 'Lift Expiration Type', sortable: true },
  { key: 'lift_expiration_days', label: 'Lift Expiration Days', sortable: true },
  { key: 'lift_expiration_date', label: 'Lift Expiration Date', sortable: true },
  { key: 'lesson_product_type_code', label: 'Lesson Product Type Code', sortable: true },
  { key: 'lesson_product_type', label: 'Lesson Product Type', sortable: true },
  { key: 'lesson_discipline_code', label: 'Lesson Discipline Code', sortable: true },
  { key: 'lesson_discipline', label: 'Lesson Discipline', sortable: true },
  { key: 'instructor_activity_code', label: 'Instructor Activity Code', sortable: true },
  { key: 'instructor_activity', label: 'Instructor Activity', sortable: true },
  { key: 'schedule_instructor', label: 'Schedule Instructor', sortable: true },
  { key: 'pass_product_type_code', label: 'Pass Product Type Code', sortable: true },
  { key: 'pass_product_type', label: 'Pass Product Type', sortable: true },
  { key: 'pass_media_type_code', label: 'Pass Media Type Code', sortable: true },
  { key: 'pass_media_type', label: 'Pass Media Type', sortable: true },
  { key: 'deferral_calendar_code', label: 'Deferral Calendar Code', sortable: true },
  { key: 'deferral_calendar', label: 'Deferral Calendar', sortable: true },
  { key: 'customer_property_set_code', label: 'Customer Property Set Code', sortable: true },
  { key: 'customer_property_set', label: 'Customer Property Set', sortable: true },
  { key: 'operator_id', label: 'Operator ID', sortable: true },
  { key: 'update_date', label: 'Updated', sortable: true },
];

const TABLE_STORAGE_KEY = 'product-component-search';

interface Props {
  onOpenProduct?: (row: any) => void;
  onSelectProduct?: (row: any) => void;
  inlineDetailPanel?: ReactNode;
  onNew?: () => void;
  onClone?: () => void;
  newLabel?: string;
  cloneLabel?: string;
  componentAnchorCode?: string;
}

export default function ProductComponentSearch({
  onOpenProduct,
  onSelectProduct,
  inlineDetailPanel,
  onNew,
  onClone,
  newLabel,
  cloneLabel,
  componentAnchorCode,
}: Props) {
  const [filters, setFilters] = useState({ pc: '', description: '' });
  const [advancedFilters, setAdvancedFilters] = useState({ lob: '', productGroup: '', productCategory: '', active: '' });
  const [tree, setTree] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState(() => new Set());
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCompCode, setSelectedCompCode] = useState('');

  const [searchTitle, setSearchTitle] = useState('');
  const isResultsMode = !!searchTitle?.trim();
  const [resultRows, setResultRows] = useState([]);
  const [pendingAnchorCompCode, setPendingAnchorCompCode] = useState(null);

  // Derive unique LOBs from the loaded tree (LOB lives at the product-group level)
  const lobs = useMemo(() => {
    const seen = new Map<string, string>();
    for (const g of tree as any[]) {
      if (g.lobCode && !seen.has(g.lobCode)) seen.set(g.lobCode, g.lobLabel ?? g.lobCode);
    }
    return Array.from(seen.entries()).map(([code, label]) => ({ code, label }));
  }, [tree]);

  // Derive unique product groups from the loaded tree
  const productGroups = useMemo(() =>
    tree.map((g: any) => ({ code: String(g.groupCode), label: String(g.label) })),
    [tree]
  );

  // Cascade: categories for the selected group (or all categories if none selected)
  const productCategories = useMemo(() => {
    if (!advancedFilters.productGroup) {
      return tree.flatMap((g: any) =>
        (g.categories ?? []).map((c: any) => ({ code: String(c.categoryCode), label: String(c.label), groupCode: String(g.groupCode) }))
      );
    }
    const g = tree.find((g: any) => String(g.groupCode) === advancedFilters.productGroup);
    return (g?.categories ?? []).map((c: any) => ({ code: String(c.categoryCode), label: String(c.label), groupCode: String(g.groupCode) }));
  }, [tree, advancedFilters.productGroup]);

  // When LOB changes, reset product group and category if they no longer belong
  useEffect(() => {
    if (!advancedFilters.lob) return;
    const g = (tree as any[]).find(g => String(g.groupCode) === advancedFilters.productGroup);
    if (advancedFilters.productGroup && g && String(g.lobCode) !== advancedFilters.lob) {
      setAdvancedFilters(f => ({ ...f, productGroup: '', productCategory: '' }));
    }
  }, [advancedFilters.lob, advancedFilters.productGroup, tree]);

  // Clear category when group changes and current category no longer belongs
  useEffect(() => {
    if (!advancedFilters.productGroup || !advancedFilters.productCategory) return;
    const still = productCategories.some(c => c.code === advancedFilters.productCategory);
    if (!still) setAdvancedFilters(f => ({ ...f, productCategory: '' }));
  }, [advancedFilters.productGroup, advancedFilters.productCategory, productCategories]);

  // Product groups filtered by selected LOB
  const filteredProductGroups = useMemo(() => {
    if (!advancedFilters.lob) return productGroups;
    return (tree as any[])
      .filter(g => String(g.lobCode) === advancedFilters.lob)
      .map(g => ({ code: String(g.groupCode), label: String(g.label) }));
  }, [tree, productGroups, advancedFilters.lob]);

  const isBasicEmpty = () => !filters.pc.trim() && !filters.description.trim();
  const hasAdvancedFilters = () => !!(advancedFilters.lob || advancedFilters.productGroup || advancedFilters.productCategory || advancedFilters.active);

  const scrollCategoryIntoView = (categoryCode) => {
    const el = document.getElementById(`pc-cat-${categoryCode}`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

    const scrollRowIntoView = (code) => {
  const target = String(code);
  const selector =
  'tr[data-table-key="product-component-search"][data-row-key="' + target + '"]';

  const attempt = (attemptsLeft) => {
  const el = document.querySelector(selector);
  if (el) {
  el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  return;
  }
  if (attemptsLeft > 0) {
  setTimeout(() => attempt(attemptsLeft - 1), 100);
  }
  };

  attempt(6);
  };

  const { cache, setCache } = useDataCache();

  const {
    data: pcTreeData,
    loading,
    error: pcTreeError,
  } = useBrowserData(
    [cache.pcTree],
    async (signal) => {
      if (Array.isArray(cache.pcTree) && cache.pcTree.length) return cache.pcTree;
      const res = await fetch('/api/components/tree', { signal });
      const json = await res.json();
      return Array.isArray(json) ? json : [];
    }
  );

  useEffect(() => {
    if (!pcTreeData) return;
    setTree(pcTreeData);
    if (!(Array.isArray(cache.pcTree) && cache.pcTree.length)) {
      setCache('pcTree', pcTreeData);
    }
  }, [pcTreeData, cache.pcTree, setCache]);

  useEffect(() => {
    if (pcTreeError) console.error('[PC Search] tree load failed', pcTreeError);
  }, [pcTreeError]);

// For opening new tab when modify button is clicked in Product Component tab under manage-products-for-sale
useEffect(() => {
  if (!componentAnchorCode || !tree.length) return;

  const codeLower = componentAnchorCode.toLowerCase();
  let found = null, foundGroup = null, foundCat = null;

  outer: for (const g of tree) {
    for (const cat of (g.categories ?? [])) {
      for (const comp of (cat.components ?? [])) {
        if (String(comp.code ?? '').toLowerCase() === codeLower) {
          found = comp; foundGroup = g; foundCat = cat;
          break outer;
        }
      }
    }
  }

  if (!found || !foundCat || !foundGroup) return;

  setExpandedGroups(prev => { const next = new Set(prev); next.add(foundGroup.groupCode); return next; });
  setSelectedCategory(String(foundCat.categoryCode));
  setSelectedCompCode(String(found.code));
  onSelectProduct?.(found);
  setPendingAnchorCompCode(String(found.code));
  setTimeout(() => scrollCategoryIntoView(String(foundCat.categoryCode)), 0);
}, [componentAnchorCode, tree]);




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
    const { lob, productGroup, productCategory, active } = advancedFilters;
    const advanced = !!(lob || productGroup || productCategory || active);

    // Exact-code match (no advanced filters) — navigate directly in tree
    if (pc && !desc && !advanced) {
      const pcLower = pc.toLowerCase();
      let found = null, foundGroup = null, foundCat = null;
      outer: for (const g of tree) {
        for (const cat of (g.categories ?? [])) {
          for (const comp of (cat.components ?? [])) {
            if (String(comp.code ?? '').toLowerCase() === pcLower) {
              found = comp; foundGroup = g; foundCat = cat;
              break outer;
            }
          }
        }
      }
      if (!found || !foundCat || !foundGroup) {
        setSelectedCompCode('');
        setResultRows([{ code: '', label: `No component found for "${pc}"` }]);
        setSearchTitle(`No results for "${pc}"`);
        return;
      }
      setSearchTitle('');
      setResultRows([]);
      setExpandedGroups(prev => { const next = new Set(prev); next.add(foundGroup.groupCode); return next; });
      setSelectedCategory(String(foundCat.categoryCode));
      setSelectedCompCode(String(found.code));
      onSelectProduct?.(found);
      setPendingAnchorCompCode(String(found.code));
      setTimeout(() => scrollCategoryIntoView(String(foundCat.categoryCode)), 0);
      return;
    }

    // Results mode — flatten tree and apply all active filters
    if (pc || desc || advanced) {
      const pcLower = pc.toLowerCase();
      const descLower = desc.toLowerCase();
      const flattened: any[] = [];
      for (const g of tree) {
        if (productGroup && String(g.groupCode) !== productGroup) continue;
          if (lob && String((g as any).lobCode) !== lob) continue;
        for (const cat of (g.categories ?? [])) {
          if (productCategory && String(cat.categoryCode) !== productCategory) continue;
          for (const comp of (cat.components ?? [])) {
            if (pc && !String(comp.code ?? '').toLowerCase().includes(pcLower)) continue;
            if (desc && !String(comp.label ?? '').toLowerCase().includes(descLower)) continue;
            if (active && String(comp.active_ind ?? '') !== active) continue;
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
    setAdvancedFilters({ lob: '', productGroup: '', productCategory: '', active: '' });
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
    const code = String(pendingAnchorCompCode);
    setSelectedCompCode(code);
    scrollRowIntoView(code);
            const hit = components.find((c) => String(c?.code ?? '') === code);
      if (hit) onSelectProduct?.(hit);

      setPendingAnchorCompCode(null);
    });
  }, [pendingAnchorCompCode, components, onSelectProduct]);

  const headerTitle = isResultsMode
    ? searchTitle
    : selectedCatObj
    ? `${selectedCatObj.label} (${selectedCatObj.categoryCode})`
    : 'Choose a category';

  const tableRows = isResultsMode ? resultRows : filteredComponents;

  const handleResetColumns = () => {
    resetTableColumns(TABLE_STORAGE_KEY);
    window.location.reload();
  };

  const handleNew = () => {};
  const handleClone = () => {};

  return (
    <div className="bg-white shadow-md rounded-md border border-gray-300 overflow-hidden">
      <div className="flex items-center bg-indigo-950 px-4 py-2 rounded-t-md shrink-0">
        <h2 className="text-white text-lg font-semibold">Product Component Search</h2>
      </div>
      <BrowserLayout
        paneBottom={inlineDetailPanel}
      sidebar={
        <>
          <div className="pm-sidebar-title">Product Groups</div>
          <div className="pm-sidebar-scroll">
            {loading && tree.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              tree.map(group => {
              const open = expandedGroups.has(group.groupCode);
              return (
                <div key={group.groupCode} className="mb-2">
                  <div className="pm-group-header hover:bg-gray-50">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-5 h-5 rounded border border-gray-200 bg-white hover:bg-gray-50 ml-1 shrink-0"
                      onClick={() => toggleGroup(group.groupCode)}
                      aria-label={open ? 'Collapse' : 'Expand'}
                    >
                      <span className="text-sm">{open ? '▾' : '▸'}</span>
                    </button>
                    <span className="pm-group-label " onClick={() => toggleGroup(group.groupCode)}>{group.label}</span>
                    <span className="pm-group-code">({group.groupCode})</span>
                  </div>
                  {open && (group.categories ?? []).map(cat => {
                    const selected = String(selectedCategory) === String(cat.categoryCode);
                    return (
                      <div key={cat.categoryCode} className="pm-cat-indent">
                        <button
                          id={`pc-cat-${cat.categoryCode}`}
                          type="button"
                          onClick={() => setCategoryAndResetSelection(String(cat.categoryCode))}
                          className={`${selected ? 'pm-list-item-small pm-list-item--active' : 'pm-list-item-small'} block`}
                          title={cat.label}
                        >
                          <div className="truncate">
                            {cat.label}
                            <span className="ml-2 text-[11px] text-neutral-500">({cat.categoryCode})</span>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
          </div>
        </>
      }
      searchPanel={
        <SearchBarAdvanced
          onSearch={handleSearch}
          onClear={handleClear}
          isSearchDisabled={isBasicEmpty() && !hasAdvancedFilters()}
          searchDisabledTitle="Enter PC code, description, or use advanced filters"
          rightActions={<SearchActionButtons />}
          advancedContent={
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* LOB (3/12) */}
              <select
                value={advancedFilters.lob}
                onChange={e => setAdvancedFilters(f => ({ ...f, lob: e.target.value, productGroup: '', productCategory: '' }))}
                className="col-span-3 w-full h-10 px-3 py-2 pmsearch"
                aria-label="Line of Business"
              >
                <option value="">LOB</option>
                {lobs.map(l => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>

              {/* Product Group (3/12) — filtered by LOB when selected */}
              <select
                value={advancedFilters.productGroup}
                onChange={e => setAdvancedFilters(f => ({ ...f, productGroup: e.target.value, productCategory: '' }))}
                className="col-span-3 w-full h-10 px-3 py-2 pmsearch"
                aria-label="Product Group"
                title={advancedFilters.lob ? 'Filtered by LOB' : 'All product groups'}
              >
                <option value="">Product Group</option>
                {filteredProductGroups.map(g => (
                  <option key={g.code} value={g.code}>{g.label}</option>
                ))}
              </select>

              {/* Product Category (4/12) — cascades from group */}
              <select
                value={advancedFilters.productCategory}
                onChange={e => setAdvancedFilters(f => ({ ...f, productCategory: e.target.value }))}
                className="col-span-4 w-full h-10 px-3 py-2 pmsearch"
                aria-label="Product Category"
                title={advancedFilters.productGroup ? 'Filtered by Product Group' : 'All categories'}
              >
                <option value="">Product Category</option>
                {productCategories.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>

              {/* Active (2/12) */}
              <select
                value={advancedFilters.active}
                onChange={e => setAdvancedFilters(f => ({ ...f, active: e.target.value }))}
                className="col-span-2 w-full h-10 px-3 py-2 pmsearch"
                aria-label="Active"
              >
                <option value="">Active</option>
                <option value="Y">Y</option>
                <option value="N">N</option>
              </select>
            </div>
          }
        >
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
            className="col-span-9 w-full h-10 px-3 py-2 pmsearch"
          />
        </SearchBarAdvanced>
      }
      paneHeader={
        <PaneHeader
          title={headerTitle}
          onResetColumns={handleResetColumns}
        />
      }
      table={
        <DataTable
          columns={COMPONENT_COLUMNS}
          data={tableRows}
          rowKey="code"
          storageKey={TABLE_STORAGE_KEY}
          loading={loading}
          selectedRowKey={selectedCompCode}
          onRowClick={(row: any) => {
            setSelectedCompCode(String(row.code ?? ''));
            onSelectProduct?.(row);
          }}
          onRowDoubleClick={(row: any) => {
            setSelectedCompCode(String(row.code ?? ''));
            onOpenProduct?.(row);
          }}
          emptyMessage={
            !isResultsMode && !selectedCatObj
              ? '← Select a category to view components.'
              : !isResultsMode && selectedCatObj && filteredComponents.length === 0
              ? 'No components match your filters.'
              : isResultsMode && tableRows.length === 0
              ? searchTitle || 'Results (0)'
              : 'No components found'
          }
        />
      }
      />
    </div>
  );
}


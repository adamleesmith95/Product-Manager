import React, { useEffect, useMemo, useRef, useState } from 'react';
import BrowserLayout from './shared/BrowserLayout';
import DataTable from './shared/DataTable';
import { useDataCache } from '../context/DataCacheContext';
import SearchToolbar from './shared/SearchToolbar';
import PaneHeader from './shared/PaneHeader';
import PaneActions from './shared/PaneActions';
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
  // Add these to COMPONENT_COLUMNS array:

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

export default function ProductComponentSearch() {
  const [filters, setFilters] = useState({ pc: '', description: '' });
  const [tree, setTree] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState(() => new Set());
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCompCode, setSelectedCompCode] = useState('');
  //const [loading, setLoading] = useState(false);

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

  const handleResetColumns = () => {
    resetTableColumns(TABLE_STORAGE_KEY);
    window.location.reload();
  };

  const handleNew = () => {
    // handle new component logic
  };

  const handleClone = () => {
    // handle clone component logic
  };

  const paneFooter = (
    <PaneActions
      onNew={handleNew}
      onClone={handleClone}
      newLabel="New"
      cloneLabel="Clone"
    />
  );

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
        <SearchToolbar onSearch={handleSearch} onClear={handleClear}>
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
        </SearchToolbar>
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
          onRowClick={(row) => setSelectedCompCode(row.code)}
          onRowDoubleClick={(row) => {
            if (isResultsMode) {
              jumpToComponentCategory(row);
            }
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
      paneFooter={paneFooter}
    />
  );
}
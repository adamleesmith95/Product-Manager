import React, { useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import BrowserLayout from './shared/BrowserLayout';
import DataTable from './shared/DataTable';
import { useDataCache } from '../context/DataCacheContext';
import SearchToolbar from './shared/SearchToolbar';
import PaneHeader from './shared/PaneHeader';
import PaneActions from './shared/PaneActions';
import { useBrowserData } from '../hooks/useBrowserData';
import Field from './Field';
import TextInput from './TextInput';
import { resetTableColumns } from '../utils/tableStorage';

const DISPLAY_CATEGORY_COLUMNS = [
  { key: 'code', label: 'Code', sortable: true, sortType: 'string' as const },
  { key: 'label', label: 'Description', sortable: true, sortType: 'string' as const },
  { key: 'displayGroupCode', label: 'Display Group Code', sortable: true, sortType: 'string' as const },
  { key: 'displayGroup', label: 'Display Group', sortable: true, sortType: 'string' as const },
  { key: 'active', label: 'Active', sortable: true, sortType: 'string' as const },
  { key: 'order', label: 'Display Order', sortable: true, sortType: 'number' as const },
  { key: 'operatorId', label: 'Operator ID', sortable: true, sortType: 'string' as const },
  { key: 'updated', label: 'Updated', sortable: true, sortType: 'string' as const },
];

const TABLE_STORAGE_KEY = 'display-category-search';

interface Props {
  onOpenCategory?: (row: any) => void;
  onSelectCategory?: (row: any) => void;
  onNew?: () => void;
  onClone?: () => void;
  newLabel?: string;
  cloneLabel?: string;
  inlineDetailPanel?: ReactNode;
}

export default function DisplayCategorySearch({
  onOpenCategory,
  onSelectCategory,
  onNew,
  onClone,
  newLabel,
  cloneLabel,
  inlineDetailPanel,
}: Props) {
  const { cache, setCache } = useDataCache();

  const [filters, setFilters] = useState({ code: '', description: '' });
  const [tree, setTree] = useState([]);
  const [selectedGroupCode, setSelectedGroupCode] = useState('');
  const [selectedCategoryCode, setSelectedCategoryCode] = useState(null);
  const groupBtnRefs = useRef({});

  const [searchTitle, setSearchTitle] = useState('');
  const [resultRows, setResultRows] = useState([]);

  const isResultsMode = !!searchTitle?.trim();

  const {
    data: dcTreeData,
    loading,
    error: dcTreeError,
  } = useBrowserData(
    [cache.dcTree],
    async (signal) => {
      if (Array.isArray(cache.dcTree) && cache.dcTree.length) return cache.dcTree;
      const res = await fetch('/api/display-categories/tree', { signal });
      const json = await res.json();
      return Array.isArray(json) ? json : [];
    }
  );

  useEffect(() => {
    if (!dcTreeData) return;
    setTree(dcTreeData);
    if (!(Array.isArray(cache.dcTree) && cache.dcTree.length)) {
      setCache('dcTree', dcTreeData);
    }
  }, [dcTreeData, cache.dcTree, setCache]);

  useEffect(() => {
    if (dcTreeError) console.error('[DC Search] tree load failed', dcTreeError);
  }, [dcTreeError]);

  const selectedGroupObj = useMemo(
    () => tree.find((g) => String(g.groupCode) === String(selectedGroupCode)) || null,
    [tree, selectedGroupCode]
  );

  const categories = useMemo(() => {
    if (!selectedGroupObj) return [];
    return (selectedGroupObj.categories || []).map((cat) => ({
      ...cat,
      displayGroup: selectedGroupObj.label,
    }));
  }, [selectedGroupObj]);

  const tableRows = isResultsMode ? resultRows : categories;

  const handleSelectGroup = (groupCode) => {
    setSelectedGroupCode(String(groupCode));
    setSearchTitle('');
    setResultRows([]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((f) => ({ ...f, [name]: value }));
  };

  const handleSearch = () => {
    const qCode = filters.code.trim().toLowerCase();
    const qDesc = filters.description.trim().toLowerCase();

    if (!qCode && !qDesc) {
      setSearchTitle('');
      setResultRows([]);
      setSelectedCategoryCode(null);
      return;
    }

    // CODE search = drive to owning group, show that group's categories
    if (qCode) {
      let hitGroup = null;
      let hitCode = null;

      for (const group of tree) {
        const cats = group.categories || [];
        const hit = cats.find((cat) =>
          String(cat.code ?? '').toLowerCase().includes(qCode)
        );
        if (hit) {
          hitGroup = group;
          hitCode = String(hit.code);
          break;
        }
      }

      if (!hitGroup) {
        setSearchTitle('Results (0)');
        setResultRows([]);
        setSelectedCategoryCode(null);
        return;
      }

      setSelectedGroupCode(String(hitGroup.groupCode));
      setSearchTitle('');        // important: header uses group title, not "Results (n)"
      setResultRows([]);         // use selected-group mode rows
      setSelectedCategoryCode(hitCode);

      requestAnimationFrame(() => {
        scrollGroupIntoView(hitGroup.groupCode);
        scrollRowIntoView(hitCode);
      });

      return;
    }

    // DESCRIPTION search = results mode
    const matchingGroups = tree.filter((group) =>
      (group.categories || []).some((cat) => {
        const label = String(cat.label ?? '').toLowerCase();
        return qDesc ? label.includes(qDesc) : true;
      })
    );

    const rows = matchingGroups.flatMap((group) =>
      (group.categories || []).map((cat) => ({
        ...cat,
        displayGroup: group.label,
        displayGroupCode: group.groupCode,
      }))
    );

    setResultRows(rows);
    setSearchTitle(`Results (${rows.length})`);
    setSelectedCategoryCode(null);
  };

  const handleClear = () => {
    setFilters({ code: '', description: '' });
    setSearchTitle('');
    setResultRows([]);
    setSelectedCategoryCode(null);
  };

  const onKeyDownBasic = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      handleClear();
    }
  };

  const headerTitle = isResultsMode
    ? searchTitle
    : selectedGroupObj
      ? `${selectedGroupObj.label} (${selectedGroupObj.groupCode})`
      : 'Choose a display group';

  const handleResetColumns = () => {
    resetTableColumns(TABLE_STORAGE_KEY);
    window.location.reload();
  };

  const scrollGroupIntoView = (groupCode) => {
    const el = groupBtnRefs.current[String(groupCode)];
    if (el) el.scrollIntoView({ block: 'nearest' });
  };

  const scrollRowIntoView = (code) => {
    requestAnimationFrame(() => {
      const row = document.getElementById(`row-${code}`);
      if (row) row.scrollIntoView({ block: 'nearest' });
    });
  };

  const handleNew = () => {
    // handle new category logic
  };

  const handleClone = () => {
    // handle clone category logic
  };

  return (
    <BrowserLayout
      sidebar={
        <>
          <div className="pm-sidebar-title">Display Groups</div>
          <div className="pm-sidebar-scroll">
            {tree.map((group) => {
              const selected = String(selectedGroupCode) === String(group.groupCode);
              return (
                <button
                  key={group.groupCode}
                  type="button"
                  onClick={() => handleSelectGroup(group.groupCode)}
                  className={`pm-list-item ${selected ? 'pm-list-item-small pm-list-item--active' : 'pm-list-item-small'} block`}
                  title={group.label}
                  ref={(el) => { groupBtnRefs.current[String(group.groupCode)] = el; }}
                >
                  <div className="truncate">
                    {group.label}
                    <span className="ml-2 text-[11px] text-neutral-500">({group.groupCode})</span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      }
      searchPanel={
        <SearchToolbar onSearch={handleSearch} onClear={handleClear}>
          <input
            type="text"
            name="code"
            placeholder="Display Category Code"
            value={filters.code}
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
        <div className="min-w-0 w-full overflow-x-hidden">
          <DataTable
            columns={DISPLAY_CATEGORY_COLUMNS}
            data={tableRows}
            rowKey="code"
            storageKey={TABLE_STORAGE_KEY}
            loading={loading}
            autoSizeDeps={[tableRows.length]}
            className="w-full"
            selectedRowKey={selectedCategoryCode}
            onRowClick={(row: any) => {
              const code = String(row?.code ?? '');
              setSelectedCategoryCode(code);
              onSelectCategory?.(row);
            }}
            onRowDoubleClick={(row: any) => {
              const code = String(row?.code ?? '');
              setSelectedCategoryCode(code);
              onOpenCategory?.(row);
            }}
            emptyMessage={
              !isResultsMode && !selectedGroupObj
                ? '← Select a display group to view categories.'
                : !isResultsMode && selectedGroupObj && tableRows.length === 0
                ? 'No categories found for this group.'
                : isResultsMode && tableRows.length === 0
                ? searchTitle || 'Results (0)'
                : 'No categories found'
            }
          />
        </div>
      }
      paneFooter={
        <PaneActions
          onNew={handleNew}
          onClone={handleClone}
          newLabel="New"
          cloneLabel="Clone"
        />
      }
    />
  );
}
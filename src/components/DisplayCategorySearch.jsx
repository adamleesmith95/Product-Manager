import React, { useEffect, useMemo, useRef, useState } from 'react';
import BrowserLayout from './shared/BrowserLayout';
import DataTable from './shared/DataTable';
import { useDataCache } from '../context/DataCacheContext';

const DISPLAY_CATEGORY_COLUMNS = [
  { key: 'code', label: 'Code', sortable: true, sortType: 'string', width: '120px' },
  { key: 'label', label: 'Description', sortable: true, sortType: 'string', width: '300px' },
  { key: 'displayGroupCode', label: 'Display Group Code', sortable: true, sortType: 'string', width: '150px' },
  { key: 'displayGroup', label: 'Display Group', sortable: true, sortType: 'string', width: '200px' },
  { key: 'active', label: 'Active', sortable: true, sortType: 'string', width: '80px' },
  { key: 'order', label: 'Display Order', sortable: true, sortType: 'number', width: '120px' },
  { key: 'operatorId', label: 'Operator ID', sortable: true, sortType: 'string', width: '120px' },
  { key: 'updated', label: 'Updated', sortable: true, sortType: 'string', width: '100px' },
];

export default function DisplayCategorySearch() {
  const { cache, setCache } = useDataCache();

  const [filters, setFilters] = useState({ code: '', description: '' });
  const [tree, setTree] = useState([]);
  const [selectedGroupCode, setSelectedGroupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCategoryCode, setSelectedCategoryCode] = useState(null);
  const groupBtnRefs = useRef({});

  const [searchTitle, setSearchTitle] = useState('');
  const [resultRows, setResultRows] = useState([]);

  const isResultsMode = !!searchTitle?.trim();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (Array.isArray(cache.dcTree) && cache.dcTree.length) {
          setTree(cache.dcTree);
          return;
        }

        setLoading(true);
        const res = await fetch('/api/display-categories/tree');
        const json = await res.json();
        if (!alive) return;

        const list = Array.isArray(json) ? json : [];
        setTree(list);
        setCache('dcTree', list);
      } catch (err) {
        console.error('[DC Search] tree load failed', err);
        setTree([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [cache.dcTree, setCache]);

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
    localStorage.removeItem('colw:displayCategoryTable');
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
                  className={`${selected ? 'pm-list-item-small pm-list-item--active' : 'pm-list-item-small'} block`}
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
        <>
          <div className="pm-section grid grid-cols-12 gap-4 items-center">
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
              onClick={handleResetColumns}
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
          columns={DISPLAY_CATEGORY_COLUMNS}
          data={tableRows}
          rowKey="code"
          storageKey="displayCategoryTable"
          loading={loading}
          emptyMessage={
            !isResultsMode && !selectedGroupObj
              ? '← Select a display group to view categories.'
              : !isResultsMode && selectedGroupObj && tableRows.length === 0
              ? 'No categories found for this group.'
              : isResultsMode && tableRows.length === 0
              ? searchTitle || 'Results (0)'
              : 'No categories found'
          }
          selectedRowKey={selectedCategoryCode}
        />
      }
      paneFooter={
        <div className="flex items-center gap-2">
          <button className="btn btn-light">New</button>
          <button className="btn btn-light">Clone</button>
        </div>
      }
    />
  );
}
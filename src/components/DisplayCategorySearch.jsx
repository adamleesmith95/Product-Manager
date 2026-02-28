import React, { useEffect, useMemo, useState } from 'react';
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
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroupCode, setSelectedGroupCode] = useState(null);

  // Search states
  const [isResultsMode, setIsResultsMode] = useState(false);
  const [searchTitle, setSearchTitle] = useState('');
  const [resultRows, setResultRows] = useState([]);

  console.log('[DC] Component rendered');
  console.log('[DC] selectedGroupCode:', selectedGroupCode);
  console.log('[DC] tree length:', tree.length);

  // Load tree on mount
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (cache.dcTree) {
          console.log('[DC] Using cached tree');
          setTree(cache.dcTree);
          return;
        }

        setLoading(true);
        const res = await fetch('/api/display-categories/tree');
        const json = await res.json();
        if (!alive) return;

        const list = Array.isArray(json) ? json : [];
        
        if (list.length > 0 && list[0].categories?.length > 0) {
          const firstCat = list[0].categories[0];
          console.log('[DC Search] First category data:', firstCat);
          console.log('[DC Search] Available keys:', Object.keys(firstCat || {}));
        }

        setTree(list);
        setCache('dcTree', list);
      } catch (err) {
        console.error('[DC Search] tree load failed', err);
        setTree([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [cache, setCache]);

  // Select a group
  const handleSelectGroup = (groupCode) => {
    setSelectedGroupCode(groupCode);
    setIsResultsMode(false);
  };

  // Get selected group object
  const selectedGroupObj = useMemo(() => {
    return tree.find(g => g.groupCode === selectedGroupCode);
  }, [tree, selectedGroupCode]);

  // Flatten categories for selected group
  const categories = useMemo(() => {
    if (!selectedGroupObj) return [];
    return (selectedGroupObj.categories || []).map(cat => ({
      ...cat,
      displayGroup: selectedGroupObj.label,
    }));
  }, [selectedGroupObj]);

  const tableRows = isResultsMode ? resultRows : categories;

  // Search handler
  const handleSearch = (query) => {
    if (!query.trim()) {
      setIsResultsMode(false);
      setResultRows([]);
      setSearchTitle('');
      return;
    }

    const lowerQuery = query.toLowerCase();
    const results = [];

    tree.forEach(group => {
      (group.categories || []).forEach(cat => {
        const matches = 
          cat.code?.toLowerCase().includes(lowerQuery) ||
          cat.label?.toLowerCase().includes(lowerQuery) ||
          cat.displayGroupCode?.toLowerCase().includes(lowerQuery);

        if (matches) {
          results.push({
            ...cat,
            displayGroup: group.label,
          });
        }
      });
    });

    setResultRows(results);
    setIsResultsMode(true);
    setSearchTitle(`Results (${results.length})`);
  };

  const handleResetColumns = () => {
    setTree([]);
    setCache('dcTree', []);
  };

  return (
    <BrowserLayout
      title={isResultsMode ? `Search Results (${resultRows.length})` : 'Manage Display Categories'}
      onBack={isResultsMode ? () => setIsResultsMode(false) : undefined}
      actions={
        <button
          onClick={handleResetColumns}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium"
        >
          Reset Columns
        </button>
      }
      sidebar={
        
        !isResultsMode && (
          <div className="pm-sidebar-scroll">
            {tree.map(group => {
              const isSelected = selectedGroupCode === group.groupCode;
              return (
                <div key={group.groupCode} className="mb-1">
                  <button
                    onClick={() => handleSelectGroup(group.groupCode)}
                    className={`pm-sidebar-item ${
                      isSelected ? 'pm-sidebar-item-selected' : ''
                    }`}
                  >
                    <span className="pm-sidebar-label">{group.label}</span>
                    <span className="pm-sidebar-count">
                      {group.groupCode}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )
      }
    
    

      
     table={  // ✅ Use table prop instead of children!
      <>
        {console.log('[DC] About to render DataTable')}
    
        <DataTable
          columns={DISPLAY_CATEGORY_COLUMNS}
          data={tableRows}
          rowKey="code"
          storageKey="displayCategoryTable"
          loading={loading}
          emptyMessage={
            !selectedGroupCode
              ? '← Select a display group to view categories'
              : 'No categories found'
          }
        
        />
      </>
    }
     paneFooter={
        <>
          <button className="btn btn-light">New</button>
          <button className="btn btn-light">Clone</button>
        </>
      }
  />
)
}
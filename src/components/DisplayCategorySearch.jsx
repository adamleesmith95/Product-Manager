import React, { useEffect, useMemo, useRef, useState } from 'react';
import BrowserLayout from './shared/BrowserLayout';
import DataTable from './shared/DataTable';
import { useDataCache } from '../context/DataCacheContext';

const DISPLAY_CATEGORY_COLUMNS = [
  { key: 'code', label: 'Code', sortable: true, sortType: 'string' },
  { key: 'label', label: 'Description', sortable: true, sortType: 'string' },
  { key: 'displayGroupCode', label: 'Display Group Code', sortable: true, sortType: 'string' },
  { key: 'displayGroup', label: 'Display Group', sortable: true, sortType: 'string' },
  { key: 'active', label: 'Active', sortable: true, sortType: 'string' },
  { key: 'order', label: 'Display Order', sortable: true, sortType: 'number' },
  { key: 'operatorId', label: 'Operator ID', sortable: true, sortType: 'string' },
  { key: 'updated', label: 'Updated', sortable: true, sortType: 'string' },
];

export default function DisplayCategorySearch() {
  const { cache, setCache } = useDataCache();
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Load tree on mount
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Check cache first
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

  // Toggle group expansion
  const toggleGroup = (groupCode) => {
    const next = new Set(expandedGroups);
    if (next.has(groupCode)) {
      next.delete(groupCode);
      if (selectedGroup === groupCode) {
        setSelectedGroup(null);
      }
    } else {
      next.add(groupCode);
    }
    setExpandedGroups(next);
  };

  // Select a group to view its categories
  const handleSelectGroup = (groupCode) => {
    setSelectedGroup(groupCode);
    if (!expandedGroups.has(groupCode)) {
      toggleGroup(groupCode);
    }
  };

  // Flatten categories for selected group
  const selectedGroupObj = useMemo(() => {
    return tree.find(g => g.groupCode === selectedGroup);
  }, [tree, selectedGroup]);

  const categories = useMemo(() => {
    if (!selectedGroupObj) return [];
    return (selectedGroupObj.categories || []).map(cat => ({
      ...cat,
      displayGroup: selectedGroupObj.label,
    }));
  }, [selectedGroupObj]);

  const tableRows = categories;

  return (
    <BrowserLayout
      title="Manage Display Categories"
      sidebar={
        <div className="pm-sidebar-scroll">
          {tree.map(group => {
            const open = expandedGroups.has(group.groupCode);
            const isSelected = selectedGroup === group.groupCode;
            return (
              <div key={group.groupCode} className="mb-2">
                <button
                  onClick={() => toggleGroup(group.groupCode)}
                  className={`pm-sidebar-group ${isSelected ? 'pm-sidebar-group-selected' : ''}`}
                >
                  <span className="pm-sidebar-caret">{open ? '▼' : '▶'}</span>
                  <span className="pm-sidebar-label">{group.label}</span>
                  <span className="pm-sidebar-count">
                    ({group.categories?.length || 0})
                  </span>
                </button>

                {open && (
                  <div className="pm-sidebar-categories">
                    <button
                      onClick={() => handleSelectGroup(group.groupCode)}
                      className={`pm-sidebar-category ${
                        isSelected ? 'pm-sidebar-category-selected' : ''
                      }`}
                    >
                      <span className="pm-sidebar-label">
                        All in {group.label}
                      </span>
                      <span className="pm-sidebar-count">
                        ({group.categories?.length || 0})
                      </span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      }
    >
      <DataTable
        columns={DISPLAY_CATEGORY_COLUMNS}
        data={tableRows}
        loading={loading}
        emptyMessage={
          !selectedGroup
            ? '← Select a display group from the left to view categories'
            : 'No categories in this group'
        }
        stickyHeader
        maxHeight="600px"
      />
    </BrowserLayout>
  );
}
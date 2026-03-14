import React, { useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import BrowserLayout from './shared/BrowserLayout';
import DataTable from './shared/DataTable';
import { useDataCache } from '../context/DataCacheContext';
import SearchToolbar from './shared/SearchToolbar';
import PaneHeader from './shared/PaneHeader';
import PaneActions from './shared/PaneActions';
import { useBrowserData } from '../hooks/useBrowserData';
import { resetTableColumns } from '../utils/tableStorage';
import RowContextMenu from './shared/RowContextMenu';

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

type Anchor = { code: string; ts: number } | null;

type Props = {
  onOpenCategory?: (row: any) => void;
  onSelectCategory?: (row: any) => void;
  onModifyCategory?: (row: any) => void;
  onGoToProductsForSale?: (row: any) => void;
  onModifyGroup?: (row: any) => void;
  onGoToDisplayGroup?: (row: any) => void;
  onNew?: () => void;
  onClone?: () => void;
  newLabel?: string;
  cloneLabel?: string;
  inlineDetailPanel?: ReactNode;
  groupAnchor?: Anchor;
  categoryAnchor?: Anchor;
};

export default function DisplayCategorySearch({
  onOpenCategory,
  onSelectCategory,
  onModifyCategory,
  onGoToProductsForSale,
  onModifyGroup,
  onGoToDisplayGroup,
  onNew,
  onClone,
  newLabel,
  cloneLabel,
  inlineDetailPanel,
  groupAnchor = null,
  categoryAnchor = null,
}: Props) {
  const { cache, setCache } = useDataCache();

  const [filters, setFilters] = useState({ code: '', description: '' });
  const [tree, setTree] = useState([]);
  const [selectedGroupCode, setSelectedGroupCode] = useState<string>('');
  const [selectedCategoryCode, setSelectedCategoryCode] = useState<string>('');
  const [ctx, setCtx] = useState<{ x: number; y: number; row: any } | null>(null);
  const [groupCtx, setGroupCtx] = useState<{ x: number; y: number; group: any } | null>(null);

  const groupBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

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

  const appliedAnchorTsRef = useRef<number>(0);

  useEffect(() => {
    const close = () => {
      setCtx(null);
      setGroupCtx(null);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('click', close);
    window.addEventListener('keydown', onEsc);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', onEsc);
    };
  }, []);

  const pendingScrollGroupRef = useRef<string>('');

  // Stage 1: apply group anchor once tree is loaded
  useEffect(() => {
    console.log('[DCS] stage1 effect fired', { tree: tree?.length, groupAnchor, categoryAnchor });
    if (!tree?.length) return;
    const ts = Number(groupAnchor?.ts ?? categoryAnchor?.ts ?? 0);
    if (!ts || appliedAnchorTsRef.current === ts) {
      console.log('[DCS] stage1 skipped', { ts, applied: appliedAnchorTsRef.current });
      return;
    }

    let targetGroup = String(groupAnchor?.code ?? '');
    const wantedCategory = String(categoryAnchor?.code ?? '');

    if (!targetGroup && wantedCategory) {
      for (const g of tree as any[]) {
        const cats = Array.isArray(g?.categories) ? g.categories : [];
        const hit = cats.find((c: any) => String(c?.code ?? '') === wantedCategory);
        if (hit) {
          targetGroup = String(g?.groupCode ?? '');
          break;
        }
      }
    }

    console.log('[DCS] stage1 applying', { targetGroup, wantedCategory, ts });
    if (targetGroup) {
      pendingScrollGroupRef.current = targetGroup;
      setSelectedGroupCode(targetGroup);
    }
    appliedAnchorTsRef.current = ts;
  }, [tree, groupAnchor, categoryAnchor]);

  // Scroll left-pane button into view AFTER React re-renders with new selectedGroupCode
  useEffect(() => {
    const target = pendingScrollGroupRef.current;
    if (!target) return;
    if (String(selectedGroupCode) !== target) return;

    const attemptScroll = (attemptsLeft: number) => {
      const el = groupBtnRefs.current[target];
      if (el) {
        // scroll within sidebar container directly
        const sidebar = sidebarScrollRef.current;
        if (sidebar) {
          const elTop = el.offsetTop;
          const elHeight = el.offsetHeight;
          const sidebarHeight = sidebar.clientHeight;
          sidebar.scrollTo({
            top: elTop - sidebarHeight / 2 + elHeight / 2,
            behavior: 'smooth',
          });
          console.log('[DCS] scrolled sidebar to', target, { elTop, sidebarHeight });
        } else {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
        pendingScrollGroupRef.current = '';
      } else if (attemptsLeft > 0) {
        setTimeout(() => attemptScroll(attemptsLeft - 1), 100);
      } else {
        console.warn('[DCS] gave up scrolling to', target);
        pendingScrollGroupRef.current = '';
      }
    };

    attemptScroll(5);
  }, [selectedGroupCode, tree]);

  const pendingScrollCategoryRef = useRef<string>('');

  // Stage 2: apply category anchor after categories for selected group load
  useEffect(() => {
    const wantedCategory = String(categoryAnchor?.code ?? '');
    const ts = Number(categoryAnchor?.ts ?? 0);
    if (!wantedCategory || !ts) return;
    if (!categories?.length) return;

    const match = categories.find((c: any) => String(c?.code ?? '') === wantedCategory);
    if (!match) return;

    pendingScrollCategoryRef.current = wantedCategory;
    setSelectedCategoryCode(wantedCategory);
    onSelectCategory?.(match);
    console.log('[DCS] stage2 category anchor applied', { wantedCategory });
  }, [categories, categoryAnchor, onSelectCategory]);

  // Scroll right-pane selected row into view after DataTable renders
  useEffect(() => {
    const target = pendingScrollCategoryRef.current;
    if (!target) return;
    if (String(selectedCategoryCode) !== target) return;

    const attemptScroll = (attemptsLeft: number) => {
      // DataTable applies selectedRowKey as a highlighted row - try known selectors
      const selectors = [
        `tr[data-row-key="${target}"]`,
        `tr[data-key="${target}"]`,
        `tr.pm-row--selected`,
        `tr.pm-row-selected`,
        `tr.selected`,
      ];

      let found = false;
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
          console.log('[DCS] scrolled row into view via', sel, target);
          pendingScrollCategoryRef.current = '';
          found = true;
          break;
        }
      }

      if (!found) {
        if (attemptsLeft > 0) {
          setTimeout(() => attemptScroll(attemptsLeft - 1), 100);
        } else {
          console.warn('[DCS] gave up scrolling to row', target);
          pendingScrollCategoryRef.current = '';
        }
      }
    };

    attemptScroll(5);
  }, [selectedCategoryCode, categories]);

  const sidebarScrollRef = useRef<HTMLDivElement | null>(null);

  return (
    <>
      <BrowserLayout
        sidebar={
          <>
            <div className="pm-sidebar-title">Display Groups</div>
            <div
              className="pm-sidebar-scroll"
              ref={sidebarScrollRef}
            >
              {tree.map((group) => {
                const selected = String(selectedGroupCode) === String(group.groupCode);
                return (
                  <button
                    key={group.groupCode}
                    type="button"
                    onClick={() => handleSelectGroup(group.groupCode)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelectGroup(group.groupCode);
                      setGroupCtx({ x: e.clientX, y: e.clientY, group });
                    }}
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
              onRowContextMenu={(row: any, e: React.MouseEvent<HTMLTableRowElement>) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedCategoryCode(String(row?.code ?? ''));
                setCtx({ x: e.clientX, y: e.clientY, row });
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

      {ctx && (
        <RowContextMenu
          x={ctx.x}
          y={ctx.y}
          actions={[
            {
              key: 'modify',
              label: 'Modify',
              onClick: () => {
                onModifyCategory?.(ctx.row);
                setCtx(null);
              },
            },
            {
              key: 'goto-products',
              label: 'Go to Products for Sale',
              onClick: () => {
                onGoToProductsForSale?.(ctx.row);
                setCtx(null);
              },
            },
          ]}
        />
      )}
      {groupCtx && (
        <RowContextMenu
          x={groupCtx.x}
          y={groupCtx.y}
          actions={[
            {
              key: 'modify-group',
              label: 'Modify',
              onClick: () => {
                onModifyGroup?.(groupCtx.group);
                setGroupCtx(null);
              },
            },
            {
              key: 'goto-display-group',
              label: 'Go to Display Group',
              onClick: () => {
                onGoToDisplayGroup?.(groupCtx.group);
                setGroupCtx(null);
              },
            },
          ]}
        />
      )}
    </>
  );
}
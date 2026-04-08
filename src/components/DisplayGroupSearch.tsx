import React, { useState, useEffect, useRef, useMemo, useCallback, ReactNode } from 'react';
import BrowserLayout from './shared/BrowserLayout';
import DataTable from './shared/DataTable';
import { useBrowserData } from '../hooks/useBrowserData';
import PaneHeader from './shared/PaneHeader';
import PaneActions from './shared/PaneActions';
import SearchToolbar from './shared/SearchToolbar';
import { resetTableColumns } from '../utils/tableStorage';
import RowContextMenu from './shared/RowContextMenu';
import { newTabLabel } from './shared/contextMenuNavActions';

const TABLE_STORAGE_KEY = 'display-group-search';

const COLUMNS = [
  { key: 'code', label: 'Code', sortable: true, width: 72, maxWidth: 90, sortType: 'string' as const },
  { key: 'description', label: 'Description', sortable: true, maxWidth: 100, sortType: 'string' as const },
  { key: 'active', label: 'Active', sortable: true, width: 64, maxWidth: 76, sortType: 'string' as const },
  { key: 'displayOrder', label: 'Display Order', sortable: true, maxWidth: 100, sortType: 'number' as const },
  { key: 'operatorId', label: 'Operator ID', sortable: true, maxWidth: 100, sortType: 'string' as const },
  { key: 'updated', label: 'Updated', sortable: true, width: 120, maxWidth: 240, sortType: 'string' as const },
];

type Anchor = { code: string; ts: number } | null;

type Props = {
  onOpenGroup?: (row: any) => void;
  onGoToDisplayCategory?: (row: any) => void;
  onSelectGroup?: (row: any) => void;
  onNew?: () => void;
  onClone?: () => void;
  newLabel?: string;
  cloneLabel?: string;
  inlineDetailPanel?: ReactNode;
  groupAnchor?: Anchor;
};
  

export default function DisplayGroupSearch({
  onOpenGroup,
  onGoToDisplayCategory,
  onSelectGroup,
  onNew,
  onClone,
  newLabel,
  cloneLabel,
  inlineDetailPanel,
  groupAnchor = null,
}: Props) {
  const [filters, setFilters] = useState({ code: '', description: '' });
  const [appliedFilters, setAppliedFilters] = useState({ code: '', description: '' });
  const [selectedGroupCode, setSelectedGroupCode] = useState<string | null>(null);
  const appliedAnchorTsRef = useRef<number>(0);
  const [groupCtx, setGroupCtx] = useState<{ x: number; y: number; row: any } | null>(null);
  // const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  const fetchDisplayGroups = useCallback(async (signal) => {
    const res = await fetch('/api/display-groups', { signal });
    const json = await res.json();
    const rows = Array.isArray(json) ? json : Array.isArray(json?.rows) ? json.rows : [];
    return rows;
  }, []);

  const { data, loading, error } = useBrowserData([], fetchDisplayGroups);

  const rawRows = Array.isArray(data) ? data : [];

  const tableRows = useMemo(() => {
    const codeQ = appliedFilters.code.trim().toLowerCase();
    const descQ = appliedFilters.description.trim().toLowerCase();

    if (!codeQ && !descQ) return rawRows;

    return rawRows.filter((r) => {
      const code = String(r.code ?? '').toLowerCase();
      const desc = String(r.description ?? '').toLowerCase();
      return (!codeQ || code.includes(codeQ)) && (!descQ || desc.includes(descQ));
    });
  }, [rawRows, appliedFilters]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setAppliedFilters({
      code: filters.code,
      description: filters.description,
    });
  };

  const handleClear = () => {
    const cleared = { code: '', description: '' };
    setFilters(cleared);
    setAppliedFilters(cleared);
  };

  const onKeyDownBasic = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      handleClear();
    }
  };

  const handleResetColumns = () => {
    resetTableColumns(TABLE_STORAGE_KEY);
    window.location.reload();
  };

  useEffect(() => {
    const code = String(groupAnchor?.code ?? '');
    const ts = Number(groupAnchor?.ts ?? 0);
    if (!code || !ts) return;

    // Keep selected state in sync immediately
    setSelectedGroupCode(code);

    // Wait until rows are actually present before considering anchor "applied"
    const match = tableRows.find((r: any) => String(r?.code ?? r?.groupCode ?? '') === code);
    if (!match) return;

    // If already applied for this timestamp, stop
    if (appliedAnchorTsRef.current === ts) return;

    onSelectGroup?.(match);

    const attemptScroll = (attemptsLeft: number) => {
      const selectors = [
      'tr[data-table-key="display-group-search"][data-row-key="' + code + '"]',
      'tr[data-table-key="display-group-search"].pm-row--selected',
      ];

      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
          appliedAnchorTsRef.current = ts; // mark applied only after successful scroll
          return;
        }
      }

      if (attemptsLeft > 0) {
        setTimeout(() => attemptScroll(attemptsLeft - 1), 100);
      }
    };

    attemptScroll(6);
  }, [groupAnchor, tableRows, onSelectGroup]);

  useEffect(() => {
    const close = () => setGroupCtx(null);
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('keydown', onEsc);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', onEsc);
    };
  }, []);

  return (
    <>
      <BrowserLayout
        hideSidebar
        paneHeader={
          <PaneHeader
            onResetColumns={handleResetColumns}
          />
        }
        searchPanel={
          <SearchToolbar onSearch={handleSearch} onClear={handleClear}>
            <input
              type="text"
              name="code"
              placeholder="Display Group Code"
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
        table={
          <div className="min-w-0 w-full overflow-x-hidden">
            <DataTable
              columns={COLUMNS}
              data={tableRows}
              rowKey="code"
              storageKey={TABLE_STORAGE_KEY}
              loading={loading}
              autoSizeDeps={[tableRows.length]}
              emptyMessage="No display groups found"
              className="w-full"
              selectedRowKey={selectedGroupCode}
              onRowClick={(row: any) => {
                const code = String(row?.code ?? '');
                setSelectedGroupCode(code);
                onSelectGroup?.(row);
              }}
              onRowDoubleClick={(row: any) => {
                const code = String(row?.code ?? '');
                setSelectedGroupCode(code);
                onOpenGroup?.(row);
              }}
              onRowContextMenu={(row: any, e: React.MouseEvent<HTMLTableRowElement>) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedGroupCode(String(row?.code ?? row?.groupCode ?? ''));
                setGroupCtx({ x: e.clientX, y: e.clientY, row });
              }}
            />
          </div>
        }
        paneFooter={<PaneActions onNew={onNew} onClone={onClone} />}
      />

      {groupCtx && (
        <RowContextMenu
          x={groupCtx.x}
          y={groupCtx.y}
          actions={[
            {
              key: 'modify',
              label: 'Modify',
              onClick: () => {
                onOpenGroup?.(groupCtx.row);
                setGroupCtx(null);
              },
            },
            {
              key: 'goto-display-category',
              label: 'Go to Display Category',
              onClick: () => {
                onGoToDisplayCategory?.(groupCtx.row);
                setGroupCtx(null);
              },
            },
            { key: 'goto-display-category-new-tab',
              label: newTabLabel('Go to Display Category'),
              onClick: () => {
                const groupCode = String(groupCtx.row?.code ?? groupCtx.row?.groupCode ?? '');
                if (!groupCode) return;
                const params = new URLSearchParams();
                params.set('focusGroupCode', groupCode);
                params.set('navTs', String(Date.now()));
                window.open('/product-manager/manage-display-category?' + params.toString(), '_blank');
                setGroupCtx(null);
            },
          },
          ]}
        />
      )}
    </>
  );
}
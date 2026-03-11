import React, { useState, useCallback, useMemo, ReactNode } from 'react';
import BrowserLayout from './shared/BrowserLayout';
import DataTable from './shared/DataTable';
import { useBrowserData } from '../hooks/useBrowserData';
import PaneHeader from './shared/PaneHeader';
import PaneActions from './shared/PaneActions';
import SearchToolbar from './shared/SearchToolbar';
import { resetTableColumns } from '../utils/tableStorage';

const TABLE_STORAGE_KEY = 'display-group-search';

const COLUMNS = [
  { key: 'code', label: 'Code', width: 72, maxWidth: 90, sortType: 'string' as const },
  { key: 'description', label: 'Description', maxWidth: 100, sortType: 'string' as const },
  { key: 'active', label: 'Active', width: 64, maxWidth: 76, sortType: 'string' as const },
  { key: 'displayOrder', label: 'Display Order', maxWidth: 100, sortType: 'number' as const },
  { key: 'operatorId', label: 'Operator ID', maxWidth: 100, sortType: 'string' as const },
  { key: 'updated', label: 'Updated', width: 120, maxWidth: 240, sortType: 'string' as const },
];

interface Props {
  onOpenGroup?: (row: any) => void;
  onSelectGroup?: (row: any) => void;
  onNew?: () => void;
  onClone?: () => void;
  newLabel?: string;
  cloneLabel?: string;
  inlineDetailPanel?: ReactNode;
}

export default function DisplayGroupSearch({
  onOpenGroup,
  onSelectGroup,
  onNew,
  onClone,
  newLabel,
  cloneLabel,
  inlineDetailPanel,
}: Props) {
  const [filters, setFilters] = useState({ code: '', description: '' });
  const [appliedFilters, setAppliedFilters] = useState({ code: '', description: '' });
  const [selectedGroupCode, setSelectedGroupCode] = useState<string | null>(null);

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

  return (
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
          />
        </div>
      }
      paneFooter={<PaneActions onNew={onNew} onClone={onClone} />}
    />
  );
}
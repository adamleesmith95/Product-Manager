import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useTableColumnSizing } from '../../hooks/useTableColumnSizing';

export type ColumnDefinition<T> = {
  key: keyof T;
  label: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
  sortType?: 'string' | 'number' | 'date';
};

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

type DataTableProps<T> = {
  columns: ColumnDefinition<T>[];
  data: T[];
  rowKey: keyof T;
  storageKey: string;
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  selectedRowKey?: string | number | null;
  emptyMessage?: string;
  className?: string;
  defaultSort?: { key: keyof T; direction: 'asc' | 'desc' };
  loading?: boolean;
};

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  storageKey,
  onRowClick,
  onRowDoubleClick,
  selectedRowKey,
  emptyMessage = 'No data available',
  className = '',
  defaultSort,
  loading = false,  // ADD THIS with default
}: DataTableProps<T>) {
  const tableRef = useRef<HTMLTableElement>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>(
    defaultSort ? { key: String(defaultSort.key), direction: defaultSort.direction } : null
  );

  // Build columnCaps object
  const columnCaps = useMemo(() => {
    return columns.reduce((acc, col, idx) => {
      if (col.minWidth || col.maxWidth || col.width) {
        acc[idx] = {
          min: col.minWidth,
          max: col.maxWidth,
          seed: col.width, // Use width as the seed/default size
        };
      }
      return acc;
    }, {} as Record<number, { min?: number; max?: number; seed?: number }>);
  }, [columns]);

  const { ColGroup, startResize, autoFitColumn } = useTableColumnSizing(tableRef, {
    storageKey,
    sampleRows: 300,
    minPx: 3,
    maxPx: 800,
    autoSizeDeps: [data.length, columns.length],
    columnCaps,
  });

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    const sorted = [...data];
    const column = columns.find(col => String(col.key) === sortConfig.key);
    const sortType = column?.sortType || 'string';

    sorted.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let comparison = 0;

      if (sortType === 'number') {
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        comparison = aNum - bNum;
      } else if (sortType === 'date') {
        const aDate = new Date(aVal).getTime();
        const bDate = new Date(bVal).getTime();
        comparison = aDate - bDate;
      } else {
        // string
        comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [data, sortConfig, columns]);

  const handleSort = (key: keyof T) => {
    const column = columns.find(col => col.key === key);
    if (!column?.sortable) return;

    setSortConfig(current => {
      if (!current || current.key !== String(key)) {
        return { key: String(key), direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key: String(key), direction: 'desc' };
      }
      return null; // Clear sort
    });
  };

  const getSortIndicator = (key: keyof T) => {
    if (!sortConfig || sortConfig.key !== String(key)) return null;
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <table className={`pm-table ${className}`} ref={tableRef}>
      {/* Remove the style prop entirely - let CSS handle table-layout */}
      {ColGroup}
      <thead className="pm-thead pm-thead-sticky">
        <tr>
          {columns.map((col, idx) => {
            if (!col || !col.key) return null;
            
            return (
              <th key={String(col.key)} className={`pm-th relative ${col.className || ''}`}>
                <div
                  className="cursor-pointer select-none"
                  onClick={() => handleSort(col.key)}
                >
                  <span>{col.label}</span>
                  {col.sortable && sortConfig?.key === String(col.key) && (
                    <span className="ml-1">
                      {sortConfig.direction === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>

                {/* Column resizer */}
                <span
                  className="pm-col-resizer"
                  onMouseDown={(e) => startResize(e, idx)}
                  onDoubleClick={() => autoFitColumn(idx)}
                />
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {sortedData.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="pm-td text-sm text-gray-500">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          sortedData.map((row) => {
            const key = String(row[rowKey]);
            const isSelected = selectedRowKey !== null && String(selectedRowKey) === key;

            return (
              <tr
                key={key}
                id={`row-${key}`}
                className={`pm-row ${isSelected ? 'pm-row--selected' : ''} ${
                  onRowClick || onRowDoubleClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onRowClick?.(row)}
                onDoubleClick={() => onRowDoubleClick?.(row)}
              >
                {columns.map((col) => {
                  const value = row[col.key];
                  const alignClass = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : '';
                  const cellClassName = `pm-td ${alignClass} ${col.className || ''}`.trim();

                  return (
                    <td key={String(col.key)} className={cellClassName}>
                      {col.render ? col.render(value, row) : value ?? ''}
                    </td>
                  );
                })}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

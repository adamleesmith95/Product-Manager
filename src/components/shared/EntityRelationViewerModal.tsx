import React, { useEffect, useState } from 'react';
import Modal from '../Modal';
import DataTable, { ColumnDefinition } from './DataTable';
import RowContextMenu from '../shared/RowContextMenu';

type RelationRow = Record<string, any> & { __rowId: string };

type RowAction = {
  key: string;
  label: string;
  onClick: () => void;
};

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  columns: ColumnDefinition<RelationRow>[];
  rows: Record<string, any>[];
  loading: boolean;
  error: string;
  emptyMessage?: string;
  storageKey?: string;
  getRowActions?: (row: Record<string, any>) => RowAction[];
};

export default function EntityRelationViewerModal({
  open,
  onClose,
  title,
  columns,
  rows,
  loading,
  error,
  emptyMessage = 'No records found.',
  storageKey = 'entity-relation-viewer',
    getRowActions,
}: Props) {
  const data: RelationRow[] = rows.map((r, i) => ({ ...r, __rowId: String(i) }));
  const [ctx, setCtx] = useState<{ x: number; y: number; row: any } | null>(null);

  useEffect(() => {
    if (!ctx) return;
    const close = () => setCtx(null);
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCtx(null);
    };
    window.addEventListener('click', close);
    window.addEventListener('keydown', onEsc);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', onEsc);
    };
  }, [ctx]);

  const actions = ctx && getRowActions ? getRowActions(ctx.row) : [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={<span className="font-semibold truncate pcphc-modal-title">{title}</span>}
      maxWidthClass="max-w-6xl"
      showSaveButton={false}
      closeLabel="Close"
    >
      <div className="p-4">
        {loading && <div className="text-sm">Loading...</div>}
        {!loading && error && <div className="text-sm text-red-600">{error}</div>}
        {!loading && !error && data.length === 0 && (
          <div className="text-sm text-gray-600">{emptyMessage}</div>
        )}
        {!loading && !error && data.length > 0 && (
          <div className="max-h-[26rem] overflow-auto border rounded">
            <DataTable
              columns={columns}
              data={data}
              rowKey="__rowId"
              storageKey={storageKey}
              emptyMessage={emptyMessage}
              onRowContextMenu={(row, e) => {
                if (!getRowActions) return;
                e.preventDefault();
                e.stopPropagation();
                setCtx({ x: e.clientX, y: e.clientY, row });
              }}
            />
          </div>
        )}
        
      </div>
        {ctx && actions.length > 0 && (
        <RowContextMenu
          x={ctx.x}
          y={ctx.y}
            actions={actions.map((a) => ({
                ...a,
                onClick: () => {
                    a.onClick();
                    setCtx(null);
                }
            }))}
        />
        )} 
    </Modal>

  );

}
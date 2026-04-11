import React, { ReactNode } from 'react';

interface Props {
  leftTitle?: string;
  rightTitle?: string;
  leftHeader?: ReactNode;  // ADDed 4/11/26 AS
  leftContent: ReactNode;
  rightContent: ReactNode;
  onAdd: () => void;
  onRemove: () => void;
  addLabel?: string;
  removeLabel?: string;
  addDisabled?: boolean;
  removeDisabled?: boolean;
}

export default function DualPane({
  leftTitle = 'Available',
  rightTitle = 'Assigned',
  leftHeader,  // ADDed 4/11/26 AS
  leftContent,
  rightContent,
  onAdd,
  onRemove,
  addLabel = '>',
  removeLabel = '<',
  addDisabled = false,
  removeDisabled = false,
}: Props) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 flex-1 min-h-0">

      {/* LEFT */}
      <div className="border rounded p-3 flex flex-col min-h-0">
                {(leftTitle || leftHeader) && (
          <div className="flex items-center gap-2 mb-2 shrink-0">
            {leftTitle && <h3 className="font-semibold shrink-0">{leftTitle}</h3>}
            {leftHeader && <div className="flex-1 min-w-0">{leftHeader}</div>}
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {leftContent}
        </div>
      </div>

      {/* MIDDLE ARROWS */}
      <div className="flex flex-col justify-center gap-3 shrink-0">
        <button
          type="button"
          disabled={addDisabled}
          className="px-3 py-1.5 rounded border bg-gray-50 text-gray-700 hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={onAdd}
        >
          {addLabel}
        </button>
        <button
          type="button"
          disabled={removeDisabled}
          className="px-3 py-1.5 rounded border bg-gray-50 text-gray-700 hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={onRemove}
        >
          {removeLabel}
        </button>
      </div>

      {/* RIGHT */}
      <div className="border rounded p-3 flex flex-col min-h-0">
        {rightTitle && (
          <h3 className="font-semibold mb-2 shrink-0">{rightTitle}</h3>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {rightContent}
        </div>
      </div>

    </div>
  );
}
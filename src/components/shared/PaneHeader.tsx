import React from "react";

type Props = {
  title: string;
  onResetColumns?: () => void;
  rightActions?: React.ReactNode;
};

export default function PaneHeader({ title, onResetColumns, rightActions }: Props) {
  return (
    <>
      <div className="pm-pane-title">{title}</div>
      <div className="flex items-center gap-2 grow justify-end">
        {onResetColumns && (
          <button
            onClick={onResetColumns}
            className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
            title="Reset column widths"
          >
            Reset Columns
          </button>
        )}
        {rightActions}
      </div>
    </>
  );
}
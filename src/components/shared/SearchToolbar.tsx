import React from "react";

type Props = {
  children: React.ReactNode;
  onSearch?: () => void;
  onClear?: () => void;
  rightActions?: React.ReactNode;
};

export default function SearchToolbar({ children, onSearch, onClear, rightActions }: Props) {
  return (
    <>
      <div className="pm-section">
        <div className="grid grid-cols-12 gap-4 items-center">
          {children}
        </div>
        <div className="flex gap-2 mt-4 justify-between">
          <div className="flex gap-2">
            {onSearch && <button onClick={onSearch} className="btn btn-light">Search</button>}
            {onClear && <button onClick={onClear} className="btn btn-light">Clear</button>}
          </div>
          {rightActions && <div className="flex gap-2">{rightActions}</div>}
        </div>
      </div>
      <div className="pm-divider-bleed" />
    </>
  );
}
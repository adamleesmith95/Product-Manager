import React from "react";

type Props = {
  children: React.ReactNode;
  onSearch?: () => void;
  onClear?: () => void;
};

export default function SearchToolbar({ children, onSearch, onClear }: Props) {
  return (
    <>
      <div className="pm-section grid grid-cols-12 gap-4 items-center">
        {children}
        <div className="pm-section-right">
          {onSearch && <button onClick={onSearch} className="btn btn-light">Search</button>}
          {onClear && <button onClick={onClear} className="btn btn-light">Clear</button>}
        </div>
      </div>
      <div className="pm-divider-bleed" />
    </>
  );
}
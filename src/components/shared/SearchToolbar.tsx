import React, { useRef, useState } from 'react';

type Props = {
  children: React.ReactNode;
  onSearch: () => void;
  onClear: () => void;
  isSearchDisabled?: boolean;
  // When provided: split caret button + collapsible advanced panel are shown
  advancedChildren?: React.ReactNode;
  onApplyAdvanced?: () => void;
  applyAdvancedLabel?: string;
  applyAdvancedLoading?: boolean;
};

export default function SearchToolbar({
  children,
  onSearch,
  onClear,
  isSearchDisabled = false,
  advancedChildren,
  onApplyAdvanced,
  applyAdvancedLabel = 'Apply Advanced',
  applyAdvancedLoading = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const searchBtnRef = useRef<HTMLButtonElement>(null);
  const hasAdvanced = !!onApplyAdvanced;

  return (
    <>
      <div className="pm-section">
        {/* Basic row */}
        <div className="grid grid-cols-12 gap-4 items-center">
          {children}
          <div className="pm-section-right flex items-center gap-2">
            <div className="flex">
              <button
                ref={searchBtnRef}
                onClick={onSearch}
                disabled={isSearchDisabled}
                aria-disabled={isSearchDisabled}
                tabIndex={isSearchDisabled ? -1 : 0}
                className={
                  `btn btn-light${hasAdvanced ? ' rounded-r-none' : ''} ` +
                  (isSearchDisabled ? 'opacity-60 cursor-not-allowed' : '')
                }
                title={isSearchDisabled ? 'Enter a search term first' : 'Search'}
              >
                Search
              </button>
              {hasAdvanced && (
                <button
                  type="button"
                  onClick={() => setExpanded(v => !v)}
                  aria-expanded={expanded}
                  className="btn btn-light rounded-l-none border-l-0 px-2 flex items-center justify-center"
                  title={expanded ? 'Hide advanced filters' : 'Show advanced filters'}
                >
                  <svg
                    className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : 'rotate-0'}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
                  </svg>
                </button>
              )}
            </div>
            <button onClick={onClear} className="btn btn-light">Clear</button>
          </div>
        </div>

        {/* Advanced panel */}
        {hasAdvanced && expanded && (
          <div className="mt-3 space-y-3">
            {advancedChildren}
            <div className="flex justify-start">
              <button
                onClick={onApplyAdvanced}
                disabled={applyAdvancedLoading}
                className={`btn btn-light${applyAdvancedLoading ? ' opacity-60 cursor-not-allowed' : ''}`}
              >
                {applyAdvancedLoading ? 'Searching…' : applyAdvancedLabel}
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="pm-divider-bleed" />
    </>
  );
}
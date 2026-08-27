import React, { useRef, useState } from 'react';

interface Props {
  /** Basic inputs row (code/description fields). Use col-span-* Tailwind classes. */
  children: React.ReactNode;
  /** Content rendered in the collapsible advanced panel. */
  advancedContent?: React.ReactNode;
  onSearch: () => void;
  onClear: () => void;
  /** Buttons rendered on the right side of the action row (e.g. <SearchActionButtons />). */
  rightActions?: React.ReactNode;
  /** Disables the Search button while a fetch is in progress. */
  busy?: boolean;
  /**
   * When true the Search button is visually disabled and shows a tooltip.
   * Pass `true` when basic fields are empty and the panel is collapsed.
   */
  isSearchDisabled?: boolean;
  searchDisabledTitle?: string;
}

/**
 * Drop-in replacement for SearchToolbar when you need a collapsible advanced
 * filter panel. The caret button sits immediately to the right of Search.
 *
 * Layout (always visible):
 *   [inputs row]
 *   [advanced panel]   ← conditional on caret toggle
 *   [Search ▼] [Clear]            [rightActions]
 */
export default function SearchBarAdvanced({
  children,
  advancedContent,
  onSearch,
  onClear,
  rightActions,
  busy = false,
  isSearchDisabled = false,
  searchDisabledTitle = 'Enter code or description',
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const searchBtnRef = useRef<HTMLButtonElement>(null);

  const disabled = busy || isSearchDisabled;

  const toggleAdvanced = () => {
    setExpanded(prev => !prev);
    requestAnimationFrame(() => {
      if (disabled) searchBtnRef.current?.blur();
    });
  };

  return (
    <>
      <div className="pm-section">
        {/* Basic inputs */}
        <div className="grid grid-cols-12 gap-4 items-center">
          {children}
        </div>

        {/* Advanced panel */}
        {expanded && advancedContent && (
          <div id="advanced-panel" className="mt-4">
            {advancedContent}
          </div>
        )}

        {/* Always-visible action row */}
        <div className="flex gap-2 mt-4 justify-between">
          <div className="flex items-center gap-0">
            {/* Search */}
            <button
              ref={searchBtnRef}
              onClick={onSearch}
              disabled={disabled}
              aria-disabled={disabled}
              tabIndex={disabled ? -1 : 0}
              className={
                `btn btn-light ${advancedContent ? 'rounded-r-none' : ''} ` +
                (disabled ? 'opacity-60 cursor-not-allowed' : '')
              }
              title={disabled && !busy ? searchDisabledTitle : 'Search'}
            >
              Search
            </button>

            {/* Caret — only rendered when there is advanced content */}
            {advancedContent && (
              <button
                onClick={toggleAdvanced}
                aria-expanded={expanded}
                aria-controls="advanced-panel"
                className="btn btn-light rounded-l-none px-3 flex items-center justify-center"
                title={expanded ? 'Hide advanced filters' : 'Show advanced filters'}
              >
                <svg
                  className={`w-3 h-4 transition-transform ${expanded ? 'rotate-180' : 'rotate-0'}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
                </svg>
              </button>
            )}

            {/* Clear */}
            <button onClick={onClear} className="btn btn-light ml-2">
              Clear
            </button>
          </div>

          {rightActions && <div className="flex gap-2">{rightActions}</div>}
        </div>
      </div>
      <div className="pm-divider-bleed" />
    </>
  );
}

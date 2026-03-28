import React from 'react';

interface BrowserLayoutProps {
  sidebar?: React.ReactNode;
  searchPanel?: React.ReactNode;
  paneHeader?: React.ReactNode;
  table?: React.ReactNode;
  paneFooter?: React.ReactNode;
  paneBottom?: React.ReactNode;
  className?: string;
  hideSidebar?: boolean;
}

export default function BrowserLayout({
  sidebar,
  searchPanel,
  paneHeader,
  table,
  paneFooter,
  paneBottom,
  className = '',
  hideSidebar = false,
}: BrowserLayoutProps) {
  return (
    <div className={`flex flex-col h-full min-h-0 ${className}`}>
      {searchPanel && <div className="pm-search-section mb-4">{searchPanel}</div>}

      <div className="grid grid-cols-12 gap-4">

        {/* Left sidebar — full height, unaffected by paneBottom */}
        {!hideSidebar && (
          <aside className="pm-sidebar col-span-3">
            {sidebar}
          </aside>
        )}

        {/* Right pane — flex column, splits when paneBottom provided */}
        <section
          className={`${
            hideSidebar ? 'col-span-12' : 'col-span-9'
          } pm-pane pm-pane-right pm-pane-flex pm-pane--vh overflow-hidden`}
        >
          {/* Table area */}
          <div className={`flex flex-col min-h-0 overflow-hidden ${paneBottom ? 'flex-[2]' : 'flex-1'}`}>
            {paneHeader && <div className="pm-pane-header">{paneHeader}</div>}
            <div className="pm-content">{table}</div>
            {paneFooter && <div className="pm-pane-footer">{paneFooter}</div>}
          </div>

          {/* Inline panel — right pane only, no whitespace */}
          {paneBottom && (
            <div className="flex-[1] min-h-0 overflow-hidden border-t border-gray-200">
              {paneBottom}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

import React from 'react';

interface BrowserLayoutProps {
  sidebar?: React.ReactNode;
  searchPanel?: React.ReactNode;
  paneHeader?: React.ReactNode;
  table?: React.ReactNode;
  paneFooter?: React.ReactNode;
  className?: string;
  hideSidebar?: boolean;
}

export default function BrowserLayout({
  sidebar,
  searchPanel,
  paneHeader,
  table,
  paneFooter,
  className = '',
  hideSidebar = false,
}: BrowserLayoutProps) {
  return (
    <div className={className}>
      {searchPanel && <div className="pm-search-section mb-4">{searchPanel}</div>}

      <div className="grid grid-cols-12 gap-4">
        {!hideSidebar && (
          <aside className="pm-sidebar col-span-3">
            {sidebar}
          </aside>
        )}

        <section
          className={`${hideSidebar ? 'col-span-12' : 'col-span-9'} pm-pane pm-pane-right pm-pane-flex pm-pane--vh`}
        >
          {paneHeader && <div className="pm-pane-header">{paneHeader}</div>}
          <div className="pm-content">{table}</div>
          {paneFooter && <div className="pm-pane-footer">{paneFooter}</div>}
        </section>
      </div>
    </div>
  );
}
import React from 'react';

interface BrowserLayoutProps {
  sidebar: React.ReactNode;
  searchPanel?: React.ReactNode;
  paneHeader?: React.ReactNode;
  table: React.ReactNode;
  paneFooter?: React.ReactNode;
  className?: string;
}

export default function BrowserLayout({ 
  sidebar, 
  searchPanel, 
  paneHeader,
  table,
  paneFooter,
  className = ''
}: BrowserLayoutProps) {
  return (
    <div className={className}>
      {/* Search panel spans full width at top */}
      {searchPanel && (
        <div className="pm-search-section mb-4">
          {searchPanel}
        </div>
      )}

      {/* Grid layout for sidebar + table */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Sidebar - 3 columns */}
        <aside className="pm-sidebar col-span-3">
          {sidebar}
        </aside>

        {/* Right Pane - 9 columns */}
        <section className="col-span-9 pm-pane pm-pane-right pm-pane-flex pm-pane--vh">
          {paneHeader && (
            <div className="pm-pane-header">
              {paneHeader}
            </div>
          )}
          
          <div className="pm-content">
            {table}
          </div>

          {paneFooter && (
            <div className="pm-pane-footer">
              {paneFooter}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
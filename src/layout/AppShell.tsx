// src/layout/AppShell.tsx
import { Suspense, useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SidebarNav from '../components/SidebarNav';
import Breadcrumbs from '../components/Breadcrumbs';

const DB_OPTIONS: { key: string; label: string }[] = [
  { key: 'lhotse',  label: 'Lhotse'  },
  { key: 'gasher',  label: 'Gasher'  },
  { key: 'makalu',  label: 'Makalu'  },
  { key: 'manaslu', label: 'Manaslu' },
  { key: 'cho-oyu', label: 'cho-oyu' },
];

function GearIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
  );
}

export default function AppShell() {
  const location = useLocation();
  const [dbKey, setDbKey] = useState<string | null>(null);
  const [dbOpen, setDbOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/db-server')
      .then((r) => r.json())
      .then((data) => setDbKey(data.serverKey))
      .catch(() => {});
  }, []);

  // Close popover on outside click
  useEffect(() => {
    if (!dbOpen) return;
    function handler(e: MouseEvent) {
      if (footerRef.current && !footerRef.current.contains(e.target as Node)) {
        setDbOpen(false);
        setSwitchError(null);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dbOpen]);

  async function handleSelectDb(key: string) {
    if (key === dbKey || switching) return;
    setSwitching(true);
    setSwitchError(null);
    try {
      const res = await fetch('/api/db-server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverKey: key }),
      });
      if (res.ok) {
        // Reload the page so all data fetches start fresh against the new DB
        window.location.reload();
      } else {
        const body = await res.json().catch(() => ({}));
        setSwitchError(body.error ?? 'Switch failed');
        setSwitching(false);
      }
    } catch {
      setSwitchError('Network error');
      setSwitching(false);
    }
  }

  const dbLabel = dbKey ? (DB_OPTIONS.find((o) => o.key === dbKey)?.label ?? dbKey) : '…';

  return (
    <div className="h-screen w-screen flex bg-neutral-100 text-neutral-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="px-4 py-3 border-b bg-indigo-950 text-white font-semibold tracking-wide">
          PRODUCT MANAGER
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav />
        </div>

        {/* DB selector footer */}
        <div ref={footerRef} className="relative border-t">
          {dbOpen && (
            <div className="absolute bottom-full left-0 w-full bg-white border border-neutral-200 shadow-lg rounded-t overflow-hidden">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider border-b">
                Database
              </div>
              {DB_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  disabled={switching}
                  onClick={() => handleSelectDb(opt.key)}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 hover:bg-neutral-50 disabled:opacity-50 ${
                    opt.key === dbKey ? 'text-blue-700 font-medium' : 'text-neutral-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      opt.key === dbKey ? 'bg-blue-600' : 'bg-neutral-300'
                    }`}
                  />
                  {opt.label}
                  {opt.key === dbKey && switching && (
                    <span className="ml-auto text-xs text-neutral-400">connecting…</span>
                  )}
                </button>
              ))}
              {switchError && (
                <div className="px-3 py-1.5 text-xs text-red-600 border-t bg-red-50">{switchError}</div>
              )}
            </div>
          )}

          <button
            onClick={() => { setDbOpen((v) => !v); setSwitchError(null); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-neutral-500 hover:bg-neutral-50"
            title="Switch database"
          >
            <GearIcon />
            <span>
              DB: <span className={dbKey ? 'text-neutral-700 font-medium' : ''}>{dbLabel}</span>
            </span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="border-b bg-white shrink-0">
          <Breadcrumbs pathname={location.pathname} />
        </div>
        {/* overflow-hidden here — each page controls its own scrolling */}
        <div className="flex-1 overflow-hidden p-4 min-h-0">
          <Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

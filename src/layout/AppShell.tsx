// src/layout/AppShell.tsx
import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SidebarNav from '../components/SidebarNav';
import Breadcrumbs from '../components/Breadcrumbs';

export default function AppShell() {
  const location = useLocation();
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

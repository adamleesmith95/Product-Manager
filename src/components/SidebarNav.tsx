// src/components/SidebarNav.tsx
import { NavLink ,useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import React, { useMemo } from 'react';

type NavGroup = {
  key: string;
  label: string;
  children?: { label: string; path: string }[];
};

const groups: NavGroup[] = [
  {
    key: 'product-tables',
    label: 'Product Tables',
    children: [
      { label: 'Manage Products For Sale', path: '/product-manager/manage-products-for-sale' },
      { label: 'Manage Product Component', path: '/product-manager/manage-product-component' },
      { label: 'Manage Display Category', path: '/product-manager/manage-display-category' },
      { label: 'Manage Display Group', path: '/product-manager/manage-display-group' },
    ],
  },
  { key: 'product-property-tables', label: 'Product Property Tables', children: [
    { label: 'Open', path: '/product-manager/product-property-tables' },
  ]},
  { key: 'product-pricing-season', label: 'Product Pricing Season', children: [
    { label: 'Open', path: '/product-manager/product-pricing-season' },
  ]},
  { key: 'discount-commission-tables', label: 'Discount/Commission Tables', children: [
    { label: 'Open', path: '/product-manager/discount-commission-tables' },
  ]},
  { key: 'line-of-business-tables', label: 'Line of Business Tables', children: [
    { label: 'Open', path: '/product-manager/line-of-business-tables' },
  ]},
  { key: 'access-control-tables', label: 'Access Control Tables', children: [
    { label: 'Open', path: '/product-manager/access-control-tables' },
  ]},
  { key: 'product-attributes', label: 'Product Attributes', children: [
    { label: 'Open', path: '/product-manager/product-attributes' },
  ]},
  { key: 'distribution-services-management', label: 'Distribution Services Management', children: [
    { label: 'Open', path: '/product-manager/distribution-services-management' },
  ]},
  { key: 'pricing-manager', label: 'Pricing Manager', children: [
    { label: 'Open', path: '/product-manager/pricing-manager' },
  ]},
  { key: 'promotion-manager', label: 'Promotion Manager', children: [
    { label: 'Open', path: '/product-manager/promotion-manager' },
  ]},
];

const STORAGE_KEY = 'pm.navExpandedSections';

const normalizePath = (p: string) => (p || '/').replace(/\/+$/, '') || '/';
const routeMatches = (itemTo: string, pathname: string) => {
  const a = normalizePath(itemTo);
  const b = normalizePath(pathname);
  return b === a || b.startsWith(`${a}/`);
};

export default function SidebarNav() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const location = useLocation();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setExpanded(JSON.parse(raw));
      else {
        // Default: expand Product Tables only
        setExpanded({ 'product-tables': true });
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expanded));
    } catch {}
  }, [expanded]);

  useEffect(() => {
    // Auto-expand the group containing the active route
    const pathname = location.pathname;
    const newExpanded = { ...expanded };
    let changed = false;

    groups.forEach((group) => {
      const hasActiveChild = (group.children ?? []).some(
        (item) => routeMatches(item.path, pathname)
      );
      if (hasActiveChild && !newExpanded[group.key]) {
        newExpanded[group.key] = true;
        changed = true;
      }
    });

    if (changed) setExpanded(newExpanded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  //const toggle = (key: string) =>
    //setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const isGroupOpen = (key: string) => !!expanded[key];

  const toggleGroup = (key: string) => {
    // keep active parent open
    //if (isGroupOpen(key)) return;
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <nav className="py-2">
      {groups.map((group) => (
        <div key={group.key} className="border-b">
          <button
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50"
            onClick={() => toggleGroup(group.key)}
            aria-expanded={isGroupOpen(group.key)}
          >
            <span className="font-medium text-blue-900">{group.label}</span>
            <svg className={`w-4 h-4 transition-transform ${isGroupOpen(group.key) ? 'rotate-180' : 'rotate-0'}`} viewBox="0 0 20 20" fill="currentColor">
              <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
            </svg>
          </button>

          {isGroupOpen(group.key) && (
            <div>
              {(group.children ?? []).map((item: any) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `block pl-6 pr-3 py-2 text-sm hover:bg-neutral-50 ${
                      isActive ? 'text-blue-700 font-medium' : 'text-neutral-700'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}

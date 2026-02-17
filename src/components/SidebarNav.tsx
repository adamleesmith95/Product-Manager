
// src/components/SidebarNav.tsx
import { NavLink } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';

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

export default function SidebarNav() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const items = useMemo(() => groups, []);

  return (
    <nav className="py-2">
      {items.map((group) => (
        <div key={group.key} className="border-b">
          <button
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50"
            onClick={() => toggle(group.key)}
            aria-expanded={!!expanded[group.key]}
          >
            <span className="font-medium text-blue-900">{group.label}</span>
            <svg className={`w-4 h-4 transition-transform ${expanded[group.key] ? 'rotate-180' : 'rotate-0'}`} viewBox="0 0 20 20" fill="currentColor">
              <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
            </svg>
          </button>
          {expanded[group.key] && (
            <ul className="pb-2">
              {(group.children ?? []).map((child) => (
                <li key={child.path}>
                  <NavLink
                    to={child.path}
                    className={({ isActive }) =>
                      `block pl-6 pr-3 py-2 text-sm hover:bg-neutral-50 ${
                        isActive ? 'text-blue-700 font-medium' : 'text-neutral-700'
                      }`
                    }
                  >
                    {child.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </nav>
  );
}

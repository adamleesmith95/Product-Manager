
// src/routes.tsx
import { lazy } from 'react';
import type { ReactNode } from 'react';

// Lazy imports or direct imports depending on your preference:
const ManageProductsForSale = lazy(() => import('./pages/ManageProductsForSale')); // wraps your existing ManageProductsForSale.jsx (see section 4)
const ManageProductComponent = lazy(() => import('./pages/ManageProductComponent'));
const Placeholder = lazy(() => import('./pages/Placeholder')); // generic placeholder (section 5)

export type RouteItem = {
  path: string;
  element: ReactNode;
  title: string;
  section: string; // used for breadcrumbs
};

export const routes: RouteItem[] = [
  {
    path: '/product-manager/manage-products-for-sale',
    element: <ManageProductsForSale />,
    title: 'Manage Products For Sale',
    section: 'Product Tables',
  },

  {
    path: '/product-manager/manage-product-component',
    element: <ManageProductComponent />,
    title: 'Manage Product Component',
    section: 'Product Tables',
  },

  {
    path: '/product-manager/manage-display-category',
    element: <Placeholder title="Manage Display Category" />,
    title: 'Manage Display Category',
    section: 'Product Tables',
  },
  {
    path: '/product-manager/manage-display-group',
    element: <Placeholder title="Manage Display Group" />,
    title: 'Manage Display Group',
    section: 'Product Tables',
  },

  // Primary headings (each with placeholder subheading for now)
  {
    path: '/product-manager/product-property-tables',
    element: <Placeholder title="Product Property Tables" />,
    title: 'Product Property Tables',
    section: 'Product Property Tables',
  },
  {
    path: '/product-manager/product-pricing-season',
    element: <Placeholder title="Product Pricing Season" />,
    title: 'Product Pricing Season',
    section: 'Product Pricing Season',
  },
  {
    path: '/product-manager/discount-commission-tables',
    element: <Placeholder title="Discount/Commission Tables" />,
    title: 'Discount/Commission Tables',
    section: 'Discount/Commission Tables',
  },
  {
    path: '/product-manager/line-of-business-tables',
    element: <Placeholder title="Line of Business Tables" />,
    title: 'Line of Business Tables',
    section: 'Line of Business Tables',
  },
  {
    path: '/product-manager/access-control-tables',
    element: <Placeholder title="Access Control Tables" />,
    title: 'Access Control Tables',
    section: 'Access Control Tables',
  },
  {
    path: '/product-manager/product-attributes',
    element: <Placeholder title="Product Attributes" />,
    title: 'Product Attributes',
    section: 'Product Attributes',
  },
  {
    path: '/product-manager/distribution-services-management',
    element: <Placeholder title="Distribution Services Management" />,
    title: 'Distribution Services Management',
    section: 'Distribution Services Management',
  },
  {
    path: '/product-manager/pricing-manager',
    element: <Placeholder title="Pricing Manager" />,
    title: 'Pricing Manager',
    section: 'Pricing Manager',
  },
  {
    path: '/product-manager/promotion-manager',
    element: <Placeholder title="Promotion Manager" />,
    title: 'Promotion Manager',
    section: 'Promotion Manager',
  },
];

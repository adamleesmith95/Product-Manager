// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataCacheProvider } from './context/DataCacheContext';
import ManageDisplayCategory from './pages/ManageDisplayCategory';

import AppShell from './layout/AppShell';
import { routes } from './routes';


const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <DataCacheProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route
              path="/"
              element={<Navigate to="/product-manager/manage-products-for-sale" replace />}
            />
            {routes.map((r) => (
              <Route key={r.path} path={r.path} element={r.element} />
            ))}
            <Route
              path="/product-manager/manage-display-category"
              element={<ManageDisplayCategory />}
            />
            <Route path="*" element={<div className="p-6">Not Found</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataCacheProvider>
  </React.StrictMode>
);




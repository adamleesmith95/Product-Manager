
// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// If some files are .tsx, it's fine as long as tsconfig has allowJs: true and jsx: react-jsx
import AppShell from './layout/AppShell';
import { routes } from './routes';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');


ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
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
          <Route path="*" element={<div className="p-6">Not Found</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);



